#include "NRF24L01.h"

const uint8_t rfAddr[5] = { 'R', 'O', 'V', 'E', 'R' };

// TODO: rename to rf_read_btye
/** Read 8-bit value of specified rf register */
uint8_t rf_read_register(uint8_t reg) {
    uint8_t value;
    SS_LOW();
    spi_master_transmit(R_REGISTER(reg));
    value = spi_master_transmit(NOP); // shifting the response from slave's 
                                      // STATUS reg to master's
    SS_HIGH();
    return value;
}

// TODO: rename to rf_write_byte 
/**
 *  Overwrite specified register with provided 7-bit value.
 *  The overwrite operation is irreversable, existing value 
 *  prior to calling function is permanently lost. 
 */
void rf_write_register(uint8_t reg, uint8_t value) {
    // NOTE: Function overwrites. Overwrite operation is irreversable.
    SS_LOW();
    spi_master_transmit(W_REGISTER(reg));
    spi_master_transmit(value);
    SS_HIGH();
}

// TODO: rename to rf_write_bytes
/** 
 *  Overwrites specified register with provided bytes. 
 *  The overwrite operation is irreversable, existing value
 *  prior to calling function is permanently lost. 
 */
void rf_write_register_multi(uint8_t reg, const uint8_t *data, uint8_t len) {
    SS_LOW();
    spi_master_transmit(W_REGISTER(reg));
    for (int i = 0; i < len; i++) {
        spi_master_transmit(data[i]);
    }
    SS_HIGH();
}

// TODO: rename to rf_set_bit_high
/** Sets bit position bitPos within specified register reg to LOW  */
void rf_set_register_bit_low(uint8_t reg, uint8_t bitPos) {
    uint8_t data = rf_read_register(reg);
    rf_write_register(reg, (data & ~(1 << bitPos)));
}

// TODO: rename to rf_set_bit_low
/** Sets bit position bitPos within specified register reg to HIGH */
void rf_set_register_bit_high(uint8_t reg, uint8_t bitPos) {
    uint8_t data = rf_read_register(reg);
    rf_write_register(reg, (data | (1 << bitPos)));
}


void rf_dynamic_init(RF_MODE mode) {
    /* CE and IRQ pin initialisation */
    DDRB |= (1 << CE_PIN); // CE pin (active high output)
    DDRB &= ~(1 << IRQ_PIN); // IRQ pin (active low)
        
    CE_LOW();
    PORTB |= (1 << IRQ_PIN); // enable pull up

    if (mode == PTX) { // configure as PTX
        rf_set_register_bit_low(CONFIG, PRIM_RX);
        rf_write_register_multi(TX_ADDR, rfAddr, ADDR_SIZE);

    } else { // assume PRX
        rf_set_register_bit_high(CONFIG, PRIM_RX);
    }
    
    /* common configurations */
    rf_write_register(RX_PW_P0, RX_PW_P0_VALUE); // set static payload length to 32 bytes @ pipe 0
    rf_write_register(SETUP_RETR, ONE_RETR); // allow only one retransmission
    rf_set_register_bit_high(EN_RXADDR, ERX_P0); // enable rx data pipe 0    
    rf_write_register_multi(RX_ADDR_P0, rfAddr, ADDR_SIZE); // set rx address to "ROVER"
    rf_set_register_bit_high(EN_AA, ENAA_P0); // enable auto_ack for pipe 0 - p.29
    
    // 6.2 Air data rate - p.22
    rf_write_register(RF_SETUP, 0x00); // 1Mps with output power -18dBm
    // 6.3. RF channel frequency - p.23
    rf_write_register(RF_CH, RF_CH_VALUE); 
    // 6.4. PA control - p23 (handled by RF_SETUP RF_PWR bits) 6.5 LNA gain - p.23 (ignored)

    // Enchanged Shockburst configurations
    // 7.3.2 set reciever address to be 5 bytes long
    rf_write_register(SETUP_AW, AW_5_BYTES); 
    // 7.3.3.1 set payload length (for Dynamic Payload Length function only)
    
    // 7.3.5 enable and set CRC to 1 byte
    rf_set_register_bit_high(CONFIG, EN_CRC);
    rf_set_register_bit_low(CONFIG, CRCO);
    // 7.4.1 enable dynamic payload length
    
    // enabling Dynmaic Payload Length
    SS_LOW();
    spi_master_transmit(ACTIVATE);
    spi_master_transmit(ACTIVATE_BYTES);
    SS_HIGH();

    rf_set_register_bit_high(FEATURE, EN_DPL);
    rf_set_register_bit_high(DYNPD, DPL_P0); // enable DPL data pipe 0

    // power up
    rf_set_register_bit_high(CONFIG, PWR_UP);
    _delay_ms(2); // start up delay
    
    // Clear pending IRQ flags
    rf_write_register(STATUS, (1<<RX_DR)|(1<<TX_DS)|(1<<MAX_RT));

    // Flush FIFOs
    SS_LOW();
    spi_master_transmit(FLUSH_TX);
    SS_HIGH();

    SS_LOW();
    spi_master_transmit(FLUSH_RX);
    SS_HIGH();

    if (mode == PRX) CE_HIGH(); // if PRX, start listening
}

