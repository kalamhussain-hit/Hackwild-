const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Habit name is required'],
            trim: true,
            maxlength: 100,
        },
        completed: {
            type: Boolean,
            default: false,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.models.Habit || mongoose.model('Habit', habitSchema);
