// main.c
// ATmega328p example
#include "libraries/usart/usart.h"
#include "libraries/buffer/buffer.h"
#include "libraries/btn-joystick/btn-joystick.h"

#include <stdio.h>
#include <avr/interrupt.h>
#include <util/delay.h>

#define BUFFER_SIZE 32

volatile int pause = 0;

/** Initialise interrupt at pin B2 for btn input */
void interrupt_init(void) 
{
    // Joystick btn input taken from pin PD7 (i.e. arduino pin 7) 
    DDRD &= ~(1 << BTN_PIN); // PD7 input
    PORTD |= (1 << BTN_PIN); // enable pull-up

    // Enabling external interrupts (see p.82-83)
    PCICR |= (1 << PCIE2); // enable PORTD interrupts
    PCMSK2 |= (1 << PCINT23); // enable interrupts on individual pin BTN_PIN
}

/** Define hardware interrupt at pin B2 */
ISR(PCINT2_vect) {
    _delay_ms(70);
    if (!(PIND & (1 << PD7))) {
        // pause printing
        pause = !pause;
        if (pause) {
            usart_println("paused");
        } else {
            usart_println("resumed");
        }
    } 
}

/** Prints josystick value to puTTY via the USART communication protocol */
int main(void) 
{
    int16_t x, y;

    int index = 0;
    char buffer[BUFFER_SIZE];

    adc_init(); // initialise analog-to-digital conversion
    usart_init(); // initilaise USART communication to puTTY
    
    interrupt_init(); // initialise btn interrupt at pin B2 
    sei();
    
    while(1) {
        if (!pause) {
            // print to puTTY x and y axis values 
            x = joystick_axis(adc_read(X_PIN));
            y = joystick_axis(adc_read(Y_PIN));
            snprintf(buffer, BUFFER_SIZE, "X %d | Y %d", x, y);
            usart_println(buffer);
            empty_buffer(&index, buffer);
            _delay_ms(500);
        }    
    } 
}