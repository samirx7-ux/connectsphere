import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import type { Notification } from '../types';
import Header from '../components/layout/Header';

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data.notifications);
        } catch { } finally { setLoading(false); }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch { }
    };

    const getIcon = (type: string) => {
        const icons: Record<string, string> = {
            follow: '👤', like: '❤️', comment: '💬', mention: '@',
            message: '✉️', friend_request: '🤝', community_invite: '🎮',
            live_stream: '📡', missed_call: '📞', lfg_accepted: '🎯'
        };
        return icons[type] || '🔔';
    };

    const timeAgo = (date: string) => {
        const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (s < 60) return 'just now';
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
        if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
        return new Date(date).toLocaleDateString();
    };

    const today = notifications.filter(n => Date.now() - new Date(n.createdAt).getTime() < 86400000);
    const earlier = notifications.filter(n => Date.now() - new Date(n.createdAt).getTime() >= 86400000);

    return (
        <div style={{ paddingBottom: 90 }}>
            <Header title="Notifications" rightAction={
                <motion.button whileTap={{ scale: 0.9 }} onClick={markAllRead}
                    style={{ background: 'none', border: 'none', color: 'var(--color-ios-blue)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ios)' }}>
                    Read All
                </motion.button>
            } />

            {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '0.5px solid var(--color-ios-separator)' }}>
                        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                        <div style={{ flex: 1 }}>
                            <div className="skeleton" style={{ width: 200, height: 14, marginBottom: 6 }} />
                            <div className="skeleton" style={{ width: 80, height: 12 }} />
                        </div>
                    </div>
                ))
            ) : notifications.length > 0 ? (
                <>
                    {today.length > 0 && (
                        <>
                            <p style={{ padding: '12px 16px 4px', fontSize: 13, fontWeight: 600, color: 'var(--color-ios-gray)', textTransform: 'uppercase' }}>Today</p>
                            {today.map(n => (
                                <motion.div key={n._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                    style={{
                                        display: 'flex', gap: 12, padding: '12px 16px',
                                        borderBottom: '0.5px solid var(--color-ios-separator)',
                                        background: n.isRead ? 'transparent' : 'rgba(0,122,255,0.04)'
                                    }}>
                                    <div style={{ position: 'relative' }}>
                                        <img src={n.sender?.avatar || `https://ui-avatars.com/api/?name=${n.sender?.displayName || 'U'}&size=44`}
                                            alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                                        <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 16, background: 'var(--color-ios-card)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {getIcon(n.type)}
                                        </span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 15, margin: 0, lineHeight: 1.35 }}>
                                            <strong>{n.sender?.displayName}</strong> {n.content}
                                        </p>
                                        <span style={{ fontSize: 13, color: 'var(--color-ios-gray)' }}>{timeAgo(n.createdAt)}</span>
                                    </div>
                                    {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-ios-blue)', alignSelf: 'center' }} />}
                                </motion.div>
                            ))}
                        </>
                    )}
                    {earlier.length > 0 && (
                        <>
                            <p style={{ padding: '16px 16px 4px', fontSize: 13, fontWeight: 600, color: 'var(--color-ios-gray)', textTransform: 'uppercase' }}>Earlier</p>
                            {earlier.map(n => (
                                <div key={n._id} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '0.5px solid var(--color-ios-separator)' }}>
                                    <img src={n.sender?.avatar || `https://ui-avatars.com/api/?name=${n.sender?.displayName || 'U'}&size=44`}
                                        alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 15, margin: 0, lineHeight: 1.35 }}>
                                            <strong>{n.sender?.displayName}</strong> {n.content}
                                        </p>
                                        <span style={{ fontSize: 13, color: 'var(--color-ios-gray)' }}>{timeAgo(n.createdAt)}</span>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                    <p style={{ fontSize: 48, marginBottom: 12 }}>🔔</p>
                    <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px' }}>All Caught Up!</h3>
                    <p style={{ color: 'var(--color-ios-gray)', fontSize: 15 }}>No new notifications</p>
                </div>
            )}
        </div>
    );
}
