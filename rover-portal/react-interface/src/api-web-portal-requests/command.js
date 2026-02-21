import apiRequests from "./apiRequest"

const commandendpoint = '/command';

/**
 * Sends command proxy server, prompt proxy server to forward command to rover.  
 *  
 * @param {string} command - a command string intended to be forwards to the rover 
 * @returns 
 */
export async function sendCommand(command) {
    return await apiRequests(commandendpoint, 'POST', {cmd: command});
}