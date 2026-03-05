const router = require('express').Router();
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

// GET /api/notifications
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 30 } = req.query;
        const notifications = await Notification.find({ recipient: req.user._id })
            .populate('sender', 'username displayName avatar')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

        res.json({ success: true, notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to load notifications.' });
    }
});

// PUT /api/notifications/read-all
router.put('/read-all', auth, async (req, res) => {
    try {
        await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to mark as read.' });
    }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', auth, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to mark as read.' });
    }
});

// DELETE /api/notifications/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Delete failed.' });
    }
});

module.exports = router;
