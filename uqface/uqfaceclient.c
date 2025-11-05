#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <netdb.h>
#include <unistd.h>
#include <signal.h>

#define BUFFER_SIZE 1024

/* typedef definitions */
typedef const uint32_t Prefix;
typedef const uint8_t Operation;
typedef struct sigaction Sigaction;
typedef const char* const ImmutableString;
// Messages
ImmutableString invalidCmdLineMsg
        = "Usage: ./uqfaceclient portnum [--outputimage filename] "
          "[--replacefilename filename] [--detect filename]\n";
ImmutableString invalidPortNumMsg
        = "uqfaceclient: cannot connect to the server on port \"";
ImmutableString errorMsg = "uqfaceclient: got the following error message: \"";
ImmutableString errorCommunicationMsg
        = "uqfaceclient: a communication error occurred\n";
// Command line arguments
ImmutableString output = "--outputimage";
ImmutableString replace = "--replacefilename";
ImmutableString detect = "--detect";
ImmutableString empty = "";
/* Communication Protocol types */
Prefix prefix = 0x23107231;
Operation detectFace = 0;
Operation replaceFace = 1;
Operation outputImg = 2;
Operation opError = 3; // operation error

/* Struct definitions */
typedef struct {
    char* portNum; // supplied portnum string from command argument
                   // to be converted as an integer
    char* outputFilename;
    char* replaceFilename;
    char* detectFilename;
    FILE* output;
    FILE* replace;
    FILE* detect;
    /* Socket fds */
    FILE* read; // read from socket
    FILE* write; // writing into socket
} Settings;

// Custom client program exit codes
typedef enum {
    EXIT_INVALID_FILE_READ = 16,
    EXIT_INVALID_FILE_WRITE = 17,
    EXIT_INVALID_COMMAND_LINE = 13,
    EXIT_INVALID_PORT_NUM = 5,
    EXIT_ERROR = 10,
    EXIT_ERROR_COMMUNICATION = 7,
    SUCCESS_EXIT = 0
} ExitCodes;

// Used to toggle for the reading or writting message to be output by
// exit_invalid_filename()
typedef enum { READ, WRITE } FileMode;

/// Functions ///////////////////////////
/* sigaction functions */
void sig_exit(int signal);
/* exiting functions */
void exit_invalid_filename(FileMode mode, char* filename);
void exit_invaid_command_line(void);
void exit_invalid_port(char* portNum);
void exit_server_error(char* msg);
void exit_communication_error(void);
/* command line processing functions */
Settings get_settings(int argc, char* argv[]);
/* file checking functions */
void open_files(Settings* settings);
/* socket functions */
void init_socket(Settings* settings);
/* server communication functions */
void send_file(FILE* stream, FILE* toServer);
void send_request(Settings* settings);
void write_response(FILE* stream, FILE* fromServer);
/* main */
int main(int argc, char* argv[]);

/////////////////////////////////////////

/// Sigaction Functions /////////////////

/* sig_exit()
 * ----------
 * Calls exit_communication_error() whenever a SIGPIPE signal is recieved.
 *
 * signal: The signal recieved by the Sigaction struct.
 */
void sig_exit(int signal)
{
    if (signal == SIGPIPE) {
        exit_communication_error();
    }
}

/// Exiting Functions ///////////////////

/* exit_invalid_filename()
 * -----------------------
 * Prints to stderr when filename could not be opened for reading, and exits
 * uqfaceclient with exit status EXIT_INVALID_FILE_READ:
 *      "uqfaceclient: cannot open the input file \"filename\" for reading\n"
 *
 * Otherwise, the following is printed to stderr and exits uqfaceclient
 * with exit status EXIT_INVALID_FILE_WRITE:
 *      "uqfaceclient: cannot open the input file \"filename\" for writing\n"
 *
 * mode: The mode (read or write) that the file failed to open with.
 * filename: The filename that cannot be opened.
 */
