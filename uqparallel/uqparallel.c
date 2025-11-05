#include <csse2310a3.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <fcntl.h>
#include <time.h> // required to used timespec for sigtimedwait()
#include <signal.h> // contains signal macros
#include <stdbool.h>

#define DECIMAL_FORMAT 10
#define SPACE_SIZE_INCREASE 3

#define MAX_JOB_LIMIT 120
#define MIN_JOB_LIMIT 1
// Reading and writing ends of pipe
#define READ 0
#define WRITE 1
#define PIPE_SIZE 2
#define BUFFER_SIZE 1
// Managing number of running children
#define PENDING_EXECUTION 1
#define TERMINATED 0
#define PIPE_OFF (-1)
// sigaction macros
#define NO_FAIL 0

bool failed = false; // tracks if an instance of SIGCHLD was caught by
                     // a sigaction struct

typedef const char* const ImmutableString;
// Messages
ImmutableString invalidCmdLineMsg
        = "Usage: ./uqparallel [--limitjobs n] [--pipe] [--halt-on-error] "
          "[--dry-run] [--argsfile argument-file] [cmd [fixed-args ...]] "
          "[::: per-task-args ...]\n";
ImmutableString invalidFilenameMsg = "uqparallel: Unable to read from file \"";
ImmutableString emptyCommandMsg
        = "uqparallel: unable to execute empty command\n";
ImmutableString executionFailedMsg
        = "uqparallel: aborting because of execution failure\n";
ImmutableString interruptMsg = "uqparallel: execution interrupted - aborting\n";
// option arguments
ImmutableString optionHandle = "--";
ImmutableString limitJobs = "--limitjobs";
ImmutableString pipeArg = "--pipe";
ImmutableString haltOnError = "--halt-on-error";
ImmutableString dryRun = "--dry-run";
ImmutableString argsFile = "--argsfile";
ImmutableString taskArgs = ":::";
// delimiters
ImmutableString decimalDelim = ".";

// Custom program exit codes
typedef enum {
    SUCCESS_EXIT = 0,
    INVALID_CMD_LINE_EXIT = 18,
    INVALID_FILENAME_EXIT = 5,
    FAILED_LAST_RUN_EXIT = 70,
    LAST_RUN_EMPTY_EXIT = 92,
    SIGTERM_EXIT = 70,
    INTERRUPT_EXIT = 16,
} ExitCodes;

// Stores all relervant program settings extracted from the commandline
typedef struct {
    int jobLimit;
    int pipeOn;
    int haltOn;
    int dryRunOn;
    char* argumentFile;
    int fixedSize; // tracks size of fixedArgs
    char** fixedArgs;
    int taskSize; // tracks size of taskArgs
    char** taskArgs;
    FILE* stream; // corresponding stream to char* argumentFile
} Settings;

// Tracks all children to be executed
// NOTE: This struct is intended to be initialised with init_queue
typedef struct {
    int size;
    int* status; // tracks each child's termination status
    pid_t* children;
    int** pipes;
} Queue;

/// Functions /////////////
void debug_print_array(int size, char** arr);
void debug_print_commands(int cmdCount, char*** commands);
/* Queue functions */
Queue init_queue(int cmdCount);
/* sigaction functions */
void set_global_flag(int signal);
void custom_interrupt_exit(int signal);
void set_signal_handlers(Settings settings);
/* exiting functions */
void exit_invalid_command_line(void);
void exit_invalid_filename(char* filename);
/* error functions */
void error_invalid_empty_command(void);
void error_failed_execute_command(char* command);
/* commandline processing functions */
void verify_jobs_limit(Settings* settings, char* limitArg);
int get_arguments(int startPos, int argc, char** argv, char*** saveTo);
char* is_space_argument(char* arg);
void check_settings(Settings* settings);
Settings get_settings(int argc, char** argv);
/* dry-run functions */
void dry_print(int size, char** args, int enableQuotes);
void execute_dry_run(Settings settings);
/* generating executable commands functions */
char*** get_settings_commands(Settings settings, int* cmdCount);
char*** get_stream_commands(Settings settings, int* cmdCount);
char** get_line_command(Settings settings, int numTok, char** tokens);
char*** get_file_commands(Settings settings, int* cmdCount);
/* executing commands functions */
void run_child(
        int previousChildFd, int currentChildFds[2], char** cmdToExecute);
void print_child_output(int currentChildFds[2]);
void parallel_wait(
        Settings settings, Queue queue, int* status, char*** commands);
int get_exit_status(int status);
void execute_parallel(Settings settings, int cmdCount, char*** commands);
void execute_sequential(Settings settings);
/* advanced functionality */
void terminate_children(int signal, Queue queue);
/* main                             */
int main(int argc, char** argv);

//////////////////////////

/* debug_print_array()
 * ------------------
 * Function is intended for debugging purposes only.
 * Function prints all strings stored in memeory location pointed
 * by char** arr.
 *
 * If size is unknown, supplied size as -1.
 *
 * arg1: The size of char** arr
 * arg2: The string array who's elements are to be printed.
 */
