import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import type { User, Community } from '../types';
import Header from '../components/layout/Header';

export default function Discover() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState('people');
    const [users, setUsers] = useState<User[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [suggested, setSuggested] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSuggested();
        loadCommunities();
    }, []);

    const loadSuggested = async () => {
        try {
            const { data } = await api.get('/users/suggested');
            setSuggested(data.users);
        } catch { }
    };

    const loadCommunities = async () => {
        try {
            const { data } = await api.get('/communities');
            setCommunities(data.communities);
        } catch { }
    };

    const handleSearch = async (value: string) => {
        setQuery(value);
        if (value.length < 2) { setUsers([]); return; }
        setLoading(true);
        try {
            if (activeTab === 'people') {
                const { data } = await api.get(`/users/search?q=${value}`);
                setUsers(data.users);
            } else {
                const { data } = await api.get(`/communities?search=${value}`);
                setCommunities(data.communities);
            }
        } catch { } finally { setLoading(false); }
    };

    const handleFollow = async (userId: string) => {
        try {
            const { data } = await api.post(`/users/${userId}/follow`);
            setSuggested(prev => prev.filter(u => u._id !== userId));
        } catch { }
    };

    return (
        <div style={{ paddingBottom: 90 }}>
            <div className="safe-top glass-heavy" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '8px 16px 12px', borderBottom: '0.5px solid var(--color-ios-separator)' }}>
                <h1 style={{ fontSize: 34, fontWeight: 700, margin: '0 0 12px' }}>Discover</h1>

                {/* Search bar */}
                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--color-ios-gray)' }}>🔍</span>
                    <input
                        className="ios-input"
                        placeholder="Search people, communities..."
                        value={query}
                        onChange={e => handleSearch(e.target.value)}
                        style={{ paddingLeft: 36, borderRadius: 10, background: 'rgba(118,118,128,0.12)', fontSize: 17 }}
                    />
                </div>

                {/* Tabs */}
                <div className="ios-segment" style={{ marginTop: 12 }}>
                    {['people', 'communities', 'tags'].map(tab => (
                        <button key={tab} className={`ios-segment-btn ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: 16 }}>
                {/* Search Results */}
                {query.length >= 2 && activeTab === 'people' && (
                    <div>
                        {users.map(u => (
                            <motion.div key={u._id} className="ios-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, marginBottom: 8, cursor: 'pointer' }}
                                onClick={() => navigate(`/user/${u.username}`)}>
                                <div style={{ position: 'relative' }}>
                                    <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.displayName}&background=007AFF&color=fff&size=44`}
                                        alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                                    {u.isOnline && <div className="online-indicator" />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ fontWeight: 600, fontSize: 16 }}>{u.displayName}</span>
                                        {u.isVerified && <span style={{ color: 'var(--color-ios-blue)', fontSize: 14 }}>✓</span>}
                                    </div>
                                    <span style={{ fontSize: 14, color: 'var(--color-ios-gray)' }}>@{u.username}</span>
                                    {u.bio && <p style={{ fontSize: 13, color: 'var(--color-ios-gray)', margin: '2px 0 0', lineHeight: 1.3 }}>{u.bio}</p>}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Suggested People */}
                {!query && activeTab === 'people' && (
                    <>
                        <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>People You Might Know</h3>
                        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }} className="hide-scrollbar">
                            {suggested.map(u => (
                                <motion.div key={u._id} className="ios-card" whileTap={{ scale: 0.97 }}
                                    style={{ minWidth: 150, padding: 16, textAlign: 'center' }}>
                                    <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.displayName}&background=007AFF&color=fff&size=60`}
                                        alt="" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 8px' }}
                                        onClick={() => navigate(`/user/${u.username}`)} />
                                    <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 2px' }}>{u.displayName}</p>
                                    <p style={{ fontSize: 12, color: 'var(--color-ios-gray)', margin: '0 0 8px' }}>@{u.username}</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginBottom: 8 }}>
                                        {u.interests?.slice(0, 3).map(i => (
                                            <span key={i} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 8, background: 'var(--color-ios-gray6)', color: 'var(--color-ios-gray)' }}>{i}</span>
                                        ))}
                                    </div>
                                    <motion.button className="ios-btn ios-btn-primary" style={{ fontSize: 13, padding: '6px 16px', width: '100%' }}
                                        whileTap={{ scale: 0.95 }} onClick={() => handleFollow(u._id)}>
                                        Follow
                                    </motion.button>
                                </motion.div>
                            ))}
                            {suggested.length === 0 && (
                                <p style={{ color: 'var(--color-ios-gray)', fontSize: 15, padding: 20 }}>No suggestions yet. Try searching!</p>
                            )}
                        </div>

                        {/* Trending */}
                        <h3 style={{ fontSize: 20, fontWeight: 700, margin: '24px 0 12px' }}>🔥 Trending Tags</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {['#gaming', '#esports', '#valorant', '#minecraft', '#fortnite', '#music', '#art', '#streaming'].map(tag => (
                                <motion.span key={tag} whileTap={{ scale: 0.95 }}
                                    style={{ padding: '8px 16px', borderRadius: 20, background: 'var(--color-ios-gray6)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                                    {tag}
                                </motion.span>
                            ))}
                        </div>
                    </>
                )}

                {/* Communities */}
                {activeTab === 'communities' && (
                    <>
                        <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>Communities</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {communities.map(c => (
                                <motion.div key={c._id} className="ios-card" whileTap={{ scale: 0.97 }}
                                    style={{ cursor: 'pointer', overflow: 'hidden' }}
                                    onClick={() => navigate(`/community/${c.slug}`)}>
                                    <div style={{
                                        height: 70, background: c.banner ? `url(${c.banner}) center/cover` : 'linear-gradient(135deg, #007AFF, #AF52DE)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {c.icon ? <img src={c.icon} alt="" style={{ width: 32, height: 32, borderRadius: 8 }} /> :
                                            <span style={{ fontSize: 28 }}>🎮</span>}
                                    </div>
                                    <div style={{ padding: '8px 10px' }}>
                                        <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                                        <p style={{ fontSize: 12, color: 'var(--color-ios-gray)', margin: 0 }}>{c.memberCount} members</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
