const MatchSession = require('../models/MatchSession');
const User = require('../models/User');

module.exports = (io, socket, onlineUsers, matchQueue, activeMatches) => {
    // Join matchmaking queue
    socket.on('match:join-queue', async ({ genderFilter, matchByInterest }) => {
        try {
            // Remove if already in queue
            const existingIdx = matchQueue.findIndex(q => q.userId === socket.user._id.toString());
            if (existingIdx > -1) matchQueue.splice(existingIdx, 1);

            const user = await User.findById(socket.user._id);

            const queueEntry = {
                userId: socket.user._id.toString(),
                socketId: socket.id,
                gender: user.gender,
                interests: user.interests || [],
                genderFilter: genderFilter || 'anyone',
                matchByInterest: matchByInterest || false,
                joinedAt: Date.now()
            };

            // Try to find a match
            let matchIdx = -1;
            let bestScore = -1;

            for (let i = 0; i < matchQueue.length; i++) {
                const candidate = matchQueue[i];

                // Skip self
                if (candidate.userId === queueEntry.userId) continue;

                // Check gender filter compatibility
                const myFilterOk = queueEntry.genderFilter === 'anyone' ||
                    (queueEntry.genderFilter === 'girls' && candidate.gender === 'female') ||
                    (queueEntry.genderFilter === 'boys' && candidate.gender === 'male');

                const theirFilterOk = candidate.genderFilter === 'anyone' ||
                    (candidate.genderFilter === 'girls' && user.gender === 'female') ||
                    (candidate.genderFilter === 'boys' && user.gender === 'male');

                if (!myFilterOk || !theirFilterOk) continue;

                // Calculate match score
                let score = 1;
                if (matchByInterest || candidate.matchByInterest) {
                    const shared = queueEntry.interests.filter(i => candidate.interests.includes(i));
                    score = shared.length;
                    if (score === 0 && (matchByInterest && candidate.matchByInterest)) continue;
                }

                if (score > bestScore) {
                    bestScore = score;
                    matchIdx = i;
                }
            }

            if (matchIdx > -1) {
                // Found match!
                const matched = matchQueue.splice(matchIdx, 1)[0];
                const matchedUser = await User.findById(matched.userId)
                    .select('username displayName avatar bio gender interests age isVerified');
                const currentUser = await User.findById(queueEntry.userId)
                    .select('username displayName avatar bio gender interests age isVerified');

                const sharedInterests = queueEntry.interests.filter(i => matched.interests.includes(i));

                const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2)}`;
                const chatRoom = `match-chat:${matchId}`;

                activeMatches.set(matchId, {
                    user1: queueEntry.userId,
                    user2: matched.userId,
                    chatRoom
                });

                // Create session in DB
                const session = await MatchSession.create({
                    user1: queueEntry.userId,
                    user2: matched.userId,
                    status: 'active'
                });

                // Notify both users
                io.to(`user:${queueEntry.userId}`).emit('match:found', {
                    matchId,
                    sessionId: session._id,
                    chatRoom,
                    user: { ...matchedUser.toObject(), sharedInterests }
                });

                io.to(`user:${matched.userId}`).emit('match:found', {
                    matchId,
                    sessionId: session._id,
                    chatRoom,
                    user: { ...currentUser.toObject(), sharedInterests }
                });
            } else {
                // No match found, add to queue
                matchQueue.push(queueEntry);
                socket.emit('match:queued', {
                    position: matchQueue.length,
                    estimatedWait: Math.max(10, matchQueue.length * 5)
                });
            }
        } catch (error) {
            socket.emit('error', { message: 'Failed to join queue' });
        }
    });

    // Leave queue
    socket.on('match:leave-queue', () => {
        const idx = matchQueue.findIndex(q => q.userId === socket.user._id.toString());
        if (idx > -1) matchQueue.splice(idx, 1);
        socket.emit('match:left-queue');
    });

    // Match chat message
    socket.on('match:chat-message', ({ matchId, content, type = 'text', mediaUrl }) => {
        const match = activeMatches.get(matchId);
        if (!match) return;

        io.to(match.chatRoom).emit('match:chat-message', {
            matchId,
            sender: {
                _id: socket.user._id,
                username: socket.user.username,
                avatar: socket.user.avatar
            },
            content,
            type,
            mediaUrl,
            timestamp: new Date()
        });
    });

    // Join match chat room
    socket.on('match:join-chat', ({ matchId }) => {
        const match = activeMatches.get(matchId);
        if (match) socket.join(match.chatRoom);
    });

    // Skip match
    socket.on('match:skip', async ({ matchId, sessionId }) => {
        const match = activeMatches.get(matchId);
        if (!match) return;

        const otherUserId = match.user1 === socket.user._id.toString() ? match.user2 : match.user1;
        io.to(`user:${otherUserId}`).emit('match:skipped', { matchId });

        socket.leave(match.chatRoom);
        activeMatches.delete(matchId);

        if (sessionId) {
            await MatchSession.findByIdAndUpdate(sessionId, { status: 'skipped', endedAt: new Date() });
        }
    });

    // End match session
    socket.on('match:end-session', async ({ matchId, sessionId, rating }) => {
        const match = activeMatches.get(matchId);
        if (match) {
            const otherUserId = match.user1 === socket.user._id.toString() ? match.user2 : match.user1;
            io.to(`user:${otherUserId}`).emit('match:ended', { matchId });
            socket.leave(match.chatRoom);
            activeMatches.delete(matchId);
        }

        if (sessionId && rating) {
            const session = await MatchSession.findById(sessionId);
            if (session) {
                if (session.user1.toString() === socket.user._id.toString()) {
                    session.rating.user1 = rating;
                } else {
                    session.rating.user2 = rating;
                }
                session.status = 'ended';
                session.endedAt = new Date();
                await session.save();
            }
        }
    });

    // Typing in match chat
    socket.on('match:typing', ({ matchId }) => {
        const match = activeMatches.get(matchId);
        if (match) {
            socket.to(match.chatRoom).emit('match:typing', {
                userId: socket.user._id,
                username: socket.user.username
            });
        }
    });
};
