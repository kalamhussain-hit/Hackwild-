const express = require('express');
const Comment = require('../models/Comment');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

/* ─── GET /api/comments/chapter/:chapterId ─── */
// List comments for a chapter (with replies nested)
router.get('/chapter/:chapterId', async (req, res) => {
    try {
        const { page = 1, limit = 30 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get top-level comments
        const comments = await Comment.find({
            chapterId: req.params.chapterId,
            parentId: null,
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('userId', 'name avatar');

        // Get replies for each top-level comment
        const commentIds = comments.map(c => c._id);
        const replies = await Comment.find({
            parentId: { $in: commentIds },
        })
            .sort({ createdAt: 1 })
            .populate('userId', 'name avatar');

        // Nest replies under their parent
        const repliesMap = {};
        replies.forEach(r => {
            const parentKey = r.parentId.toString();
            if (!repliesMap[parentKey]) repliesMap[parentKey] = [];
            repliesMap[parentKey].push(r);
        });

        const result = comments.map(c => ({
            ...c.toObject(),
            replies: repliesMap[c._id.toString()] || [],
        }));

        const total = await Comment.countDocuments({
            chapterId: req.params.chapterId,
            parentId: null,
        });

        res.json({ comments: result, total, page: parseInt(page) });
    } catch (err) {
        console.error('Fetch comments error:', err);
        res.status(500).json({ error: 'Failed to fetch comments.' });
    }
});

/* ─── POST /api/comments/chapter/:chapterId ─── */
// Post a comment on a chapter
router.post('/chapter/:chapterId', authenticateToken, async (req, res) => {
    try {
        const { content, parentId, storyId } = req.body;

        if (!content || !content.trim())
            return res.status(400).json({ error: 'Comment content is required.' });
        if (!storyId)
            return res.status(400).json({ error: 'Story ID is required.' });

        const comment = await Comment.create({
            userId: req.user.id,
            chapterId: req.params.chapterId,
            storyId,
            content: content.trim(),
            parentId: parentId || null,
        });

        // Populate user info before returning
        await comment.populate('userId', 'name avatar');

        res.status(201).json(comment);
    } catch (err) {
        console.error('Create comment error:', err);
        res.status(500).json({ error: 'Failed to post comment.' });
    }
});

/* ─── DELETE /api/comments/:id ─── */
// Delete own comment (and its replies)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const comment = await Comment.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });
        if (!comment)
            return res.status(404).json({ error: 'Comment not found or unauthorized.' });

        // Delete replies to this comment
        await Comment.deleteMany({ parentId: comment._id });
        // Delete the comment itself
        await Comment.findByIdAndDelete(comment._id);

        res.json({ message: 'Comment deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete comment.' });
    }
});

/* ─── POST /api/comments/:id/like ─── */
// Like or unlike a comment
router.post('/:id/like', authenticateToken, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ error: 'Comment not found.' });

        const userId = req.user.id;
        const alreadyLiked = comment.likes.some(id => id.toString() === userId);

        if (alreadyLiked) {
            comment.likes = comment.likes.filter(id => id.toString() !== userId);
        } else {
            comment.likes.push(userId);
        }

        await comment.save();
        res.json({ liked: !alreadyLiked, likeCount: comment.likes.length });
    } catch (err) {
        res.status(500).json({ error: 'Failed to toggle like.' });
    }
});

module.exports = router;
