#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <pthread.h>
#include <semaphore.h>
#include <signal.h>
#include <errno.h>
/* Establishing server socket */
#include <netdb.h>
#include <unistd.h>
/* OpenCV */
#include <opencv2/imgcodecs/imgcodecs_c.h>
#include <opencv2/imgproc/imgproc_c.h>
#include <opencv2/objdetect/objdetect_c.h>

#define UNLIMITED_CONNECTIONS                                                  \
    0 // denotes that the user intends to not place a
      // limit on the number of clients allowed to connect
#define MAX_CONNECTIONS                                                        \
    10000 // the maximum number of clients allowed to connect
#define MIN_ARGS                                                               \
    3 // the minimum number of terminal arguments that must be supplied by user.
#define MAX_ARGS                                                               \
    4 // the maximum number of terminal arguments that must be supplied by user.
#define DECIMAL_FORMAT 10
#define BUFFER_SIZE 1024
#define DUMMY                                                                  \
    10 // the second parameter used in listen() is ignored
       // by linux systems
/* Specific to update_counter() parameter int value */
#define INCREMENT 1
#define DECREMENT (-1)
/* Specific to client_detect() */
#define DETECT_SUCCESS 1
#define DETECT_FAIL 0

typedef struct sigaction Sigaction;
typedef IplImage Image;
typedef CvHaarClassifierCascade Cascade;

/* detect and replace operation */
int const ellipseStartAngle = 0;
int const ellipseEndAngle = 360;
int const lineThickness = 4;
int const lineType = 8;
int const shift = 0;
float const haarScaleFactor = 1.1;
int const haarMinNeighbours = 4;
int const haarFlags = 0;
int const haarMinSize = 0;
int const haarMaxSize = 1000;
int const bgraChannels = 4;
int const alphaIndex = 3;

/* Communication Protocol types */
typedef const uint32_t Prefix;
typedef const uint8_t Operation;
Prefix prefix = 0x23107231;
Operation detectFace = 0;
Operation replaceFace = 1;
Operation outputImg = 2;
Operation opError = 3; // operation error

typedef const char* const ImmutableString;
// uqfacedetect messages
ImmutableString invalidCmdLineMsg
        = "Usage: ./uqfacedetect maxconnections maxsize [portnum]\n";
ImmutableString failWriteMsg
        = "uqfacedetect: unable to open the image file for writing\n";
ImmutableString failCascadeMsg
        = "uqfacedetect: unable to load a cascade classifier\n";
ImmutableString invalidPortNumMsg
        = "uqfacedetect: unable to listen on given port \"";
// server to client error messages
ImmutableString invalidMsg = "invalid message";
ImmutableString invalidOpMsg = "invalid operation type";
ImmutableString zeroByteMsg = "image is 0 bytes";
ImmutableString imgLargeMsg = "image too large";
ImmutableString invalidImgMsg = "invalid image";
ImmutableString noFaceMsg = "no faces detected in image";
// file paths
ImmutableString temp = "/tmp/imagefile.jpg";
ImmutableString cascadeFace = "/local/courses/csse2310/resources/a4/"
                              "haarcascade_frontalface_alt2.xml";
ImmutableString cascadeEye = "/local/courses/csse2310/resources/a4/"
                             "haarcascade_eye_tree_eyeglasses.xml";
ImmutableString responseFile
        = "/local/courses/csse2310/resources/a4/responsefile";
// other strings
ImmutableString negDelim = "-"; // delimiter for detecting negative numbers
ImmutableString empty = ""; // invalid command line argument
ImmutableString ephemeral = "0";
// other numerical values
const uint32_t maxByteSize = 0xFFFFFFFF; // max byte size allowed by server

// Defines the index position valid terminal arguments must appear in.
typedef enum {
    MAX_CONNECTIONS_INDEX = 1,
    MAX_SIZE_INDEX = 2,
    PORT_NUM_INDEX = 3
} Index;

// Custom server program exit codes
typedef enum {
    EXIT_INVALID_CMD_LINE = 11,
    EXIT_FILE_FAIL_WRITE = 2,
    EXIT_FILE_FAIL_CASCADE = 5,
    EXIT_INVALID_PORT_NUM = 8
} ExitCodes;