void debug_print_array(int size, char** arr)
{
    int index = 0;
    if (size != -1) {
        for (int i = 0; i < size; i++) {
            printf("%d | %s\n", i, arr[i]);
        }
    } else {
        // this case is mainly used for handling char** with unknown size
        printf("commands sent to exevp():");
        while (arr[index] != NULL) {
            // printing commands until NULL is reached
            printf(" %s", arr[index]);
            index++;
        }
        printf("\n");
    }
}

/* debug_print_commands()
 * ---------------------
 * Function is intended for debuggin purposes only.
 * Function prints each char** on the same line with
 * Function prints to stdout.
 *
 * arg1: The number of char** commands in memeory location pointed by
 *       char*** commands.
 * arg2: Points to the collection of char** commands to be printed.
 */
void debug_print_commands(int cmdCount, char*** commands)
{
    int index = 0;
    printf("Printing commands\n");
    for (int i = 0; i < cmdCount; i++) {
        // printing each command[i] on them same line
        printf("commands[%d] =", i);
        while (commands[i][index] != NULL) {
            // print each command[i] on the same line
            printf("%s", commands[i][index]);
            index++;
        }
        printf(" %s", commands[i][index]); // expected to be NULL
        printf("\n");
        index = 0;
    }
}

/// Queue Functions ////////////

/* init_queue()
 * ------------
 * Dynamically initialises a new Queue struct in accordance to
 * the number of children needed to executed, included a set of READ
 * and WRITE pipes mapped to each expected child.
 *
 * arg1: The number of commands to be executed by children.
 *
 * Returns: A new Queue initialised dynamically.
 */
Queue init_queue(int cmdCount)
{
    Queue queue = {0};
    queue.size = cmdCount;
    queue.children = (pid_t*)malloc(sizeof(pid_t) * cmdCount);
    queue.status = (int*)malloc(sizeof(int) * cmdCount);
    queue.pipes = (int**)malloc(sizeof(int*) * cmdCount);
    for (int i = 0; i < cmdCount; i++) {
        // initalising pipes for children
        queue.pipes[i] = (int*)malloc(sizeof(int) * PIPE_SIZE);
        pipe(queue.pipes[i]);
        // initialing children status to PENDING_EXECUTION
        queue.status[i] = PENDING_EXECUTION;
    }
    return queue;
}

/// sigaction Functions /////////////////

/* set_global_flag()
 * ----------------
 * Sets the global failed flag to failed when signal is SHCLD caught.
 *
 * arg1: The signal caught by the sigaction struct.
 */
void set_global_flag(int signal)
{
    if (signal == SIGCHLD) {
        failed = true;
    }
}

/* custom_interrupt_exit()
 * ----------------------
 * Exits program with INTERRUPT_EXIT whenever SIGINT is sent to parent
 * program.
 *
 * interruptMsg is printed to stderr.
 *
 * arg1: The signal caught by the sigaction struct.
 */
void custom_interrupt_exit(int signal)
{
    if (signal == SIGINT) {
        // SIGINT caught, exit gracefully
        fprintf(stderr, "%s", interruptMsg);
        exit(INTERRUPT_EXIT);
    }
}

/* set_signal_handlers()
 * -------------------
 * Sets a single sigaction struct to catch SIGINT whenever called.
 * The struct is also set to catch SIGCHLD only when --pipe or --halt-on-error
 * was supplied on the command line.
 *
 * arg1: The Settings struct with all of the program settings extracted from
 *       the command line supplied by the user.
 */
void set_signal_handlers(Settings settings)
{
    /* setting up signal hanlder for SIGINT */
    struct sigaction sigint = {0};
    sigint.sa_handler = custom_interrupt_exit;
    sigint.sa_flags = SA_RESTART; // disbling default blocking behaviour of
                                  // sigaction structs
    sigaction(SIGINT, &sigint, 0);

    if (settings.pipeOn || settings.haltOn) {
        // register to catch SIGCHLD if --pipe or --halt-on-error was
        // specified on command line
        struct sigaction sigchld = {0};
        sigchld.sa_handler = set_global_flag;
        sigchld.sa_flags = SA_RESTART;
        sigaction(SIGCHLD, &sigchld, 0);
    }
}

/// Exiting Functions ///////////////////

/* exit_invalid_command_line()
 * ---------------------------
 * Prints to stderr invalidCmdLineMsg and exit program with
 * exit status INVALID_CMD_LINE_EXIT.
 */
void exit_invalid_command_line(void)
{
    fprintf(stderr, "%s", invalidCmdLineMsg);
    exit(INVALID_CMD_LINE_EXIT);
}

/* exit_invalid_filename()
 * -----------------------
 * Prints to stderr "uqparallel: Unable to read from file \"filename\"\n"
 * and exits program with exit status INVALID_FILENAME_EXIT.
 *
 * arg1: The filename that could not be opened in read mode.
 */
