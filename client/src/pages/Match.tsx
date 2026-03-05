import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { getSocket } from '../lib/socket';
import type { MatchUser } from '../types';
import Header from '../components/layout/Header';

export default function Match() {
    const { user } = useAuthStore();
    const [status, setStatus] = useState<'idle' | 'searching' | 'matched' | 'chatting'>('idle');
    const [genderFilter, setGenderFilter] = useState('anyone');
    const [matchByInterest, setMatchByInterest] = useState(false);
    const [matchedUser, setMatchedUser] = useState<MatchUser | null>(null);
    const [matchId, setMatchId] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [searchTime, setSearchTime] = useState(0);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        socket.on('match:found', (data) => {
            setMatchedUser(data.user);
            setMatchId(data.matchId);
            setSessionId(data.sessionId);
            setStatus('matched');
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        });

        socket.on('match:queued', (data) => {
            setSearchTime(data.estimatedWait);
        });

        socket.on('match:chat-message', (data) => {
            setMessages(prev => [...prev, data]);
        });

        socket.on('match:skipped', () => {
            setStatus('idle');
            setMatchedUser(null);
            setMessages([]);
        });

        socket.on('match:ended', () => {
            setStatus('idle');
            setMatchedUser(null);
            setMessages([]);
        });

        socket.on('match:typing', () => setIsTyping(true));

        return () => {
            socket.off('match:found');
            socket.off('match:queued');
            socket.off('match:chat-message');
            socket.off('match:skipped');
            socket.off('match:ended');
            socket.off('match:typing');
        };
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'searching') {
            interval = setInterval(() => setSearchTime(t => t + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [status]);

    useEffect(() => {
        if (isTyping) {
            const timer = setTimeout(() => setIsTyping(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isTyping]);

    const joinQueue = () => {
        const socket = getSocket();
        if (!socket) return;
        setStatus('searching');
        setSearchTime(0);
        socket.emit('match:join-queue', { genderFilter, matchByInterest });
    };

    const leaveQueue = () => {
        const socket = getSocket();
        if (!socket) return;
        setStatus('idle');
        socket.emit('match:leave-queue');
    };

    const startChat = () => {
        const socket = getSocket();
        if (!socket) return;
        setStatus('chatting');
        socket.emit('match:join-chat', { matchId });
    };

    const sendMessage = () => {
        if (!input.trim()) return;
        const socket = getSocket();
        if (!socket) return;
        socket.emit('match:chat-message', { matchId, content: input });
        setInput('');
    };

    const skipMatch = () => {
        const socket = getSocket();
        if (!socket) return;
        socket.emit('match:skip', { matchId, sessionId });
        setStatus('idle');
        setMatchedUser(null);
        setMessages([]);
    };

    const endSession = (rating?: string) => {
        const socket = getSocket();
        if (!socket) return;
        socket.emit('match:end-session', { matchId, sessionId, rating });
        setStatus('idle');
        setMatchedUser(null);
        setMessages([]);
    };

    return (
        <div style={{ paddingBottom: status === 'chatting' ? 0 : 90, minHeight: '100vh' }}>
            <Header title="Random Match" />

            <AnimatePresence mode="wait">
                {/* IDLE STATE */}
                {status === 'idle' && (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ padding: 16, textAlign: 'center' }}>
                        <motion.div
                            style={{ fontSize: 80, margin: '40px 0 20px' }}
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >🎲</motion.div>

                        <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Meet Someone New</h2>
                        <p style={{ color: 'var(--color-ios-gray)', fontSize: 15, marginBottom: 32 }}>
                            Connect with random people, make friends, or find gaming partners
                        </p>

                        {/* Gender Filter */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ios-gray)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                                Match Preference
                            </label>
                            <div className="ios-segment">
                                {[
                                    { value: 'anyone', label: 'Anyone' },
                                    { value: 'girls', label: 'Girls' },
                                    { value: 'boys', label: 'Boys' }
                                ].map(opt => (
                                    <button key={opt.value} className={`ios-segment-btn ${genderFilter === opt.value ? 'active' : ''}`}
                                        onClick={() => setGenderFilter(opt.value)}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Interest Toggle */}
                        <div className="ios-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', marginBottom: 32 }}>
                            <div>
                                <span style={{ fontWeight: 600, fontSize: 16 }}>Match by Interest</span>
                                <p style={{ fontSize: 13, color: 'var(--color-ios-gray)', margin: '2px 0 0' }}>Prioritize shared interests</p>
                            </div>
                            <div className={`ios-toggle ${matchByInterest ? 'active' : ''}`}
                                onClick={() => setMatchByInterest(!matchByInterest)} />
                        </div>

                        <motion.button
                            className="ios-btn ios-btn-primary ios-btn-full"
                            style={{ height: 54, fontSize: 18, borderRadius: 27 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={joinQueue}
                        >
                            🎲 Start Matching
                        </motion.button>
                    </motion.div>
                )}

                {/* SEARCHING STATE */}
                {status === 'searching' && (
                    <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ padding: 16, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 200px)' }}>

                        {/* Pulsing rings */}
                        <div style={{ position: 'relative', width: 160, height: 160, marginBottom: 30 }}>
                            {[1, 2, 3].map(i => (
                                <motion.div
                                    key={i}
                                    style={{
                                        position: 'absolute', inset: 0,
                                        border: '2px solid var(--color-ios-blue)',
                                        borderRadius: '50%', opacity: 0
                                    }}
                                    animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
                                />
                            ))}
                            <div style={{
                                position: 'absolute', inset: 30,
                                background: 'linear-gradient(135deg, #007AFF, #AF52DE)',
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40
                            }}>
                                🔍
                            </div>
                        </div>

                        <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Finding Someone...</h2>
                        <motion.p style={{ color: 'var(--color-ios-gray)', fontSize: 15, margin: '0 0 8px' }}
                            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
                            Searching for the perfect match
                        </motion.p>
                        <p style={{ color: 'var(--color-ios-gray2)', fontSize: 13 }}>
                            ⏱ {searchTime}s elapsed
                        </p>

                        <motion.button
                            className="ios-btn ios-btn-danger"
                            style={{ marginTop: 40, borderRadius: 22 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={leaveQueue}
                        >
                            Cancel
                        </motion.button>
                    </motion.div>
                )}

                {/* MATCHED STATE */}
                {status === 'matched' && matchedUser && (
                    <motion.div key="matched" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        style={{ padding: 16, textAlign: 'center' }}>

                        <motion.div initial={{ y: -20 }} animate={{ y: 0 }} transition={{ type: 'spring' }}
                            style={{ fontSize: 40, marginBottom: 8 }}>🎉</motion.div>
                        <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 20px', color: 'var(--color-ios-blue)' }}>Match Found!</h2>

                        {/* Profile Card */}
                        <motion.div className="ios-card" initial={{ y: 50 }} animate={{ y: 0 }}
                            style={{ padding: 24, marginBottom: 24, textAlign: 'center' }}>
                            <img src={matchedUser.avatar || `https://ui-avatars.com/api/?name=${matchedUser.displayName}&background=007AFF&color=fff&size=80`}
                                alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px', border: '3px solid var(--color-ios-blue)' }} />
                            <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>
                                {matchedUser.displayName}
                                {matchedUser.isVerified && <span style={{ color: 'var(--color-ios-blue)', marginLeft: 4 }}>✓</span>}
                            </h3>
                            <p style={{ color: 'var(--color-ios-gray)', fontSize: 14, margin: '0 0 12px' }}>
                                @{matchedUser.username} {matchedUser.age && `· ${matchedUser.age} years old`}
                            </p>
                            {matchedUser.bio && (
                                <p style={{ fontSize: 15, margin: '0 0 12px', lineHeight: 1.3 }}>{matchedUser.bio}</p>
                            )}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                                {matchedUser.interests?.map(i => (
                                    <span key={i} style={{
                                        padding: '4px 10px', borderRadius: 12, fontSize: 13, fontWeight: 500,
                                        background: matchedUser.sharedInterests?.includes(i) ? 'rgba(0,122,255,0.15)' : 'var(--color-ios-gray6)',
                                        color: matchedUser.sharedInterests?.includes(i) ? 'var(--color-ios-blue)' : 'var(--color-ios-gray)'
                                    }}>{i}</span>
                                ))}
                            </div>
                            {matchedUser.sharedInterests?.length > 0 && (
                                <p style={{ fontSize: 13, color: 'var(--color-ios-blue)', marginTop: 8, fontWeight: 500 }}>
                                    {matchedUser.sharedInterests.length} shared interest{matchedUser.sharedInterests.length > 1 ? 's' : ''}
                                </p>
                            )}
                        </motion.div>

                        {/* Action buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                            <motion.button className="ios-btn ios-btn-primary" style={{ padding: '14px' }}
                                whileTap={{ scale: 0.95 }} onClick={startChat}>
                                💬 Text Chat
                            </motion.button>
                            <motion.button className="ios-btn ios-btn-secondary" style={{ padding: '14px' }}
                                whileTap={{ scale: 0.95 }}>
                                📞 Voice Call
                            </motion.button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <motion.button className="ios-btn ios-btn-secondary" style={{ padding: '14px' }}
                                whileTap={{ scale: 0.95 }}>
                                📹 Video Chat
                            </motion.button>
                            <motion.button className="ios-btn ios-btn-danger" style={{ padding: '14px' }}
                                whileTap={{ scale: 0.95 }} onClick={skipMatch}>
                                ⏭ Skip
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* CHATTING STATE */}
                {status === 'chatting' && matchedUser && (
                    <motion.div key="chatting" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>

                        {/* Chat Header */}
                        <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '0.5px solid var(--color-ios-separator)' }}>
                            <img src={matchedUser.avatar || `https://ui-avatars.com/api/?name=${matchedUser.displayName}&size=36`}
                                alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                            <div style={{ flex: 1 }}>
                                <span style={{ fontWeight: 600, fontSize: 15 }}>{matchedUser.displayName}</span>
                                {isTyping && (
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        style={{ fontSize: 12, color: 'var(--color-ios-gray)', margin: 0 }}>typing...</motion.p>
                                )}
                            </div>
                            <motion.button className="ios-btn ios-btn-danger" style={{ fontSize: 13, padding: '6px 12px' }}
                                whileTap={{ scale: 0.95 }} onClick={() => endSession()}>
                                End
                            </motion.button>
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }} className="hide-scrollbar">
                            {messages.map((msg, idx) => (
                                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className={`chat-bubble ${msg.sender._id === user?._id ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
                                    {msg.content}
                                </motion.div>
                            ))}
                        </div>

                        {/* Input */}
                        <div style={{ display: 'flex', gap: 8, padding: '8px 16px 24px', background: 'var(--color-ios-card)', borderTop: '0.5px solid var(--color-ios-separator)' }}>
                            <input className="ios-input" placeholder="Type a message..." value={input}
                                onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                style={{ borderRadius: 20, fontSize: 16 }} />
                            <motion.button whileTap={{ scale: 0.9 }}
                                style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-ios-blue)', border: 'none', color: 'white', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={sendMessage}>
                                ↑
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