// Stores all uqfacedetect settings enabled by user at the command line
typedef struct {
    int listenOn;
    int maxConnections; // maximum number of clients allowed to connect
    uint32_t maxSize; // maximum image size
    char* portNum; // supplied portnum string from command line, to be
                   // converted as an integer
} Server;

// Stores all data sensitive to the race condition (i.e. expected to be
// accessed and modified by client threads
typedef struct {
    sem_t lock;
    char* temp; // allows protected access to the temp filename
    Cascade* face; // loaded face Cascade struct
    Cascade* eye; // loaded eye Cascade struct
} Protected;

// used to specify which stat to update
typedef enum { CONNECTED, COMPLETED, DETECT, REPLACE, INVALID } StatMemeber;

// Stores all relervant statistics pertaining to the server
typedef struct {
    sem_t lock;
    sigset_t set; // used to catch SIGHUP
    uint32_t clientsConnected;
    uint32_t clientsCompleted;
    uint32_t detectRequestCount;
    uint32_t replaceRequestCount;
    uint32_t invalidRequests;
} Stats;

// Stores all relervant info a client thread need to perform client's request
typedef struct {
    sem_t* activeCount;
    uint32_t maxSize; // the maxSize of the server
    FILE* read; // reading end of socket to client
    FILE* write; // writing end of socket to client
    Image* detect; // loaded detect image
    Image* replace; // loaded replace image
    Protected* data; // gives threads access to counter
    Stats* stat; // a pointer to the single initialised Stat struct storing
                 // server statistics
} Client;

//// Functions ///////////////////////////
/* sigaction functions */
void sig_ignore(int signal);
/* exiting functions */
void exit_invalid_command_line(void);
void exit_fail_write(void);
void exit_fail_cascade(void);
void exit_invalid_port(char* portNum);
/* command line processing functions */
Server get_server(int argc, char* argv[]);
/* server functions */
void run_server(Server server, Protected data);
/* client functions */
void handle_bad_request(Client* client);
void send_error_message(FILE* toClient, ImmutableString msg);
int client_read(Client* client);
Image* load_image(Client* client, int op);
int client_detect(Client* client, int* error);
void client_replace(Client* client, int* error);
void client_write(Client* client);
void* client_thread(void* data);
/* Protected functions */
Protected init_protected(void);
/* Stat functions */
void update_stat(Stats* stat, StatMemeber mem, uint32_t value);
void* print_stats(void* data);

//////////////////////////////////////////

/// Sigaction Functions ////////////////////

/* sig_ignore()
 * ------------
 * Ensure that server ignores SIGPIPE signals recieved from terminal
 * due to failed writes to client socket.
 *
 * signal: The recieved signal
 */
void sig_ignore(int signal)
{
    if (signal == SIGPIPE) {
        // ignore SIGPIPE
    }
}

/// Exiting Functions ////////////////////

/* exit_invalid_command_line()
 * ---------------------------
 * Prints to stderr invalidCmdLineMsg and exits uqfaceserver with an
 * exit status of EXIT_INVALID_CMD_LINE.
 */
void exit_invalid_command_line(void)
{
    fprintf(stderr, "%s", invalidCmdLineMsg);
    exit(EXIT_INVALID_CMD_LINE);
}

/* exit_fail_write()
 * -----------------
 * Prints to stderr failWriteMsg and exits uqfacedetect with an exit
 * status of EXIT_FILE_FAIL_WRITE.
 */
void exit_fail_write(void)
{
    fprintf(stderr, "%s", failWriteMsg);
    exit(EXIT_FILE_FAIL_WRITE);
}

/* exit_fail_cascade()
 * ------------------
 * Prints to stderr failCascadeMsg and exit uqfacedetect with an exit
 * status of EXIT_FILE_FAIL_CASCADE.
 */
void exit_fail_cascade(void)
{
    fprintf(stderr, "%s", failCascadeMsg);
    exit(EXIT_FILE_FAIL_CASCADE);
}

/* exit_invalid_port()
 * -------------------
 * Prints to stderr the message below and exit uqfacedetect with an exit
 * status of EXIT_INVALID_PORT_NUM.
 *
 * The message printed to stderr is as follows:
 *      "uqfacedetect: unable to listen on given port \"portNum\"\n"
 *
 * portNum: The portNum supplied at terminal that could not connect.
 */
void exit_invalid_port(char* portNum)
{
    fprintf(stderr, "%s%s\"\n", invalidPortNumMsg, portNum);
    exit(EXIT_INVALID_PORT_NUM);
}

