/**
 * By Anthony Condezo
 */
#include <avr/io.h>
#include <avr/interrupt.h>
#include <string.h>
#include <stdlib.h>
// custom libraries
#include "libraries/spi/spi.h"
#include "libraries/buffer/buffer.h"
#include "libraries/NRF24L01/NRF24L01.h"
#include "libraries/btn-joystick/btn-joystick.h"
#include "libraries/motor-driver/motor-driver.h"

#define F_CPU 16000000UL
#define BAUD 9600
//#define BAUD 4800
#define UBRR_VALUE ((F_CPU / 16 / BAUD) - 1)

/* LED */
#define RED_LED_PIN PC5
#define GREEN_LED_PIN PC4
#define LED_ON(LED_PIN) (PORTC |= (1 << LED_PIN))
#define LED_OFF(LED_PIN) (PORTC &= ~(1 << LED_PIN))
#define LED_TOGGLE(LED_PIN) (PORTC ^= (1 << LED_PIN))

// w putty
//const char* ON = "ON\r";
//const char* OFF = "OFF\r";

const char* ON = "ON";
const char* OFF = "OFF";

/* Handling esp32 USART */
#define MAX_CMD_LENGTH 32
#define BUFFER_SIZE (4 * MAX_CMD_LENGTH) 
// usart tx buffer
volatile uint8_t txStart = 0;
volatile uint8_t txEnd = 0;
uint8_t tx[BUFFER_SIZE]; // commands to be transmitted
// usart rx buffer
volatile uint8_t start = 0;
volatile uint8_t end = 0;
uint8_t cmds[BUFFER_SIZE]; // commands pending execution

// usart tx actions 
#define START_TX() (UCSR0B |= (1 << UDRIE0))
#define END_TX() (UCSR0B &= ~(1 << UDRIE0))


void led_init(void) {
   DDRC |= (1 << RED_LED_PIN) | (1 << GREEN_LED_PIN);
   // initial state
   LED_OFF(RED_LED_PIN);
   LED_OFF(GREEN_LED_PIN);
}

/* rf controller */

// recived string format is: x,y
void extract(uint16_t *x, uint16_t *y, char *received) {
    char *comma = strchr(received, ',');

    if (comma == NULL) return; // invalid format

    *comma = '\0'; // split string in-place
    *x = (uint16_t)strtoul(received, NULL, 10);
    *y = (uint16_t)strtoul(comma + 1, NULL, 10);
}

/* esp32 functions - enabling wifi control */

// Initialise USART with RX and TX interrupts enabled
void usart_interrupt_init(void) {
    // set baud rate 
    UBRR0H = (UBRR_VALUE >> 8);
    UBRR0L = UBRR_VALUE; 

    // Enable transmitter
    UCSR0B = (1 << TXEN0) | (1 << RXEN0);

    // Frame format: 8 data bits, 1 stop bit
    UCSR0C = (1 << UCSZ01) | (1 << UCSZ00); 
    
    // enable RX interrupt
    UCSR0B |= (1 << RXCIE0); 
}

// append c to cmds buffer and increment end
void cmds_append(uint8_t c) {
    // ensure start wraps around cmds buffer
    int newEnd = (end + 1) % BUFFER_SIZE;

    if (newEnd == start) return; // buffer full

    // update
    cmds[end] = c;
    end = newEnd;
}

// append c to tx buffer and increment txEnd
void tx_append(uint8_t c) {
    // ensure start wraps around cmds buffer
    uint8_t newTxEnd = (txEnd + 1) % BUFFER_SIZE;

    if (newTxEnd == txStart) return; // buffer full

    // update
    tx[txEnd] = c;
    txEnd = newTxEnd;
}

// returns next byte pending tx, overwrites next byte in tx with '\0'
uint8_t tx_next(void) {
    uint8_t next = tx[txStart];
    txStart = (txStart + 1) % BUFFER_SIZE;
    return next;
}

// returns 1 if next command in cmds is complete (ends with '\r'), 0 otherwise
uint8_t cmd_is_next_ready(void) {
    uint8_t isReady = 0;

    int i = start; 
    while (i != end) {
        // update isReady if the next cmd is complete
        //if (cmds[i] == '\r') {
        if (cmds[i] == '\n') {
            isReady = 1;
            break;
        }
        i = (i + 1) % BUFFER_SIZE;
    }

    return isReady;
}

