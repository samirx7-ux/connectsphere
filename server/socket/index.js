const jwt = require('jsonwebtoken');
const User = require('../models/User');
const messageHandler = require('./messageHandler');
const callHandler = require('./callHandler');
const matchHandler = require('./matchHandler');
const streamHandler = require('./streamHandler');
const communityHandler = require('./communityHandler');

// In-memory stores (Redis replacement for simple deployment)
const onlineUsers = new Map(); // userId -> socketId
const matchQueue = []; // { userId, gender, preferences, socketId, interests }
const activeMatches = new Map(); // matchId -> { user1, user2, chatRoom }
const activeCalls = new Map(); // callId -> { caller, callee, type }

const setupSocket = (io) => {
    // Auth middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!token) return next(new Error('Authentication required'));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-passwordHash -refreshToken');
            if (!user) return next(new Error('User not found'));

            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', async (socket) => {
        const userId = socket.user._id.toString();
        console.log(`🟢 ${socket.user.username} connected`);

        // Track online status
        onlineUsers.set(userId, socket.id);
        socket.join(`user:${userId}`);

        // Update DB
        await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

        // Broadcast online status to followers
        const user = await User.findById(userId);
        if (user?.followers) {
            user.followers.forEach(followerId => {
                io.to(`user:${followerId}`).emit('user:online', { userId, username: socket.user.username });
            });
        }

        // Register handlers
        messageHandler(io, socket, onlineUsers);
        callHandler(io, socket, onlineUsers, activeCalls);
        matchHandler(io, socket, onlineUsers, matchQueue, activeMatches);
        streamHandler(io, socket, onlineUsers);
        communityHandler(io, socket);

        // Handle disconnect
        socket.on('disconnect', async () => {
            console.log(`🔴 ${socket.user.username} disconnected`);
            onlineUsers.delete(userId);

            await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });

            // Remove from match queue
            const queueIdx = matchQueue.findIndex(q => q.userId === userId);
            if (queueIdx > -1) matchQueue.splice(queueIdx, 1);

            // Broadcast offline
            if (user?.followers) {
                user.followers.forEach(followerId => {
                    io.to(`user:${followerId}`).emit('user:offline', { userId, lastSeen: new Date() });
                });
            }
        });
    });
};

module.exports = setupSocket;
