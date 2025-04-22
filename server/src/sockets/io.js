let io;

/**
 * Initialize Socket.io with the HTTP server
 * @param {object} httpServer - HTTP server instance
 * @returns {object} Socket.io server instance
 */
exports.init = (httpServer) => {
  io = require('socket.io')(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? ['https://srilankaguide.com', 'https://www.srilankaguide.com']
        : 'http://localhost:19006', // Expo web default port
      methods: ['GET', 'POST'],
      credentials: true,
    }
  });
  
  return io;
};

/**
 * Get the Socket.io server instance
 * @returns {object} Socket.io server instance
 */
exports.getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  
  return io;
};