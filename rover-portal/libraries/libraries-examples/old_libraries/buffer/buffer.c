#include "buffer.h"

/**
 * Appends supplied character to end of buffer and increments 
 * index by +1.
 */
void append_buffer(int* index, char* buffer, char c) {
    // Note: Function does not check if supplied character will be
    //       written outside of buffer memory
    buffer[(*index)++] = c;
    buffer[*index] = '\0';
}

/** 
 *  Sets buffer memeory to store the terminal character and sets
 *  index to 0.
 */
void empty_buffer(int* index, char* buffer) {
    // Note: Any characters from the previous string post index 0 
    //       are still not present
    *index = 0; 
    buffer[0] = '\0';
}

