# a3 Makefile
# By Anthony Condezo

SHOW = -DSHOW

# Define compiler
CC = gcc
# Define debug argument
DEBUG = -g
# Defining location of custom csse2310a3 library
CUSTOMDIR = ./local/courses/csse2310
# Define compilation flags
CFLAGS = -Wall -Wextra -pedantic -std=gnu99 -I$(CUSTOMDIR)/include
# Define library directory flags
LDFLAGS = -L$(CUSTOMDIR)/lib -lcsse2310a3 -Wl,-rpath,'$$ORIGIN/local/courses/csse2310/lib'
# Added for unsuppressing children
show: CFLAGS += $(SHOW)
show: uqparallel

# Add debug flag to enable use with gdb
debug: CFLAGS += $(DEBUG)
debug: uqparallel

.DEFAULT_GOAL := uqparallel
.PHONY: clean

# uqparallel is the target and uqparallel.c is the dependency
uqparallel: uqparallel.c
	$(CC) $(CFLAGS) $^ $(LDFLAGS) -o $@

# Remove object and binary files
clean:
	rm -f *uqparallel *.o
