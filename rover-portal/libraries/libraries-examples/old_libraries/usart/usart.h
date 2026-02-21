#ifndef __USART_H__
#define __USART_H__

#include <avr/io.h>

/** Performs initialisation steps to enable usart transmission */
void usart_init(void);

/**
 *  Polls (i.e. busy wait) for next character send to usart rx pin. Saves 
 *  recieved character to usart rx buffer  
 */
char usart_recieve(void);

/** Transmit supplied char via usart tx */
void usart_transmit(char data);

/** 
 * Transmits each individual char from supplied string via usart TX 
 */
void usart_print(const char* str);

/** 
 * Transmits each individual char from supplied string via usart TX 
 * with a trailing \r\n characters 
 */
void usart_println(const char* str);

/**
 * Empties usart rx buffer
 */
void usart_empty_rx_buffer(void);


#endif