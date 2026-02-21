# By Anthony Condezo
MCU = atmega328p
MCU = atmega328p
F_CPU = 16000000

# ---- compilers ----
CC = avr-gcc
AR = avr-ar

# ---- compile flags ----
CFLAGS = -mmcu=$(MCU) -DF_CPU=$(F_CPU)UL -Os -Wall
LDFLAGS = -mmcu=$(MCU)

# ---- Targets ----
CONTROLLER = controller
CONTROLLER_SRC = $(CONTROLLER).c
ROVER = rover
ROVER_SRC = $(ROVER).c

TARGETS = $(CONTROLLER).hex $(ROVER).hex 

# ---- library paths ----
USART_LIB = libraries\usart\libusart.a
BUFFER_LIB = libraries\buffer\libbuffer.a
SPI_LIB = libraries\spi\libspi.a
BTN_JOYSTICK_LIB = libraries\btn-joystick\libbtn-joystick.a
NRF24L01_LIB = libraries\NRF24L01\libNRF24L01.a
MOTOR_DRIVER_LIB = libraries\motor-driver\libmotor-driver.a
LIBS = $(NRF24L01_LIB) $(USART_LIB) $(BUFFER_LIB) $(BTN_JOYSTICK_LIB) $(SPI_LIB) $(MOTOR_DRIVER_LIB)

PROGRAMMER = arduino
CONTROLLER_PORT = COM4
ROVER_PORT = COM3
BAUD = 115200

all: libs $(TARGETS)

# ---- library building ----
libs:
	$(MAKE) -C libraries

# ---- controller application ----
$(CONTROLLER).elf: $(CONTROLLER_SRC) $(LIBS)
	$(CC) $(CFLAGS) $(LDFLAGS) -Ilibraries/ $^ -o $@

$(CONTROLLER).hex: $(CONTROLLER).elf
	avr-objcopy -O ihex -R .eeprom $< $@

# ---- rover application ----
$(ROVER).elf: $(ROVER_SRC) $(LIBS)
	$(CC) $(CFLAGS) $(LDFLAGS) -Ilibraries $^ -o $@

$(ROVER).hex: $(ROVER).elf
	avr-objcopy -O ihex -R .eeprom $< $@

# ---- flashing to microcontroller ----
flash-controller: $(CONTROLLER).hex
	avrdude -c $(PROGRAMMER) -p $(MCU) -P $(CONTROLLER_PORT) -b $(BAUD) -U flash:w:$<

flash-rover: $(ROVER).hex
	avrdude -c $(PROGRAMMER) -p $(MCU) -P $(ROVER_PORT) -b $(BAUD) -U flash:w:$<

# ---- utilities ----
clean:
	$(MAKE) -C libraries clean
	del *.elf *.hex

# Start a puTTY instance via USART with pre-saved "avr-4" configurations
run-controller:
	putty -load "avr-4"

# Start a puTTY instance via USART with pre-saved "avr" configurations
run-debug-rover:
	putty -load "avr"

# End all puTTY instances
end:
	powershell -Command "Get-Process putty | Stop-Process -Force"
