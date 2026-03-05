import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { getSocket } from '../lib/socket';
import api from '../services/api';
import type { Message } from '../types';
import Header from '../components/layout/Header';

function ConversationList() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { conversations, fetchConversations } = useChatStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConversations().finally(() => setLoading(false));
    }, []);

    const getOtherUser = (conv: any) => {
        return conv.participants?.find((p: any) => p._id !== user?._id) || conv.participants?.[0];
    };

    const timeAgo = (date: string) => {
        if (!date) return '';
        const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (s < 60) return 'now';
        if (s < 3600) return `${Math.floor(s / 60)}m`;
        if (s < 86400) return `${Math.floor(s / 3600)}h`;
        return `${Math.floor(s / 86400)}d`;
    };

    return (
        <div style={{ paddingBottom: 90 }}>
            <div className="safe-top glass-heavy" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '8px 16px 12px', borderBottom: '0.5px solid var(--color-ios-separator)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h1 style={{ fontSize: 34, fontWeight: 700, margin: 0 }}>Messages</h1>
                    <motion.button whileTap={{ scale: 0.9 }} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>
                        ✍️
                    </motion.button>
                </div>
            </div>

            {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '0.5px solid var(--color-ios-separator)' }}>
                        <div className="skeleton" style={{ width: 52, height: 52, borderRadius: '50%' }} />
                        <div style={{ flex: 1 }}>
                            <div className="skeleton" style={{ width: 120, height: 16, marginBottom: 6 }} />
                            <div className="skeleton" style={{ width: 200, height: 14 }} />
                        </div>
                    </div>
                ))
            ) : conversations.length > 0 ? (
                conversations.map(conv => {
                    const other = getOtherUser(conv);
                    const unread = conv.unreadCount?.[user?._id || ''] || 0;
                    return (
                        <motion.div key={conv._id} whileTap={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                            style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '0.5px solid var(--color-ios-separator)', cursor: 'pointer' }}
                            onClick={() => navigate(`/chat/${conv._id}`)}>
                            <div style={{ position: 'relative' }}>
                                <img src={other?.avatar || `https://ui-avatars.com/api/?name=${other?.displayName || 'U'}&background=007AFF&color=fff&size=52`}
                                    alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} />
                                {other?.isOnline && <div className="online-indicator" />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <span style={{ fontWeight: unread > 0 ? 700 : 600, fontSize: 16 }}>{conv.type === 'group' ? conv.groupName : other?.displayName}</span>
                                    <span style={{ fontSize: 13, color: 'var(--color-ios-gray)', flexShrink: 0 }}>{timeAgo(conv.updatedAt)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <p style={{
                                        fontSize: 14, color: unread > 0 ? '#000' : 'var(--color-ios-gray)',
                                        fontWeight: unread > 0 ? 500 : 400,
                                        margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260
                                    }}>
                                        {(conv.lastMessage as any)?.content || 'Start a conversation'}
                                    </p>
                                    {unread > 0 && <span className="badge" style={{ position: 'static' }}>{unread}</span>}
                                </div>
                            </div>
                        </motion.div>
                    );
                })
            ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <p style={{ fontSize: 48, marginBottom: 12 }}>💬</p>
                    <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px' }}>No Messages Yet</h3>
                    <p style={{ color: 'var(--color-ios-gray)', fontSize: 15 }}>Start a conversation with someone!</p>
                </div>
            )}
        </div>
    );
}

