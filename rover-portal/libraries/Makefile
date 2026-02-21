# By Anthony Condezo
# This Makefile is dedicated to compiling static libraries (i.e. .a)
MCU = atmega328p
F_CPU = 16000000

CC = avr-gcc
AR = avr-ar

CFLAGS = -mmcu=$(MCU) -DF_CPU=$(F_CPU)UL -Os -Wall

# ---- USART library ----
USART_DIR = usart
USART_SRC = $(USART_DIR)\usart.c 
USART_OBJ = $(USART_DIR)\usart.o
USART_LIB = $(USART_DIR)\libusart.a

# ---- Buffer library ----
BUFFER_DIR = buffer
BUFFER_SRC = $(BUFFER_DIR)\buffer.c
BUFFER_OBJ = $(BUFFER_DIR)\buffer.o
BUFFER_LIB = $(BUFFER_DIR)\libbuffer.a

# ---- Motor-driver library ----
MOTOR_DRIVER_DIR = motor-driver
MOTOR_DRIVER_SRC = $(MOTOR_DRIVER_DIR)\motor-driver.c
MOTOR_DRIVER_OBJ = $(MOTOR_DRIVER_DIR)\motor-driver.o
MOTOR_DRIVER_LIB = $(MOTOR_DRIVER_DIR)\libmotor-driver.a

# ---- Btn-joystick library ----
BTN_JOYSTICK_DIR = btn-joystick
BTN_JOYSTICK_SRC = $(BTN_JOYSTICK_DIR)\btn-joystick.c
BTN_JOYSTICK_OBJ = $(BTN_JOYSTICK_DIR)\btn-joystick.o
BTN_JOYSTICK_LIB = $(BTN_JOYSTICK_DIR)\libbtn-joystick.a

# ---- spi library ----
SPI_DIR = spi
SPI_SRC = $(SPI_DIR)\spi.c
SPI_OBJ = $(SPI_DIR)\spi.o
SPI_LIB = $(SPI_DIR)\libspi.a

# ---- NRF24L01 library ----
NRF24L01_DIR = NRF24L01
NRF24L01_SRC = $(NRF24L01_DIR)\NRF24L01.c
NRF24L01_OBJ = $(NRF24L01_DIR)\NRF24L01.o
NRF24L01_LIB = $(NRF24L01_DIR)\libNRF24L01.a

TARGETS = $(USART_LIB) $(BUFFER_LIB) $(MOTOR_DRIVER_LIB) $(BTN_JOYSTICK_LIB) $(SPI_LIB) $(NRF24L01_LIB)
CLEAN_TARGETS = $(TARGETS) $(USART_OBJ) $(BUFFER_OBJ)  $(MOTOR_DRIVER_OBJ) $(BTN_JOYSTICK_OBJ) $(SPI_OBJ) $(NRF24L01_OBJ)

all: $(TARGETS)

# ---- USART library building ----
$(USART_OBJ): $(USART_SRC) $(USART_DIR)/usart.h
	$(CC) $(CFLAGS) -I$(USART_DIR) -c $< -o $@

$(USART_LIB): $(USART_OBJ)
	$(AR) rcs $@ $^

# ---- buffer library building ----
$(BUFFER_OBJ): $(BUFFER_SRC) $(BUFFER_DIR)/buffer.h
	$(CC) $(CFLAGS) -I$(BUFFER_DIR) -c $< -o $@

$(BUFFER_LIB): $(BUFFER_OBJ)
	$(AR) rcs $@ $^

# ---- motor-driver library building ----
$(MOTOR_DRIVER_OBJ): $(MOTOR_DRIVER_SRC) $(MOTOR_DRIVER_DIR)/motor-driver.h
	$(CC) $(CFLAGS) -I$(MOTOR_DRIVER_DIR) -c $< -o $@

$(MOTOR_DRIVER_LIB): $(MOTOR_DRIVER_OBJ)
	$(AR) rcs $@ $^

# ---- btn-joystick library building ----
$(BTN_JOYSTICK_OBJ): $(BTN_JOYSTICK_SRC) $(BTN_JOYSTICK_DIR)/btn-joystick.h
	$(CC) $(CFLAGS) -I$(BTN_JOYSTICK_DIR) -c $< -o $@

$(BTN_JOYSTICK_LIB): $(BTN_JOYSTICK_OBJ)
	$(AR) rcs $@ $^

# ---- spi library building ----
$(SPI_OBJ): $(SPI_SRC) $(SPI_DIR)/spi.h
	$(CC) $(CFLAGS) -I$(SPI_DIR) -c $< -o $@

$(SPI_LIB): $(SPI_OBJ)
	$(AR) rcs $@ $^

# ---- NRF24L01 library building ----
$(NRF24L01_OBJ): $(NRF24L01_SRC) $(NRF24L01_DIR)/NRF24L01.h $(NRF24L01_DIR)/NRF24-spi.h $(NRF24L01_DIR)/register-map.h
	$(CC) $(CFLAGS) -I. -c $< -o $@

$(NRF24L01_LIB): $(NRF24L01_OBJ)
	$(AR) rcs $@ $^

# ---- Utilities ----
clean:
	del $(CLEAN_TARGETS)
