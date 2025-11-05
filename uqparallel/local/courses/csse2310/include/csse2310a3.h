//
// csse2310a3.h
//
#ifndef _CSSE2310A3_H
#define _CSSE2310A3_H

#include <stdio.h>

/* read_line()
 * ----------
 * Reads the next line from a file stream into a dynamically allocated buffer.
 *
 * stream: the file stream to read from
 *
 * Returns: pointer to the read line or NULL if EOF or error occurs
 * Global variables modified: none
 * Errors: none
 * REF: Ed Lessons Week 3.2 – file handling (Basic file handling)
 */
char* read_line(FILE* stream);

/* split_space_not_quote()
 * -----------------------
 * Splits a mutable, NULL-terminated line buffer into tokens separated by
 * ASCII spaces (' '), while preserving spaces that occur inside double quotes.
 * The function tokenises the string in-place by overwriting delimiter spaces
 * and double-quote characters with '\0'. Returned token pointers therefore
 * point into the original buffer.
 *
 * input: pointer to a writable, NULL-terminated C string to be tokenised.
 * Must not be NULL. The buffer is modified in-place:
 * delimiter spaces outside quotes are replaced with '\0'.
 * Opening/closing double quotes are removed (set to '\0').
 * Only the ASCII space character is treated as a delimiter; tabs,
 * newlines, and other whitespace are treated as normal characters.
 * The lifetime of all returned tokens depends on the lifetime of
 * this buffer, so it must remain valid while tokens are in use.
 *
 * numTokens: optional output pointer to receive the number of tokens found.
 * May be NULL. On success (with at least one token), *numTokens
 * is set to the token count. If there are zero tokens or input is
 * NULL, this value is not written (or the function returns NULL).
 *
 * Returns: on success with >=1 token, returns a heap-allocated, NULL-terminated
 * vector (char**) of pointers to each token within input. The caller
 * must free() the returned pointer array when done, but must NOT
 * free the individual token strings (they are slices of input).
 * Returns NULL if: input is NULL, or no tokens are found after processing.
 *
 * Global variables modified:  None.
 *
 * Errors: unmatched opening quote: if the input ends while inside a
 * quoted section, the remainder from the opening quote to the
 * end of the string is treated as a single token; no error is
 * reported and the opening quote is removed.
 * Input must be writable; passing string literals or read-only
 * memory leads to undefined behavior due to in-place modification.
 *
 * REF: Inspired by/derived from discussion at:
 * https://stackoverflow.com/questions/26187037/in-c-split-char-on-spaces-with-strtok-function-except-if-between-quotes
 */
char** split_space_not_quote(char* input, int* numTokens);

#endif
