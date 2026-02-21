#include "motor-driver.h"

/**
 * Initialises all MOTOR_DRIVER_PINS to their
 * appropiate configurations (e.g. as output)
 */
void motor_driver_init(void) {
    // Set motor driver pins as digital output
    DDRD |= (1 << ENA) | 
            (1 << ENB) |
            (1 << IN1) |
            (1 << IN2) |
            (1 << IN3) |
            (1 << IN4);
    // set motor enable pins
    PORTD |= (1 << ENA) | (1 << ENB);
}

// Not used due to hardware noise from PWM interferring with
// rf transciever module
/** Initialise Timer 0 and Timer 2 with Fast PWM mode */
void pwm_init(void) {
    /** Timer 0 Initialisation */
    TCCR0A |= (1 << COM0B1) | // fast pwm mode (non-inverting) - p.85 
              (1 << WGM01) | (1 << WGM00); // mode 3 - p.86 
    TCCR0B |= (1 << CS01); // presscale 8
    OCR0B = 0; // default speed 0
    /** Timer 2 Initialisation */
    TCCR2A |= (1 << COM2B1) | // fast pwm mode (non-inverting) - p.129
              (1 << WGM21) | (1 << WGM20); // mode 3 - p.130
    TCCR2B |= (1 << CS21); // prescale 8
    OCR2B = 0; // default speed 0
}

/** Sets motor actutators to stop */
void stop(void) {
    PORTD &= ~( (1 << IN1) | (1 << IN2) |
                (1 << IN3) | (1 << IN4) );
}

/** Sets motor actutators to move forward */
void reverse(void) {
    // motor A
    PORTD &= ~(1 << IN1);
    PORTD |= (1 << IN2);
    // motor B
    PORTD |= (1 << IN3);
    PORTD &= ~(1 << IN4);
}

/** Sets motor actutators to move in reverse */
void forward(void) {
    // motor A
    PORTD |= (1 << IN1);
    PORTD &= ~(1 << IN2);
    // motor B
    PORTD &= ~(1 << IN3);
    PORTD |= (1 << IN4);
}

void right(void) {
    // motor A
    PORTD |= (1 << IN1);
    PORTD &= ~(1 << IN2);
    // motor B
    PORTD &= ~( (1 << IN3) | (1 << IN4)); // stop
}

void left(void) {
    // motor A
    PORTD &= ~( (1 << IN1) | (1 << IN2)); // stop
    // motor B
    PORTD &= ~(1 << IN3);
    PORTD |= (1 << IN4);
}

// TODO: rename to set_direction
/** Maps joystick values to perform the appropiate MOTOR_ACTION */
void motor_driver(int16_t x_value, int16_t y_value) {
    if (x_value < 0) {
        right();
    } else if (x_value > 0) {
        left();
    } else if (y_value < 0) {
        reverse();
    } else if (y_value > 0) {
        forward();
    } else {
        stop();
    }

}

// Not used due to hardware noise from PWM interferring with
// rf transciever module
void set_speed(int16_t x_value, int16_t y_value) { 
    // TODO: some processing here
    OCR0B = (uint8_t)((x_value + 512) * 255 / 1023);
    OCR2B = (uint8_t)((y_value + 512) * 255 / 1023);
}
