const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_changeme_in_production';
const JWT_EXPIRES = '7d';

function issueToken(user) {
    return jwt.sign(
        { id: user._id, name: user.name, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
    );
}

/* ─── GET /api/auth/bypass ─── */
router.get('/bypass', async (req, res) => {
    try {
        let user = await User.findOne({ email: 'guest@inkwell.com' });
        if (!user) {
            user = await User.create({
                name: 'Guest Author',
                email: 'guest@inkwell.com',
                password: 'guestpassword123',
                bio: 'A passionate guest writer on InkWell.'
            });
        }
        const token = issueToken(user);
        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email },
        });
    } catch (err) {
        console.error('Bypass authentication error:', err);
        res.status(500).json({ error: 'Server error during auto-login.' });
    }
});

/* ─── POST /api/auth/register ─── */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        if (password.length < 6)
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });

        const exists = await User.findOne({ email: email.toLowerCase().trim() });
        if (exists)
            return res.status(409).json({ error: 'An account with this email already exists.' });

        const user = await User.create({ name: name.trim(), email, password });

        const token = issueToken(user);
        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email },
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: `Server error during registration: ${err.message}` });
    }
});

/* ─── POST /api/auth/login ─── */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ error: 'Email and password are required.' });

        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
        if (!user)
            return res.status(401).json({ error: 'Invalid email or password.' });

        const valid = await user.comparePassword(password);
        if (!valid)
            return res.status(401).json({ error: 'Invalid email or password.' });

        const token = issueToken(user);
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                bio: user.bio,
                avatar: user.avatar,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: `Server error during login: ${err.message}` });
    }
});

/* ─── GET /api/auth/me ─── */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('readingList', 'title coverImage genre');
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                bio: user.bio,
                avatar: user.avatar,
                followerCount: user.followerCount,
                followingCount: user.followingCount,
                readingList: user.readingList,
                createdAt: user.createdAt,
            },
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error.' });
    }
});

/* ─── GET /api/auth/profile/:id ─── */
router.get('/profile/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('name bio avatar followers following createdAt');
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json({
            id: user._id,
            name: user.name,
            bio: user.bio,
            avatar: user.avatar,
            followerCount: user.followerCount,
            followingCount: user.followingCount,
            createdAt: user.createdAt,
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error.' });
    }
});

/* ─── PUT /api/auth/profile ─── */
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name, bio, avatar } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name.trim();
        if (bio !== undefined) updates.bio = bio.trim();
        if (avatar !== undefined) updates.avatar = avatar.trim();

        const user = await User.findByIdAndUpdate(req.user.id, updates, {
            new: true,
            runValidators: true,
        });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                bio: user.bio,
                avatar: user.avatar,
            },
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update profile.' });
    }
});

module.exports = router;
