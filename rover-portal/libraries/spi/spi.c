#include "spi.h"

//NOTE: This has not been confirmed to work: getting another ardunino R3 to confirm by Monday(28/12/2025)
//         (update) I think it works?

/** Initialises spi pins to master mode */
void spi_init(SPI_MODE mode) {
    if (mode == MASTER) {
        // initalise SPI in Master Mode
        
        /* Set SPI pins as outputs */
        DDRB |= (1 << PB5) | // SCK (i.e. Slave Clock)
                (1 << PB3) | // MOSI (i.e. Master Out, Slave In)
                (1 << PB2);  // ~(SS) (i.e. Active Low - Slave Select)

        /* Set MISO as input - page 136 (table 18-1) */
        DDRB &= ~(1 << PB4);
        
        PORTB |= (1 << PB2); // why? p.139, 18.3.2 - enable pull up to ensure alway high
                             //      removes possibility that the active low pin resets
                             //      SPI settings

        /** Configure SPI Settings */
        SPCR = (1 << SPE) | // enable SPI protocol
               (1 << MSTR) | // enable SPI Master mode
               (1 << SPR1) |
               (1 << SPR0); // set clock rate - f_ck /128
        
        // CPOL = 0, CPHA = 0 → SPI Mode 0 TODO: research this
    } else {
        // initialise SPI In Slave Mode

        /* Set MOSI, SCK and ~(SS) as inputs */
        DDRB &= ~((1 << PB5) | 
                  (1 << PB3) |
                  (1 << PB2));

        DDRB |= (1 << PB4); // MISO output

        /* Enable SPI*/
        SPCR = (1 << SPE);
        // CPOL = 0, CPHA = 0
    }
}

// From example on p.172
uint8_t spi_master_transmit(uint8_t data) {
    SPDR = data; // load data into SPI data reg to start transmission
    while (!(SPSR & (1 << SPIF))); // wait for transmission to be complete
    return SPDR;
}

// From example on p.173
uint8_t spi_slave_recieve(void) {
    while (!(SPSR & (1 << SPIF))); // wait 
    return SPDR; // return data
}

/** Transmit entire string through SPI */
void spi_master_transmit_str(const char* str) {
    while (*str) {
        spi_master_transmit(*str++);
    }
}