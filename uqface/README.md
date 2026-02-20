By Anthony Condezo
# uqface 
// TODO: add single sentence description

## Project Description

This project consists of a TCP server and TCP client program.  

### uqfacedetect

*uqfacedetect* is a networked, multithreaded image processing server allowing clients to connect, send an image for manipulation (and an optional image to replace faces with), and then return a manipulated image to the client. All communication between clients and the server is over TCP using a message format described with **Communication Protocol** section.

### uqfaceclient

The *uqfaceclient* program provides a command line interface that alloes users to interact with server (*uqfacedetect*) as a client - connecting, sending an image to detect faces, sending an (optional) image to replace faces with, recieving server response (i.e. the modified image) and saving it to a file on user's current directory on local machine.

*uqfaceclient* is **NOT** a multi-threaded program nor multi-process program. 

### Communication Protocol
Both *uqfaceclient* and *uqfacedetact* are implemented to abide by a custom communication protocol (see table below).

**The image processing communcication protocol**. Each message will consists of a prefix, operation type, image size, and image data. Multi-byte numbers are transmitted in little-endian format.

| Number of Bytes | Data Type | Description|
|:----------------|:----------|:-----------|
|       4         | 32-bit unsigned integer | **Prefix** - 0x23107231 - this fixed number at the start of the message indicates that this is an image processing protocol message.
|       1         | 8-bit unsigned integer | **Operation Type** - this integer indicates the type of message. The number must be either 0 (face detection request), 1(face replacement request), 2 (output image) or 3(error message).
|       4         | 32-bit unsigned integer | **Image 1 size** - number of bytes (*M*) of image 1, which is the image to detact faces or the output image, depending on the specified operation. If the operation type is 3, then this is the number of bytes of the error message. 
|       *M*       | Bytes | **Image 1 data** - the data for image 1. the bytes may have any value. If the operation type is 3, then this is the data for the error message.
|       4         | 32-bit unsigned integer | **Image 2 size (only present in face replacement requests)** - number of bytes (*N*) of image 2, which is the iamge to replace faces with.
|       *N*       | Bytes | **Image 2 data (only present in face replacement requests)** - the data for image 2. The bytes may have any value.



## Features
All features are exposed via command line arguments.

### uqfacedetect

*uqfacedetect* accepts command line arguments as follows:

```bash
   # valid terminal line arguments
   ./uqfacedetect maxconnections maxsize [portnum] 
```
**_NOTE_**: *Square* brackets ([ ]) indicate optional groups of arguments. Remaining arguments are placeholders for user-supplied arguments. Arguments **MUST** appear in this order.

**Command Line Arguments**

- *maxconnections* : This argument must be specified and is expected to be a non-negative integer less than or equal to 10,000 specifying the maximum number of simultaneous client connections to be permitted. If this is zero, then there is no limit to how many clients may connect (other than operating system limits which have **NOT** be tested). 

- *maxsize* : This argument must be specified and is expected to be a 32-bit unsigned integer less than or equal to 2^32 - 1 specifiying the maximum imave size (in bytes) that will be accepted from clients. If this argument is zero, then the iamge size limit is 2^32 - 1 bytes.

- *portnum* : If specified, this argument is a string which specifies which localhost port the server is to listen on. This can be either numerical or the name of a service. If this is zero or this argument is absent, then *uqfacedetect* will use an enphemeral port.

### uqfaceclient

*uqfaceclient* accepts comamnd line arguments as follows: 

```bash
    # valid terminal line arguments
    ./uqfaceclient portnum [--outputimage filename] [--replacefilename filename] [--detact filename]
```

**_NOTE_**: *Square* brackets ([ ]) indicate optional groups of arguments. Arguments without the  prepending substring "--" indicate placeholder for user-supplied arguments. *portnum* must always be the first argument, option arguments can be in any order after the *portnum* argument.

**Command Line Arguments**

- *portnum* : This mandatory argument specified which localhost port the server is listening on - either numerical or the name of a service.

- --detect : If specified, this option argument is followed by the name of a file containing an image. This **is** that image that *will be sent* to the server to be processed. If an input file is not specified on the command line, then the image is to be read from *uqfaceclient's* standard input.

- --replacefilename : If specified, this option argument is followed by the name of a file containing an image. This is the image that will be sent to the server to replace face with.

- --outputimage : If specifed, this option argument is followed by the name of a file where the output image will be saved. If an output file is not specified on the commandline, then the iamge will be sent to *uqfaceclient's* standard output.

## Set Up Guide

To compile executables uqfacedetect and uqfaceclient, please run "make" command in the terminal. This will compile both with all necessary libraries. 

//TOOO: double check if you need to add more detail

## Example Usage

### uqfacedetect

### uqfaceclient

