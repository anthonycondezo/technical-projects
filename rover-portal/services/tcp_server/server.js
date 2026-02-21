import cors from 'cors'
import express from 'express'
import net from 'net' // TCP server
import readline from 'readline' // reading terminal stdin

const SERVERPORT = 3000; // port that express + cors server will run on
const PORT = 1234; // port that tcp server will run on
const HOST = '0.0.0.0'; // listen on all interfaces 

// valid commands
const VALIDCOMMANDS = {
    led: ["ON", "OFF"], 
    rover: ['F', 'R', 'L', 'B']
};

// returns true if supplied command is valid (i.e. consists of
//         VALIDCOMMANDS.rover characters only), false otherwise
const isValidCmd = (cmd) => {
    return typeof cmd === 'string' &&
           cmd.length > 0 &&
           [...cmd].every(c => VALIDCOMMANDS.rover.includes(c));
};

// object for taking stdin inputs
const terminal = readline.createInterface({
    input: process.stdin, 
    output: process.stdout,
    terminal: true
});

function main() {
    // TODO: enable multiple clients control
    let clientSocket = null; // TODO: update to a collection of client sockets.
    console.log("Starting proxy server...");

    /** tcp server */
    // initialise 
    const server = net.createServer((socket) => {
        console.log('Client connected:', socket.remoteAddress);

        clientSocket = socket; // to reference socket outside of callback

        // print data recieved from client to terminal
        socket.on('data', (data) => {
            console.log('Received:', data.toString());
        });
        
        // notify when a client disconnects
        socket.on('end', () => {
            console.log('Client disconnected');
            clientSocket = null;
        });

        // error handling function
        socket.on('error', (err) => {
            console.error('Socket error:', err);
        });
    });
    
    /** define terminal behaviour */
    terminal.on("line", (input) => {
        // line processing
        if (input === 'exit') {
            terminal.close();
        }
        clientSocket.write(input); // send stdin input to tcp client
    })

    terminal.on('close', () => {
        // terminal exit
        console.log('\nEnding proxy server\nGoodbye!');
        process.exit(0);
    })

    terminal.on('error', (err) => {
        // terminal error handling
        console.log('An unexpected error occured', err);
    });

    // start server
    server.listen(PORT, HOST, () => {
        console.log(`TCP server listening on ${HOST}:${PORT}`);
    });

    /** express + cors RESTful api server */
    // initialise
    const app = express();
    app.use(cors({ // only allow requests fro this address AND only handle GET and POST requests
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],

    }));
    app.use(express.json());

    // define GET & POST request behaviour
    app.get('/request', async (req, res) => {
        // TODO: define - maybe forward an ai prompt to llm server
        // TODO: check - that llm server is made
        return res.status(400).json({
            error: 'Rover requests currently not supported.'
        })
    });

    app.post('/command', async (req, res) => {
        // forward commands string (e.g. FBRLLBR) to tcp-client (i.e. esp32) 
        if (!clientSocket) return res.status(503).json({
            error: 'Rover is not connected to network. Please try again later.'
        });
        // verify command
        const { cmd } = req.body;
        if (!isValidCmd(cmd)) return res.status(400).json({
            error: "Invalid command recieved."
        })
        // forward command to rover
        clientSocket.write(cmd);
        // respond to react client
        return res.status(200).json({
            success: true, 
            sent: cmd
        });
    });

    app.listen(SERVERPORT, () => {
        console.log("express server running on port", SERVERPORT);
    });

    return 0;   
}

main();