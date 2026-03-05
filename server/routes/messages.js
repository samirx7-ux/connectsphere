const router = require('express').Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { auth } = require('../middleware/auth');

// GET /api/messages/conversations
router.get('/conversations', auth, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id
        })
            .populate('participants', 'username displayName avatar isOnline lastSeen')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });

        res.json({ success: true, conversations });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to load conversations.' });
    }
});

// POST /api/messages/conversations
router.post('/conversations', auth, async (req, res) => {
    try {
        const { participantId, type = 'dm', groupName, participants } = req.body;

        if (type === 'dm') {
            // Check existing DM
            const existing = await Conversation.findOne({
                type: 'dm',
                participants: { $all: [req.user._id, participantId], $size: 2 }
            }).populate('participants', 'username displayName avatar isOnline lastSeen');

            if (existing) return res.json({ success: true, conversation: existing });

            const conversation = await Conversation.create({
                participants: [req.user._id, participantId],
                type: 'dm'
            });

            const populated = await Conversation.findById(conversation._id)
                .populate('participants', 'username displayName avatar isOnline lastSeen');

            return res.status(201).json({ success: true, conversation: populated });
        }

        // Group chat
        const allParticipants = [...new Set([req.user._id.toString(), ...participants])];
        const conversation = await Conversation.create({
            participants: allParticipants,
            type: 'group',
            groupName: groupName || 'New Group',
            groupAdmin: [req.user._id]
        });

        const populated = await Conversation.findById(conversation._id)
            .populate('participants', 'username displayName avatar isOnline lastSeen');

        res.status(201).json({ success: true, conversation: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create conversation.' });
    }
});

// GET /api/messages/:conversationId
router.get('/:conversationId', auth, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;

        const conversation = await Conversation.findById(req.params.conversationId);
        if (!conversation || !conversation.participants.includes(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const messages = await Message.find({
            conversationId: req.params.conversationId,
            deletedFor: { $ne: req.user._id }
        })
            .populate('sender', 'username displayName avatar')
            .populate('replyTo', 'content sender type')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        res.json({ success: true, messages: messages.reverse() });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to load messages.' });
    }
});

// POST /api/messages/:conversationId
router.post('/:conversationId', auth, async (req, res) => {
    try {
        const { content, type = 'text', mediaUrl, replyTo } = req.body;

        const conversation = await Conversation.findById(req.params.conversationId);
        if (!conversation || !conversation.participants.includes(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const message = await Message.create({
            conversationId: req.params.conversationId,
            sender: req.user._id,
            content,
            type,
            mediaUrl: mediaUrl || '',
            replyTo: replyTo || null
        });

        conversation.lastMessage = message._id;
        conversation.updatedAt = new Date();

        // Increment unread for other participants
        conversation.participants.forEach(p => {
            if (p.toString() !== req.user._id.toString()) {
                const currentCount = conversation.unreadCount.get(p.toString()) || 0;
                conversation.unreadCount.set(p.toString(), currentCount + 1);
            }
        });
        await conversation.save();

        const populated = await Message.findById(message._id)
            .populate('sender', 'username displayName avatar')
            .populate('replyTo', 'content sender type');

        // Emit via Socket.IO
        const io = req.app.get('io');
        conversation.participants.forEach(p => {
            if (p.toString() !== req.user._id.toString()) {
                io.to(`user:${p}`).emit('message:receive', {
                    message: populated,
                    conversationId: req.params.conversationId
                });
            }
        });

        res.status(201).json({ success: true, message: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to send message.' });
    }
});

// DELETE /api/messages/:messageId
router.delete('/:messageId', auth, async (req, res) => {
    try {
        const { forEveryone } = req.body;
        const message = await Message.findById(req.params.messageId);

        if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });

        if (forEveryone) {
            const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
            if (message.sender.toString() !== req.user._id.toString() || message.createdAt < fiveMinAgo) {
                return res.status(403).json({ success: false, message: 'Cannot delete for everyone after 5 minutes.' });
            }
            message.isDeletedForEveryone = true;
            message.content = 'This message was deleted';
            await message.save();
        } else {
            message.deletedFor.push(req.user._id);
            await message.save();
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Delete failed.' });
    }
});

// PUT /api/messages/:messageId/react
router.put('/:messageId/react', auth, async (req, res) => {
    try {
        const { emoji } = req.body;
        const message = await Message.findById(req.params.messageId);
        if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });

        const existingIdx = message.reactions.findIndex(
            r => r.user.toString() === req.user._id.toString()
        );

        if (existingIdx > -1) {
            if (message.reactions[existingIdx].emoji === emoji) {
                message.reactions.splice(existingIdx, 1);
            } else {
                message.reactions[existingIdx].emoji = emoji;
            }
        } else {
            message.reactions.push({ user: req.user._id, emoji });
        }

        await message.save();

        const io = req.app.get('io');
        io.to(`conversation:${message.conversationId}`).emit('message:react', {
            messageId: message._id,
            reactions: message.reactions
        });

        res.json({ success: true, reactions: message.reactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Reaction failed.' });
    }
});

module.exports = router;
