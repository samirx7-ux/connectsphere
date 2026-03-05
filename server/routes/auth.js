const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, setTokenCookies } = require('../config/jwt');
const { auth } = require('../middleware/auth');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, displayName, gender, dateOfBirth, bio, interests, avatar } = req.body;

        // Validate age (18+)
        const dob = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

        if (age < 18) {
            return res.status(400).json({ success: false, message: 'You must be 18 or older to sign up.' });
        }

        // Check existing user
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ success: false, message: 'Email already registered.' });
            }
            return res.status(400).json({ success: false, message: 'Username already taken.' });
        }

        const user = new User({
            username,
            email,
            passwordHash: password,
            displayName: displayName || username,
            gender,
            dateOfBirth: dob,
            bio: bio || '',
            interests: interests || [],
            avatar: avatar || ''
        });

        const refreshToken = generateRefreshToken(user._id);
        user.refreshToken = refreshToken;
        await user.save();

        const accessToken = generateAccessToken(user._id);
        setTokenCookies(res, accessToken, refreshToken);

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            user: user.toPublicProfile(),
            accessToken
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, message: 'Failed to create account.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        user.isOnline = true;
        user.lastSeen = new Date();
        await user.save();

        setTokenCookies(res, accessToken, refreshToken);

        res.json({
            success: true,
            message: 'Login successful!',
            user: user.toPublicProfile(),
            accessToken
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed.' });
    }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
    try {
        const token = req.cookies?.refreshToken || req.body.refreshToken;
        if (!token) {
            return res.status(401).json({ success: false, message: 'No refresh token.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user || user.refreshToken !== token) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        setTokenCookies(res, accessToken, refreshToken);

        res.json({ success: true, accessToken });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }
});

// POST /api/auth/logout
router.post('/logout', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.refreshToken = '';
        user.isOnline = false;
        user.lastSeen = new Date();
        await user.save();

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.json({ success: true, message: 'Logged out.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Logout failed.' });
    }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-passwordHash -refreshToken')
            .populate('followers', 'username displayName avatar isOnline')
            .populate('following', 'username displayName avatar isOnline');

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch user.' });
    }
});

// PUT /api/auth/change-password
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        }

        user.passwordHash = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to change password.' });
    }
});

// DELETE /api/auth/delete-account
router.delete('/delete-account', auth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user._id);
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.json({ success: true, message: 'Account deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete account.' });
    }
});

module.exports = router;
