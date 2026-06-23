const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
        },
        author: {
            type: String,
            required: [true, 'Author is required'],
            trim: true,
        },
        genre: {
            type: String,
            required: [true, 'Genre is required'],
            trim: true,
        },
        status: {
            type: String,
            enum: ['Want to Read', 'Reading', 'Finished'],
            default: 'Want to Read',
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: null,
        },
        notes: {
            type: String,
            trim: true,
            default: '',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);