void rf_init(RF_MODE mode) {
    /* CE and IRQ pin initialisation */
    DDRB |= (1 << CE_PIN); // CE pin (active high output)
    DDRB &= ~(1 << IRQ_PIN); // IRQ pin (active low)
        
    CE_LOW();
    PORTB |= (1 << IRQ_PIN); // enable pull up

    if (mode == PTX) { // configure as PTX
        rf_set_register_bit_low(CONFIG, PRIM_RX);
        rf_write_register_multi(TX_ADDR, rfAddr, ADDR_SIZE);

    } else { // assume PRX
        rf_set_register_bit_high(CONFIG, PRIM_RX);
    }
    
    //rf_write_register(RX_PW_P0, RX_PW_P0_VALUE); // set static payload length to 32 bytes @ pipe 0
    rf_write_register(SETUP_RETR, MULTI_RETR); // allow only one retransmission
    rf_set_register_bit_high(EN_RXADDR, ERX_P0); // enable rx data pipe 0    
    rf_write_register_multi(RX_ADDR_P0, rfAddr, ADDR_SIZE); // set rx address to "ROVER"
    rf_set_register_bit_high(EN_AA, ENAA_P0); // enable auto_ack for pipe 0 - p.29
    
    // common configurations
    // 6.2 Air data rate - p.22
    rf_write_register(RF_SETUP, 0x00); // 1Mps with output power -18dBm
    // 6.3. RF channel frequency - p.23
    rf_write_register(RF_CH, RF_CH_VALUE); 
    // 6.4. PA control - p23 (handled by RF_SETUP RF_PWR bits)
    // 6.5 LNA gain - p.23 (ignored)

    // Enchanged Shockburst configurations
    // 7.3.1 preamble (automatic)
    // 7.3.2 set reciever address to be 5 bytes long
    rf_write_register(SETUP_AW, AW_5_BYTES); 
    // 7.3.3.1 set payload length (for Dynamic Payload Length function only)
    // 7.3.3.2 PID (automatic)
    // 7.3.3.3 set No Acknowledgement flag (NO_ACK) //TODO: check
    // 7.3.4 Payload //TODO: check 
    // 7.3.5 enable and set CRC to 1 byte
    rf_set_register_bit_high(CONFIG, EN_CRC);
    rf_set_register_bit_low(CONFIG, CRCO);
    // 7.4.1 enable and set static payload length to 32 bytes
    // set RX_PW_Px register (on PRX)
    // set on clock by uploadting payload for PTX

    // power up
    rf_set_register_bit_high(CONFIG, PWR_UP);
    _delay_ms(2); // start up delay
    
    // Clear pending IRQ flags
    rf_write_register(STATUS, (1<<RX_DR)|(1<<TX_DS)|(1<<MAX_RT));

    // Flush FIFOs
    SS_LOW();
    spi_master_transmit(FLUSH_TX);
    SS_HIGH();

    SS_LOW();
    spi_master_transmit(FLUSH_RX);
    SS_HIGH();

    if (mode == PRX) CE_HIGH(); // if PRX, start listening 
}

// p.20 6.1.5. to configure to tx mode 
    //  - PWR_UP: set high
    //  - PRIM_RX: set low
    //  - tx FIFO payload must be present
    //  - CE pulse must be on for more thatn 9us
    //
    // see p.45 for SPI commands
    // See p.52 form register map
// p.25 - to enable Dynamic Payload Length (DPL) the following must be configured
//  - the EN_DPL bit in FEATURE must be set
//  - when in PTX (primary tx) - must have DPL_-1 in DYNPD enabled with EN_DPL (p.27) 

/** 
 * Uploads string to rf-tranciever's tx payload register. 
 * 
 * Return: 1 only if upload was successfull. 0 Otherwise.
 */
int tx_upload_payload(const char* str) {
    // page 46: # of bytes that can be written to the 
    // tranciever's tx buffer must be between 1 - 32 bytes (inclusive)
    if (strlen(str) > TX_MAX_BYTE) return 0;
    SS_LOW();
    spi_master_transmit(FLUSH_TX);
    SS_HIGH();

    SS_LOW();
    spi_master_transmit(W_TX_PAYLOAD);
    spi_master_transmit_str(str);
    SS_HIGH();
    return 1;
}

/**
 * Prompts rf-tranciever to transmit string
 */
void tx_transmit_payload(const char* str) {
    int err = tx_upload_payload(str);
    if (!err) { 
        usart_println("failed to load string to tranciever"); //TODO: consider returning a 0 instead
    } else {
        CE_HIGH();
        TX_DELAY();
        CE_LOW();
    }
}

/*8 Loads supplied bytes to TX FIFO for transmission */
void tx_upload_payload_raw(const uint8_t* data, uint8_t len) {
    SS_LOW();
    spi_master_transmit(FLUSH_TX);
    SS_HIGH();

    SS_LOW();
    spi_master_transmit(W_TX_PAYLOAD);
    for (uint8_t i = 0; i < len; i++) {
        spi_master_transmit(data[i]);
    }
    SS_HIGH();
}

/** Loads bytes from RX FIFO and clears FIFO */
void rx_recieve_payload(uint8_t *buf, uint8_t len) {
    SS_LOW();
    spi_master_transmit(R_RX_PAYLOAD);
    for (uint8_t i = 0; i < len; i++) {
        buf[i] = spi_master_transmit(NOP);
    }
    SS_HIGH();

    // Clear RX_DR
    rf_write_register(STATUS, (1 << RX_DR));
}

/** Loads bytes from RX FIFO and clears FIFO when DPL is enabled on both TX and RX */
void rx_dynamic_recieve_payload(uint8_t *buff, uint8_t *len) {
    // query number of bytes recieved in FIFO rx buffer
    SS_LOW();
    spi_master_transmit(R_RX_PL_WID);
    *len = spi_master_transmit(NOP);
    SS_HIGH();
    
    if ((*len == 0) || (*len > 32)) {
        // RX FIFO corrupted - flush
        SS_LOW();
        spi_master_transmit(FLUSH_RX);
        SS_HIGH();
        rf_write_register(STATUS, (1 << RX_DR));
        *len = 0;
        return;
    }
    rx_recieve_payload(buff, *len);
}
