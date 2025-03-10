let net = require('net'),
    singleton = require('./Singleton'),
    ClientsHandler = require('./ClientsHandler');

let HOST = '127.0.0.1',
    PORT = 3000;

// Create server with proper buffer settings
net.bytesWritten = 64 * 1024; // 1MB
net.bufferSize = 64 * 1024; // 1MB

singleton.init();

// Create a mediaDB instance, and chain the listen function to it
// The function passed to net.createServer() becomes the event handler for the 'connection'
// event. The sock object the callback function receives UNIQUE for each connection
let mediaServer = net.createServer().listen(PORT, HOST);

mediaServer.on('connection', (sock) => {
    console.log('Client connected from ' + sock.remoteAddress);
    
    // Disable Nagle's algorithm
    sock.setNoDelay(true);
    
    // Handle client joining
    ClientsHandler.handleClientJoining(sock);
    
    // Handle client leaving
    sock.on('close', () => {
        console.log('Client closed connection');
    });
    
    sock.on('error', (err) => {
        console.log('Client error: ' + err);
    });
});

console.log('Server listening on ' + HOST + ':' + PORT);



