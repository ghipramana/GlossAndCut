const { Server } = require('socket.io');

let io = null;

/**
 * Initializes the Socket.io server with the HTTP server instance.
 * @param {object} server - HTTP Server instance
 * @returns {Server} io instance
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins for development
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Client can join a specific room (e.g. "barber" or "stylist_1")
    socket.on('join_room', (roomName) => {
      socket.join(roomName);
      console.log(`[WebSocket] Client ${socket.id} joined room: ${roomName}`);
      socket.emit('joined', { room: roomName });
    });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Returns the initialized Socket.io instance.
 * Throws an error if called before initSocket.
 * @returns {Server}
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Call initSocket(server) first.');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO
};
