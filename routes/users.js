const express = require('express');
const User = require('../models/User');
const Story = require('../models/Story');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

/* ─── POST /api/users/:id/follow ─── */
// Follow or unfollow a user
router.post('/:id/follow', authenticateToken, async (req, res) => {
    try {
        if (req.params.id === req.user.id)
            return res.status(400).json({ error: "You can't follow yourself." });

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ error: 'User not found.' });

        const currentUser = await User.findById(req.user.id);
        const isFollowing = currentUser.following.some(
            id => id.toString() === req.params.id
        );

        if (isFollowing) {
            // Unfollow
            currentUser.following = currentUser.following.filter(
                id => id.toString() !== req.params.id
            );
            targetUser.followers = targetUser.followers.filter(
                id => id.toString() !== req.user.id
            );
        } else {
            // Follow
            currentUser.following.push(req.params.id);
            targetUser.followers.push(req.user.id);
        }

        await Promise.all([currentUser.save(), targetUser.save()]);

        res.json({
            following: !isFollowing,
            followerCount: targetUser.followers.length,
        });
    } catch (err) {
        console.error('Follow error:', err);
        res.status(500).json({ error: 'Failed to toggle follow.' });
    }
});

/* ─── GET /api/users/:id/followers ─── */
router.get('/:id/followers', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('followers', 'name avatar bio');
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json(user.followers);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch followers.' });
    }
});

/* ─── GET /api/users/:id/following ─── */
router.get('/:id/following', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('following', 'name avatar bio');
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json(user.following);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch following.' });
    }
});

/* ─── POST /api/users/reading-list/:storyId ─── */
// Add or remove a story from reading list
router.post('/reading-list/:storyId', authenticateToken, async (req, res) => {
    try {
        const story = await Story.findById(req.params.storyId);
        if (!story) return res.status(404).json({ error: 'Story not found.' });

        const user = await User.findById(req.user.id);
        const isInList = user.readingList.some(
            id => id.toString() === req.params.storyId
        );

        if (isInList) {
            user.readingList = user.readingList.filter(
                id => id.toString() !== req.params.storyId
            );
        } else {
            user.readingList.push(req.params.storyId);
        }

        await user.save();
        res.json({ inReadingList: !isInList });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update reading list.' });
    }
});

/* ─── GET /api/users/reading-list ─── */
// Get current user's reading list
router.get('/reading-list', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate({
                path: 'readingList',
                populate: { path: 'authorId', select: 'name avatar' },
            });
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json(user.readingList);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch reading list.' });
    }
});

/* ─── GET /api/users/:id ─── */
// Get a user's public profile with their stories
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('name bio avatar followers following createdAt');
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const stories = await Story.find({
            authorId: req.params.id,
            isPublished: true,
        }).sort({ createdAt: -1 });

        res.json({
            user: {
                id: user._id,
                name: user.name,
                bio: user.bio,
                avatar: user.avatar,
                followerCount: user.followerCount,
                followingCount: user.followingCount,
                createdAt: user.createdAt,
            },
            stories,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user profile.' });
    }
});

module.exports = router;
