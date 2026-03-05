export interface User {
    _id: string;
    username: string;
    email?: string;
    displayName: string;
    avatar: string;
    coverPhoto: string;
    bio: string;
    gender: 'male' | 'female' | 'other';
    dateOfBirth?: string;
    age?: number;
    location: { city: string; country: string };
    interests: string[];
    socialLinks: { instagram: string; twitter: string; discord: string; youtube: string };
    gamerTag: string;
    favoriteGames: string[];
    followers: User[];
    following: User[];
    totalFollowers: number;
    totalFollowing: number;
    isOnline: boolean;
    lastSeen: string;
    isVerified: boolean;
    onboardingCompleted: boolean;
    settings: UserSettings;
    createdAt: string;
    isFollowing?: boolean;
    isBlocked?: boolean;
}

export interface UserSettings {
    theme: 'light' | 'dark' | 'system';
    messagePrivacy: 'everyone' | 'friends' | 'nobody';
    callPrivacy: 'everyone' | 'friends' | 'nobody';
    profileVisibility: 'public' | 'friends' | 'private';
    showOnlineStatus: boolean;
    notifications: {
        messages: boolean;
        calls: boolean;
        likes: boolean;
        follows: boolean;
        live: boolean;
        communities: boolean;
    };
}

export interface Post {
    _id: string;
    author: User;
    community?: Community;
    content: string;
    media: { url: string; type: 'image' | 'video' }[];
    type: 'text' | 'image' | 'video' | 'poll' | 'link';
    reactions: {
        like: string[];
        love: string[];
        fire: string[];
        laugh: string[];
        wow: string[];
        sad: string[];
    };
    comments: Comment[];
    commentCount: number;
    totalReactions: number;
    tags: string[];
    flair: string;
    isPinned: boolean;
    shareCount: number;
    savedBy: string[];
    createdAt: string;
}

export interface Comment {
    _id: string;
    author: User;
    content: string;
    reactions: { like: string[] };
    replies: { _id: string; author: User; content: string; createdAt: string }[];
    createdAt: string;
}

export interface Message {
    _id: string;
    conversationId: string;
    sender: User;
    content: string;
    type: 'text' | 'image' | 'audio' | 'video' | 'gif' | 'system';
    mediaUrl: string;
    replyTo?: Message;
    reactions: { user: string; emoji: string }[];
    readBy: { user: string; readAt: string }[];
    deliveredTo: { user: string; deliveredAt: string }[];
    isDeletedForEveryone: boolean;
    createdAt: string;
}

export interface Conversation {
    _id: string;
    participants: User[];
    type: 'dm' | 'group';
    groupName: string;
    groupIcon: string;
    lastMessage?: Message;
    unreadCount: Record<string, number>;
    updatedAt: string;
}

export interface Community {
    _id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    banner: string;
    category: string;
    owner: User;
    moderators: User[];
    members: User[];
    memberCount: number;
    channels: Channel[];
    isPublic: boolean;
    tags: string[];
    rules: string[];
    featured: boolean;
    events: CommunityEvent[];
    isMember?: boolean;
    createdAt: string;
}

export interface Channel {
    _id: string;
    name: string;
    slug: string;
    description: string;
    type: 'text' | 'voice';
}

export interface CommunityEvent {
    _id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    going: string[];
    interested: string[];
    createdBy: string;
}

export interface Notification {
    _id: string;
    recipient: string;
    sender: User;
    type: string;
    referenceId: string;
    referenceModel: string;
    content: string;
    isRead: boolean;
    createdAt: string;
}

export interface Story {
    _id: string;
    author: User;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    caption: string;
    viewers: { user: string; viewedAt: string }[];
    expiresAt: string;
    createdAt: string;
}

export interface StoryGroup {
    user: User;
    stories: Story[];
    hasUnviewed: boolean;
}

export interface Stream {
    _id: string;
    streamer: User;
    title: string;
    category: string;
    thumbnail: string;
    isLive: boolean;
    viewerCount: number;
    totalViews: number;
    comments: { user: User; content: string; createdAt: string }[];
    allowComments: boolean;
    community?: Community;
    startedAt: string;
    endedAt?: string;
}

export interface MatchUser {
    _id: string;
    username: string;
    displayName: string;
    avatar: string;
    bio: string;
    gender: string;
    interests: string[];
    age?: number;
    isVerified: boolean;
    sharedInterests: string[];
}

export interface CallData {
    callId: string;
    type: 'voice' | 'video';
    caller?: User;
    callee?: User;
    status: 'ringing' | 'active' | 'ended' | 'declined';
    startedAt?: Date;
}