/// Command Line Processing Functions ////

/* get_server()
 * ------------
 * Returns a Server struct populated with server settings enabled by user's
 * terminal inputs.
 *
 * argc: The number of terminal inputs supplied.
 * argv: The terminal inputs supplied byb user.
 *
 * Returns: A Server struct populated with all server settings enabled by user's
 *          terminal inputs.
 *
 * Errors: exit_invalid_command_line() is called whenever an invalid terminal
 *         argument is supplied.
 */
Server get_server(int argc, char* argv[])
{
    // NOTE: This function does not attempt to validate settings.portNum.
    //       That is handled by start_server()
    char* endptr;
    Server server = {0};
    if (!(argc == MIN_ARGS || argc == MAX_ARGS)) {
        // insufficient arguments supplied, exit
        exit_invalid_command_line();
    }
    char* maxConnections = strdup(argv[MAX_CONNECTIONS_INDEX]);
    char* maxSize = strdup(argv[MAX_SIZE_INDEX]);
    for (int i = 0; i < argc; i++) {
        // catching non-empty arguments
        if (!strcmp(argv[i], empty)) {
            // "" found, exit
            exit_invalid_command_line();
        }
    }
    /* checking maxconnections */
    server.maxConnections
            = (int)strtol(maxConnections, &endptr, DECIMAL_FORMAT);
    if ((*endptr != '\0') || (server.maxConnections > MAX_CONNECTIONS)
            || (server.maxConnections < 0)) {
        // failed conversion (including partial conversion) or
        // invalid maxconnections value supplied
        exit_invalid_command_line();
    } else if (!server.maxConnections) {
        // 0 was supplied as maxConnections, set max to MAX_CONNECTIONS
        server.maxConnections = MAX_CONNECTIONS;
    }
    /* checking maxsize */
    if (strstr(maxSize, negDelim)) {
        // negative number detected
        exit_invalid_command_line();
    }
    server.maxSize = (uint32_t)strtoul(maxSize, &endptr, DECIMAL_FORMAT);
    if (*endptr != '\0') {
        // failed converions or partial conversion
        exit_invalid_command_line();
    } else if (server.maxSize == 0) {
        // 0 was supplied as maxSize, set size limit to maxByteSize
        server.maxSize = maxByteSize;
    }
    if (argc == MAX_ARGS) {
        // save supplied portnum string
        server.portNum = argv[PORT_NUM_INDEX];
    }
    free(maxConnections);
    free(maxSize);
    return server;
}

/// Server Funtions //////////////////////

/* start_server()
 * -------------
 * Initialise server.listenOn member with the provided server.portNum and starts
 * listening to socket for pending new connections.
 *
 * Function prints the socket address being used by the server for listening to
 * stderr.
 *
 * server: The Server struct who's server.listenOn memeber is to be populated
 *
 * Error: Function calls exit_invalid_port() whenever the provied port
 *        cannot be listened on.
 */
void start_server(Server* server)
{
    int listenOn;
    int optVal = 1;
    /* setting up socket address */
    struct addrinfo* ai = 0;
    struct addrinfo hints = {0};
    hints.ai_family = AF_INET;
    hints.ai_socktype = SOCK_STREAM;
    hints.ai_flags = AI_PASSIVE; // listen on all IP addresses
    if (server->portNum) {
        // use provided portnum
        if (getaddrinfo(NULL, server->portNum, &hints, &ai) < 0) {
            // address could not generated
            exit_invalid_port(server->portNum);
        }
    } else {
        // use ephemeral port if none provided
        if (getaddrinfo(NULL, ephemeral, &hints, &ai) < 0) {
            // address could not be generate
            exit_invalid_port(server->portNum);
        }
    }
    /* setting up socket */
    if ((listenOn = socket(AF_INET, SOCK_STREAM, 0)) < 0) {
        // socket could not be created
        exit_invalid_port(server->portNum);
    }
    // allow socket to be reused immediately
    setsockopt(listenOn, SOL_SOCKET, SO_REUSEADDR, &optVal, sizeof(int));
    if (bind(listenOn, ai->ai_addr, sizeof(struct sockaddr)) < 0) {
        // socket could not be binded
        exit_invalid_port(server->portNum);
    }
    if (listen(listenOn, DUMMY) < 0) {
        // socket cannot be listened to
        exit_invalid_port(server->portNum);
    }
    server->listenOn = listenOn;
    /* printing the socket addressing being used by the server for listening */
    struct sockaddr_in ad = {0};
    socklen_t len = sizeof(struct sockaddr_in);
    getsockname(listenOn, (struct sockaddr*)&ad, &len);
    fprintf(stderr, "%u\n", ntohs(ad.sin_port));
}