// loads next command pending execution into buffer
void cmd_next(uint8_t *len, uint8_t* buffer) {
    // exit if next command is incomplete (i.e. still being transmitted via usart)
    if (!cmd_is_next_ready()) return;
    
    while ((start != end) // buffer not full
        && (cmds[start] != '\n')) // newline character not reached
    {
        if (*len >= (MAX_CMD_LENGTH - 1)) break; // buffer overflow - reject command

        buffer[(*len)++] = cmds[start];
        start = (start + 1) % BUFFER_SIZE;
    }

    // update start to the next valid command in cmds
    if ((start != end) && (cmds[start] == '\n')) start = (start + 1) % BUFFER_SIZE;
    
    buffer[*len] = '\0'; 
}

// RX interrupt service - load data into rx buffer
ISR(USART_RX_vect) {
    uint8_t c = UDR0; 

    // add c to cmds and tx buffers
    cmds_append(c); 
    tx_append(c); 
    
    if (((c == '\n') ) && !(UCSR0B & (1 << UDRIE0))) {
    //if (((c == '\n') || (c == '\r')) && !(UCSR0B & (1 << UDRIE0))) {
        // usart rx finised, start ack transmission if NOT transmitting already
        START_TX();
        UDR0 = tx_next(); // load first byte of pending cmd
        LED_TOGGLE(GREEN_LED_PIN); // debug: checking we reach here in execution
    }
}

// UDRE empty interrupt service - transmit remaining data from tx buffer
ISR(USART_UDRE_vect) {
    if (txStart == txEnd) {
        // end of transmission buffer - nothing left to send
        UDR0 = '\n';
        END_TX();
        return;
    }
    
    UDR0 = tx_next();
}

void execute(char* cmd) {
    if (!strcmp(cmd, ON)) {
        LED_ON(RED_LED_PIN);
        return;
    }

    if (!strcmp(cmd, OFF)) {
        LED_OFF(RED_LED_PIN);
        return;
    } 

    while (*cmd != '\0') {
       switch(*cmd) {
            case 'F':
                forward();
                _delay_ms(1000);
                break;
            case 'B': 
                reverse();
                _delay_ms(1000);
                break;
            case 'L':
                left();
                _delay_ms(1000);
                break;
            case 'R': 
                right();
                _delay_ms(1000);
                break;
            default: 
                // do nothing
                break; 
        } 
        cmd++; // point to the next item
   }
   _delay_ms(1000);
   stop();
}

// Takes and executes wifi commands sent by esp32 via USART
void handler_esp32(void) {
   // placeholder for next command 
   uint8_t len = 0;
   uint8_t buffer[(MAX_CMD_LENGTH + 1)]; // increment to always guarantee buffer can be treated as string
   memset(buffer, '\0', sizeof(buffer));

   // get and perform next command pending execution
   //cli();
   cmd_next(&len, buffer);
   //sei();
   if (len > 0) execute((char*)buffer);
}

// Handles rf tranciever commands and converts it to motor-driver actions
void handler_rf_controller(void) {
   uint16_t x, y; // raw joystick readings
   int16_t x_axis, y_axis; // axis joystick readings
   // buffer for handling rf tranciever commands
   uint8_t rfLen = 0; 
   uint8_t rfBuffer[BUFFER_SIZE];
   memset(rfBuffer, '\0', BUFFER_SIZE);
   
   /* rf tranciever behaviour */  
   uint8_t status = rf_read_register(STATUS);

   if (status & (1 << RX_DR)) { 
      // TODO: test rf-tranciever still works after refactoring
      // rf-tranciever behaviour - use incomming transmission to controller 
      // motor driver
      rx_dynamic_recieve_payload(rfBuffer, &rfLen);
           
      rf_write_register(STATUS, (1 << RX_DR)); // clearing interrupt flag
            
      extract(&x, &y, (char*)rfBuffer); // extract x and y joystick reading sent via rf
            
      x_axis = joystick_axis(x);
      y_axis = joystick_axis(y); 

      motor_driver(x_axis, y_axis);
   }
}

int main(void) {
   // clean cmds and tx buffer
   memset(cmds, '\0', sizeof(cmds));
   memset(tx, '\0', sizeof(tx));

   /* Initialisations */
   led_init();

   spi_init(MASTER);
   rf_dynamic_init(PRX);
   _delay_ms(5); // allow full powerup

   motor_driver_init();

   usart_interrupt_init();
   sei(); 

   /* Debugging - ensure all LEDs are connected properly */
   LED_ON(RED_LED_PIN);
   LED_ON(GREEN_LED_PIN);
   _delay_ms(1000);
   LED_OFF(RED_LED_PIN);
   LED_OFF(GREEN_LED_PIN);
   
   /* Behaviour */
   while (1) {
      handler_rf_controller();
      handler_esp32();
   }

   return 0;
}