const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            trim: true,
            default: '',
            maxlength: 2000,
        },
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        coverImage: {
            type: String,
            trim: true,
            default: '', // URL to cover image
        },
        genre: {
            type: String,
            required: [true, 'Genre is required'],
            trim: true,
            enum: [
                'Reflective',
                'Joyful',
                'Anxious',
                'Melancholy',
                'Grateful',
                'Stressed',
                'Peaceful',
                'Excited',
                'Angry',
                'Hopeful',
                'Tired',
                'Other'
            ],
        },
        tags: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],
        status: {
            type: String,
            enum: ['Ongoing', 'Completed', 'Hiatus'],
            default: 'Ongoing',
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        views: {
            type: Number,
            default: 0,
        },
        chapterCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Virtual for like count
storySchema.virtual('likeCount').get(function () {
    return this.likes ? this.likes.length : 0;
});

// Ensure virtuals are included in JSON
storySchema.set('toJSON', { virtuals: true });
storySchema.set('toObject', { virtuals: true });

// Index for searching and sorting
storySchema.index({ title: 'text', description: 'text', tags: 'text' });
storySchema.index({ genre: 1, isPublished: 1 });
storySchema.index({ createdAt: -1 });
storySchema.index({ views: -1 });

module.exports = mongoose.model('Story', storySchema);