/* run_server()
 * ------------
 * Begins accepting new connections requests to server.listenOn, and intialises
 * a thread to handle client.
 *
 *
 * server: The Server struct populated with all server settings enabled by
 *         terminal commands.
 * data: The Protected struct which stores data sensitive to the race condition.
 *       See Protected struct definition for more details pertaining to members.
 *
 * Pre-condition: Requires server.listenOn to be populated (i.e. start_server()
 *                must be called prior).
 */
void run_server(Server server, Protected data)
{
    int read, write; // placeholder for the read and writing socket fds between
                     // the server and a client
    struct sockaddr_in fromAddr;
    socklen_t fromAddrSize;
    pthread_t thread;
    /* init stats */
    Stats stat = {0};
    sem_init(&stat.lock, 0, 1);
    /* handling SIGHUB */
    pthread_t sigThread; // for catching SIGHUP
    sigemptyset(&stat.set);
    sigaddset(&stat.set, SIGHUP);
    pthread_sigmask(SIG_BLOCK, &stat.set, NULL);
    pthread_create(&sigThread, NULL, print_stats, (void*)&stat);
    pthread_detach(sigThread);
    /* continueously handle new connections */
    sem_t activeCount;
    sem_init(&activeCount, 0, server.maxConnections);
    while (1) {
        sem_wait(&activeCount);
        fromAddrSize = sizeof(struct sockaddr_in);
        // block wait for a new connection
        read = accept(
                server.listenOn, (struct sockaddr*)&fromAddr, &fromAddrSize);
        // creating a thread to deal with client
        write = dup(read);
        Client* client = (Client*)malloc(sizeof(Client));
        client->read = fdopen(read, "rb");
        client->write = fdopen(write, "wb");
        client->maxSize = server.maxSize;
        client->data = &data;
        client->detect = NULL;
        client->replace = NULL;
        client->activeCount = &activeCount;
        client->stat = &stat;
        pthread_create(&thread, NULL, client_thread, client);
        pthread_detach(thread); // ensure thread is cleaned up properly
    }
}

/// Client Functions /////////////////////

/* handle_bad_request()
 * -------------------
 * Function sends the binary contents of the response file (path is specified
 * by responseFile, see line 53).
 *
 * client: The Client that submitted a "badly formed request".
 */
void handle_bad_request(Client* client)
{
    // NOTE: This function does not terminate the socket connection between
    //       the Client and Server, that is handled by client_thread()
    size_t nread;
    char buffer[BUFFER_SIZE];
    FILE* responseStream = fopen(responseFile, "rb");
    while ((nread = fread(buffer, 1, sizeof(buffer), responseStream)) > 0) {
        // copy over contents of reponse file
        fwrite(buffer, 1, nread, client->write);
    }
    fclose(responseStream);
    update_stat(client->stat, INVALID, INCREMENT);
}

/* send_error_message()
 * --------------------
 * Sends specified error message to client socket.
 *
 * toClient: The client's write socket.
 * msg: The error message to be sent to the client.
 */
void send_error_message(FILE* toClient, ImmutableString msg)
{
    uint32_t errMsgLength = strlen(msg);
    // send prefix
    fwrite(&prefix, sizeof(uint32_t), 1, toClient);
    // send operation (3)
    fwrite(&opError, sizeof(uint8_t), 1, toClient);
    // send message length
    fwrite(&errMsgLength, sizeof(uint32_t), 1, toClient);
    // send Message itself
    fwrite(msg, errMsgLength, 1, toClient);
}

