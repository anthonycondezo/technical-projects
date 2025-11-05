# a4 Makefile
# By Anthony Condezo


# Define compiler
CC = gcc
# Define compilation flags
CFLAGS = -Wall -Wextra -pedantic -std=gnu99 -pthread
# Define debug argument
DEBUG = -g
# Define custom stdout debug argument
SHOW = -DSHOW
# Define uqfaceclient and uqfacedetect as the two programs to build
TARGETS = uqfaceclient uqfacedetect
# Define OpenCV macors to link OpenCV functions
OPENDIR = /usr/lib64 # directory location
CORE = opencv_core
IMGCODECS = opencv_imgcodecs
OBJDETECT = opencv_objdetect
IMGPROC = opencv_imgproc
# Define library flags
LDFLAGS = -L$(OPENDIR) -l$(CORE) -l$(IMGCODECS) -l$(OBJDETECT) -l$(IMGPROC)

# specifying targets to run
.DEFAULT_GOAL := all
.PHONY: clean

# added for enabling debugging print statments
show: CFLAGS += $(SHOW)
show: all

# Add debug flag to enable use with gdb
debug: CFLAGS += $(DEBUG)
debug: all

# generates both uqfaceclient and uqfacedetect
all: $(TARGETS)

# uqfaceclient is the target and uqfaceclient.c is the dependency
uqfaceclient: uqfaceclient.c
	$(CC) $(CFLAGS) $^ -o $@

# uqfacedetect is the target and uqfacedetect.c is the dependency
uqfacedetect: uqfacedetect.c
	$(CC) $(CFLAGS) $^ $(LDFLAGS) -o $@

# Remove object and binary files
clean:
	rm -f uqfaceclient uqfacedetect *.o
