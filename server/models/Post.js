const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        default: null
    },
    content: {
        type: String,
        maxlength: 5000,
        default: ''
    },
    media: [{
        url: String,
        type: { type: String, enum: ['image', 'video'] }
    }],
    type: {
        type: String,
        enum: ['text', 'image', 'video', 'poll', 'link'],
        default: 'text'
    },
    reactions: {
        like: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        love: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        fire: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        laugh: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        wow: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        sad: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    },
    comments: [{
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: { type: String, maxlength: 1000 },
        reactions: {
            like: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
        },
        replies: [{
            author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            content: { type: String, maxlength: 1000 },
            createdAt: { type: Date, default: Date.now }
        }],
        createdAt: { type: Date, default: Date.now }
    }],
    tags: [String],
    flair: {
        type: String,
        enum: ['', 'LFG', 'Clip', 'Discussion', 'Meme', 'Help', 'News', 'Guide'],
        default: ''
    },
    isPinned: { type: Boolean, default: false },
    shareCount: { type: Number, default: 0 },
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

postSchema.virtual('commentCount').get(function () {
    return this.comments ? this.comments.length : 0;
});

postSchema.virtual('totalReactions').get(function () {
    if (!this.reactions) return 0;
    return Object.values(this.reactions).reduce((sum, arr) => {
        return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0);
});

postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);
