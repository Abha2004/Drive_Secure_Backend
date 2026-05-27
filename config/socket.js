const socketIo = require('socket.io');

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const initSocket = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected', socket.id);

        socket.on('disconnect', () => {
            console.log('Client disconnected', socket.id);
        });
        
        socket.on('alert:new', (data) => {
            io.emit('alert:new', data);
        });
        
        socket.on('risk:update', (data) => {
            io.emit('risk:update', data);
        });

        socket.on('location:update', (data) => {
            io.emit('location:update', data);
        });
    });

    return io;
};

module.exports = { initSocket };
