const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        maxlength: 500,
        default: ''
    },
    icon: { type: String, default: '' },
    banner: { type: String, default: '' },
    category: {
        type: String,
        enum: ['FPS', 'RPG', 'Battle Royale', 'Sports', 'Strategy', 'Mobile', 'Racing', 'Fighting', 'Sandbox', 'Horror', 'Other'],
        default: 'Other'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    channels: [{
        name: { type: String, required: true },
        slug: { type: String, required: true },
        description: { type: String, default: '' },
        type: { type: String, enum: ['text', 'voice'], default: 'text' },
        createdAt: { type: Date, default: Date.now }
    }],
    isPublic: { type: Boolean, default: true },
    tags: [String],
    rules: [String],
    featured: { type: Boolean, default: false },
    events: [{
        title: String,
        description: String,
        startDate: Date,
        endDate: Date,
        going: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        interested: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
}, { timestamps: true });

communitySchema.virtual('memberCount').get(function () {
    return this.members ? this.members.length : 0;
});

communitySchema.set('toJSON', { virtuals: true });
communitySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Community', communitySchema);
