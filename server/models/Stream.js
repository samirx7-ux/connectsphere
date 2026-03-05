const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema({
    streamer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    category: {
        type: String,
        enum: ['Gaming', 'Just Chatting', 'Music', 'Art', 'Sports', 'Tech', 'Education', 'Other'],
        default: 'Just Chatting'
    },
    thumbnail: { type: String, default: '' },
    isLive: { type: Boolean, default: true },
    viewerCount: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: String,
        createdAt: { type: Date, default: Date.now }
    }],
    allowComments: { type: Boolean, default: true },
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        default: null
    },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Stream', streamSchema);