void exit_invalid_filename(char* filename)
{
    fprintf(stderr, "%s%s\"\n", invalidFilenameMsg, filename);
    exit(INVALID_FILENAME_EXIT);
}

/// Error Functions /////////////////////

/* error_invalid_empty_command()
 * -----------------------------
 * Prints to stderr emptyCommandMsg.
 */
void error_invalid_empty_command(void)
{
    fprintf(stderr, "%s", emptyCommandMsg);
}

/* error_failed_execute_command()
 * -----------------------------
 * Prints "uqparallel: "cmd" not able to be executed" with a newline in stderr.
 *
 * arg1: The first argument to the char** command supplied to execvp()
 */
void error_failed_execute_command(char* command)
{
    fprintf(stderr, "uqparallel: \"%s\" not able to be executed\n", command);
}

/// Commandline Processing Functions ////

/* verify_jobs_limit()
 * -------------------
 * Checks that the supplied --limitjobs argument is valid and
 * saves value is supplied Settings struct.
 *
 * arg1: The Settings struct where the valid value is to be stored.
 * arg2: The supplied --limitjobs argument.
 *
 * Error: Function will invoke exit_invalid_command_line() if supplied
 *        --limitjobs argument is invalid.
 */
void verify_jobs_limit(Settings* settings, char* limitArg)
{
    int limit;
    char* decimalPos;
    char* endPtr;
    char* limitCopy = strdup(limitArg);
    if ((decimalPos = strstr(limitCopy, decimalDelim))) {
        // decimal point detected, invalid limit argument supplied
        exit_invalid_command_line();
    }
    limit = strtol(limitCopy, &endPtr, DECIMAL_FORMAT);
    if (*endPtr != '\0') {
        // partial conversion detected, invalid limit argument supplied
        exit_invalid_command_line();
    }
    if (limit < MIN_JOB_LIMIT || limit > MAX_JOB_LIMIT) {
        // invalid limit value
        exit_invalid_command_line();
    }
    settings->jobLimit = limit;
    free(limitCopy);
}

/* get_arguments()
 * ---------------
 * Extracts all fixed-args or per-task-args arguments and stores them at the
 * address of an unpopulated 2D char array pointed by saveTo.
 *
 * arg1: The first fixed-args or per-task-args argument position in the
 *       command line.
 * arg2: The number of command line arguments provided by user.
 * arg3: The command line arguments provided by user.
 * arg4: The address of the 2D char array where the tokenised arguments are to
 *       be stored.
 *
 * Returns: The number of extracted arguments stored at saveTo.
 *
 * Errors: Function calls exit_invalid_command_line() if:
 *      (i)  The 2D array pointed by saveTo is already pre-populated with data.
 *      (ii) An invalid fixed-args or per-task-args arguments is found,
 *           including invalid option arguments.
 */
int get_arguments(int startPos, int argc, char** argv, char*** saveTo)
{
    int size = 0; // tracks the number of arguments saved in saveTo
    char* isSpaceOutput;
    if (*saveTo != NULL) {
        // saveTo already populated from a previous call,
        // implies a cmd or ::: arguments
        exit_invalid_command_line();
    }
    *saveTo = (char**)malloc(sizeof(char*) * (size + 1));
    for (int i = startPos; i < argc; i++) {
        if (!strncmp(argv[i], optionHandle, strlen(optionHandle))
                || !strcmp("", argv[i])) {
            // detected an valid or invalid option argument at
            // an invalid position
            exit_invalid_command_line();
        } else if (!strcmp(argv[i], taskArgs)) {
            // ::: detected
            break;
        }
        /* Save argument to settings */
        *saveTo = (char**)realloc((void*)*saveTo, sizeof(char*) * ++size);
        if ((isSpaceOutput = is_space_argument(argv[i]))) {
            // detected space-character only argument, surrounds with quotes
            (*saveTo)[size - 1] = isSpaceOutput; // output is dynamically
                                                 // alloacted
        } else {
            (*saveTo)[size - 1] = strdup(argv[i]); // saving a copy
        }
    }
    return size;
}

/* is_space_argument()
 * -------------------
 * Checks if supplied token argument, generated by split_space_not_quote(),
 * consists purely of spaced characters and returns a copy with '\"' appended
 * and prepended.
 *
 * Copy is dynamically allocated and must be freed by called.
 *
 * Returns: A copy with '\"' appended and prepended if argument consits purely
 *          space characters, NULL otherwise.
 */
char* is_space_argument(char* arg)
{
    int size = strlen(arg);
    char* result = NULL;
    for (int i = 0; i < size; i++) {
        if (!isspace((int)arg[i])) {
            // non-space character found, not a space argument
            return NULL;
        }
    }
    // increase size by 3 to include the prepended and appended '\"' and '\0'
    size += SPACE_SIZE_INCREASE;
    result = (char*)malloc(sizeof(char) * size);
    for (int i = 0; i < size; i++) {
        if (!i) {
            // prepend '\"' condition
            result[i] = '\"';
        } else if (i == (size - 2)) {
            // append '\"' condition
            result[i] = '\"';
        } else {
            // insert space otherwise
            result[i] = ' ';
        }
    }
    result[size - 1] = '\0'; // append termination character
    return result;
}

