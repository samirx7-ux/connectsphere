import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import type { Community } from '../types';
import Header from '../components/layout/Header';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'FPS', 'RPG', 'Battle Royale', 'Sports', 'Strategy', 'Mobile', 'Racing', 'Fighting', 'Sandbox'];

export default function CommunityHub() {
    const navigate = useNavigate();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [featured, setFeatured] = useState<Community[]>([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadCommunities(); }, [activeCategory]);

    const loadCommunities = async () => {
        setLoading(true);
        try {
            const params = activeCategory !== 'All' ? `?category=${activeCategory}` : '';
            const { data } = await api.get(`/communities${params}`);
            setCommunities(data.communities);
            setFeatured(data.communities.filter((c: Community) => c.featured));
        } catch { } finally { setLoading(false); }
    };

    const handleJoin = async (id: string) => {
        try {
            const { data } = await api.post(`/communities/${id}/join`);
            toast.success(data.action === 'joined' ? 'Joined community!' : 'Left community');
            loadCommunities();
        } catch { toast.error('Failed'); }
    };

    return (
        <div style={{ paddingBottom: 90 }}>
            <div className="safe-top glass-heavy" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '8px 16px 0', borderBottom: '0.5px solid var(--color-ios-separator)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h1 style={{ fontSize: 34, fontWeight: 700, margin: 0 }}>Communities</h1>
                    <motion.button className="ios-btn ios-btn-primary" style={{ fontSize: 13, padding: '6px 14px' }}
                        whileTap={{ scale: 0.95 }} onClick={() => navigate('/community/create')}>
                        + Create
                    </motion.button>
                </div>

                {/* Category scrollbar */}
                <div className="hide-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12 }}>
                    {CATEGORIES.map(cat => (
                        <motion.button key={cat} whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveCategory(cat)}
                            style={{
                                padding: '6px 14px', borderRadius: 16, border: 'none', fontSize: 13, fontWeight: 600,
                                background: activeCategory === cat ? 'var(--color-ios-blue)' : 'var(--color-ios-gray6)',
                                color: activeCategory === cat ? 'white' : '#000',
                                whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'var(--font-ios)'
                            }}>
                            {cat}
                        </motion.button>
                    ))}
                </div>
            </div>

            <div style={{ padding: 16 }}>
                {/* Featured */}
                {featured.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                            ⭐ Featured
                        </h3>
                        {featured.map(c => (
                            <motion.div key={c._id} className="ios-card" whileTap={{ scale: 0.98 }}
                                style={{ marginBottom: 10, cursor: 'pointer', overflow: 'hidden' }}
                                onClick={() => navigate(`/community/${c.slug}`)}>
                                <div style={{
                                    height: 100,
                                    background: c.banner ? `url(${c.banner}) center/cover` : 'linear-gradient(135deg, #007AFF 0%, #5856D6 50%, #AF52DE 100%)',
                                    position: 'relative'
                                }}>
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }} />
                                    <div style={{ position: 'absolute', bottom: 10, left: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                            {c.icon ? <img src={c.icon} alt="" style={{ width: 32, height: 32, borderRadius: 8 }} /> : '🎮'}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: 16, color: 'white', margin: 0 }}>{c.name}</p>
                                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{c.memberCount || 0} members · {c.category}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Community List */}
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>
                    {activeCategory === 'All' ? 'All Communities' : activeCategory}
                </h3>

                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="ios-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, marginBottom: 8 }}>
                            <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
                            <div style={{ flex: 1 }}>
                                <div className="skeleton" style={{ width: 140, height: 16, marginBottom: 6 }} />
                                <div className="skeleton" style={{ width: 100, height: 12 }} />
                            </div>
                        </div>
                    ))
                ) : communities.length > 0 ? (
                    communities.map(c => (
                        <motion.div key={c._id} className="ios-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, marginBottom: 8, cursor: 'pointer' }}
                            onClick={() => navigate(`/community/${c.slug}`)}>
                            <div style={{
                                width: 48, height: 48, borderRadius: 12,
                                background: c.icon ? `url(${c.icon}) center/cover` : 'linear-gradient(135deg, #007AFF, #AF52DE)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0
                            }}>
                                {!c.icon && '🎮'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontWeight: 600, fontSize: 16, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                                <p style={{ fontSize: 13, color: 'var(--color-ios-gray)', margin: '2px 0 0' }}>
                                    {c.memberCount || 0} members · {c.category}
                                </p>
                            </div>
                            <motion.button
                                className={`ios-btn ${c.isMember ? 'ios-btn-secondary' : 'ios-btn-primary'}`}
                                style={{ fontSize: 13, padding: '6px 12px' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); handleJoin(c._id); }}
                            >
                                {c.isMember ? 'Joined' : 'Join'}
                            </motion.button>
                        </motion.div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <p style={{ fontSize: 40, marginBottom: 12 }}>🎮</p>
                        <p style={{ color: 'var(--color-ios-gray)', fontSize: 15 }}>No communities found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