/* load_image()
 * ------------
 * Initalises an Image struct from the image byte data send by from the
 * client socket.
 *
 * client: The client where the image byte data is expected to be recieved from.
 * op: A flag that denotes if the Image struct is to be loaded with
 *      (i) CV_LOAD_IMAGE_COLOR (denoted by 0)
 *      (ii) CV_LOAD_IMAGE_UNCHANGED (denoted by 1)
 *
 * Errors: Function calls send_error_messages() to send one of the following
 *         error messages to client under the following conditions:
 *         (i)   zeroByteMsg: When the recieved byte size of file is 0.
 *         (ii)  imgLargeMsg: When the recieved byte size exceeds the server's
 *                            maxsize limit.
 *         (iii) invalidImgMsg: When image byte data could not be extracted
 *                              from client's socket or cvLoadImage() failed
 *                              due to supplied image byte data.
 */
Image* load_image(Client* client, int op)
{
    uint32_t fileByteSize;
    uint8_t* buffer;
    Image* img;
    FILE* tempWrite = fopen(client->data->temp, "wb");
    /* confirming image size is valid */
    if (!fread(&fileByteSize, sizeof(uint32_t), 1, client->read)
            || !fileByteSize) {
        // byte size M of file 1 is zero
        send_error_message(client->write, zeroByteMsg);
        return NULL;
    }
    if (fileByteSize > client->maxSize) {
        // supplied byte size M exceed's server's maxSize limit
        send_error_message(client->write, imgLargeMsg);
        return NULL;
    }
    // get file and save it to temp
    buffer = (uint8_t*)malloc(fileByteSize);
    if (!fread(buffer, 1, fileByteSize, client->read)) {
        // data could not be extracted
        send_error_message(client->write, invalidImgMsg);
        return NULL;
    }
    fwrite(buffer, 1, fileByteSize, tempWrite); // writing to temp
    fclose(tempWrite);
    if (!op && !(img = cvLoadImage(client->data->temp, CV_LOAD_IMAGE_COLOR))) {
        // failed to load image
        send_error_message(client->write, invalidImgMsg);
        return NULL;
    }
    if (op
            && !(img = cvLoadImage(
                         client->data->temp, CV_LOAD_IMAGE_UNCHANGED))) {
        // failed to load image
        send_error_message(client->write, invalidImgMsg);
        return NULL;
    }

    free(buffer);
    return img;
}

/* client_read()
 * -------------
 * Reads data sent from client socket in accordance to communication protocol.
 *
 * client: Points to the client struct populated with detailed corrsponding
 *         to the client, including the reading and writing ends of the
 *         client socket.
 * error: Points to an error bit which denotes if an error has occured.
 *
 * Errors: Excluding case (i), all cases use send_error_message() to send
 *         error message to client socket.
 *      (i)   function calls handle_bad_request() whenever an invalid prefix is
 *            recieved from client. See handle_bad_request() for more details.
 *      (ii)  sends invalidMsg when an attempt to read from the socket fails.
 *      (iii) sends invalidOpMsg when recieved operation is invalid.
 *
 *  Note: Function calls sem_wait() but will not call sem_post() client
 *        input file data (and replace file data if provided) was read
 *        successfully.
 *
 *        client_thread() will call sem_post() regardless if image operation
 *        is successful.
 */
int client_read(Client* client)
{
    // NOTE: This function follows the communication protocol highlighed in
    //       specsheet - which is:
    //       (i)   get prefix
    //       (ii)  get operation type
    //       (iii) get image 1 size (number of bytes M)
    //       (iv)  get image 1 data (as bytes)
    //       (v)   IF present, get image 2 size (number of bytes N)
    //       (vi)  IF present, get image 2 data (as bytes)
    uint32_t recievedPrefix;
    uint8_t recievedOperation;
    if (!fread(&recievedPrefix, sizeof(uint32_t), 1, client->read)
            || recievedPrefix != prefix) {
        // valid prefix was not recieved, send contents to responsefile
        handle_bad_request(client);
        return 0;
    }
    /* identifying operation request */
    if (!fread(&recievedOperation, sizeof(uint8_t), 1, client->read)) {
        // operation could not be recieved
        send_error_message(client->write, invalidMsg);
        return 0;
    }
    if (recievedOperation != detectFace && recievedOperation != replaceFace) {
        // invalid operation request detected
        send_error_message(client->write, invalidOpMsg);
        return 0;
    }
    /* loading images */
    sem_wait(&client->data->lock);
    if (!(client->detect = load_image(client, 0))) {
        // failed to load input image (image 1)
        sem_post(&client->data->lock);
        return 0;
    }
    if ((recievedOperation == replaceFace)
            && !(client->replace = load_image(client, 1))) {
        // failed to load replace image (image 2)
        sem_post(&client->data->lock);
        return 0;
    }
    return 1;
}

