const router = require('express').Router();
const Community = require('../models/Community');
const Post = require('../models/Post');
const { auth } = require('../middleware/auth');

// GET /api/communities
router.get('/', auth, async (req, res) => {
    try {
        const { category, search, page = 1, limit = 20 } = req.query;
        const query = {};
        if (category) query.category = category;
        if (search) query.name = { $regex: search, $options: 'i' };

        const communities = await Community.find(query)
            .populate('owner', 'username displayName avatar')
            .sort({ featured: -1, createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        res.json({ success: true, communities });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to load communities.' });
    }
});

// GET /api/communities/:slug
router.get('/:slug', auth, async (req, res) => {
    try {
        const community = await Community.findOne({ slug: req.params.slug })
            .populate('owner', 'username displayName avatar')
            .populate('moderators', 'username displayName avatar')
            .populate('members', 'username displayName avatar isOnline');

        if (!community) return res.status(404).json({ success: false, message: 'Community not found.' });

        const isMember = community.members.some(m => m._id.toString() === req.user._id.toString());
        const posts = await Post.find({ community: community._id })
            .populate('author', 'username displayName avatar isVerified')
            .sort({ isPinned: -1, createdAt: -1 })
            .limit(20);

        res.json({ success: true, community: { ...community.toObject(), isMember }, posts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to load community.' });
    }
});

// POST /api/communities
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, category, isPublic, tags, rules, icon, banner } = req.body;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const existing = await Community.findOne({ slug });
        if (existing) return res.status(400).json({ success: false, message: 'Community name already taken.' });

        const community = await Community.create({
            name, slug, description, category, isPublic: isPublic !== false, tags: tags || [], rules: rules || [],
            icon: icon || '', banner: banner || '',
            owner: req.user._id,
            moderators: [req.user._id],
            members: [req.user._id],
            channels: [
                { name: 'General', slug: 'general', description: 'General discussion' },
                { name: 'LFG', slug: 'lfg', description: 'Looking for group' },
                { name: 'Off Topic', slug: 'off-topic', description: 'Off topic chat' }
            ]
        });

        res.status(201).json({ success: true, community });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create community.' });
    }
});

// POST /api/communities/:id/join
router.post('/:id/join', auth, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ success: false, message: 'Community not found.' });

        const isMember = community.members.includes(req.user._id);
        if (isMember) {
            community.members.pull(req.user._id);
            await community.save();
            return res.json({ success: true, action: 'left' });
        }

        community.members.push(req.user._id);
        await community.save();
        res.json({ success: true, action: 'joined' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Join failed.' });
    }
});

// POST /api/communities/:id/channels
router.post('/:id/channels', auth, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ success: false, message: 'Community not found.' });

        const isModOrOwner = community.owner.toString() === req.user._id.toString() ||
            community.moderators.includes(req.user._id);
        if (!isModOrOwner) return res.status(403).json({ success: false, message: 'Only mods can create channels.' });

        const { name, description, type } = req.body;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        community.channels.push({ name, slug, description: description || '', type: type || 'text' });
        await community.save();

        res.json({ success: true, channels: community.channels });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create channel.' });
    }
});

module.exports = router;
