// TODO: Add to register map header file
/* register and register bits - see p.53 register map */
#define CONFIG 0x00 // config register
#define PWR_UP 1 // config reg bit 1
#define PRIM_RX 0 // config reg bit 0 

// tranciever status register 
#define STATUS 0x07
#define TX_DS 5
#define MAX_RT 4
#define RX_DR 6

// dynamic payload (DPL)
#define FEATURE 0x1D // feature register
#define EN_DPL 2 // enable DPL bit
#define DYNPD 0x1C // Enable Dynamic Payload Length
#define DPL_P0 0 

// node address configurations
#define TX_ADDR 0x10 // PTX radio transmission address reg
#define RX_ADDR_P0 0x0A // PRX radio reciever address reg
#define EN_RXADDR 0x02 // enable RX addresses reg
#define ERX_P0 0

// retransmission configurations
#define SETUP_RETR 0x04
#define DISABLE_RETR 0x00
#define ONE_RETR 0x01 // one re-transmission only, wait 250us
#define MULTI_RETR 0x2F // 15 re-transmissions

// Set up address width
#define SETUP_AW 0x03
#define AW_5_BYTES 0x03

// Set up air data rate
#define RF_SETUP 0x06
#define RF_DR_LOW  5
#define RF_DR_HIGH 3
 
// auto-acknowledgement
#define EN_AA 0x01
#define ENAA_P0 0

// Set correct payload width on data pipe 0
#define RX_PW_P0 0x11
#define RX_PW_P0_VALUE 0x20 // 32 bytes

// RF channel
#define RF_CH 0x05
#define RF_CH_VALUE 76
// Cycle Redundancy Check
#define EN_CRC 3
#define CRCO 2