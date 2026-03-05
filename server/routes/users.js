const router = require('express').Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

// GET /api/users/search?q=
router.get('/search', auth, async (req, res) => {
    try {
        const { q, page = 1, limit = 20 } = req.query;
        if (!q) return res.json({ success: true, users: [] });

        const users = await User.find({
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { displayName: { $regex: q, $options: 'i' } }
            ],
            _id: { $ne: req.user._id }
        })
            .select('username displayName avatar bio isOnline isVerified interests')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Search failed.' });
    }
});

// GET /api/users/suggested
router.get('/suggested', auth, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id);
        const users = await User.find({
            _id: { $ne: req.user._id, $nin: [...currentUser.following, ...currentUser.blockedUsers] },
            interests: { $in: currentUser.interests }
        })
            .select('username displayName avatar bio isOnline isVerified interests')
            .limit(10);

        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get suggestions.' });
    }
});

// GET /api/users/:username
router.get('/:username', auth, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select('-passwordHash -refreshToken -blockedUsers')
            .populate('followers', 'username displayName avatar isOnline')
            .populate('following', 'username displayName avatar isOnline');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const isFollowing = user.followers.some(f => f._id.toString() === req.user._id.toString());
        const isBlocked = (await User.findById(req.user._id)).blockedUsers.includes(user._id);

        res.json({
            success: true,
            user: { ...user.toObject(), isFollowing, isBlocked }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
    }
});

// PUT /api/users/profile
router.put('/profile', auth, async (req, res) => {
    try {
        const allowedFields = ['displayName', 'bio', 'avatar', 'coverPhoto', 'location',
            'interests', 'socialLinks', 'gamerTag', 'favoriteGames', 'settings'];

        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
            .select('-passwordHash -refreshToken');

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update profile.' });
    }
});

// POST /api/users/:id/follow
router.post('/:id/follow', auth, async (req, res) => {
    try {
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: "Can't follow yourself." });
        }

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const isFollowing = targetUser.followers.includes(req.user._id);

        if (isFollowing) {
            // Unfollow
            await User.findByIdAndUpdate(req.params.id, { $pull: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $pull: { following: req.params.id } });
            res.json({ success: true, action: 'unfollowed' });
        } else {
            // Follow
            await User.findByIdAndUpdate(req.params.id, { $addToSet: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: req.params.id } });

            // Create notification
            await Notification.create({
                recipient: req.params.id,
                sender: req.user._id,
                type: 'follow',
                referenceId: req.user._id,
                referenceModel: 'User',
                content: `${req.user.displayName || req.user.username} started following you`
            });

            // Push real-time notification
            const io = req.app.get('io');
            io.to(`user:${req.params.id}`).emit('notification:new', {
                type: 'follow',
                sender: { _id: req.user._id, username: req.user.username, displayName: req.user.displayName, avatar: req.user.avatar }
            });

            res.json({ success: true, action: 'followed' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Follow action failed.' });
    }
});

// POST /api/users/:id/block
router.post('/:id/block', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const isBlocked = user.blockedUsers.includes(req.params.id);

        if (isBlocked) {
            await User.findByIdAndUpdate(req.user._id, { $pull: { blockedUsers: req.params.id } });
            res.json({ success: true, action: 'unblocked' });
        } else {
            await User.findByIdAndUpdate(req.user._id, {
                $addToSet: { blockedUsers: req.params.id },
                $pull: { followers: req.params.id, following: req.params.id }
            });
            await User.findByIdAndUpdate(req.params.id, {
                $pull: { followers: req.user._id, following: req.user._id }
            });
            res.json({ success: true, action: 'blocked' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Block action failed.' });
    }
});

// GET /api/users/:id/mutual-friends
router.get('/:id/mutual-friends', auth, async (req, res) => {
    try {
        const [currentUser, targetUser] = await Promise.all([
            User.findById(req.user._id),
            User.findById(req.params.id)
        ]);

        const mutualIds = currentUser.following.filter(id =>
            targetUser.following.some(tid => tid.toString() === id.toString())
        );

        const mutuals = await User.find({ _id: { $in: mutualIds } })
            .select('username displayName avatar isOnline');

        res.json({ success: true, mutualFriends: mutuals });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get mutual friends.' });
    }
});

module.exports = router;
