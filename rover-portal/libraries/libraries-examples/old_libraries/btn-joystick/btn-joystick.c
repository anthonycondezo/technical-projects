#include "btn-joystick.h"

/** Initialise analog-digital conversion pins */
void adc_init(void) {
    /* ADC configurations (p.257 - 24.9.1) */
    ADMUX |= (1 << REFS0); // enable AV_CC reference 
    // p.249 - successful input frequency must be between 50kHz-200kHz. Choose a pre-scale value accordingly to satisify this requirement
    // p.259 - to see avaliable pre-scale values
    ADCSRA |= (1 << ADEN) | // enable AD-conversion
              (1 << ADPS2) | // prescale value: 128
              (1 << ADPS1) | 
              (1 << ADPS0);
}

/** Read 16 bit register ADC - Analog-Digital Conversion Value from specified channel */
uint16_t adc_read(uint8_t channel) {
    channel &= 0x07; // i.e. 0b00000111
    ADMUX = (ADMUX & 0xF8) | channel; // listen only to A0 and A1

    ADCSRA |= (1 << ADSC); // p.258 - start conversion bit
    while(ADCSRA & (1 << ADSC));

    return ADC; // this is a 16 bit register ADCH + ADCL
}

/** Converts raw, unsigned value to a signed axis value */
int16_t joystick_axis(uint16_t value) {
    if (value > CENTER + DEADZONE) {
        return value - (CENTER + DEADZONE);
    } else if (value < CENTER - DEADZONE) {
        return value - (CENTER - DEADZONE);
    } else {
        return 0;
    }
}