/* check_settings()
 * ----------------
 * Checks if uploaded settings arguments are valid and sets the stream
 * member to stdin in cases where insufficient arguments were provided.
 *
 * These "insufficent" cases include:
 *      (i)  fixed-args, per-task-args and argument-file were not supplied
 *           in command line, or
 *      (ii) fixed-args supplied, but per-task and argument-file were not
 *           supplied in command line.
 *
 * arg1: A pointer the the Settings struct to be tested.
 */
void check_settings(Settings* settings)
{
    // Note: Both "insufficient" cases are characterised by the lack
    //       of both per-task-args and argument-file
    if ((settings->argumentFile && settings->taskArgs)
            || (settings->pipeOn
                    && (!settings->argumentFile && !settings->taskArgs))) {
        // --argfile and ::: are both present, invalid command line detected
        // or
        // --pipe was supplied but niether were --argsfile nor per-task-args
        exit_invalid_command_line();
    }
    if (settings->argumentFile
            && !(settings->stream = fopen(settings->argumentFile, "r"))) {
        // file could not be opened for read mode, exit program
        exit_invalid_filename(settings->argumentFile);
    }
    if (!settings->taskSize && !settings->argumentFile && !settings->pipeOn) {
        // insufficient case detected, take and execute
        // commands directly from stdin
        settings->stream = stdin;
    }
}

/* get_settings()
 * --------------
 * Extracts program settings from command line arguments.
 *
 * arg1: The number of command line arguments entered by the user.
 * arg2: The command line arguments entered by the user.
 *
 * Returns: An instance of Settings populated with all of settings enabled by
 *          user.
 */
Settings get_settings(int argc, char** argv)
{
    Settings settings = {0};
    settings.jobLimit = MAX_JOB_LIMIT; // default job limit value unless
                                       // otherwise specified by user
    int jobCount = 0; // counts the number of --limitjobs has appeared
    for (int i = 1; i < argc; i++) {
        // parsing through command line arguments
        if (!strcmp(argv[i], haltOnError) && !settings.haltOn) {
            // --halt-on-error detected
            settings.haltOn = 1;
        } else if (!strcmp(argv[i], pipeArg) && !settings.pipeOn) {
            // --pipe detected
            settings.pipeOn = 1;
        } else if (!strcmp(argv[i], argsFile) && !settings.argumentFile
                && (i + 1 < argc)) {
            // --argsfile detected
            settings.argumentFile = argv[++i];
        } else if (!strcmp(argv[i], limitJobs) && !jobCount && (i + 1 < argc)) {
            // --limitjobs detected
            verify_jobs_limit(&settings, argv[++i]);
            jobCount++;
        } else if (!strcmp(argv[i], dryRun) && !settings.dryRunOn) {
            // --dry-run detected
            settings.dryRunOn = 1;
        } else if (strncmp(argv[i], optionHandle, strlen(optionHandle))
                && strcmp(argv[i], taskArgs)) { // fixed-args detected
            settings.fixedSize
                    = get_arguments(i, argc, argv, &settings.fixedArgs);
            i += settings.fixedSize - 1;
        } else if (!strcmp(argv[i], taskArgs)) {
            // per-task-args detected
            settings.taskSize
                    = get_arguments(i + 1, argc, argv, &settings.taskArgs);
            i += settings.taskSize;
        } else {
            // unrecognised argument found, invalid command line
            exit_invalid_command_line();
        }
    }
    check_settings(&settings);
    return settings;
}

//// dry-run Functions //////////////////

/* dry_print()
 * -----------
 * Prints to stdout the arguments of a given string array in the format
 * specified by --dry-run in spec-sheet, where each argument is printed on
 * the same line with a space between them.
 *
 * Format: "arg1 arg2 arg3.. argn"
 *
 * arg1: The size of the array to be printed.
 * arg2: The array who's elements are to be printed in --dry-run format.
 * arg3: A flag where function will attempt to print tokens with quotes
 *       if detected.
 *
 * Notes: Only when enableQuotes is 1, function will print quoted arguments
 *        with quotes.
 */
void dry_print(int size, char** args, int enableQuotes)
{
    for (int i = 0; i < size; i++) {
        if ((enableQuotes == 1) && args[i][-1] == '\"') {
            // check for proceeding delimiter
            printf(" \"%s\"\n", args[i]);
            continue;
        }
        printf(" %s", args[i]);
    }
}

/* execute_dry_run()
 * ---------------
 * Executes --dry-run behaviour in accordance to spec-sheet, including
 * taking user input from stdin. Function exits program with an
 * exit status EXIT_SUCCESS
 *
 * All printing operations are sent to stdout.
 *
 * arg1: The Settings struct populated with all settings enabled by users.
 */
