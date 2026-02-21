/**
 * By Anthony Condezo
 */

#include <string.h>
#include <util/delay.h>
#include <avr/interrupt.h>

#include "libraries/spi/spi.h"
#include "libraries/usart/usart.h"
#include "libraries/buffer/buffer.h"
#include "libraries/NRF24L01/NRF24L01.h"
#include "libraries/btn-joystick/btn-joystick.h"

#define MESSAGE_SIZE 32
#define DEBOUNCE_DELAY 10 // ms
#define OCR0A_VALUE 249

volatile uint8_t debounce_active = 0;
volatile uint8_t debounce_timer = 0;
volatile uint8_t btn_event = 0;

// Notes to self:
// Pin layout joystick button -> digital pin 7 (i.e. PIN D7)
//            x joystick out -> A0 (i.e. pin PC0)
//            y joystick out -> A1 (i.e. pin PC1)

/** Initlaise BTN_PIN to generate an interrupt */
void interrupt_init(void) {
    // Joystick btn input taken from pin PD7 (i.e. arduino pin 7) 
    DDRD &= ~(1 << BTN_PIN); // PD7 input
    PORTD |= (1 << BTN_PIN); // enable pull-up

    // Enabling external interrupts (see p.82-83)
    PCICR |= (1 << PCIE2); // enable PORTD interrupts
    PCMSK2 |= (1 << PCINT23); // enable interrupts on individual pin BTN_PIN
} 

/** Initialise timer to count a delay of 1ms */
void timer0_init(void) {
    // clear OC0A on compare match - non-pwm Mode (p.84)
    TCCR0A |= (1 << COM0A1);

    // mode operation CTC
    TCCR0A |= (1 << WGM01);

    // set prescale 64
    TCCR0B |= (1 << CS01) | (1 << CS00);

    OCR0A = OCR0A_VALUE;  // 249

    TIMSK0 |= (1 << OCIE0A); // enable timer interrpt
}

/** Software timer - count 10ms */
ISR(TIMER0_COMPA_vect) {
    if (debounce_active) {
        debounce_timer++; // increment when active

        if (debounce_timer >= DEBOUNCE_DELAY) {
            // time out, reset then deactivate timer
            debounce_active = 0; 
            debounce_timer = 0;

            if (!(PIND & (1 << PD7))) {
                // check btn is still pressed
                btn_event = 1;
            }

        } 
    }
}

/** Joystick btn input interrupt - detect edge */
ISR(PCINT2_vect) {
    if (!debounce_active) {
        // activate debounce if not already
        debounce_active = 1;
        debounce_timer = 0;
    }
}

int main(void) {
    uint16_t x, y;

    adc_init();
    usart_init();

    spi_init(MASTER);
    rf_dynamic_init(PTX);
    //_delay_ms(5); // allow full powerup for rf tranciever

    timer0_init();
    interrupt_init();
    sei();

    while (1) {
        //_delay_ms(500);
        usart_println("-------------------");
        if (btn_event) {
            // upload btn pressed msg
            usart_println("btn pressed");
            btn_event = 0;

        } else {
            // upload joystick readings
            char buffer[MESSAGE_SIZE]; // 32 bytes
            memset(buffer, '\0', MESSAGE_SIZE);

            x = adc_read(X_PIN);
            y = adc_read(Y_PIN);
        
            snprintf(buffer, MESSAGE_SIZE, "%u,%u", x, y);

            usart_println(buffer);
            tx_upload_payload_raw((uint8_t*)buffer, MESSAGE_SIZE);
        }
        
        
        usart_print("sending: "); 
        
        // tranmsit 
        CE_HIGH();
        TX_DELAY();   // >10us required
        CE_LOW();
        
        usart_println("sent");
        usart_println("-------------------");
        
        // clear IRQ flags
        rf_write_register(STATUS,
            (1 << TX_DS) |
            (1 << MAX_RT) |
            (1 << RX_DR));
    }
    return 0;
}