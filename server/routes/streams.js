const router = require('express').Router();
const Stream = require('../models/Stream');
const { auth } = require('../middleware/auth');

// GET /api/streams - Live streams
router.get('/', auth, async (req, res) => {
    try {
        const { category } = req.query;
        const query = { isLive: true };
        if (category) query.category = category;

        const streams = await Stream.find(query)
            .populate('streamer', 'username displayName avatar isVerified')
            .sort({ viewerCount: -1 });

        res.json({ success: true, streams });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to load streams.' });
    }
});

// POST /api/streams - Go Live
router.post('/', auth, async (req, res) => {
    try {
        const { title, category, thumbnail, allowComments, community } = req.body;

        const existingStream = await Stream.findOne({ streamer: req.user._id, isLive: true });
        if (existingStream) {
            return res.status(400).json({ success: false, message: 'You are already live.' });
        }

        const stream = await Stream.create({
            streamer: req.user._id, title, category: category || 'Just Chatting',
            thumbnail: thumbnail || '', allowComments: allowComments !== false,
            community: community || null
        });

        const populated = await Stream.findById(stream._id)
            .populate('streamer', 'username displayName avatar isVerified');

        res.status(201).json({ success: true, stream: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to start stream.' });
    }
});

// PUT /api/streams/:id/end
router.put('/:id/end', auth, async (req, res) => {
    try {
        const stream = await Stream.findById(req.params.id);
        if (!stream || stream.streamer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
        stream.isLive = false;
        stream.endedAt = new Date();
        await stream.save();

        const io = req.app.get('io');
        io.to(`stream:${stream._id}`).emit('stream:end', { streamId: stream._id });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to end stream.' });
    }
});

// GET /api/streams/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const stream = await Stream.findById(req.params.id)
            .populate('streamer', 'username displayName avatar isVerified followers')
            .populate('comments.user', 'username displayName avatar');
        if (!stream) return res.status(404).json({ success: false, message: 'Stream not found.' });
        res.json({ success: true, stream });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to load stream.' });
    }
});

module.exports = router;
