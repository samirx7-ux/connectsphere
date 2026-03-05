module.exports = (io, socket) => {
    // Join community channel
    socket.on('channel:join', ({ communityId, channelSlug }) => {
        socket.join(`channel:${communityId}:${channelSlug}`);
    });

    socket.on('channel:leave', ({ communityId, channelSlug }) => {
        socket.leave(`channel:${communityId}:${channelSlug}`);
    });

    // Channel message
    socket.on('channel:message', ({ communityId, channelSlug, content, type = 'text', mediaUrl }) => {
        io.to(`channel:${communityId}:${channelSlug}`).emit('channel:message', {
            communityId,
            channelSlug,
            sender: {
                _id: socket.user._id,
                username: socket.user.username,
                displayName: socket.user.displayName,
                avatar: socket.user.avatar
            },
            content,
            type,
            mediaUrl,
            timestamp: new Date()
        });
    });

    // Channel typing
    socket.on('channel:typing', ({ communityId, channelSlug }) => {
        socket.to(`channel:${communityId}:${channelSlug}`).emit('channel:typing', {
            userId: socket.user._id,
            username: socket.user.username
        });
    });

    // Join community room for live count
    socket.on('community:join', ({ communityId }) => {
        socket.join(`community:${communityId}`);
        const room = io.sockets.adapter.rooms.get(`community:${communityId}`);
        io.to(`community:${communityId}`).emit('community:live-count', {
            count: room ? room.size : 0
        });
    });

    socket.on('community:leave', ({ communityId }) => {
        socket.leave(`community:${communityId}`);
        const room = io.sockets.adapter.rooms.get(`community:${communityId}`);
        io.to(`community:${communityId}`).emit('community:live-count', {
            count: room ? room.size : 0
        });
    });
};
