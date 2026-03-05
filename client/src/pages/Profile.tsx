import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { User, Post } from '../types';
import Header from '../components/layout/Header';
import toast from 'react-hot-toast';

export default function Profile() {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, logout, updateProfile } = useAuthStore();
    const [profile, setProfile] = useState<User | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [activeTab, setActiveTab] = useState('posts');
    const [loading, setLoading] = useState(true);

    const isOwnProfile = !username || username === currentUser?.username;

    useEffect(() => {
        if (isOwnProfile) {
            setProfile(currentUser);
            loadPosts(currentUser?._id);
        } else {
            loadProfile();
        }
    }, [username, currentUser]);

    const loadProfile = async () => {
        try {
            const { data } = await api.get(`/users/${username}`);
            setProfile(data.user);
            loadPosts(data.user._id);
        } catch { toast.error('Profile not found'); }
    };

    const loadPosts = async (userId?: string) => {
        if (!userId) { setLoading(false); return; }
        try {
            const { data } = await api.get(`/posts?userId=${userId}`);
            setPosts(data.posts);
        } catch { } finally { setLoading(false); }
    };

    const handleFollow = async () => {
        if (!profile) return;
        try {
            const { data } = await api.post(`/users/${profile._id}/follow`);
            setProfile(prev => prev ? { ...prev, isFollowing: data.action === 'followed' } : null);
            toast.success(data.action === 'followed' ? 'Following!' : 'Unfollowed');
        } catch { }
    };

    const handleMessage = async () => {
        if (!profile) return;
        try {
            const { data } = await api.post('/messages/conversations', { participantId: profile._id });
            navigate(`/chat/${data.conversation._id}`);
        } catch { }
    };

    const timeAgo = (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    if (!profile) return (
        <div style={{ padding: 16 }}>
            <div className="skeleton" style={{ width: '100%', height: 200, borderRadius: 0 }} />
        </div>
    );

    return (
        <div style={{ paddingBottom: 90 }}>
            {!isOwnProfile && <Header title="" showBack transparent />}

            {/* Cover Photo */}
            <div style={{
                height: 180, position: 'relative',
                background: profile.coverPhoto ? `url(${profile.coverPhoto}) center/cover` : 'linear-gradient(135deg, #007AFF 0%, #5856D6 50%, #AF52DE 100%)'
            }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.5))' }} />
            </div>

            {/* Profile Info */}
            <div style={{ padding: '0 16px', position: 'relative' }}>
                {/* Avatar */}
                <div style={{ marginTop: -45, position: 'relative', display: 'inline-block' }}>
                    <img
                        src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.displayName}&background=007AFF&color=fff&size=90`}
                        alt="" style={{
                            width: 90, height: 90, borderRadius: '50%', border: '4px solid var(--color-ios-card)',
                            objectFit: 'cover', background: 'var(--color-ios-card)'
                        }} />
                    {profile.isOnline && (
                        <div className="online-indicator online-pulse" style={{ width: 16, height: 16, borderWidth: 3 }} />
                    )}
                </div>

                {/* Action Buttons */}
                {!isOwnProfile && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <motion.button
                            className={`ios-btn ${profile.isFollowing ? 'ios-btn-secondary' : 'ios-btn-primary'}`}
                            style={{ flex: 1 }} whileTap={{ scale: 0.95 }} onClick={handleFollow}
                        >
                            {profile.isFollowing ? 'Following' : 'Follow'}
                        </motion.button>
                        <motion.button className="ios-btn ios-btn-secondary" whileTap={{ scale: 0.95 }} onClick={handleMessage}>
                            💬
                        </motion.button>
                        <motion.button className="ios-btn ios-btn-secondary" whileTap={{ scale: 0.95 }}>
                            📞
                        </motion.button>
                    </div>
                )}

                {isOwnProfile && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <motion.button className="ios-btn ios-btn-secondary" style={{ flex: 1 }}
                            whileTap={{ scale: 0.95 }} onClick={() => navigate('/settings')}>
                            Edit Profile
                        </motion.button>
                        <motion.button className="ios-btn ios-btn-secondary" whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/settings')}>
                            ⚙️
                        </motion.button>
                    </div>
                )}

                {/* Name & Bio */}
                <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{profile.displayName}</h2>
                        {profile.isVerified && <span style={{ color: 'var(--color-ios-blue)', fontSize: 18 }}>✓</span>}
                    </div>
                    <p style={{ color: 'var(--color-ios-gray)', fontSize: 15, margin: '2px 0 0' }}>@{profile.username}</p>
                    {profile.bio && <p style={{ fontSize: 16, margin: '8px 0 0', lineHeight: 1.4 }}>{profile.bio}</p>}

                    <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                        {profile.location?.city && (
                            <span style={{ fontSize: 14, color: 'var(--color-ios-gray)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                📍 {profile.location.city}{profile.location.country ? `, ${profile.location.country}` : ''}
                            </span>
                        )}
                        <span style={{ fontSize: 14, color: 'var(--color-ios-gray)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            📅 Joined {timeAgo(profile.createdAt)}
                        </span>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
                        <div>
                            <span style={{ fontWeight: 700, fontSize: 18 }}>{profile.totalFollowers || profile.followers?.length || 0}</span>
                            <span style={{ color: 'var(--color-ios-gray)', fontSize: 14, marginLeft: 4 }}>Followers</span>
                        </div>
                        <div>
                            <span style={{ fontWeight: 700, fontSize: 18 }}>{profile.totalFollowing || profile.following?.length || 0}</span>
                            <span style={{ color: 'var(--color-ios-gray)', fontSize: 14, marginLeft: 4 }}>Following</span>
                        </div>
                        <div>
                            <span style={{ fontWeight: 700, fontSize: 18 }}>{posts.length}</span>
                            <span style={{ color: 'var(--color-ios-gray)', fontSize: 14, marginLeft: 4 }}>Posts</span>
                        </div>
                    </div>

                    {/* Interests */}
                    {profile.interests && profile.interests.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                            {profile.interests.map(i => (
                                <span key={i} style={{
                                    padding: '4px 10px', borderRadius: 12, fontSize: 13, fontWeight: 500,
                                    background: 'rgba(0,122,255,0.1)', color: 'var(--color-ios-blue)'
                                }}>{i}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="ios-segment" style={{ margin: '20px 16px 0' }}>
                {['posts', 'media', 'about'].map(tab => (
                    <button key={tab} className={`ios-segment-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ padding: '12px 0' }}>
                {activeTab === 'posts' && (
                    posts.length > 0 ? (
                        posts.map(post => (
                            <div key={post._id} className="ios-card" style={{ margin: '0 0 8px', padding: '12px 16px' }}>
                                <p style={{ fontSize: 16, lineHeight: 1.4, margin: '0 0 8px' }}>{post.content}</p>
                                {post.media?.length > 0 && (
                                    <img src={post.media[0].url} alt="" style={{ width: '100%', borderRadius: 12, maxHeight: 300, objectFit: 'cover' }} />
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, color: 'var(--color-ios-gray)', fontSize: 13 }}>
                                    <span>❤️ {post.totalReactions || 0}</span>
                                    <span>💬 {post.commentCount || 0}</span>
                                    <span style={{ marginLeft: 'auto' }}>{new Date(post.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ textAlign: 'center', padding: 40, color: 'var(--color-ios-gray)' }}>No posts yet</p>
                    )
                )}

                {activeTab === 'about' && (
                    <div className="ios-list-group" style={{ margin: '0 16px' }}>
                        {profile.gender && (
                            <div className="ios-list-item">
                                <span style={{ fontSize: 20 }}>🧑</span>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: 13, color: 'var(--color-ios-gray)' }}>Gender</span>
                                    <p style={{ margin: 0, fontSize: 16, fontWeight: 500, textTransform: 'capitalize' }}>{profile.gender}</p>
                                </div>
                            </div>
                        )}
                        {profile.age && (
                            <div className="ios-list-item">
                                <span style={{ fontSize: 20 }}>🎂</span>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: 13, color: 'var(--color-ios-gray)' }}>Age</span>
                                    <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>{profile.age} years old</p>
                                </div>
                            </div>
                        )}
                        {profile.gamerTag && (
                            <div className="ios-list-item">
                                <span style={{ fontSize: 20 }}>🎮</span>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: 13, color: 'var(--color-ios-gray)' }}>Gamer Tag</span>
                                    <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>{profile.gamerTag}</p>
                                </div>
                            </div>
                        )}
                        {profile.favoriteGames?.length > 0 && (
                            <div className="ios-list-item">
                                <span style={{ fontSize: 20 }}>🕹️</span>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: 13, color: 'var(--color-ios-gray)' }}>Favorite Games</span>
                                    <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>{profile.favoriteGames.join(', ')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
