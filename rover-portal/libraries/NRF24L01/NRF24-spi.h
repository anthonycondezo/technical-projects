// p.46 SPI commands 
#define R_REGISTER(addr) (0x00 | (addr & 0x1F))
#define W_REGISTER(addr) (0x20 | (addr & 0x1F))
#define R_RX_PAYLOAD 0x61
#define W_TX_PAYLOAD 0xA0
#define FLUSH_TX 0xE1
#define FLUSH_RX 0xE2
#define REUSE_TX_PL 0xE3
#define ACTIVATE 0x50 
#define ACTIVATE_BYTES 0x73 // as stated by datasheet, ACTIVATE MUST be followed by this value
#define R_RX_PL_WID 0x60
#define W_ACK_PAYLOAD(addr) (0xA8 | (addr & 0x07))  // addr must be between 0b000 and 0b101 inclusive
#define W_TX_PAYLOAD_NOACK 0xB0
#define NOP 0xFF // Can be used to read the STATUS register