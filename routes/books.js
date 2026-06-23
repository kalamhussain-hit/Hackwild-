const express  = require('express');
const Book     = require('../models/Book');
const User     = require('../models/User');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// All routes require a valid JWT
router.use(authenticateToken);

/* ─── GET /api/books ─── */
// Returns all books belonging to the authenticated user, newest first.
router.get('/', async (req, res) => {
    try {
        const books = await Book.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch books.' });
    }
});

/* ─── GET /api/books/community ─── */
// Returns ALL books from every user, with ownerName attached.
// Only the first-registered user (owner) may call this.
router.get('/community', async (req, res) => {
    try {
        const oldest = await User.findOne().sort({ createdAt: 1 }).select('_id');
        if (!oldest || oldest._id.toString() !== req.user.id.toString())
            return res.status(403).json({ error: 'Only the library owner can view the community library.' });

        const books = await Book.find()
            .sort({ createdAt: -1 })
            .populate('userId', 'name email');

        const result = books.map(b => ({
            ...b.toObject(),
            ownerName: b.userId?.name || 'Unknown',
        }));
        res.json(result);
    } catch (err) {
        console.error('Community books error:', err);
        res.status(500).json({ error: 'Failed to fetch community books.' });
    }
});

/* ─── GET /api/books/community/stats ─── */
// Returns per-user book counts. Owner only.
router.get('/community/stats', async (req, res) => {
    try {
        const oldest = await User.findOne().sort({ createdAt: 1 }).select('_id');
        if (!oldest || oldest._id.toString() !== req.user.id.toString())
            return res.status(403).json({ error: 'Only the library owner can view community stats.' });

        const users = await User.find().sort({ createdAt: 1 });
        const stats = await Promise.all(
            users.map(async u => {
                const [total, reading, finished, wantToRead] = await Promise.all([
                    Book.countDocuments({ userId: u._id }),
                    Book.countDocuments({ userId: u._id, status: 'Reading' }),
                    Book.countDocuments({ userId: u._id, status: 'Finished' }),
                    Book.countDocuments({ userId: u._id, status: 'Want to Read' }),
                ]);
                return {
                    id:        u._id,
                    name:      u.name,
                    email:     u.email,
                    joinedAt:  u.createdAt,
                    total, reading, finished, wantToRead,
                };
            })
        );
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch community stats.' });
    }
});

/* ─── GET /api/books/:id ─── */
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.params.id, userId: req.user.id });
        if (!book) return res.status(404).json({ error: 'Book not found.' });
        res.json(book);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch book.' });
    }
});

/* ─── POST /api/books ─── */
router.post('/', async (req, res) => {
    try {
        const { title, author, genre, status, rating, notes } = req.body;

        if (!title || !author || !genre)
            return res.status(400).json({ error: 'Title, author, and genre are required.' });

        const book = await Book.create({
            userId: req.user.id,
            title,
            author,
            genre,
            status: status || 'Want to Read',
            rating: rating ? Math.min(5, Math.max(1, parseInt(rating))) : null,
            notes:  notes || '',
        });
        res.status(201).json(book);
    } catch (err) {
        console.error('Create book error:', err);
        res.status(500).json({ error: 'Failed to create book.' });
    }
});

/* ─── PUT /api/books/:id ─── */
router.put('/:id', async (req, res) => {
    try {
        const { title, author, genre, status, rating, notes } = req.body;
        const validStatuses = ['Want to Read', 'Reading', 'Finished'];

        const updates = {};
        if (title)  updates.title  = title.trim();
        if (author) updates.author = author.trim();
        if (genre)  updates.genre  = genre.trim();
        if (status && validStatuses.includes(status)) updates.status = status;
        if (rating !== undefined) updates.rating = rating ? Math.min(5, Math.max(1, parseInt(rating))) : null;
        if (notes  !== undefined) updates.notes  = notes.trim();

        const book = await Book.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            updates,
            { new: true, runValidators: true }
        );
        if (!book) return res.status(404).json({ error: 'Book not found.' });
        res.json(book);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update book.' });
    }
});

/* ─── DELETE /api/books/:id ─── */
router.delete('/:id', async (req, res) => {
    try {
        const book = await Book.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!book) return res.status(404).json({ error: 'Book not found.' });
        res.json({ message: 'Book deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete book.' });
    }
});

module.exports = router;
