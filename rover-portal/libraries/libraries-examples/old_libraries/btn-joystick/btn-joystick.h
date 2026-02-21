#ifndef __BTN_JOYSTICK_H__

#define __BTN_JOYSTICK_H__

#include <avr/io.h>

#define DEADZONE 50
#define JOYSTICK_RESOLUTION 1023
#define CENTER (JOYSTICK_RESOLUTION / 2)

// Joystick Pin Layout
typedef enum {
    BTN_PIN = PD7, // arduino pin 7 
    X_PIN = PC0, // arduino pin A0 
    Y_PIN = PC1 // arduino pin A1
} JOYSTICK_PINS;

/** Initialise analog-digital conversion pins */
void adc_init(void);

/** Read 16 bit register ADC - Analog-Digitial Conversion vlaue from specified channel */
uint16_t adc_read(uint8_t channel);

/** Converts raw, unsigned value to a signed axis value */
int16_t joystick_axis(uint16_t value);


#endif