void execute_dry_run(Settings settings)
{
    int count = 0;
    ssize_t nread;
    size_t len = 0;
    char* line = NULL;
    /* line processing */
    int numTok;
    char** tokens;
    if (!settings.taskSize) {
        // per-task-args not supplied, take from settings.stream
        while ((nread = getline(&line, &len, settings.stream)) != -1) {
            if (!strcmp("\n", line)) {
                // empty line, skip
                continue;
            }
            tokens = split_space_not_quote(line, &numTok);
            if (!settings.fixedSize) {
                // no fixed-args nor per-task-args provided,
                // get both from settings.stream
                printf("%d:", ++count);
                dry_print(numTok, tokens, 1);
            } else {
                // only no per-task-args provided, get from settings.stream
                printf("%d:", ++count);
                dry_print(settings.fixedSize, settings.fixedArgs, 0);
                dry_print(numTok, tokens, 1);
            }
            free((void*)tokens);
        }
        if (settings.argumentFile) {
            // close argument-file
            fclose(settings.stream);
        }
    } else {
        // fixed-args and per-task-size arguments provided
        for (int i = 0; i < settings.taskSize; i++) {
            printf("%d:", i + 1);
            dry_print(settings.fixedSize, settings.fixedArgs, 0);
            if (settings.pipeOn && (i != settings.taskSize - 1)) {
                // --pipe supplied, append '|' excluding the last print
                printf(" %s |\n", settings.taskArgs[i]);
            } else {
                printf(" %s\n", settings.taskArgs[i]);
            }
        }
    }
    exit(SUCCESS_EXIT);
}

/// Generating Executable Commands Functions //////////////////

/* get_settings_commands()
 * --------------
 * Generates the collection of char** commands that can be executed through
 * execvp() in accordence to the supplied settings.fixedArgs
 * settings.taskArgs
 *
 * arg1: The Settings struct storing users input from command line.
 * arg2: A pointer intended to store the number of commands generated
 *       (char** arrays) stored at the memory location of char***
 *
 * Return: A pointer to the memory location of char**, NULL terminating
 *         commands, each ready to be executed by execvp().
 */
char*** get_settings_commands(Settings settings, int* cmdCount)
{
    // NOTE:
    // Format of all char** pointed by char*** commands:
    //              {[fixed-args], [per-task-args[i], NULL}
    int cmdLen;
    *cmdCount = settings.taskSize;
    char*** commands = (char***)malloc(sizeof(char**) * (*cmdCount));
    for (int i = 0; i < *cmdCount; i++) {
        // generating a double array with
        // format {{fixed-args, ..}, {per-task-args[i]}, NULL}
        cmdLen = settings.fixedSize + 2; // + 2 for per-task-args[i] and NULL
        commands[i] = (char**)malloc(sizeof(char*) * (cmdLen));
        for (int j = 0; j < settings.fixedSize; j++) {
            // adding fixedCount
            commands[i][j] = settings.fixedArgs[j];
        }
        commands[i][settings.fixedSize] = settings.taskArgs[i];
        commands[i][cmdLen - 1] = NULL;
    }
    return commands;
}

/* get_stream_commands()
 * ---------------------
 * Generates a collection of char** commands tokenising each line
 * in the file into a char** that can be executed by execvp.
 *
 * arg1: The Settings struct storing users input from command line.
 * arg2: A pointer intended to store the number of commands generated
 *
 * Returns: A pointer to the memeory location of char**, NULL terminating
 *          commands, each ready to be executed by execvp().
 *
 * Precondition: settings.stream cannot be stdin, stderr, or stdout.
 *               If either is detected, function will return NULL
 */
char*** get_stream_commands(Settings settings, int* cmdCount)
{
    char*** commands;
    /* Token processing */
    int numTok;
    char** tokens;
    /* input from stdin */
    ssize_t nread;
    size_t len = 0;
    char* line = NULL;
    *cmdCount = 0;
    if ((settings.stream == stdin) || (settings.stream == stderr)
            || (settings.stream == stdout)) {
        // violation of precondition detected, return
        return NULL;
    }
    commands = (char***)malloc(sizeof(char**) * (*cmdCount + 1));
    /* counting number of lines to be converted into a command */
    while ((nread = getline(&line, &len, settings.stream)) != -1) {
        // number of non-empty lines == *cmdCount
        if (!strcmp("\n", line)) {
            // empty line, skip
            continue;
        }
        line[nread - 1] = '\0'; // stripping newline
        tokens = split_space_not_quote(line, &numTok);
        commands = (char***)realloc(
                (void*)commands, sizeof(char**) * (++(*cmdCount)));
        commands[*cmdCount - 1]
                = (char**)malloc(sizeof(char*) * (numTok + 1)); // +1 for NULL
        for (int i = 0; i < numTok; i++) {
            // generating char** and storing it in char***
            commands[*cmdCount - 1][i] = strdup(tokens[i]);
        }
        commands[*cmdCount - 1][numTok]
                = NULL; // add NULL to make char** executable via execvp()
        free((void*)tokens);
    }
    return commands;
}