void exit_invalid_filename(FileMode mode, char* filename)
{
    if (mode == READ) {
        // print reading message
        fprintf(stderr,
                "uqfaceclient: cannot open the input file \"%s\" for reading\n",
                filename);
        exit(EXIT_INVALID_FILE_READ);
    }
    // assume writing message is to be printed
    fprintf(stderr,
            "uqfaceclient: unable to open the output file \"%s\" for writing\n",
            filename);
    exit(EXIT_INVALID_FILE_WRITE);
}

/* exit_invaid_command_line()
 * --------------------------
 * Prints to stderr invaidCmdLineMsg and exit uqfaceclient with na
 * exit status of EXIT_INVALID_COMMAND_LINE.
 */
void exit_invalid_command_line(void)
{
    fprintf(stderr, "%s", invalidCmdLineMsg);
    exit(EXIT_INVALID_COMMAND_LINE);
}

/* exit_invalid_port()
 * -------------------
 * Prints to stderr the message below and exits uqfacedetect with an
 * exit status of EXIT_INVALID_PORT_NUM.
 *
 * The message printed to stderr is as follows:
 *      "uqfaceclient: cannot connect to the settings on port \"portNum\"\n"
 *
 * portNum: The portNum supplied at terminal that could not connect to settings.
 */
void exit_invalid_port(char* portNum)
{
    fprintf(stderr, "%s%s\"\n", invalidPortNumMsg, portNum);
    exit(EXIT_INVALID_PORT_NUM);
}

/* exit_server_error()
 * Function prints to stderr the message below and exits uqfacedetect with
 * exit status EXIT_ERROR.
 *
 * Message sent: "uqfaceclient: got the following error message: \"msg\"\n"
 *
 * msg: The string to be incoorparated into the sent message above
 */
void exit_server_error(char* msg)
{
    fprintf(stderr, "%s%s\"\n", errorMsg, msg);
    free(msg);
    exit(EXIT_ERROR);
}

/* exit_communication_error()
 * -----------------------------
 * Prints to stderr errorCommunicationMsg and exits uqfacedetect with
 * exit status EXIT_ERROR_COMMUNICATION.
 */
void exit_communication_error(void)
{
    fprintf(stderr, "%s", errorCommunicationMsg);
    exit(EXIT_ERROR_COMMUNICATION);
}

/// Command Line Processing Functions ////

/* get_settings()
 * --------------
 * Generates a settings struct populated with all program settings
 * enabled user through terminal input.
 *
 * argc: The number of program arguments supplied by user at the terminal.
 * argv: The program arguments supplied by user at the terminal.
 *
 * Return: A settings struct populated with all of the program settings.
 *         enabled by user.
 * Errors: Function calls exit_invalid_command_line() whenever an invalid
 *         argument is detected.
 */
Settings get_settings(int argc, char* argv[])
{
    // NOTE: This function does not attempt to validate settings.portNum.
    //       portnum verification is handled by init_socket()
    Settings settings = {0};
    for (int i = 1; i < argc; i++) {
        if (i == 1 && strcmp(argv[i], empty)) {
            // saving first argument as a portnum is not ""
            settings.portNum = argv[i];
        } else if (!strcmp(argv[i], output) && (i + 1 < argc)
                && !settings.outputFilename && strcmp(argv[i + 1], empty)) {
            // saving non-empty output file
            settings.outputFilename = argv[++i];
        } else if (!strcmp(argv[i], replace) && (i + 1 < argc)
                && !settings.replaceFilename && strcmp(argv[i + 1], empty)) {
            // saving non-empty replace filename
            settings.replaceFilename = argv[++i];
        } else if (!strcmp(argv[i], detect) && (i + 1 < argc)
                && !settings.detectFilename && strcmp(argv[i + 1], empty)) {
            // saving non-empty detect filename
            settings.detectFilename = argv[++i];
        } else {
            // argument cannot be identified, assume to be invalid
            exit_invalid_command_line();
        }
    }
    if (!settings.portNum) {
        // invalid case: portnum was not supplied at command line
        exit_invalid_command_line();
    }
    return settings;
}

/// File Checking Functions //////////////

