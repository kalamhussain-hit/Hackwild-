const express = require('express');
const Story = require('../models/Story');
const Chapter = require('../models/Chapter');
const Comment = require('../models/Comment');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

/* ─── GET /api/stories ─── */
// Browse all published stories with optional filtering
router.get('/', async (req, res) => {
    try {
        const { genre, search, sort, page = 1, limit = 20 } = req.query;
        const filter = { isPublished: true };

        if (genre && genre !== 'All') filter.genre = genre;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
            ];
        }

        let sortOption = { createdAt: -1 }; // default: newest
        if (sort === 'popular') sortOption = { views: -1 };
        if (sort === 'likes') sortOption = { likes: -1 };
        if (sort === 'oldest') sortOption = { createdAt: 1 };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [stories, total] = await Promise.all([
            Story.find(filter)
                .sort(sortOption)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('authorId', 'name avatar'),
            Story.countDocuments(filter),
        ]);

        res.json({
            stories,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
        });
    } catch (err) {
        console.error('Fetch stories error:', err);
        res.status(500).json({ error: 'Failed to fetch stories.' });
    }
});

/* ─── GET /api/stories/my ─── */
// Get current user's stories (published and drafts)
router.get('/my', authenticateToken, async (req, res) => {
    try {
        const stories = await Story.find({ authorId: req.user.id })
            .sort({ updatedAt: -1 });
        res.json(stories);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch your stories.' });
    }
});

/* ─── GET /api/stories/trending ─── */
// Get trending stories (most views in recent period)
router.get('/trending', async (req, res) => {
    try {
        const stories = await Story.find({ isPublished: true })
            .sort({ views: -1, createdAt: -1 })
            .limit(10)
            .populate('authorId', 'name avatar');
        res.json(stories);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch trending stories.' });
    }
});

/* ─── GET /api/stories/recent ─── */
// Get recently published stories
router.get('/recent', async (req, res) => {
    try {
        const stories = await Story.find({ isPublished: true })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('authorId', 'name avatar');
        res.json(stories);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch recent stories.' });
    }
});

/* ─── GET /api/stories/:id ─── */
// Get a single story with chapter list
router.get('/:id', async (req, res) => {
    try {
        const story = await Story.findById(req.params.id)
            .populate('authorId', 'name avatar bio followers');

        if (!story) return res.status(404).json({ error: 'Story not found.' });

        // Get chapters list (titles only, not full content)
        const chapters = await Chapter.find({ storyId: story._id, isPublished: true })
            .select('title chapterNumber views createdAt')
            .sort({ chapterNumber: 1 });

        // Get comment count
        const commentCount = await Comment.countDocuments({ storyId: story._id });

        res.json({ story, chapters, commentCount });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch story.' });
    }
});

/* ─── POST /api/stories ─── */
// Create a new story
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, description, genre, tags, coverImage, status, isPublished } = req.body;

        if (!title || !genre)
            return res.status(400).json({ error: 'Title and genre are required.' });

        const story = await Story.create({
            title: title.trim(),
            description: description ? description.trim() : '',
            authorId: req.user.id,
            genre,
            tags: tags || [],
            coverImage: coverImage || '',
            status: status || 'Ongoing',
            isPublished: isPublished || false,
        });

        res.status(201).json(story);
    } catch (err) {
        console.error('Create story error:', err);
        res.status(500).json({ error: 'Failed to create story.' });
    }
});

/* ─── PUT /api/stories/:id ─── */
// Update story metadata (author only)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const story = await Story.findOne({ _id: req.params.id, authorId: req.user.id });
        if (!story) return res.status(404).json({ error: 'Story not found or unauthorized.' });

        const { title, description, genre, tags, coverImage, status, isPublished } = req.body;

        if (title !== undefined) story.title = title.trim();
        if (description !== undefined) story.description = description.trim();
        if (genre !== undefined) story.genre = genre;
        if (tags !== undefined) story.tags = tags;
        if (coverImage !== undefined) story.coverImage = coverImage;
        if (status !== undefined) story.status = status;
        if (isPublished !== undefined) story.isPublished = isPublished;

        await story.save();
        res.json(story);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update story.' });
    }
});

/* ─── DELETE /api/stories/:id ─── */
// Delete a story and all its chapters/comments (author only)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const story = await Story.findOne({ _id: req.params.id, authorId: req.user.id });
        if (!story) return res.status(404).json({ error: 'Story not found or unauthorized.' });

        // Delete all chapters and comments for this story
        await Promise.all([
            Chapter.deleteMany({ storyId: story._id }),
            Comment.deleteMany({ storyId: story._id }),
        ]);

        await Story.findByIdAndDelete(story._id);
        res.json({ message: 'Story deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete story.' });
    }
});

/* ─── POST /api/stories/:id/like ─── */
// Like or unlike a story
router.post('/:id/like', authenticateToken, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ error: 'Story not found.' });

        const userId = req.user.id;
        const alreadyLiked = story.likes.some(id => id.toString() === userId);

        if (alreadyLiked) {
            story.likes = story.likes.filter(id => id.toString() !== userId);
        } else {
            story.likes.push(userId);
        }

        await story.save();
        res.json({ liked: !alreadyLiked, likeCount: story.likes.length });
    } catch (err) {
        res.status(500).json({ error: 'Failed to toggle like.' });
    }
});

module.exports = router;