/* get_line_commands()
 * -------------------
 * Generates a char** command from settings.fixedArgs and tokens
 *
 * arg1: The Settings struct storing user inputs from command line.
 * arg2: The number of tokens supplied.
 * arg3: The tokens to be used in place of a single per-task-args
 *
 * Return: A char**, NULL terminating command ready to be executed by execvp()
 */
char** get_line_command(Settings settings, int numTok, char** tokens)
{
    int cmdCount = settings.fixedSize + numTok + 1; // +1 for NULL
    char** commands = (char**)malloc(sizeof(char*) * cmdCount);
    for (int i = 0; i < settings.fixedSize; i++) {
        commands[i] = strdup(settings.fixedArgs[i]);
    }
    for (int i = 0; i < numTok; i++) {
        commands[i + settings.fixedSize] = strdup(tokens[i]);
    }
    commands[cmdCount - 1] = NULL;
    return commands;
}

/* get_file_commands()
 * ------------------
 * Reads through provided argument-file and uses supplied settings.fixed-args
 * and non-empty file lines to generate a collections of char** commands
 * that can be executed by execvp()
 *
 * arg1: The Settings struct stroing all user inputs from command line.
 * arg2: A pointer intended to store the number of char** commands generated.
 */
char*** get_file_commands(Settings settings, int* cmdCount)
{
    ssize_t nread;
    size_t len = 0;
    char* line = NULL;
    /* line processing */
    int numTok;
    char** tokens;

    *cmdCount = 0;
    char*** commands = (char***)malloc(sizeof(char**) * (*cmdCount + 1));
    while ((nread = getline(&line, &len, settings.stream)) != -1) {
        // save each line as an argument in settings.taskArgs
        if (!strcmp("\n", line)) {
            // empty line, skip
            continue;
        }
        line[nread - 1] = '\0'; // strip newline
        tokens = split_space_not_quote(line, &numTok);
        commands = (char***)realloc(
                (void*)commands, sizeof(char**) * ++(*cmdCount));
        commands[*cmdCount - 1] = (char**)malloc(
                sizeof(char*) * (settings.fixedSize + numTok + 1));
        for (int i = 0; i < settings.fixedSize; i++) {
            // adding all fixed
            commands[*cmdCount - 1][i] = strdup(settings.fixedArgs[i]);
        }
        for (int i = 0; i < numTok; i++) {
            // adding tokens
            commands[*cmdCount - 1][settings.fixedSize + i] = strdup(tokens[i]);
        }
        commands[*cmdCount - 1][settings.fixedSize + numTok] = NULL;
    }
    // debug_print_commands(*cmdCount, commands);
    return commands;
}

//// Executing Commands Functions ///////

/* run_child()
 * -----------
 * Ensures a given child process runs provided command.
 * The child is subject to the following:
 *      (i)   stderr is suppressed
 *      (ii)  stdout is sent to the parent via the provided pipes
 *      (iii) provided pipes fds will be closed
 *
 * arg1: The previous childs file descriptor to the READ end of its pipe
 * arg2: Pipe fds shared between parent and child.
 * arg3: The command vector to be executed by child.
 *
 * Requirement:
 *      (i)   cmdToExecute must have NULL as its last element.
 *      (ii)  To recieve termination status, child must be reaped after
 *            termination.
 *      (iii) To recieve stdout from child, parent must be actively reading
 *            from the READ end of the pipe
 *      (iv)  To run the child without linking its stdin to another
 *            previous child, set previousChildFd to PIPE_OFF
 *
 * Errors: If cmdToExecute could not be executed by child,
 *         child terminiates itself and sends SIGUSR1 to parent.
 */
void run_child(int previousChildFd, int currentChildFds[2], char** cmdToExecute)
{
#ifdef SHOW
    printf("printing commands before running execvp() - modifed check\n");
    debug_print_array(-1, cmdToExecute);
    printf("\n\n");
    execvp(cmdToExecute[0], cmdToExecute);
    raise(SIGUSR1); // exec failed, terminate child process
#endif
    close(currentChildFds[READ]);
    dup2(currentChildFds[WRITE], STDOUT_FILENO);
    close(currentChildFds[WRITE]);
    /* redirecting previousChildFd to stdin of current child */
    if (previousChildFd != PIPE_OFF) {
        // reading end of previous child
        dup2(previousChildFd, STDIN_FILENO);
        close(previousChildFd); // we don't need this anymore
    }
    /* suppressing stdeer child */
    int fdErr = open("/dev/null", O_WRONLY);
    dup2(fdErr, STDERR_FILENO);
    close(fdErr);
    execvp(cmdToExecute[0], cmdToExecute);
    raise(SIGUSR1); // exec failed, terminate child process
}

/* print_child_output()
 * -----------------
 * Ensures a given parent process reads and prints out the child's sdtout
 * to the parent's stdout.
 *
 * arg1: Pipe fds shared between parent and child.
 *
 */
