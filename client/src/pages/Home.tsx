import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { Post, StoryGroup, Stream } from '../types';
import Header from '../components/layout/Header';
import toast from 'react-hot-toast';

function StoryCircle({ group, onClick }: { group: StoryGroup; onClick: () => void }) {
    return (
        <motion.button onClick={onClick} whileTap={{ scale: 0.95 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', minWidth: 68 }}>
            <div className={`story-ring ${group.hasUnviewed ? '' : 'viewed'}`}>
                <img src={group.user.avatar || `https://ui-avatars.com/api/?name=${group.user.displayName}&background=007AFF&color=fff&size=64`}
                    alt="" style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid white', objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--color-ios-gray)', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {group.user.displayName}
            </span>
        </motion.button>
    );
}

function PostCard({ post, onReact, userId }: { post: Post; onReact: (id: string, reaction: string) => void; userId: string }) {
    const navigate = useNavigate();
    const [showComments, setShowComments] = useState(false);
    const [comment, setComment] = useState('');
    const [optimisticReactions, setOptimisticReactions] = useState(post.reactions);

    const timeAgo = (date: string) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    };

    const totalReactions = Object.values(optimisticReactions).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    const userReaction = Object.entries(optimisticReactions).find(([, users]) => Array.isArray(users) && users.includes(userId))?.[0];

    const handleReact = (reaction: string) => {
        setOptimisticReactions(prev => {
            const updated = { ...prev };
            // Remove user from all reactions first
            Object.keys(updated).forEach(key => {
                if (Array.isArray(updated[key as keyof typeof updated])) {
                    (updated as any)[key] = (updated as any)[key].filter((id: string) => id !== userId);
                }
            });
            // Add if not same
            if (reaction !== userReaction) {
                (updated as any)[reaction] = [...((updated as any)[reaction] || []), userId];
            }
            return updated;
        });
        onReact(post._id, reaction);
    };

    const handleComment = async () => {
        if (!comment.trim()) return;
        try {
            await api.post(`/posts/${post._id}/comment`, { content: comment });
            setComment('');
            toast.success('Comment added');
        } catch { toast.error('Failed to comment'); }
    };

    return (
        <motion.div
            className="ios-card"
            style={{ margin: '0 0 8px' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Post Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 8px' }}>
                <div style={{ position: 'relative', cursor: 'pointer' }}
                    onClick={() => navigate(`/user/${post.author.username}`)}>
                    <img src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.displayName}&background=007AFF&color=fff&size=40`}
                        alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                    {post.author.isOnline && <div className="online-indicator" style={{ width: 10, height: 10 }} />}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{post.author.displayName}</span>
                        {post.author.isVerified && <span style={{ color: 'var(--color-ios-blue)' }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--color-ios-gray)' }}>
                        @{post.author.username} · {timeAgo(post.createdAt)}
                    </span>
                </div>
                {post.flair && (
                    <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                        background: 'rgba(0,122,255,0.1)', color: 'var(--color-ios-blue)'
                    }}>{post.flair}</span>
                )}
            </div>

            {/* Content */}
            {post.content && (
                <p style={{ padding: '0 16px 8px', fontSize: 16, lineHeight: 1.4, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {post.content}
                </p>
            )}

            {/* Media */}
            {post.media && post.media.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                    {post.media.map((m, i) => (
                        m.type === 'image' ? (
                            <img key={i} src={m.url} alt="" style={{ width: '100%', maxHeight: 400, objectFit: 'cover' }} />
                        ) : (
                            <video key={i} src={m.url} controls style={{ width: '100%', maxHeight: 400 }} />
                        )
                    ))}
                </div>
            )}

            {/* Reactions Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px 8px', flexWrap: 'wrap' }}>
                {[
                    { key: 'like', emoji: '👍' }, { key: 'love', emoji: '❤️' }, { key: 'fire', emoji: '🔥' },
                    { key: 'laugh', emoji: '😂' }, { key: 'wow', emoji: '😮' }, { key: 'sad', emoji: '😢' }
                ].map(({ key, emoji }) => (
                    <motion.button
                        key={key}
                        whileTap={{ scale: 1.3 }}
                        onClick={() => handleReact(key)}
                        style={{
                            background: userReaction === key ? 'rgba(0,122,255,0.12)' : 'var(--color-ios-gray6)',
                            border: 'none', borderRadius: 20, padding: '4px 10px', fontSize: 16,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                        }}
                    >
                        {emoji}
                        {(optimisticReactions as any)[key]?.length > 0 && (
                            <span style={{ fontSize: 13, fontWeight: 500, color: userReaction === key ? 'var(--color-ios-blue)' : 'var(--color-ios-gray)' }}>
                                {(optimisticReactions as any)[key].length}
                            </span>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Action Bar */}
            <div style={{
                display: 'flex', alignItems: 'center', padding: '6px 16px 10px', gap: 20,
                borderTop: '0.5px solid var(--color-ios-separator)'
            }}>
                <button onClick={() => setShowComments(!showComments)}
                    style={{ background: 'none', border: 'none', fontSize: 14, color: 'var(--color-ios-gray)', cursor: 'pointer', fontFamily: 'var(--font-ios)' }}>
                    💬 {post.commentCount || post.comments?.length || 0}
                </button>
                <button style={{ background: 'none', border: 'none', fontSize: 14, color: 'var(--color-ios-gray)', cursor: 'pointer', fontFamily: 'var(--font-ios)' }}>
                    ↗️ Share
                </button>
                <button style={{ background: 'none', border: 'none', fontSize: 14, color: 'var(--color-ios-gray)', cursor: 'pointer', fontFamily: 'var(--font-ios)', marginLeft: 'auto' }}>
                    🔖 Save
                </button>
            </div>

            {/* Comments */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ borderTop: '0.5px solid var(--color-ios-separator)', overflow: 'hidden' }}
                    >
                        {post.comments?.slice(0, 3).map(c => (
                            <div key={c._id} style={{ padding: '8px 16px', display: 'flex', gap: 8 }}>
                                <img src={c.author?.avatar || `https://ui-avatars.com/api/?name=${c.author?.displayName}&size=28`}
                                    alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                                <div>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{c.author?.displayName}</span>
                                    <p style={{ fontSize: 14, margin: '2px 0 0', lineHeight: 1.3 }}>{c.content}</p>
                                </div>
                            </div>
                        ))}
                        <div style={{ display: 'flex', gap: 8, padding: '8px 16px 12px' }}>
                            <input className="ios-input" placeholder="Add a comment..." value={comment}
                                onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleComment()}
                                style={{ fontSize: 14, padding: '8px 12px' }} />
                            <motion.button whileTap={{ scale: 0.9 }} onClick={handleComment}
                                style={{ background: 'var(--color-ios-blue)', color: 'white', border: 'none', borderRadius: 20, padding: '0 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                                Post
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function LiveStreamCard({ stream }: { stream: Stream }) {
    const navigate = useNavigate();
    return (
        <motion.div whileTap={{ scale: 0.97 }} onClick={() => navigate(`/stream/${stream._id}`)}
            style={{ minWidth: 220, cursor: 'pointer', borderRadius: 12, overflow: 'hidden', background: 'var(--color-dark-card)', position: 'relative' }}>
            <div style={{ width: 220, height: 130, background: 'linear-gradient(135deg, #1a1a2e, #16213e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 40, opacity: 0.3 }}>📡</span>
            </div>
            <div style={{ position: 'absolute', top: 8, left: 8 }}>
                <span className="live-badge"><span className="live-dot"></span> LIVE</span>
            </div>
            <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>
                👁 {stream.viewerCount}
            </div>
            <div style={{ padding: '8px 10px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stream.title}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '2px 0 0' }}>{stream.streamer.displayName}</p>
            </div>
        </motion.div>
    );
}

function SkeletonPost() {
    return (
        <div className="ios-card" style={{ padding: 16, margin: '0 0 8px' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                <div>
                    <div className="skeleton" style={{ width: 120, height: 14, marginBottom: 6 }} />
                    <div className="skeleton" style={{ width: 80, height: 12 }} />
                </div>
            </div>
            <div className="skeleton" style={{ width: '100%', height: 14, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '80%', height: 14, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: '100%', height: 200 }} />
        </div>
    );
}

export default function Home() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Post[]>([]);
    const [stories, setStories] = useState<StoryGroup[]>([]);
    const [liveStreams, setLiveStreams] = useState<Stream[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchFeed = useCallback(async () => {
        try {
            const [postsRes, storiesRes, streamsRes] = await Promise.allSettled([
                api.get(`/posts?page=${page}`),
                api.get('/stories'),
                api.get('/streams')
            ]);

            if (postsRes.status === 'fulfilled') {
                if (page === 1) setPosts(postsRes.value.data.posts);
                else setPosts(prev => [...prev, ...postsRes.value.data.posts]);
                setHasMore(postsRes.value.data.hasMore);
            }
            if (storiesRes.status === 'fulfilled') setStories(storiesRes.value.data.storyGroups || []);
            if (streamsRes.status === 'fulfilled') setLiveStreams(streamsRes.value.data.streams || []);
        } catch { } finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchFeed(); }, [fetchFeed]);

    const handleReact = async (postId: string, reaction: string) => {
        try {
            await api.post(`/posts/${postId}/react`, { reaction });
        } catch { }
    };

    return (
        <div style={{ paddingBottom: 90 }}>
            <Header
                title="ConnectSphere"
                rightAction={
                    <div style={{ display: 'flex', gap: 12 }}>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/notifications')}
                            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', position: 'relative' }}>
                            🔔
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/chat')}
                            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>
                            💬
                        </motion.button>
                    </div>
                }
            />

            {/* Stories */}
            {stories.length > 0 && (
                <div className="hide-scrollbar" style={{
                    display: 'flex', gap: 12, padding: '12px 16px',
                    overflowX: 'auto', borderBottom: '0.5px solid var(--color-ios-separator)'
                }}>
                    {/* Add Story */}
                    <motion.button whileTap={{ scale: 0.95 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', minWidth: 68 }}>
                        <div style={{
                            width: 60, height: 60, borderRadius: '50%', border: '2px dashed var(--color-ios-gray3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'var(--color-ios-blue)'
                        }}>+</div>
                        <span style={{ fontSize: 11, color: 'var(--color-ios-blue)' }}>Add Story</span>
                    </motion.button>
                    {stories.map(group => (
                        <StoryCircle key={group.user._id} group={group} onClick={() => { }} />
                    ))}
                </div>
            )}

            {/* Live Streams */}
            {liveStreams.length > 0 && (
                <div style={{ padding: '12px 0' }}>
                    <h3 style={{ padding: '0 16px 8px', fontSize: 20, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="live-dot" style={{ background: 'var(--color-ios-red)' }} /> Live Now
                    </h3>
                    <div className="hide-scrollbar" style={{ display: 'flex', gap: 10, padding: '0 16px', overflowX: 'auto' }}>
                        {liveStreams.map(stream => (
                            <LiveStreamCard key={stream._id} stream={stream} />
                        ))}
                    </div>
                </div>
            )}

            {/* Create Post */}
            <div className="ios-card" style={{ margin: '8px 0', padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img
                        src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.displayName}&background=007AFF&color=fff&size=36`}
                        alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                    <div onClick={() => navigate('/create-post')}
                        style={{ flex: 1, padding: '10px 14px', borderRadius: 20, background: 'var(--color-ios-gray6)', color: 'var(--color-ios-gray)', fontSize: 15, cursor: 'pointer' }}>
                        What's on your mind?
                    </div>
                </div>
            </div>

            {/* Feed */}
            <div style={{ padding: '0 0' }}>
                {loading ? (
                    <>
                        <SkeletonPost />
                        <SkeletonPost />
                        <SkeletonPost />
                    </>
                ) : posts.length > 0 ? (
                    posts.map(post => (
                        <PostCard key={post._id} post={post} onReact={handleReact} userId={user?._id || ''} />
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{ fontSize: 64, marginBottom: 16 }}
                        >🌐</motion.div>
                        <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px' }}>Welcome to ConnectSphere!</h3>
                        <p style={{ color: 'var(--color-ios-gray)', fontSize: 15 }}>
                            Follow people and join communities to see posts here
                        </p>
                        <motion.button
                            className="ios-btn ios-btn-primary"
                            style={{ marginTop: 16 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/discover')}
                        >
                            Discover People
                        </motion.button>
                    </div>
                )}

                {hasMore && !loading && posts.length > 0 && (
                    <motion.button
                        className="ios-btn ios-btn-secondary ios-btn-full"
                        style={{ margin: '16px' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Load More
                    </motion.button>
                )}
            </div>
        </div>
    );
}
