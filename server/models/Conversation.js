const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    type: {
        type: String,
        enum: ['dm', 'group'],
        default: 'dm'
    },
    groupName: { type: String, default: '' },
    groupIcon: { type: String, default: '' },
    groupAdmin: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    isPinned: {
        type: Map,
        of: Boolean,
        default: {}
    },
    isMuted: {
        type: Map,
        of: Boolean,
        default: {}
    },
    isArchived: {
        type: Map,
        of: Boolean,
        default: {}
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
