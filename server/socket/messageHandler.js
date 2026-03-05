const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

module.exports = (io, socket, onlineUsers) => {
    // Join conversation rooms
    socket.on('conversation:join', (conversationId) => {
        socket.join(`conversation:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId) => {
        socket.leave(`conversation:${conversationId}`);
    });

    // Send message
    socket.on('message:send', async (data) => {
        try {
            const { conversationId, content, type = 'text', mediaUrl, replyTo } = data;

            const message = await Message.create({
                conversationId,
                sender: socket.user._id,
                content,
                type,
                mediaUrl: mediaUrl || '',
                replyTo: replyTo || null
            });

            const conversation = await Conversation.findById(conversationId);
            conversation.lastMessage = message._id;

            conversation.participants.forEach(p => {
                if (p.toString() !== socket.user._id.toString()) {
                    const count = conversation.unreadCount.get(p.toString()) || 0;
                    conversation.unreadCount.set(p.toString(), count + 1);
                }
            });
            await conversation.save();

            const populated = await Message.findById(message._id)
                .populate('sender', 'username displayName avatar')
                .populate('replyTo', 'content sender type');

            // Emit to conversation room
            io.to(`conversation:${conversationId}`).emit('message:receive', {
                message: populated,
                conversationId
            });

            // Also notify users not in the room
            conversation.participants.forEach(p => {
                const pid = p.toString();
                if (pid !== socket.user._id.toString()) {
                    io.to(`user:${pid}`).emit('message:notification', {
                        conversationId,
                        sender: { _id: socket.user._id, username: socket.user.username, avatar: socket.user.avatar },
                        preview: type === 'text' ? content.substring(0, 50) : `Sent ${type}`
                    });
                }
            });
        } catch (error) {
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Typing indicator
    socket.on('user:typing', ({ conversationId }) => {
        socket.to(`conversation:${conversationId}`).emit('user:typing', {
            userId: socket.user._id,
            username: socket.user.username,
            conversationId
        });
    });

    socket.on('user:stop-typing', ({ conversationId }) => {
        socket.to(`conversation:${conversationId}`).emit('user:stop-typing', {
            userId: socket.user._id,
            conversationId
        });
    });

    // Message read
    socket.on('message:read', async ({ conversationId, messageIds }) => {
        try {
            await Message.updateMany(
                { _id: { $in: messageIds } },
                { $addToSet: { readBy: { user: socket.user._id } } }
            );

            const conversation = await Conversation.findById(conversationId);
            conversation.unreadCount.set(socket.user._id.toString(), 0);
            await conversation.save();

            socket.to(`conversation:${conversationId}`).emit('message:read', {
                userId: socket.user._id,
                messageIds,
                conversationId
            });
        } catch (error) {
            socket.emit('error', { message: 'Failed to mark as read' });
        }
    });

    // Message delivered
    socket.on('message:delivered', async ({ messageIds }) => {
        try {
            await Message.updateMany(
                { _id: { $in: messageIds } },
                { $addToSet: { deliveredTo: { user: socket.user._id } } }
            );
        } catch (error) { }
    });
};
