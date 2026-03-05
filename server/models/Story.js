const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    mediaUrl: {
        type: String,
        required: true
    },
    mediaType: {
        type: String,
        enum: ['image', 'video'],
        default: 'image'
    },
    caption: {
        type: String,
        maxlength: 200,
        default: ''
    },
    viewers: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        viewedAt: { type: Date, default: Date.now }
    }],
    reactions: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: String
    }],
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 }
    }
}, { timestamps: true });

module.exports = mongoose.model('Story', storySchema);