void print_child_output(int currentChildFds[2])
{
    ssize_t bytesRead;
    char buffer[BUFFER_SIZE];
    close(currentChildFds[WRITE]);
    while ((bytesRead = read(currentChildFds[READ], buffer, sizeof(buffer)))
            > 0) {
        // reading stdout from child process
        fwrite(buffer, sizeof(char), bytesRead, stdout);
    }
    close(currentChildFds[READ]);
}

/* parallel_wait()
 * --------------
 * Function reaps all children spawned by execute_parallel() and prints
 * there output to the parent's stdout in chrinological order.
 *
 * This function is intended to be use execute_parallel().
 *
 * arg1: The Settings struct with all program arguments, including
 *       commands provided by user at command line.
 * arg2: The Queue struct populated with all of the children processes ids
 *       That has been run, pending, terminated or reaped.
 * arg3: Where the int status of the last terminated process in queue is to be
 *       stored.
 * arg4: The collection of commands executed by children in queue.
 *
 * Error: Function calls error_failed_execute_command() whenever a child
 *        process failed to execvp().
 */
void parallel_wait(
        Settings settings, Queue queue, int* status, char*** commands)
{
    if ((failed == true) && (settings.pipeOn || settings.haltOn)) {
        // --pipe or --halt-on-error specified and SIGCHLD recived
        terminate_children(SIGCHLD, queue);
    } else {
        for (int i = 0; i < queue.size; i++) {
            if (queue.status[i] != TERMINATED) {
                // wait for child only if it has not been terminated
                waitpid(queue.children[i], status, 0);
                if (WIFSIGNALED(*status) && (SIGUSR1 == WTERMSIG(*status))) {
                    // child failed to exec TODO check if this is correct
                    error_failed_execute_command(commands[i][0]);
                }
            }
        }
    }
    if (settings.pipeOn) {
        // only print the last child when --pipe was supplied
        print_child_output(queue.pipes[queue.size - 1]);
    } else {
        for (int i = 0; i < queue.size; i++) {
            print_child_output(queue.pipes[i]);
        }
    }
}

/* get_exit_status()
 * ------------------
 * Gets the corrsponding exit status from the status int supplied.
 *
 * arg1: The status int where the exit status is to be extracted from.
 *
 * Returns the exit status corresponding to the status int supplied.
 */
int get_exit_status(int status)
{
    if (WIFSIGNALED(status)) {
        // last run exited due to signal (including SIGUSR1)
        return FAILED_LAST_RUN_EXIT;
    }
    if (WIFEXITED(status)) {
        // child terminated normally
        return WEXITSTATUS(status);
    }
    return LAST_RUN_EMPTY_EXIT; // exit status due to empty command
}

/* execute_parallel()
 * ---------------------------
 * Executes commands saved in provided Settings struct in parallel.
 *
 * arg1: The Settings struct with all program arguments, including
 *       commands provided by user at command line.
 *
 * Errors: Function calls error_failed_execute_command() whenever
 *         an child failed to execute a specific command
 */
void execute_parallel(Settings settings, int cmdCount, char*** commands)
{
    pid_t reapedChild;
    int status;
    int running = 0; // Tracks the number of running children
    set_signal_handlers(settings);
    Queue queue = init_queue(cmdCount);
    for (int i = 0; i < cmdCount; i++) {
        // spawn children in parallel
        queue.children[i] = fork();
        if (settings.pipeOn && i) {
            // close WRITE when a previous child exists to stop blocked read
            close(queue.pipes[i - 1][WRITE]);
        }
        running++;
        if (!queue.children[i] && !settings.pipeOn) {
            // child case: execute command send SIGUSR1 otherwise
            run_child(PIPE_OFF, queue.pipes[i], commands[i]);
        } else if (!queue.children[i] && settings.pipeOn) {
            // child case --pipe enabled
            if (!i) {
                // treat first child normally
                run_child(PIPE_OFF, queue.pipes[i], commands[i]);
            } else {
                // direct input form previous child to stdin
                run_child(
                        queue.pipes[i - 1][READ], queue.pipes[i], commands[i]);
            }
        }
        if (running >= settings.jobLimit) {
            // enforcing --limitjobs, block wait for any child
            reapedChild = wait(&status);
            for (int j = 0; j < cmdCount; j++) {
                // update reaped status to avoid wait blocking indefinitely
                if (queue.children[j] == reapedChild) {
                    queue.status[j] = TERMINATED;
                    if (!settings.haltOn && WIFSIGNALED(status)
                            && (SIGUSR1 == WTERMSIG(status))) {
                        // child failed to exec
                        error_failed_execute_command(commands[i][0]);
                    }
                    break;
                }
            }
            running--;
        }
    }
    parallel_wait(settings, queue, &status, commands);
    exit(get_exit_status(status));
}

/* execute_sequential()
 * -------------------------
 * Executes commands sent from settings.stream in sequenential.
 *
 * arg1: The Settings struct that provides access to the file stream
 *       stored at setting.stream
 *
 * Errors: Functions throws error_failed_execute_command() whenever
 *         execvp() fails, that is SIGUSR was sent from by the
 *         child process.
 */
