const mongoose = require('mongoose');

const matchSessionSchema = new mongoose.Schema({
    user1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    user2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation'
    },
    status: {
        type: String,
        enum: ['active', 'ended', 'skipped'],
        default: 'active'
    },
    rating: {
        user1: { type: String, enum: ['up', 'down', ''], default: '' },
        user2: { type: String, enum: ['up', 'down', ''], default: '' }
    },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('MatchSession', matchSessionSchema);
