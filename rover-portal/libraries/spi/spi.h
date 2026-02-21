#ifndef __SPI_H__
#define __SPI_H__

#include <avr/io.h>

/** valid spi models */
typedef enum {
    SLAVE = 0, 
    MASTER = 1
} SPI_MODE;

/** Intitialise spi pins to either MASTER or SLAVE mode */
void spi_init(SPI_MODE mode);

/** Transmit unsigned byte through spi connection */
uint8_t spi_master_transmit(uint8_t data);

void spi_master_transmit_str(const char* str);

uint8_t spi_slave_recieve(void);
#endif