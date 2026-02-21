#ifndef __BUFFER_H__
#define __BUFFER_H__

/**
 * Appends supplied character to end of buffer and increments
 * index by +1.
 */
void append_buffer(int* index, char* buffer, char c);

/**
 * Sets buffer memory to store the terminal character and sets
 * index to 0.
 */
void empty_buffer(int* index, char* buffer);

#endif