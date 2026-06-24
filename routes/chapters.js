const express = require('express');
const Chapter = require('../models/Chapter');
const Story = require('../models/Story');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

/* ─── GET /api/chapters/story/:storyId ─── */
// List all published chapters for a story
router.get('/story/:storyId', async (req, res) => {
    try {
        const chapters = await Chapter.find({
            storyId: req.params.storyId,
            isPublished: true,
        })
            .select('title chapterNumber views createdAt')
            .sort({ chapterNumber: 1 });

        res.json(chapters);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch chapters.' });
    }
});

/* ─── GET /api/chapters/story/:storyId/all ─── */
// List ALL chapters including drafts (author only)
router.get('/story/:storyId/all', authenticateToken, async (req, res) => {
    try {
        const story = await Story.findOne({ _id: req.params.storyId, authorId: req.user.id });
        if (!story) return res.status(403).json({ error: 'Not authorized.' });

        const chapters = await Chapter.find({ storyId: req.params.storyId })
            .sort({ chapterNumber: 1 });

        res.json(chapters);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch chapters.' });
    }
});

/* ─── GET /api/chapters/:id ─── */
// Read a single chapter (increments view count)
router.get('/:id', async (req, res) => {
    try {
        const chapter = await Chapter.findById(req.params.id);
        if (!chapter || !chapter.isPublished)
            return res.status(404).json({ error: 'Chapter not found.' });

        // Increment view count
        chapter.views += 1;
        await chapter.save();

        // Also increment story view count
        await Story.findByIdAndUpdate(chapter.storyId, { $inc: { views: 1 } });

        // Get prev/next chapter info for navigation
        const [prev, next] = await Promise.all([
            Chapter.findOne({
                storyId: chapter.storyId,
                chapterNumber: chapter.chapterNumber - 1,
                isPublished: true,
            }).select('_id title chapterNumber'),
            Chapter.findOne({
                storyId: chapter.storyId,
                chapterNumber: chapter.chapterNumber + 1,
                isPublished: true,
            }).select('_id title chapterNumber'),
        ]);

        res.json({ chapter, prev, next });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch chapter.' });
    }
});

/* ─── POST /api/chapters/story/:storyId ─── */
// Add a new chapter to a story (author only)
router.post('/story/:storyId', authenticateToken, async (req, res) => {
    try {
        const story = await Story.findOne({ _id: req.params.storyId, authorId: req.user.id });
        if (!story) return res.status(403).json({ error: 'Not authorized to add chapters.' });

        const { title, content, isPublished } = req.body;
        if (!title || !content)
            return res.status(400).json({ error: 'Title and content are required.' });

        // Auto-assign chapter number
        const lastChapter = await Chapter.findOne({ storyId: story._id })
            .sort({ chapterNumber: -1 });
        const chapterNumber = lastChapter ? lastChapter.chapterNumber + 1 : 1;

        const chapter = await Chapter.create({
            storyId: story._id,
            title: title.trim(),
            content,
            chapterNumber,
            isPublished: isPublished !== undefined ? isPublished : false,
        });

        // Update story chapter count
        const publishedCount = await Chapter.countDocuments({
            storyId: story._id,
            isPublished: true,
        });
        story.chapterCount = publishedCount;
        await story.save();

        res.status(201).json(chapter);
    } catch (err) {
        console.error('Create chapter error:', err);
        res.status(500).json({ error: 'Failed to create chapter.' });
    }
});

/* ─── PUT /api/chapters/:id ─── */
// Edit a chapter (author only)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const chapter = await Chapter.findById(req.params.id);
        if (!chapter) return res.status(404).json({ error: 'Chapter not found.' });

        const story = await Story.findOne({ _id: chapter.storyId, authorId: req.user.id });
        if (!story) return res.status(403).json({ error: 'Not authorized.' });

        const { title, content, isPublished } = req.body;
        if (title !== undefined) chapter.title = title.trim();
        if (content !== undefined) chapter.content = content;
        if (isPublished !== undefined) chapter.isPublished = isPublished;

        await chapter.save();

        // Update story chapter count
        const publishedCount = await Chapter.countDocuments({
            storyId: story._id,
            isPublished: true,
        });
        story.chapterCount = publishedCount;
        await story.save();

        res.json(chapter);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update chapter.' });
    }
});

/* ─── DELETE /api/chapters/:id ─── */
// Delete a chapter (author only)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const chapter = await Chapter.findById(req.params.id);
        if (!chapter) return res.status(404).json({ error: 'Chapter not found.' });

        const story = await Story.findOne({ _id: chapter.storyId, authorId: req.user.id });
        if (!story) return res.status(403).json({ error: 'Not authorized.' });

        await Chapter.findByIdAndDelete(chapter._id);

        // Re-number remaining chapters
        const remaining = await Chapter.find({ storyId: story._id })
            .sort({ chapterNumber: 1 });
        for (let i = 0; i < remaining.length; i++) {
            remaining[i].chapterNumber = i + 1;
            await remaining[i].save();
        }

        // Update story chapter count
        const publishedCount = await Chapter.countDocuments({
            storyId: story._id,
            isPublished: true,
        });
        story.chapterCount = publishedCount;
        await story.save();

        res.json({ message: 'Chapter deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete chapter.' });
    }
});

module.exports = router;
