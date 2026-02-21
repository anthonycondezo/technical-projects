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

/** Sets motor actutators to stop */
void stop(void) {
    PORTD &= ~( (1 << IN1) | (1 << IN2) |
                (1 << IN3) | (1 << IN4) );
}

/** Sets motor actutators to move forward */
void forward(void) {
    // motor A
    PORTD &= ~(1 << IN1);
    PORTD |= (1 << IN2);
    // motor B
    PORTD &= ~(1 << IN3);
    PORTD |= (1 << IN4);
}

/** Sets motor actutators to move in reverse */
void reverse(void) {
    // motor A
    PORTD |= (1 << IN1);
    PORTD &= ~(1 << IN2);
    // motor B
    PORTD |= (1 << IN3);
    PORTD &= ~(1 << IN4);
}

/** Maps joystick values to perform the appropiate MOTOR_ACTION */
void motor_driver(int16_t x_value, int16_t y_value) {
    if (y_value < 0) {
        reverse();
    } else if (y_value > 0) {
        forward();
    } else {
        stop();
    }
}