/* client_detect()
 * --------------
 *  Peforms the detect operation using the client.detect generated by input
 *  file data. Output is written to temp.
 *
 *  client: Points to the client struct populated with detailed corrsponding
 *          to the client, including the reading and writing ends of the
 *          client socket.
 *  error: Points to an error bit which denotes if an error has occured.
 *
 *  Return: 1 on success (i.e. the detect operation was successful), 0 otherwise
 *
 *  Error: On success error get populated by 1, 0 otherwise.
 */
int client_detect(Client* client, int* error)
{
    IplImage* frameGray
            = cvCreateImage(cvGetSize(client->detect), IPL_DEPTH_8U, 1);
    cvCvtColor(client->detect, frameGray, CV_BGR2GRAY);
    cvEqualizeHist(frameGray, frameGray);
    CvMemStorage* storage = 0;
    storage = cvCreateMemStorage(0);
    cvClearMemStorage(storage);
    CvSeq* faces = cvHaarDetectObjects(frameGray, client->data->face, storage,
            haarScaleFactor, haarMinNeighbours, haarFlags,
            cvSize(haarMinSize, haarMinSize), cvSize(haarMaxSize, haarMaxSize));
    if (!faces->total) {
        *error = 1;
        send_error_message(client->write, noFaceMsg);
        return 0;
    }
    for (int i = 0; i < faces->total; i++) {
        CvRect* face = (CvRect*)cvGetSeqElem(faces, i);
        CvPoint center
                = {face->x + face->width / 2, face->y + face->height / 2};
        const CvScalar magenta = cvScalar(255, 0, 255, 0);
        const CvScalar blue = cvScalar(255, 0, 0, 0);
        cvEllipse(client->detect, center,
                cvSize(face->width / 2, face->height / 2), 0, ellipseStartAngle,
                ellipseEndAngle, magenta, lineThickness, lineType, shift);
        IplImage* faceROI
                = cvCreateImage(cvGetSize(frameGray), IPL_DEPTH_8U, 1);
        cvCopy(frameGray, faceROI, NULL);
        cvSetImageROI(faceROI, *face);
        CvMemStorage* eyeStorage = 0;
        eyeStorage = cvCreateMemStorage(0);
        cvClearMemStorage(eyeStorage);
        CvSeq* eyes = cvHaarDetectObjects(faceROI, client->data->eye,
                eyeStorage, haarScaleFactor, haarMinNeighbours, haarFlags,
                cvSize(haarMinSize, haarMinSize),
                cvSize(haarMaxSize, haarMaxSize));
        if (eyes->total == 2) {
            for (int j = 0; j < eyes->total; j++) {
                CvRect* eye = (CvRect*)cvGetSeqElem(eyes, j);
                CvPoint eyeCenter = {face->x + eye->x + eye->width / 2,
                        face->y + eye->y + eye->height / 2};
                int radius = cvRound((eye->width / 2 + eye->height / 2) / 2);
                cvCircle(client->detect, eyeCenter, radius, blue, lineThickness,
                        lineType, shift);
            }
        }
        cvReleaseImage(&faceROI);
        cvReleaseMemStorage(&eyeStorage);
    }
    cvSaveImage(client->data->temp, client->detect, 0);
    cvReleaseImage(&client->detect); // we don't need input file anymore
    cvReleaseImage(&frameGray);
    cvReleaseMemStorage(&storage);
    *error = 0; // no erro has occured
    return 1;
}

/* client_replace()
 * ----------------
 * Performs the replace operation using the client.detect and client.relace
 * gerated by the input and replace data respectively
 *
 * client: Points to the client struct populated with detailed corrsponding
 *          to the client, including the reading and writing ends of the
 *          client socket.
 *  error: Points to an error bit which denotes if an error has occured.
 *
 *  Error: On success error get populated by 1, 0 otherwise.
 */