/* open_files()
 * -------------
 * Opens supplied files in their appropiate mode:
 *      (i)   settings.outputFilename in write mode.
        // no faces detected, notify client of error
 *      (ii)  settings.replaceFilename in read mode.
 *      (iii) settings.detectFilename in read mode.
 *
 * settings: The settings struct whole upladed files are to be opened.
 *
 * Errors: Function calls exit_invalid_filename() if a filename in settings
 *         cannot be opened under their appropiate mode (e.g. --detect filename
 *         could not be opened in read mode).
 */
void open_files(Settings* settings)
{
    if (settings->detectFilename
            && !(settings->detect = fopen(settings->detectFilename, "rb"))) {
        // supplied detect file could not be opened in read mode
        exit_invalid_filename(READ, settings->detectFilename);
    }
    if (settings->replaceFilename
            && !(settings->replace = fopen(settings->replaceFilename, "rb"))) {
        // supplied replace file could not be opened in read mode
        exit_invalid_filename(READ, settings->replaceFilename);
    }
    if (settings->outputFilename
            && !(settings->output = fopen(settings->outputFilename, "wb"))) {
        // supplied output file could not be opened in write mode
        exit_invalid_filename(WRITE, settings->outputFilename);
    }
}

/// Socket Functions ////////////////////

/* init_socket()
 * -------------
 * Initialise settings.write and settings.read memebers with the provided
 * setting.portNum saved.
 *
 * settings: The Settings struct whose settings.write and settings.read memebers
 *       are to be populated.
 *
 * Error: Function calls exit_invalid_port() whenever the provided port
 *        cannot be listened on.
 */
void init_socket(Settings* settings)
{
    int socketRead, socketWrite;
    struct addrinfo* ai = 0;
    struct addrinfo hints = {0}; // populating generic socket type
    hints.ai_family = AF_INET; // specifiying using internet family protocol
    hints.ai_socktype = SOCK_STREAM; // specify TCP protocol is to be used
    if (getaddrinfo("localhost", settings->portNum, &hints, &ai)) {
        exit_invalid_port(settings->portNum);
    }
    /* connect socket */
    socketRead = socket(AF_INET, SOCK_STREAM, 0);
    if (connect(socketRead, ai->ai_addr, sizeof(struct sockaddr))) {
        exit_invalid_port(settings->portNum);
    }
    /* populate settings with socket ends */
    socketWrite = dup(socketRead);
    settings->read = fdopen(socketRead, "r");
    settings->write = fdopen(socketWrite, "w");
}

/// Server Communication Functions //////

/* send_file()
 * -----------
 * Sends to server's socket the size of file as a uint32_t and the contents of
 * the file in bytes.
 *
 * stream: The file to be sent to the server.
 * toServer: The writing end of the file's socket.
 */
void send_file(FILE* stream, FILE* toServer)
{
    ssize_t nread; // butes read
    char buffer[BUFFER_SIZE];
    uint32_t fileByteSize = 0;
    uint8_t* fileData = NULL;
    while ((nread = fread(buffer, 1, sizeof(buffer), stream))) {
        // save bytes read to buffer and increment fileByteSize by bytes read
        fileData = (uint8_t*)realloc(fileData, fileByteSize + nread);
        memcpy(fileData + fileByteSize, buffer, nread);
        fileByteSize += nread;
    }
    fwrite(&fileByteSize, sizeof(uint32_t), 1, toServer);
    fwrite(fileData, sizeof(uint8_t), fileByteSize, toServer);
    fflush(toServer);
    free(fileData);
}

/* send_request()
 * --------------
 * Sends a request to server in accordance to enabled memebers in Settings
 * struct.
 *
 * settings: The Settings struct populated from program settings enabled by used
 *           in terminal.
 */
