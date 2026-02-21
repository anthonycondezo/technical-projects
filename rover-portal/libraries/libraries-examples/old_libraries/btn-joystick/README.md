# btn-joystick library
## Description
btn-joystick is an ATmega238p driver for the [Keyestudio XC4422](https://media.jaycar.com.au/product/resources/XC4422_datasheetMain_67849.pdf?_gl=1*1n4mubk*_gcl_au*NTYyNjMwMzg0LjE3NjQ2NjMzMjA.), an arduino compatiable, joystick module. 

## Example Description

The provided example includes prints x-axis and y-axis readings to puTTY via the USART communication protocol. Where the intergrated joystick button toggles the program's "pause" state: which halts printing until the "pause" state is toggle to false.

### Example Project Directory

The provided example assumes your project directory adhears to the following structure: 
    
    project directory
        |__ /libraries
        |__ main.c
        |__ Makefile

### Example Hardware Layout
    // TODO: include Hardware layout

### Example MakeFile
```Makefile
#
# example Makefile - sub-directory /libraries must be present
#

MCU = atmega328p
F_CPU = 16000000

# ---- compilers ----
CC = avr-gcc
AR = avr-ar

# ---- compile flags ----
CFLAGS = -mmcu=$(MCU) -DF_CPU=$(F_CPU)UL -Os -Wall
LDFLAGS = -mmcu=$(MCU)

TARGET = main
SRC = main.c

# ---- library paths ----
USART_LIB = libraries\usart\libusart.a
BUFFER_LIB = libraries\buffer\libbuffer.a
BTN_JOYSTICK_LIB = libraries\btn-joystick\libbtn-joystick.a
LIBS = $(USART_LIB) $(BUFFER_LIB) $(BTN_JOYSTICK_LIB)

PROGAMMER = arduino
PORT = # YOUR PORT NUMBER
BAUD = 115200

all: libs $(TARGET).hex

# ---- library building ----
libs:
	$(MAKE) -C libraries

# ---- application ----
$(TARGET).elf: $(SRC) $(LIBS)
	$(CC) $(CFLAGS) $(LDFLAGS) $^ -o $@

$(TARGET).hex: $(TARGET).elf
	avr-objcopy -O ihex -R .eeprom $< $@

# ---- flashing to microcontroller ----
flash: $(TARGET).hex
	avrdude -c $(PROGAMMER) -p $(MCU) -P $(PORT) -b $(BAUD) -U flash:w:$<

# ---- utilities ----
clean:
	$(MAKE) -C libraries clean
	del *.elf *.hex

```

### Example Code: main.c
    
Please ensure that the .c file is saved as main.c, otherwise provided makefile will fail to build and flash to micro-controller.

```c
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
```

## Running Example
To run example on your local machine - perform the following terminal commands: 
1) **Update** example makefile with your port number
    ```Makefile
        PORT = # your port
    ```

2) **Build** example application
    ```bash
        make # within project directory 
    ```

3) **Flash** example application
    ```bash
        make flash
    ```

4) **Run** puTTY on your local machine with the following configurations:
- Connection type: serial
- Serial line: your-port-number
- Speed: 9600