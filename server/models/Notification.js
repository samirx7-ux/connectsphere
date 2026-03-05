const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: ['follow', 'like', 'comment', 'mention', 'message', 'friend_request', 'community_invite', 'live_stream', 'missed_call', 'lfg_accepted'],
        required: true
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    referenceModel: {
        type: String,
        enum: ['User', 'Post', 'Community', 'Stream', 'Message'],
        required: true
    },
    content: { type: String, default: '' },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
