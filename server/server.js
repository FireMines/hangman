const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const GameController = require('./GameController');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
// Apply CORS for Socket.IO connections
const io = socketIo(server, {
    cors: {
        origin: "*", // Adjust this to match the client's origin
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

const gameController = new GameController(io);

// Apply CORS to Express
app.use(cors({
    origin: "*", // Adjust this to match the client's origin
    methods: ["GET", "POST"]
}));

io.on('connection', (socket) => {


    console.log(`New client connected: ${socket.id}`);

    socket.on('joinGame', (name) => {
        gameController.addPlayer(socket, name);
    });

    socket.on('setWord', (word) => {
        gameController.setWord(socket, word);
    });

    socket.on('guessLetter', (letter) => {
        gameController.guessLetter(socket, letter);
    });

    socket.on('disconnect', () => {
        gameController.removePlayer(socket);
        console.log(`Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
