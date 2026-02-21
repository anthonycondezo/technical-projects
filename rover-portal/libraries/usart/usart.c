#include "usart.h"

#define F_CPU 16000000UL
#define BAUD 9600
#define UBRR_VALUE ((F_CPU / 16 / BAUD) - 1)

/** Performs initialisation steps to enable usart transmission */
void usart_init(void) {
    // set baud rate 
    UBRR0H = (UBRR_VALUE >> 8);
    UBRR0L = UBRR_VALUE; 

    // Enable transmitter
    UCSR0B = (1 << TXEN0) | (1 << RXEN0);

    // Frame format: 8 data bits, 1 stop bit
    UCSR0C = (1 << UCSZ01) | (1 << UCSZ00);
}

/**
 *  Polls (i.e. busy wait) for next character send to usart rx pin. Saves 
 *  recieved character to usart rx buffer  
 */
char usart_recieve(void) {
    // Wait until data (i.e. a char) is recived
    while (!(UCSR0A & (1 << RXC0)));
    return UDR0;
}

/** Transmit supplied char via usart tx */
void usart_transmit(char data) {
    // polling: wait for empty transmit buffer
    while (!(UCSR0A & (1 << UDRE0)));
    // Put data into buffer, send data
    UDR0 = data;
}

/** 
 * Transmits each individual char from supplied string via usart TX 
 */
void usart_print(const char *str) {
    while (*str) {
        usart_transmit(*str++);
    }
}

/** 
 * Transmits each individual char from supplied string via usart TX 
 * with a trailing \r\n characters 
 */
void usart_println(const char *str) {
    usart_print(str);
    usart_print("\r\n");
}

/**
 * Empties usart rx buffer
 */
void usart_empty_rx_buffer(void) {
    char c;
    while (1) {
        c = usart_recieve();
        if (c == '\r' || c == '\n') break;
    }
}