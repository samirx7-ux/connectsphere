const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30,
        match: /^[a-zA-Z0-9_]+$/
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    displayName: {
        type: String,
        trim: true,
        maxlength: 50
    },
    avatar: {
        type: String,
        default: ''
    },
    coverPhoto: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        maxlength: 150,
        default: ''
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    location: {
        city: { type: String, default: '' },
        country: { type: String, default: '' }
    },
    interests: [{
        type: String,
        enum: ['Gaming', 'Music', 'Art', 'Sports', 'Tech', 'Travel', 'Fitness', 'Food', 'Movies', 'Photography', 'Reading', 'Fashion', 'Science', 'Nature', 'Comedy', 'Anime', 'Streaming']
    }],
    socialLinks: {
        instagram: { type: String, default: '' },
        twitter: { type: String, default: '' },
        discord: { type: String, default: '' },
        youtube: { type: String, default: '' }
    },
    gamerTag: { type: String, default: '' },
    favoriteGames: [{ type: String }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    refreshToken: { type: String, default: '' },
    onboardingCompleted: { type: Boolean, default: false },
    settings: {
        theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
        messagePrivacy: { type: String, enum: ['everyone', 'friends', 'nobody'], default: 'everyone' },
        callPrivacy: { type: String, enum: ['everyone', 'friends', 'nobody'], default: 'everyone' },
        profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
        showOnlineStatus: { type: Boolean, default: true },
        notifications: {
            messages: { type: Boolean, default: true },
            calls: { type: Boolean, default: true },
            likes: { type: Boolean, default: true },
            follows: { type: Boolean, default: true },
            live: { type: Boolean, default: true },
            communities: { type: Boolean, default: true }
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userSchema.virtual('age').get(function () {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
});

userSchema.virtual('totalFollowers').get(function () {
    return this.followers ? this.followers.length : 0;
});

userSchema.virtual('totalFollowing').get(function () {
    return this.following ? this.following.length : 0;
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toPublicProfile = function () {
    const obj = this.toObject();
    delete obj.passwordHash;
    delete obj.refreshToken;
    delete obj.blockedUsers;
    delete obj.settings;
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