void execute_sequential(Settings settings)
{
    pid_t pid;
    int status, numTok;
    int fds[PIPE_SIZE];
    char** tokens;
    char** commands;
    int count = 0;
    ssize_t nread;
    size_t len = 0;
    char* line;
    struct sigaction sa = {0};
    sa.sa_handler = custom_interrupt_exit;
    sa.sa_flags = SA_RESTART;
    sigaction(SIGINT, &sa, 0);
    while ((nread = getline(&line, &len, settings.stream)) != -1) {
        count++;
        if (!strcmp("\n", line)) {
            // empty line, skip
            continue;
        }
        tokens = split_space_not_quote(line, &numTok);
        if (!strcmp(tokens[0], "")) {
            // empty string followed by arguments detected
            error_invalid_empty_command();
            continue;
        }
        line[nread - 1] = '\0';
        if (settings.fixedSize) {
            commands = get_line_command(settings, numTok, tokens);
        } else {
            commands = tokens;
        }
        pipe(fds);
        pid = fork();
        if (!pid) {
            run_child(PIPE_OFF, fds, commands);
        }
        print_child_output(fds);
        waitpid(pid, &status, 0);
        if (WIFSIGNALED(status) && (SIGUSR1 == WTERMSIG(status))) {
            // child failed to exec, notify user
            error_failed_execute_command(commands[0]);
        }
        free((void*)commands);
    }
    if (!count && !strcmp(line, "")) {
        // special case, no arguments were supplied to stdin
        exit(LAST_RUN_EMPTY_EXIT);
    }
    exit(get_exit_status(status));
}

/// Advanced Functionality Functions ///

/* terminate_children()
 * -------------------
 * Manually terminates running children in queue in accordance
 * to provided signal.
 *
 * arg1: The signal sent to the parent (e.g. SIGCHLD or SIGINT).
 * arg2: A Queue struct with all of the children, in order, pending termination.
 *
 * REF: Used to learn how to set a sigset_t (i.e. sigemptyset() and sigaddset()
 * REF:
 * https://support.sas.com/documentation/onlinedoc/sasc/doc750/html/Ir1/z2056396.html
 */
void terminate_children(int signal, Queue queue)
{
    // settings up set in accordance signal recieved
    sigset_t set;
    sigemptyset(&set);
    sigaddset(&set, SIGTERM);
    siginfo_t info;
    struct timespec timeout = {0};
    timeout.tv_sec = 1; // setting timeout to one second exactly
    int killSuccess;
    int killSuccessCount = 0;
    int stopPrint = 0;
    for (int i = 0; i < queue.size; i++) {
        // send  SIGTERM if child was not already TERMINATED
        if ((queue.status[i] != TERMINATED) && signal == SIGCHLD) {
            if (!(killSuccess = kill(queue.children[i], SIGTERM))) {
                // kill signal was successfully sent
                killSuccessCount++;
            }
            if (sigtimedwait(&set, &info, &timeout) < 0) {
                // child was not terminated by SIGTERM,
                // within a second send SIGKILL instead
                kill(queue.children[i], SIGKILL);
            }
        }
        if (!stopPrint && WIFEXITED(info.si_status)) {
            print_child_output(queue.pipes[i]);
            continue;
        }
        stopPrint++;
    }
    // send message only once if not done so already
    fprintf(stderr, "%s", executionFailedMsg);
    if (killSuccessCount) {
        exit(SIGTERM_EXIT);
    }
    exit(get_exit_status(info.si_status));
}

/// Main ////////////////////////////////
int main(int argc, char** argv)
{
    int cmdCount;
    char*** commands;
    Settings settings = get_settings(argc, argv); // parsing commmandline
                                                  // arguments
    if (!settings.dryRunOn && !settings.taskSize && !settings.argumentFile
            && !settings.pipeOn) {
        // "insufficient" arguments supplied, extracts commands from
        // stdin
        execute_sequential(settings);
    } else if (settings.dryRunOn) {
        // --dry-run specified by user
        execute_dry_run(settings);
    } else if (argc == 2 && !strcmp(argv[1], taskArgs)) {
        // handling special case
        exit(LAST_RUN_EMPTY_EXIT);
    }
    /* when --dry-run not specified, generating commands and execute */
    if (!settings.fixedSize && !settings.taskSize && settings.argumentFile) {
        // argument-file supplied only, extract all commands from argument-file
        commands = get_stream_commands(settings, &cmdCount);
    } else if (settings.fixedSize && !settings.taskSize
            && settings.argumentFile) {
        // fixed-args supplied but per-task-args wasn't, use argument-file
        // to generate per-task-args, then commands
        commands = get_file_commands(settings, &cmdCount);
    } else {
        // remaining cases handled here
        commands = get_settings_commands(settings, &cmdCount);
    }
#ifdef SHOW
    if (settings.stream == stdin) {
        printf("it is stdin\n");
    }
    printf("it is NOT stdin\n");
    debug_print_commands(cmdCount, commands);
#endif
    execute_parallel(settings, cmdCount, commands);
    return SUCCESS_EXIT;
}
