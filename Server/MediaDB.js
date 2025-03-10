// Required modules
let net = require('net'),  // Network module for creating TCP server
    singleton = require('./Singleton'),  // Singleton module for shared state management
    ClientsHandler = require('./ClientsHandler');  // Module for handling client connections

// Server configuration constants
let HOST = '127.0.0.1',  // Localhost address
    PORT = 3000;  // Port for the media server

// Set buffer settings for network communication
net.bytesWritten = 64 * 1024;  // Buffer size for outgoing data (1MB)
net.bufferSize = 64 * 1024;  // Buffer size for incoming data (1MB)

// Initialize singleton (e.g., start time)
const startTime = singleton.init();

// Create a server to listen for incoming connections
let mediaServer = net.createServer().listen(PORT, HOST);

// Handle incoming client connections
mediaServer.on('connection', (sock) => {
    console.log('Client connected from ' + sock.remoteAddress);  // Log client connection address
    
    // Disable Nagle's algorithm for faster transmission (immediate packet sending)
    sock.setNoDelay(true);
    
    // Handle the client joining the server
    ClientsHandler.handleClientJoining(sock);
    
    // Handle client disconnection (close event)
    sock.on('close', () => {
        console.log('Client closed connection');  // Log client disconnection
    });
    
    // Handle client connection errors
    sock.on('error', (err) => {
        console.log('Client error: ' + err);  // Log any connection errors
    });
});

// Log server start information
console.log(`MediaDB server is started at timestamp: ${startTime} and is listening on ${HOST}:${PORT}`);
