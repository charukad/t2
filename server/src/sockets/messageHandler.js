const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

/**
 * Set up message-related socket event handlers
 * @param {object} io - Socket.io server instance
 * @param {object} socket - Socket instance for the connected client
 */
module.exports = (io, socket) => {
  // Join a conversation room
  socket.on('joinConversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    console.info(`User ${socket.user._id} joined conversation: ${conversationId}`);
  });
  
  // Leave a conversation room
  socket.on('leaveConversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
    console.info(`User ${socket.user._id} left conversation: ${conversationId}`);
  });
  
  // Send a new message
  socket.on('sendMessage', async (data) => {
    try {
      const { conversationId, content } = data;
      
      // Create a new message
      const message = new Message({
        conversationId,
        senderId: socket.user._id,
        content,
      });
      
      // Save the message
      await message.save();
      
      // Update the conversation's last message
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        updatedAt: Date.now(),
      });
      
      // Populate the sender information
      const populatedMessage = await Message.findById(message._id).populate({
        path: 'senderId',
        select: 'firstName lastName profileImage',
      });
      
      // Broadcast the message to all users in the conversation
      io.to(`conversation:${conversationId}`).emit('newMessage', populatedMessage);
      
      // Find conversation participants to send notifications
      const conversation = await Conversation.findById(conversationId);
      
      if (conversation) {
        // Send notification to all participants except the sender
        conversation.participants.forEach((participantId) => {
          if (participantId.toString() !== socket.user._id.toString()) {
            // Emit to the specific user's room
            io.to(participantId.toString()).emit('messageNotification', {
              messageId: message._id,
              conversationId,
              senderId: socket.user._id,
              senderName: `${socket.user.firstName} ${socket.user.lastName}`,
              content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            });
          }
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('messageError', 'Error sending message');
    }
  });
  
  // Mark messages as read
  socket.on('markMessagesRead', async (conversationId) => {
    try {
      // Update all unread messages from others to read
      await Message.updateMany(
        {
          conversationId,
          senderId: { $ne: socket.user._id },
          isRead: false,
        },
        {
          isRead: true,
        }
      );
      
      // Notify other participants
      io.to(`conversation:${conversationId}`).emit('messagesRead', {
        conversationId,
        userId: socket.user._id,
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });
  
  // User is typing notification
  socket.on('typing', (conversationId) => {
    socket.to(`conversation:${conversationId}`).emit('userTyping', {
      conversationId,
      userId: socket.user._id,
    });
  });
  
  // User stopped typing notification
  socket.on('stopTyping', (conversationId) => {
    socket.to(`conversation:${conversationId}`).emit('userStoppedTyping', {
      conversationId,
      userId: socket.user._id,
    });
  });
};