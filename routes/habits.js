const express = require('express');
const Habit = require('../models/Habit');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all habit routes
router.use(authenticateToken);

/* ─── GET /api/habits ─── */
// Get all habits for the logged-in user
router.get('/', async (req, res) => {
    try {
        const habits = await Habit.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(habits);
    } catch (err) {
        console.error('Fetch habits error:', err);
        res.status(500).json({ error: 'Failed to fetch habits.' });
    }
});

/* ─── POST /api/habits ─── */
// Create a new habit
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Habit name is required.' });
        }

        const habit = new Habit({
            name: name.trim(),
            userId: req.user.id,
            completed: false
        });

        await habit.save();
        res.status(201).json(habit);
    } catch (err) {
        console.error('Create habit error:', err);
        res.status(500).json({ error: 'Failed to create habit.' });
    }
});

/* ─── PATCH /api/habits/:id ─── */
// Toggle completion status or update a habit
router.patch('/:id', async (req, res) => {
    try {
        const habit = await Habit.findOne({ _id: req.params.id, userId: req.user.id });
        if (!habit) {
            return res.status(404).json({ error: 'Habit not found.' });
        }

        if (req.body.completed !== undefined) {
            habit.completed = !!req.body.completed;
        }
        if (req.body.name !== undefined) {
            habit.name = req.body.name.trim();
        }

        await habit.save();
        res.json(habit);
    } catch (err) {
        console.error('Update habit error:', err);
        res.status(500).json({ error: 'Failed to update habit.' });
    }
});

/* ─── DELETE /api/habits/:id ─── */
// Delete a habit
router.delete('/:id', async (req, res) => {
    try {
        const result = await Habit.deleteOne({ _id: req.params.id, userId: req.user.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Habit not found.' });
        }
        res.json({ message: 'Habit deleted successfully.' });
    } catch (err) {
        console.error('Delete habit error:', err);
        res.status(500).json({ error: 'Failed to delete habit.' });
    }
});

module.exports = router;
