#ifndef __NRF24L01_H__
#define __NRF24L01_H__

#include <stdio.h>
#include <avr/io.h>
#include <util/delay.h>
#include <string.h>



#include "NRF24-spi.h" // import spi commands
#include "register-map.h" // import NRF24L01.h register map
#include <spi/spi.h>
#include <usart/usart.h>

/* rf tranciever */
#define TX_MAX_BYTE 32
#define TX_DELAY() (_delay_us(25))
#define IRQ_PIN PB0 // arduino pin 8
#define CE_PIN PB1 // arduino pin 9
#define SS_PIN PB2 // arduino pin 10
// toggle slave select pin
#define SS_LOW() (PORTB &= ~(1 << SS_PIN))
#define SS_HIGH() (PORTB |= (1 << SS_PIN))
// toggle rf mode (i.e. tx or rx mode) pin
#define CE_LOW() (PORTB &= ~(1 << CE_PIN))
#define CE_HIGH() (PORTB |= (1 << CE_PIN))

#define ADDR_SIZE 5

extern const uint8_t rfAddr[5];

typedef enum {
    PTX = 0,
    PRX = 1
} RF_MODE;

// TODO: refactor rf_init() and rf_dynamic_init() into a single function rf_init();

/** Initialise tranciever with static payload length (set to 32 bytes) */
void rf_init(RF_MODE mode);

/** Initialise tranciever with dynamic payload length */
void rf_dynamic_init(RF_MODE mode);

/** Read 8-bit value of specified rf register */
uint8_t rf_read_register(uint8_t reg); 

/**
 *  Overwrite specified register with provided 8-bit value.
 *  The overwrite operation is irreversable, existing value 
 *  prior to calling function is permanently lost. 
 */
void rf_write_register(uint8_t reg, uint8_t value);

/** 
 *  Overwrites specified register with provided bytes. 
 *  The overwrite operation is irreversable, existing value
 *  prior to calling function is permanently lost. 
 */
void rf_write_register_multi(uint8_t reg, const uint8_t *data, uint8_t len);

/** Sets bit position bitPos within specified register reg to LOW  */
void rf_set_register_bit_low(uint8_t reg, uint8_t bitPos);

/** Sets bit position bitPos within specified register reg to HIGH */
void rf_set_register_bit_high(uint8_t reg, uint8_t bitPos);

/** 
 * Uploads string to rf-tranciever's tx payload register. 
 * 
 * Return: 1 only if upload was successfull. 0 Otherwise.
 */
int tx_upload_payload(const char* str);

/** Loads supplied bytes to TX FIFO for transmission */
void tx_upload_payload_raw(const uint8_t* data, uint8_t len);
   
/**
 * Prompts rf-tranciever to transmit string
 */
void tx_transmit_payload(const char* str);

/* Loads bytes from RX FIFO and clears FIFO */
void rx_recieve_payload(uint8_t *buf, uint8_t len);

/** Loads bytes from RX FIFO and clears FIFO when DPL is enabled on both TX and RX */
void rx_dynamic_recieve_payload(uint8_t *buff, uint8_t *len);

#endif