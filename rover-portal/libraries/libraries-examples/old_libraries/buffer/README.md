# buffer library
## Description
The buffer library allows users initialise static memory to store charaters.

## Example Description
Allows users to send strings (through the puTTY interface) consisting no more than 30 characters
to the micro-controller; where the micro-controller would then echo with "Recieved: " prepended to the string sent.

## Example Project Directory

The provided example assumes your project directory adhears to the following structure: 

    project directory
        |_ /libraries/
        |_ main.c
        |_ Makefile

### Example Hardware Layout
Ensure all required hardward USART connections are present.

### Example Makefile
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
LIBS = $(USART_LIB) $(BUFFER_LIB)

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
Please ensure that the .c file is saved as main.c, otherwise provided makefile will fail to build and
flash to micro-controller.

```c
// main.c
// ATmega328p example
#include "libraries/usart/usart.h"
#include "libraries/buffer/buffer.h"

#define BUFFER_SIZE 31

int main(void) 
{
    int index = 0; 
    char buffer[BUFFER_SIZE];
    
    usart_init();

    while (1) {
        char c = usart_recieve();
        if (index >= BUFFER_SIZE - 1) {
            // buffer overflow - reject line, empty buffer, notify user
            usart_println("Line was too long - cannot exceed 30 characters");
            usart_empty_rx_buffer();
            empty_buffer(&index, buffer);
            continue;
        }

        if ((c == '\r' || c == '\n')) {
            // user finished entering line, print line to puTTY                i
            // with the "Recieved: " prepended.
            usart_print("Recieved: ");
            usart_println(buffer);
            empty_buffer(&index, buffer);
        } else {
            // append character to buffer
            append_buffer(&index, buffer, c);
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