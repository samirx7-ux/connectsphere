const router = require('express').Router();
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

// GET /api/posts - Feed
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20, community, userId, tag } = req.query;
        const query = {};

        if (community) query.community = community;
        if (userId) query.author = userId;
        if (tag) query.tags = tag;

        if (!community && !userId && !tag) {
            const User = require('../models/User');
            const user = await User.findById(req.user._id);
            query.$or = [
                { author: { $in: [...user.following, req.user._id] } },
                { community: { $ne: null } }
            ];
        }

        const posts = await Post.find(query)
            .populate('author', 'username displayName avatar isOnline isVerified')
            .populate('community', 'name slug icon')
            .populate('comments.author', 'username displayName avatar')
            .sort({ isPinned: -1, createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Post.countDocuments(query);

        res.json({ success: true, posts, total, page: parseInt(page), hasMore: total > parseInt(page) * parseInt(limit) });
    } catch (error) {
        console.error('Feed error:', error);
        res.status(500).json({ success: false, message: 'Failed to load feed.' });
    }
});

// GET /api/posts/trending
router.get('/trending', auth, async (req, res) => {
    try {
        const posts = await Post.aggregate([
            { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
            {
                $addFields: {
                    totalReactions: {
                        $sum: [
                            { $size: { $ifNull: ['$reactions.like', []] } },
                            { $size: { $ifNull: ['$reactions.love', []] } },
                            { $size: { $ifNull: ['$reactions.fire', []] } }
                        ]
                    },
                    totalComments: { $size: { $ifNull: ['$comments', []] } }
                }
            },
            { $addFields: { score: { $add: ['$totalReactions', { $multiply: ['$totalComments', 2] }, '$shareCount'] } } },
            { $sort: { score: -1 } },
            { $limit: 20 }
        ]);

        await Post.populate(posts, [
            { path: 'author', select: 'username displayName avatar isOnline isVerified' },
            { path: 'community', select: 'name slug icon' }
        ]);

        res.json({ success: true, posts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to load trending.' });
    }
});

// POST /api/posts
router.post('/', auth, async (req, res) => {
    try {
        const { content, media, type, community, tags, flair } = req.body;

        const post = await Post.create({
            author: req.user._id,
            content,
            media: media || [],
            type: type || 'text',
            community: community || null,
            tags: tags || [],
            flair: flair || ''
        });

        const populated = await Post.findById(post._id)
            .populate('author', 'username displayName avatar isOnline isVerified')
            .populate('community', 'name slug icon');

        res.status(201).json({ success: true, post: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create post.' });
    }
});

// POST /api/posts/:id/react
router.post('/:id/react', auth, async (req, res) => {
    try {
        const { reaction } = req.body;
        const validReactions = ['like', 'love', 'fire', 'laugh', 'wow', 'sad'];
        if (!validReactions.includes(reaction)) {
            return res.status(400).json({ success: false, message: 'Invalid reaction.' });
        }

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

        // Remove existing reaction from user
        for (const r of validReactions) {
            if (post.reactions[r]) {
                post.reactions[r] = post.reactions[r].filter(id => id.toString() !== req.user._id.toString());
            }
        }

        // Toggle - if same reaction remove, else add new
        const alreadyReacted = post.reactions[reaction]?.includes(req.user._id);
        if (!alreadyReacted) {
            post.reactions[reaction].push(req.user._id);

            // Notify post author
            if (post.author.toString() !== req.user._id.toString()) {
                await Notification.create({
                    recipient: post.author,
                    sender: req.user._id,
                    type: 'like',
                    referenceId: post._id,
                    referenceModel: 'Post',
                    content: `reacted to your post`
                });

                const io = req.app.get('io');
                io.to(`user:${post.author}`).emit('notification:new', { type: 'like' });
            }
        }

        await post.save();
        res.json({ success: true, reactions: post.reactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Reaction failed.' });
    }
});

// POST /api/posts/:id/comment
router.post('/:id/comment', auth, async (req, res) => {
    try {
        const { content, parentCommentId } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

        if (parentCommentId) {
            const comment = post.comments.id(parentCommentId);
            if (comment) {
                comment.replies.push({ author: req.user._id, content });
            }
        } else {
            post.comments.push({ author: req.user._id, content });
        }

        await post.save();

        const populated = await Post.findById(post._id)
            .populate('comments.author', 'username displayName avatar')
            .populate('comments.replies.author', 'username displayName avatar');

        // Notify
        if (post.author.toString() !== req.user._id.toString()) {
            await Notification.create({
                recipient: post.author,
                sender: req.user._id,
                type: 'comment',
                referenceId: post._id,
                referenceModel: 'Post',
                content: `commented on your post`
            });
            const io = req.app.get('io');
            io.to(`user:${post.author}`).emit('notification:new', { type: 'comment' });
        }

        res.json({ success: true, comments: populated.comments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Comment failed.' });
    }
});

// DELETE /api/posts/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
        await Post.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Post deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Delete failed.' });
    }
});

// POST /api/posts/:id/save
router.post('/:id/save', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

        const isSaved = post.savedBy.includes(req.user._id);
        if (isSaved) {
            post.savedBy.pull(req.user._id);
        } else {
            post.savedBy.push(req.user._id);
        }
        await post.save();

        res.json({ success: true, saved: !isSaved });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Save failed.' });
    }
});

module.exports = router;
