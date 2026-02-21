/*
 * SPDX-FileCopyrightText: 2022 Espressif Systems (Shanghai) CO LTD
 *
 * SPDX-License-Identifier: Unlicense OR CC0-1.0
 */
#include "sdkconfig.h"
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <errno.h>
#include <netdb.h>            // struct addrinfo
#include <arpa/inet.h>
#include "esp_netif.h"
#include "esp_log.h"

// my imports
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "driver/uart.h"

#define BLINK_LED 2
const char *LED_TASKNAME = "LED CMD";
const char *ON  = "ON";
const char *OFF = "OFF";

#define UART_PORT UART_NUM_2
#define BUFFER_SIZE 32
const char *UART_TASKNAME = "TO ATMEGA";
const char *RESPONSE_TASKNAME = "FROM ATMEGA";


#if defined(CONFIG_EXAMPLE_SOCKET_IP_INPUT_STDIN)
#include "addr_from_stdin.h"
#endif

#if defined(CONFIG_EXAMPLE_IPV4)
#define HOST_IP_ADDR CONFIG_EXAMPLE_IPV4_ADDR
#elif defined(CONFIG_EXAMPLE_SOCKET_IP_INPUT_STDIN)
#define HOST_IP_ADDR ""
#endif

#define PORT CONFIG_EXAMPLE_PORT

static const char *TAG = "example";
static const char *payload = "Message from ESP32 ";

// initialise LED pin as output
void led_init() {
    gpio_reset_pin(BLINK_LED);
    gpio_set_direction(BLINK_LED, GPIO_MODE_OUTPUT);
}

// attempts to execute supplied command
void execute_command(char* cmd) {
    if (!strcmp(cmd, ON)) {
        gpio_set_level(BLINK_LED, 1);
        ESP_LOGI(LED_TASKNAME, "Recieved: %s", cmd);
    } else if (!strcmp(cmd, OFF)) {
        gpio_set_level(BLINK_LED, 0);
        ESP_LOGI(LED_TASKNAME, "Recieved: %s", cmd);
    } else {
        ESP_LOGI(LED_TASKNAME, "Invalid LED command. Failed to execute %s", cmd); 
    }
}

void uart_init(uart_port_t uart_num) {
    // Setup UART buffered IO with event queue
    const int uart_buffer_size = (1024 * 2);
    QueueHandle_t uart_queue;
    // Insall UART driver wusingg an event queue here
    ESP_ERROR_CHECK(uart_driver_install(uart_num, uart_buffer_size, uart_buffer_size, 10, &uart_queue, 0));
    // configure uart
    uart_config_t uart_config = {
        .baud_rate = 9600, 
        .data_bits = UART_DATA_8_BITS,
        .parity = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE,
        .rx_flow_ctrl_thresh = 122,
    };
    ESP_ERROR_CHECK(uart_param_config(uart_num, &uart_config));
    // set UART pins(TXL IO4, RX: IO5, RTS: I018, CTS: IO19)
    ESP_ERROR_CHECK(uart_set_pin(uart_num, 17, 16, UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE));
}

/**
 * Function attempts to load TX FIFO buffer and then waits for a successful transmission
 * 
 * returns: bytes successfully written into the buffer
 */
int uart_transmit(uart_port_t uart_num, char* data, int len) {
    int bytes =  uart_write_bytes(uart_num, (const char*) data, len);
    bytes += uart_write_bytes(uart_num, "\n", 1);
    ESP_ERROR_CHECK(uart_wait_tx_done(uart_num, 1000)); // wait timeout is 100 RTOS ticks (TickType_t)
    return bytes;
}

int uart_recieve(uart_port_t uart_num, uint8_t* buffer) {
    // Notes: see provided esp-idf UART example 
    return uart_read_bytes(uart_num, buffer, BUFFER_SIZE - 1, 20 / portTICK_PERIOD_MS);
}