function ChatView() {
    const { conversationId } = useParams();
    const { user } = useAuthStore();
    const { messages, fetchMessages, addMessage } = useChatStore();
    const [input, setInput] = useState('');
    const [otherUser, setOtherUser] = useState<any>(null);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatMessages = messages[conversationId || ''] || [];

    useEffect(() => {
        if (conversationId) {
            fetchMessages(conversationId);
            loadConversation();

            const socket = getSocket();
            if (socket) {
                socket.emit('conversation:join', conversationId);
                socket.on('message:receive', (data) => {
                    if (data.conversationId === conversationId) {
                        addMessage(conversationId, data.message);
                    }
                });
                socket.on('user:typing', (data) => {
                    if (data.conversationId === conversationId) setIsTyping(true);
                });
                socket.on('user:stop-typing', (data) => {
                    if (data.conversationId === conversationId) setIsTyping(false);
                });
            }
        }
        return () => {
            const socket = getSocket();
            if (socket && conversationId) {
                socket.emit('conversation:leave', conversationId);
                socket.off('message:receive');
                socket.off('user:typing');
                socket.off('user:stop-typing');
            }
        };
    }, [conversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const loadConversation = async () => {
        try {
            const { data } = await api.get('/messages/conversations');
            const conv = data.conversations.find((c: any) => c._id === conversationId);
            if (conv) {
                const other = conv.participants.find((p: any) => p._id !== user?._id);
                setOtherUser(other);
            }
        } catch { }
    };

    const sendMessage = async () => {
        if (!input.trim() || !conversationId) return;
        try {
            const { data } = await api.post(`/messages/${conversationId}`, { content: input, type: 'text' });
            addMessage(conversationId, data.message);
            setInput('');
        } catch { }
    };

    const handleTyping = () => {
        const socket = getSocket();
        if (socket && conversationId) {
            socket.emit('user:typing', { conversationId });
            setTimeout(() => socket.emit('user:stop-typing', { conversationId }), 2000);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {/* Chat Header */}
            <div className="glass-heavy safe-top" style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
                borderBottom: '0.5px solid var(--color-ios-separator)', zIndex: 10
            }}>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => window.history.back()}
                    style={{ background: 'none', border: 'none', color: 'var(--color-ios-blue)', fontSize: 22, cursor: 'pointer', padding: '0 8px 0 0' }}>
                    ‹
                </motion.button>
                <div style={{ position: 'relative' }}>
                    <img src={otherUser?.avatar || `https://ui-avatars.com/api/?name=${otherUser?.displayName || 'U'}&size=36`}
                        alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                    {otherUser?.isOnline && <div className="online-indicator" style={{ width: 10, height: 10 }} />}
                </div>
                <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{otherUser?.displayName || 'Chat'}</span>
                    {isTyping ? (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ fontSize: 12, color: 'var(--color-ios-blue)', margin: 0 }}>typing...</motion.p>
                    ) : otherUser?.isOnline ? (
                        <p style={{ fontSize: 12, color: 'var(--color-ios-green)', margin: 0 }}>Online</p>
                    ) : null}
                </div>
                <motion.button whileTap={{ scale: 0.9 }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>📞</motion.button>
                <motion.button whileTap={{ scale: 0.9 }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>📹</motion.button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }} className="hide-scrollbar">
                {chatMessages.map((msg, idx) => {
                    const isSent = msg.sender?._id === user?._id || msg.sender === user?._id;
                    return (
                        <motion.div key={msg._id || idx} initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.2 }}
                            style={{ display: 'flex', justifyContent: isSent ? 'flex-end' : 'flex-start' }}>
                            <div className={`chat-bubble ${isSent ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
                                {msg.isDeletedForEveryone ? (
                                    <span style={{ fontStyle: 'italic', opacity: 0.6 }}>This message was deleted</span>
                                ) : msg.content}
                                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2, textAlign: 'right' }}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {isSent && (
                                        <span style={{ marginLeft: 4 }}>
                                            {msg.readBy?.length > 0 ? '✓✓' : msg.deliveredTo?.length > 0 ? '✓✓' : '✓'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
                {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '4px 0' }}>
                        <div className="chat-bubble chat-bubble-received" style={{ display: 'inline-block' }}>
                            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                •••
                            </motion.span>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
                display: 'flex', gap: 8, padding: '8px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)',
                background: 'var(--color-ios-card)', borderTop: '0.5px solid var(--color-ios-separator)'
            }}>
                <motion.button whileTap={{ scale: 0.9 }} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', padding: 0 }}>+</motion.button>
                <input className="ios-input" placeholder="iMessage" value={input}
                    onChange={e => { setInput(e.target.value); handleTyping(); }}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    style={{ borderRadius: 20, fontSize: 16, flex: 1 }} />
                {input.trim() ? (
                    <motion.button whileTap={{ scale: 0.85 }} onClick={sendMessage}
                        style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--color-ios-blue)', border: 'none', color: 'white', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        ↑
                    </motion.button>
                ) : (
                    <motion.button whileTap={{ scale: 0.9 }} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', padding: 0 }}>🎤</motion.button>
                )}
            </div>
        </div>
    );
}

export default function Chat() {
    const { conversationId } = useParams();
    return conversationId ? <ChatView /> : <ConversationList />;
}
