const messageHandler = require('./messageHandler');
const notificationHandler = require('./notificationHandler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Set up socket.io event handlers
 * @param {object} io - Socket.io server instance
 */
module.exports = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user._id}`);
    
    // Join user to a room based on their ID for private messages
    socket.join(socket.user._id.toString());
    
    // Initialize message handlers
    messageHandler(io, socket);
    
    // Initialize notification handlers
    notificationHandler(io, socket);
    
    // Update user's online status
    User.findByIdAndUpdate(socket.user._id, { isOnline: true, lastActive: new Date() })
      .catch(err => console.error('Error updating user online status:', err));
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user._id}`);
      
      // Update user's offline status and last active timestamp
      User.findByIdAndUpdate(socket.user._id, { isOnline: false, lastActive: new Date() })
        .catch(err => console.error('Error updating user offline status:', err));
    });
  });
};