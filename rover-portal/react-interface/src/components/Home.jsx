import { useState, useEffect } from "react";
import { Container, Button, Form, Card } from "react-bootstrap";

/* customComponents */

/* api imports */
import fetchData from "../api-web-portal-requests/fetchData"
import { sendCommand } from "../api-web-portal-requests/command";

/**
 * @returns The Home Page 
 */
function Home() {
    // TODO: take text inputs from text box
    // TODO: use btn to prompt sending input txt as a commmand
    // TODO: use fetchData & sendCommand to fetch request to proxy server

    return (
        <>
            <Card>
                <Card.Header> Rover Web Portal </Card.Header>
                <Card.Text> Enter your command in text field </Card.Text>
                <Card.Body> {<CommandForm />} </Card.Body>
            </Card>
        </>
    );
} 

/**
 * 
 * @returns a form component for input commands to proxy server
 */
function CommandForm() {
    const [command, setCommand] = useState(""); // command string
    const [response, setResponse] = useState(""); // fetch response
    const [error, setError] = useState(false); // no error 
    
    /** Sends fetch request sendCommand() to proxy server */
    const fetchCommand = async () => fetchData(
        async () =>  (sendCommand(command)), 
        setResponse, 
        setError, 
        "Failed to send command to rover"
    );
    
    /** onSubmit function for form */
    const handleSubmit = async (e) => {
        e.preventDefault(); // prevent default form submission and prevents page reload
        const response = await fetchCommand();
        return response;
    }

    return (
        <>
            <Form onSubmit={handleSubmit}>
               <Form.Label>Enter command here</Form.Label> 
               <Form.Control 
                    type="text" 
                    placeholder="FLBR"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                />
               <Button variant="primary" type="submit" className="m-1">
                    Submit
               </Button>
            </Form> 
            { (response) && (
                <>
                    <text className="my-2">sent: {response.sent}</text>
                </> 
            )}
            { (error) && (<text>{error}</text>) }
        </>
    );
}

export default Home;