void client_replace(Client* client, int* error)
{
    IplImage* frameGray
            = cvCreateImage(cvGetSize(client->detect), IPL_DEPTH_8U, 1);
    cvCvtColor(client->detect, frameGray, CV_BGR2GRAY);
    cvEqualizeHist(frameGray, frameGray);
    CvMemStorage* storage = 0;
    storage = cvCreateMemStorage(0);
    cvClearMemStorage(storage);
    CvSeq* faces = cvHaarDetectObjects(frameGray, client->data->face, storage,
            haarScaleFactor, haarMinNeighbours, haarFlags,
            cvSize(haarMinSize, haarMinSize), cvSize(haarMaxSize, haarMaxSize));
    if (!faces->total) {
        // no faces detected, notify client
        *error = 1;
        send_error_message(client->write, noFaceMsg);
        return;
    }
    for (int i = 0; i < faces->total; i++) {
        CvRect* face = (CvRect*)cvGetSeqElem(faces, i);
        IplImage* resized = cvCreateImage(cvSize(face->width, face->height),
                IPL_DEPTH_8U, client->replace->nChannels);
        cvResize(client->replace, resized, CV_INTER_AREA);
        char* frameData = client->detect->imageData;
        char* faceData = resized->imageData;
        for (int y = 0; y < face->height; y++) {
            for (int x = 0; x < face->width; x++) {
                int faceIndex
                        = (resized->widthStep * y) + (x * resized->nChannels);
                if ((resized->nChannels == bgraChannels)
                        && (faceData[faceIndex + alphaIndex] == 0)) {
                    continue;
                }
                int frameIndex = (client->detect->widthStep * (face->y + y))
                        + ((face->x + x) * client->detect->nChannels);
                frameData[frameIndex + 0] = faceData[faceIndex + 0];
                frameData[frameIndex + 1] = faceData[faceIndex + 1];
                frameData[frameIndex + 2] = faceData[faceIndex + 2];
            }
        }
        cvReleaseImage(&resized);
    }
    cvSaveImage(client->data->temp, client->detect, 0);
    cvReleaseImage(&client->detect);
    cvReleaseImage(&client->replace);
    cvReleaseImage(&frameGray);
    cvReleaseMemStorage(&storage);
    *error = 0; // no error has occured
}

/* client_write()
 * -------------
 * Send data sent from temp file to the client in accordance to
 * communication protocol.
 *
 * client: Points to the client struct populated with details corresponding
 *         to the client, including the readinf and writing ends of the client
 *         socket.
 */
void client_write(Client* client)
{
    // NOTE: This function follows the communication protocol highlighed in
    //       specsheet - which is:
    //       (i)   send prefix
    //       (ii)  send operation type output
    //       (iii) send image 1 size (number of bytes M)
    //       (iv)  send image 1 data (as bytes)
    //       (v)   IF present, send image 2 size (number of bytes N)
    //       (vi)  IF present, send image 2 data (as bytes)
    ssize_t nread; // bytes read
    uint8_t buffer[BUFFER_SIZE];
    uint8_t* fileData = NULL;
    // sem_wait(&client->data->lock);
    FILE* tempRead = fopen(client->data->temp, "rb");
    uint32_t fileByteSize = 0;
    /* sending prefix */
    fwrite(&prefix, 1, sizeof(uint32_t), client->write);
    fflush(client->write);
    /* sending ouput operation */
    fwrite(&outputImg, 1, sizeof(uint8_t), client->write);
    fflush(client->write);
    while ((nread = fread(buffer, 1, sizeof(buffer), tempRead))) {
        // save bytes read in buffer to fileData
        fileData = (uint8_t*)realloc(fileData, fileByteSize + nread);
        memcpy(fileData + fileByteSize, buffer, nread);
        fileByteSize += nread;
    }
    fwrite(&fileByteSize, sizeof(uint32_t), 1, client->write);
    fwrite(fileData, sizeof(uint8_t), fileByteSize, client->write);
    fflush(client->write);
    free(fileData);
    fclose(tempRead);
}

/* client_thread()
 * --------------
 * Dictates how client thread handles client.
 *
 * data: A pointer to an expected Client struct that is populated by caller.
 *
 * Pre-condition: data is expected to be a populated Client struct and hence
 *                must be populated properly by caller.
 */
