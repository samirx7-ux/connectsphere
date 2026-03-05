module.exports = (io, socket, onlineUsers, activeCalls) => {
    // Initiate call
    socket.on('call:initiate', ({ targetUserId, type, offer }) => {
        const targetSocketId = onlineUsers.get(targetUserId);

        if (!targetSocketId) {
            return socket.emit('call:error', { message: 'User is offline' });
        }

        // Check if target is already in a call
        for (const [, call] of activeCalls) {
            if (call.caller === targetUserId || call.callee === targetUserId) {
                return socket.emit('call:busy', { userId: targetUserId });
            }
        }

        const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2)}`;
        activeCalls.set(callId, {
            caller: socket.user._id.toString(),
            callee: targetUserId,
            type,
            startedAt: new Date()
        });

        io.to(`user:${targetUserId}`).emit('call:incoming', {
            callId,
            caller: {
                _id: socket.user._id,
                username: socket.user.username,
                displayName: socket.user.displayName,
                avatar: socket.user.avatar
            },
            type,
            offer
        });

        socket.emit('call:ringing', { callId, targetUserId });
    });

    // Accept call
    socket.on('call:accept', ({ callId, answer }) => {
        const call = activeCalls.get(callId);
        if (!call) return;

        io.to(`user:${call.caller}`).emit('call:accepted', {
            callId,
            answer,
            user: {
                _id: socket.user._id,
                username: socket.user.username,
                displayName: socket.user.displayName,
                avatar: socket.user.avatar
            }
        });
    });

    // Decline call
    socket.on('call:decline', ({ callId }) => {
        const call = activeCalls.get(callId);
        if (!call) return;

        io.to(`user:${call.caller}`).emit('call:declined', { callId });
        activeCalls.delete(callId);
    });

    // End call
    socket.on('call:end', ({ callId }) => {
        const call = activeCalls.get(callId);
        if (!call) return;

        const otherUserId = call.caller === socket.user._id.toString() ? call.callee : call.caller;
        io.to(`user:${otherUserId}`).emit('call:ended', { callId });
        activeCalls.delete(callId);
    });

    // ICE candidate exchange
    socket.on('call:ice-candidate', ({ callId, candidate, targetUserId }) => {
        io.to(`user:${targetUserId}`).emit('call:ice-candidate', {
            callId,
            candidate,
            userId: socket.user._id.toString()
        });
    });

    // WebRTC offer
    socket.on('call:offer', ({ callId, offer, targetUserId }) => {
        io.to(`user:${targetUserId}`).emit('call:offer', {
            callId,
            offer,
            userId: socket.user._id.toString()
        });
    });

    // WebRTC answer
    socket.on('call:answer', ({ callId, answer, targetUserId }) => {
        io.to(`user:${targetUserId}`).emit('call:answer', {
            callId,
            answer,
            userId: socket.user._id.toString()
        });
    });
};
