#ifndef __SPI_H__
#define __SPI_H__

#include <avr/io.h>
#include <util/delay.h>

/** valid spi models */
typedef enum {
    SLAVE = 0, 
    MASTER = 1
} SPI_MODE;

/** Intitialise spi pins to either MASTER or SLAVE mode */
void spi_init(SPI_MODE mode);

/** Prompt master device to transmit char data through spi connection */
char spi_master_transmit(char cData);

/** Prompts slave device to recieve char data through spi connection */
uint8_t spi_slave_recieve(void);

#endif