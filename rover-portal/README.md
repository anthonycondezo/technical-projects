By Anthony Condezo
# Rover Portal

An implementation of a small-scaled distributive control system for a mobile robotic
platform.  

//TODO: add a link that will lead user to a video showing the rover working

## Technical Stack

### Embedded Systems
- ESP32 (Wi-Fi TCP client, high-level command handling)
- ATmega328p (Real-time motor control, RF TX/RX)
- Embedded C
- Interrupt-driven UART communication
- SPI communication (NRF24L01 driver)

### Networking
- TCP/IP (LAN communication)
- Node.js proxy server
- REACT Single Page Application (SPA) frontend

### Protocols & Concepts
- Custom command protocol design
- Distributed system architecture
- State-based motor control logic
- Deterministic command parsing
- Hardware abstraction & driver development

### System Projets Demonstrated
- Distributed control system design
- Separation of high-level networking from real-time control
- Interrupt-driven embedded communication
- Custom device driver implementation
- TCP client-server architecture
- Wireless communication (Wi-Fi + RF)
- State machine motor control
- Cross-layer system integration (Web -> Server -> Microcontrollers -> Motor Driver)

## Project Description

**Rover Portal** was designed to explore distributed embedded architectures in robotic systems.

The system separates: 
- High-level TCP command handling (ESP32)
- Deterministic motor execution logic (ATmega328p)

This separation ensures: 
- Real-time motor reliability
- Reduced network latency impact
- Clear architectural boundaries between communication and actuation layers.

The ESP32 handles all Wi-Fi connectivity and acts as a TCP client.A Node.js proxy server acts as the TCP server, forwarding commands from a REACT SPA running on the local network.

The ATmega328p is dedicated to: 

- Parsing validated control commands
- Running state-based motor logic
- Handling RF transmission/reception
- Executing low-level motor-driver signals

Communication between ESP32 and ATmega328p is performed via **_interrupt-driven UART_**, ensuring deterministic command receptoin and processing.

## Control 

### 1. Wi-Fi Mode (LAN-Based Control)

Control flow:

REACT SPA -> Proxy Server (TCP server) -> ESP32 (TCP Client) -> UART -> ATmega328p -> Motor Driver

- User inputs commands via web interface
- Proxy server forwards validated TCP messages
- ESP32 recieved and forwards commands via UART
- ATmega eexecutes state-based motor-logic

This architecture isolates web networking complexity from real-time control execution.

### 2. RF Mode (NRF24L01)

The rover also supports radio contro lusing the **_NRF24L01 transceiver module_**

- Custom RF driver implemented for ATmega328p
- SPI-based communication with transceiver
- Bidirectional packet transmission
- Lightweight command protocol over RF

This provides:

- Lower-latency control
- Network-independent operation
- Redundant control capability


## Distributive Network Architecture

The sustem demonstrates a layered distributed architecture:

### Layer 1 - Web Interface

- REACT SPA for command input

### Layer 2 - Network Middleware

- Proxy server acting as TCP server
- Handles routing and forwarding

### Layer 3 - Wi-Fi Communication Node

- ESP32 acting as TCP client
- Handles network communication
- Forwards validated commands via UART

### Layer 4 - Real-Time Control Node

- ATmega328p
- Deterministic motor state machine
- RF subsystem integeration

By decoupling communication and control layers, the system improves:

- Modularity
- Debuggability
- Fault isolation
- Real-time reliabilty

## Set Up Guide

// TODO: Add set guide. 
// Mention installing avr8-gnu-tollchain, avrdude, and the esp-idf framework
//                     mention installing npm dependencies also for proxy server
//                     also mention about running idf.pu menuconfig for adding localhost ip address, server port and addign wifi ssid and password before flashing to micro-controller

## Usage

// TODO - add a brief description on rover control via Wi-Fi mode and RF mode