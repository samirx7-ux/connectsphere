const router = require('express').Router();
const Story = require('../models/Story');
const { auth } = require('../middleware/auth');

// GET /api/stories - Stories from followed users
router.get('/', auth, async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.user._id);

        const stories = await Story.find({
            author: { $in: [...user.following, req.user._id] },
            expiresAt: { $gt: new Date() }
        })
            .populate('author', 'username displayName avatar isOnline')
            .sort({ createdAt: -1 });

        // Group by author
        const grouped = {};
        stories.forEach(story => {
            const authorId = story.author._id.toString();
            if (!grouped[authorId]) {
                grouped[authorId] = {
                    user: story.author,
                    stories: [],
                    hasUnviewed: false
                };
            }
            grouped[authorId].stories.push(story);
            if (!story.viewers.some(v => v.user.toString() === req.user._id.toString())) {
                grouped[authorId].hasUnviewed = true;
            }
        });

        res.json({ success: true, storyGroups: Object.values(grouped) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to load stories.' });
    }
});

// POST /api/stories
router.post('/', auth, async (req, res) => {
    try {
        const { mediaUrl, mediaType, caption } = req.body;
        const story = await Story.create({
            author: req.user._id,
            mediaUrl,
            mediaType: mediaType || 'image',
            caption: caption || '',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

        const populated = await Story.findById(story._id)
            .populate('author', 'username displayName avatar');

        res.status(201).json({ success: true, story: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create story.' });
    }
});

// PUT /api/stories/:id/view
router.put('/:id/view', auth, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ success: false, message: 'Story not found.' });

        const alreadyViewed = story.viewers.some(v => v.user.toString() === req.user._id.toString());
        if (!alreadyViewed) {
            story.viewers.push({ user: req.user._id });
            await story.save();
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to mark as viewed.' });
    }
});

// DELETE /api/stories/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story || story.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
        await Story.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Delete failed.' });
    }
});

module.exports = router;