void send_request(Settings* settings)
{
    // NOTE: This function follows the communication protocol highlighed in
    //       specsheet - which is:
    //       (i)   send prefix
    //       (ii)  send operation type
    //       (iii) send image 1 size (number of bytes M)
    //       (iv)  send image 1 data (as bytes)
    //       (v)   IF present, send image 2 size (number of bytes N)
    //       (vi)  IF present, send image 2 data (as bytes)
    fwrite(&prefix, sizeof(uint32_t), 1, settings->write); // send prefix
    fflush(settings->write);
    /* sending operation type */
    if (settings->replaceFilename) {
        fwrite(&replaceFace, sizeof(uint8_t), 1, settings->write);
        fflush(settings->write);
    } else {
        // neither settings.outputFilename or settings.replaceFilename was
        // supplied, default to operation detectFace
        fwrite(&detectFace, sizeof(uint8_t), 1, settings->write);
        fflush(settings->write);
    }
    /* send input image byte size M and its contents as bytes */
    if (settings->detectFilename) {
        // input file provided, send to server
        send_file(settings->detect, settings->write);
        fclose(settings->detect);
    } else {
        // no input file provided, send stdin contents to server
        send_file(stdin, settings->write);
    }
    /* send replace image byte size N and its contents as bytes */
    if (settings->replaceFilename) {
        // --replacefilename provided, send to server
        send_file(settings->replace, settings->write);
        fclose(settings->replace);
    }
}

/* write_response()
 * ----------------
 * Function write output image (in bytes) received by server to the provided
 * file stream.
 *
 * stream: The file stream to write to (including outputfilename or stdout).
 * fromServer: The socket to read output from server.
 *
 * Error:
 *      (i)  Function calls exit_communication_error() attempts to read
 *           from the closed socket of a terminated server.
 *      (ii) Function calls exit_server_error() when an error message is
 *           recieved from the server.
 */
void write_response(FILE* stream, FILE* fromServer)
{
    size_t nread; // number of bytes read
    uint32_t recievedPrefix, outSize;
    uint8_t recievedOperation;
    uint8_t* buffer;
    if (fread(&recievedPrefix, 1, sizeof(uint32_t), fromServer) == 0) {
        // failed to read prefix
        exit_communication_error();
    }
    if (recievedPrefix != prefix) {
        // unrecognised prefixe was detected
        exit_communication_error();
    }
    if (fread(&recievedOperation, 1, sizeof(uint8_t), fromServer) == 0) {
        // failed to read operation
        exit_communication_error();
    }
    if (recievedOperation == opError) {
        // error message recieved, exit uqfaceclient
        fread(&outSize, 1, sizeof(uint32_t), fromServer);
        buffer = (uint8_t*)malloc((outSize + 1)); // +1 for '\0'
        if ((nread = fread(buffer, 1, outSize, fromServer)) < outSize) {
            // number of bytes read is less than expected
            free(buffer);
            exit_communication_error();
        }
        buffer[nread] = '\0';
        exit_server_error((char*)buffer);
    } else if ((recievedOperation == outputImg
                       || recievedOperation == replaceFace)) {
        if (fread(&outSize, sizeof(uint32_t), 1, fromServer) == 0) {
            // failed to read output file size
            exit_communication_error();
        }
        /* writing output */
        buffer = (uint8_t*)malloc(outSize);
        if ((nread = fread(buffer, 1, outSize, fromServer)) < outSize) {
            // number of bytes read is less than expected
            free(buffer);
            exit_communication_error();
        }
        fwrite(buffer, outSize, 1, stream);
        free(buffer);
    } else {
        // unrecognised operation from server
        exit_communication_error();
    }
}

/// Main /////////////////////////////////
int main(int argc, char* argv[])
{
   Settings settings = get_settings(argc, argv);
#ifdef SHOW
    printf("printing out setttings\n");
    printf("settings.portNum: %s\n", settings.portNum);
    printf("settings.output: %s\n", settings.outputFilename);
    printf("settings.replace: %s\n", settings.replaceFilename);
    printf("settings.detect: %s\n", settings.detectFilename);
#endif
    open_files(&settings);
    init_socket(&settings);
    /* setting up to catch SIGPIPE sent from kernal */
    Sigaction sa = {0};
    sa.sa_handler = sig_exit;
    sa.sa_flags = SA_RESTART;
    sigaction(SIGPIPE, &sa, 0);
    /* beginning communication with server */
    send_request(&settings);
    // handling server response
    if (settings.outputFilename) {
        // output file provided, write response here
        write_response(settings.output, settings.read);
        fclose(settings.output);
    } else {
        // no output filename, send server's output to stdout
        write_response(stdout, settings.read);
    }
    fclose(settings.read);
    fclose(settings.write);
    return SUCCESS_EXIT;
}
