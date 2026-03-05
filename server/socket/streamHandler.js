const Stream = require('../models/Stream');

module.exports = (io, socket, onlineUsers) => {
    // Start streaming
    socket.on('stream:start', async ({ streamId }) => {
        socket.join(`stream:${streamId}`);
        socket.streamId = streamId;
    });

    // Viewer joins stream
    socket.on('stream:viewer-join', async ({ streamId }) => {
        socket.join(`stream:${streamId}`);

        const stream = await Stream.findByIdAndUpdate(streamId, { $inc: { viewerCount: 1, totalViews: 1 } }, { new: true });

        io.to(`stream:${streamId}`).emit('stream:viewer-count', {
            viewerCount: stream?.viewerCount || 0
        });

        // Notify streamer
        const streamerSocket = io.sockets.sockets.get(onlineUsers.get(stream?.streamer?.toString()));
        if (streamerSocket) {
            streamerSocket.emit('stream:viewer-joined', {
                user: { _id: socket.user._id, username: socket.user.username, avatar: socket.user.avatar }
            });
        }
    });

    // Viewer leaves stream
    socket.on('stream:viewer-leave', async ({ streamId }) => {
        socket.leave(`stream:${streamId}`);

        const stream = await Stream.findByIdAndUpdate(streamId, { $inc: { viewerCount: -1 } }, { new: true });
        if (stream && stream.viewerCount < 0) {
            stream.viewerCount = 0;
            await stream.save();
        }

        io.to(`stream:${streamId}`).emit('stream:viewer-count', {
            viewerCount: Math.max(0, stream?.viewerCount || 0)
        });
    });

    // Stream comment
    socket.on('stream:comment', async ({ streamId, content }) => {
        const stream = await Stream.findById(streamId);
        if (!stream || !stream.allowComments) return;

        stream.comments.push({ user: socket.user._id, content });
        await stream.save();

        io.to(`stream:${streamId}`).emit('stream:comment', {
            user: { _id: socket.user._id, username: socket.user.username, avatar: socket.user.avatar },
            content,
            createdAt: new Date()
        });
    });

    // Stream reaction
    socket.on('stream:reaction', ({ streamId, emoji }) => {
        io.to(`stream:${streamId}`).emit('stream:reaction', {
            userId: socket.user._id,
            emoji
        });
    });

    // WebRTC signaling for streams
    socket.on('stream:offer', ({ streamId, offer, targetUserId }) => {
        io.to(`user:${targetUserId}`).emit('stream:offer', {
            streamId,
            offer,
            streamerId: socket.user._id.toString()
        });
    });

    socket.on('stream:answer', ({ streamId, answer, targetUserId }) => {
        io.to(`user:${targetUserId}`).emit('stream:answer', {
            streamId,
            answer,
            viewerId: socket.user._id.toString()
        });
    });

    socket.on('stream:ice-candidate', ({ streamId, candidate, targetUserId }) => {
        io.to(`user:${targetUserId}`).emit('stream:ice-candidate', {
            streamId,
            candidate,
            userId: socket.user._id.toString()
        });
    });
};
