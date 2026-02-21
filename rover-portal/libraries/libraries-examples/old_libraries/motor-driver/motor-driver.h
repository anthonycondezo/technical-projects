#ifndef __MOTOR_DRIVER_H__
#define __MOTOR_DRIVER_H__

#define MAX_SPEED 255
#define DEFAULT_SPEED (MAX_SPEED / 2)

#include <avr/io.h>

/** Motor actutator actions */
typedef enum {
    FORWARD = 0, 
    STOP = 1, 
    REVERSE = 2
} MOTOR_ACTION;

/** 
 * Motor driver hardware pin mapping 
 * between motor driver and ATmega328p 
 */
typedef enum {
    ENA = PD2,
    ENB = PD7,
    IN1 = PD6, 
    IN2 = PD5, 
    IN3 = PD4, 
    IN4 = PD3
} MOTOR_DRIVER_PIN;

/** 
 * Initialises all MOTOR_DRIVER_PINS to their 
 * appropiate configuration (e.g. as output)
 */
void motor_driver_init(void);

/** Set motor actutator to stop */
void stop(void);

/** Sets motor actutators to move forward */
void forward(void);

/** Sets motor actutators to move in reverse */
void reverse(void);

/** Maps joystick values to perform the appropiate MOTOR_ACTION */
void motor_driver(int16_t x_value, int16_t y_value);

#endif