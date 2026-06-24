const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema(
    {
        storyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Story',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Chapter title is required'],
            trim: true,
            maxlength: 200,
        },
        content: {
            type: String,
            required: [true, 'Chapter content is required'],
        },
        chapterNumber: {
            type: Number,
            required: true,
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        views: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Compound index for fetching chapters of a story in order
chapterSchema.index({ storyId: 1, chapterNumber: 1 });

module.exports = mongoose.model('Chapter', chapterSchema);