void tcp_client(void)
{
    char rx_buffer[128];
    char host_ip[] = HOST_IP_ADDR;
    int addr_family = 0;
    int ip_protocol = 0;

    /* Initalisations */
    led_init();
    uart_init(UART_PORT);

    while (1) {
#if defined(CONFIG_EXAMPLE_IPV4)
        struct sockaddr_in dest_addr;
        inet_pton(AF_INET, host_ip, &dest_addr.sin_addr);
        dest_addr.sin_family = AF_INET;
        dest_addr.sin_port = htons(PORT);
        addr_family = AF_INET;
        ip_protocol = IPPROTO_IP;
#elif defined(CONFIG_EXAMPLE_SOCKET_IP_INPUT_STDIN)
        struct sockaddr_storage dest_addr = { 0 };
        ESP_ERROR_CHECK(get_addr_from_stdin(PORT, SOCK_STREAM, &ip_protocol, &addr_family, &dest_addr));
#endif

        /* TCP client initialisation */
        int sock =  socket(addr_family, SOCK_STREAM, ip_protocol);
        if (sock < 0) {
            ESP_LOGE(TAG, "Unable to create socket: errno %d", errno);
            break;
        }
        ESP_LOGI(TAG, "Socket created, connecting to %s:%d", host_ip, PORT);

        int err = connect(sock, (struct sockaddr *)&dest_addr, sizeof(dest_addr));
        if (err != 0) {
            ESP_LOGE(TAG, "Socket unable to connect: errno %d", errno);
            break;
        }
        ESP_LOGI(TAG, "Successfully connected");

        /* TCP client behaviour */
        while (1) {
            // UART variables
            int bytesSent = 0;
            int totalBytesRead = 0;
            char m328pResponse[BUFFER_SIZE];
            memset(m328pResponse, '\0', BUFFER_SIZE); 

            // send response back to TCP server
            int err = send(sock, payload, strlen(payload), 0);
            if (err < 0) {
                ESP_LOGE(TAG, "Error occurred during sending: errno %d", errno);
                break;
            }

            // lock wait command sent from TCP server 
            int len = recv(sock, rx_buffer, sizeof(rx_buffer) - 1, 0);
            // Error occurred during receiving
            if (len < 0) {
                ESP_LOGE(TAG, "recv failed: errno %d", errno);
                break;
            }

            // Data received
            else {
                // execute recieved command as a LED command
                rx_buffer[len] = 0; // Null-terminate whatever we received and treat like a string
                execute_command(rx_buffer);
                // forward recived command to m328p
                bytesSent = uart_transmit(UART_PORT, rx_buffer, len);// send to ATmega328p
                ESP_LOGI(UART_TASKNAME, "Bytes to sent: %d bytes. Command intended to be sent: %s", len, rx_buffer);
                // verifying if all chars where sent
                if ((len + 1 ) == bytesSent) { // +1 for newline appended in uart transmission to m328p - see uart_transmit()
                    ESP_LOGI(UART_TASKNAME, "UART transmittion success! All %d bytes sent to m328p", bytesSent); 
                    // block wait for all command to be sent back from m328p or an error occurs

                    while (1) {
                        int bytesRead = 0; 
                        uint8_t buffer[BUFFER_SIZE];
                        memset(buffer, '\0', BUFFER_SIZE);

                        if ((bytesRead = uart_recieve(UART_PORT, buffer)) > 0) {

                            if (bytesRead >= (BUFFER_SIZE - 1)) { // buffer overflow - exit an notify
                                ESP_LOGI(RESPONSE_TASKNAME, "Error reading bytes from MCU: BUFFER OVERFLOW");
                                break;
                            }
                            memcpy(m328pResponse + totalBytesRead, buffer, bytesRead);

                        } else {
                            // an unexpected error occurred
                            ESP_LOGI(RESPONSE_TASKNAME, "An unexpected error occured reading bytes sent from MCU. Recieved errno: %d", bytesRead);
                            break;
                        }
                    }
                    m328pResponse[totalBytesRead] = '\0';
                    ESP_LOGI(RESPONSE_TASKNAME, "Read %d bytes from mcu. Response was string is: %s", totalBytesRead, (char*)m328pResponse);
                } else {
                    ESP_LOGI(UART_TASKNAME, "Failed to send over all bytes. Bytes sent: %d, bytes not sent: %d", bytesSent, (len - bytesSent));
                }
            }

           
        }

        if (sock != -1) {
            ESP_LOGE(TAG, "Shutting down socket and restarting...");
            shutdown(sock, 0);
            close(sock);
        }
    }
}