void* client_thread(void* data)
{
    int err, detectSuccess;
    Client* client = (Client*)data;
    update_stat(client->stat, CONNECTED, INCREMENT);
    while (client_read(client)) {
        // continuously read client until client cannot be read
        if (!client->replace) {
            // only input image was loaded
            detectSuccess = client_detect(client, &err);
        } else {
            // both input image and replace image was loaded
            client_replace(client, &err);
        }
        if (err) {
            // an error occured, terminate connection with client
            // and start clean up
            sem_post(&client->data->lock);
            break;
        }
        client_write(client); // send output data to client
        if (detectSuccess) {
            // --detect output successfully sent
            update_stat(client->stat, DETECT, INCREMENT);
        } else {
            // --replace output successfully sent
            update_stat(client->stat, REPLACE, INCREMENT);
        }
        sem_post(&client->data->lock);
    }
    update_stat(client->stat, CONNECTED, DECREMENT);
    update_stat(client->stat, COMPLETED, INCREMENT);
    /* clean up */
    sem_post(client->activeCount);
    fclose(client->read);
    fclose(client->write);
    free(client);
    return NULL;
}

/// Protected Functions ///////////////////

/* init_protected()
 * ----------------
 * Function initalises a Protected struct populated with all data protected
 * by a semephore lock Protected.lock memeber
 *
 * Errors:
 *      (i)  calls exit_fail_write() whenever temp file cannot be opened for
 *           writing.
 *      (ii) calls exit_fail_cascade() whenever a cascade object cannot be
 *           created using cascadeFace nor cascadeEye
 */
Protected init_protected(void)
{
    FILE* tempWrite;
    Protected protected = {0};
    // init lock
    sem_init(&protected.lock, 0, 1);

    // checking temp can be opened in write mode and truncated
    if (!(tempWrite = fopen(temp, "wb"))) {
        // temp could not be opened
        exit_fail_write();
    }
    fclose(tempWrite);
    protected.temp = strdup(temp);
    // init Cascade eye and face
    if (!(protected.face = (Cascade*)cvLoad(cascadeFace, NULL, NULL, NULL))
            || !(protected.eye
                    = (Cascade*)cvLoad(cascadeEye, NULL, NULL, NULL))) {
        // Casade file checking failed
        exit_fail_cascade();
    }
    return protected;
}

/// Stats Functions ///////////////////////

/* update_stat()
 * -------------
 * Increments the Stats memeber specified by mem with provided.
 *
 * stat: A pointer to the Stats struct to be updated.
 * mam: Specifies which memeber of stat is to be updated.
 * value: The value to increment the stats memeber by.
 */
void update_stat(Stats* stat, StatMemeber mem, uint32_t value)
{
    sem_wait(&stat->lock);
    if (mem == CONNECTED) {
        stat->clientsConnected += value;
    } else if (mem == COMPLETED) {
        stat->clientsCompleted += value;
    } else if (mem == DETECT) {
        stat->detectRequestCount += value;
    } else if (mem == REPLACE) {
        stat->replaceRequestCount += value;
    } else {
        // assume invalid is to be updated
        stat->invalidRequests += value;
    }
    sem_post(&stat->lock);
}

/* print_stats()
 * ------------
 * Prints all memeber values stored by an expected Stats struct to stderr.
 *
 * data: A pointer to the expected Stats struct who's memenbers are to be
 *       printed.
 */
void* print_stats(void* data)
{
    Stats* stat = (Stats*)data;
    int signal;
    while (1) {
        sigwait(&stat->set, &signal);
        if (signal == SIGHUP) {
            sem_wait(&stat->lock);
            fprintf(stderr, "Clients connected: %d\n", stat->clientsConnected);
            fprintf(stderr, "Num clients completed: %d\n",
                    stat->clientsCompleted);
            fprintf(stderr, "Face detection requests: %d\n",
                    stat->detectRequestCount);
            fprintf(stderr, "Face replacement requests: %d\n",
                    stat->replaceRequestCount);
            fprintf(stderr, "Invalid requests: %d\n", stat->invalidRequests);
            fflush(stderr);
            sem_post(&stat->lock);
        }
    }
    return NULL;
}

/// Main /////////////////////////////////
int main(int argc, char* argv[])
{
    Server server = get_server(argc, argv);
    Protected data = init_protected(); // initialising protected data types
    start_server(&server); // ensure listening socket is initialised
    /* initialising a sigaction struct to handle SIGPIPE */
    Sigaction sa = {0};
    sa.sa_handler = sig_ignore;
    sa.sa_flags = SA_RESTART;
    sigaction(SIGPIPE, &sa, 0);
    run_server(server, data); // begin begin accepting and handling new clients
    return 0;
}
