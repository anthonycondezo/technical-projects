// main.c
// ATmega328p example
#include "libraries/usart/usart.h"
#include "libraries/buffer/buffer.h"

#define BUFFER_SIZE 31

int main(void) 
{
    int index = 0; 
    char buffer[BUFFER_SIZE];

    usart_init();

    while (1) {
        char c = usart_recieve();
        if (index >= BUFFER_SIZE - 1) {
            // buffer overflow - reject line, empty buffer, notify user
            usart_println("Line was too long - cannot exceed 30 characters");
            usart_empty_rx_buffer();
            empty_buffer(&index, buffer);
            continue;
        }

        if ((c == '\r' || c == '\n')) {
            // user finished entering line, print line to puTTY
            // with the "Recieved: " prepended.
            usart_print("Recieved: ");
            usart_println(buffer);
            empty_buffer(&index, buffer);
        } else {
            // append character to buffer
            append_buffer(&index, buffer, c);
        }
    }
}