#
# example Makefile - sub-directory /libraries must be present
#

MCU = atmega328p
F_CPU = 16000000

# ---- compilers ----
CC = avr-gcc
AR = avr-AR

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
PORT = COM4
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
