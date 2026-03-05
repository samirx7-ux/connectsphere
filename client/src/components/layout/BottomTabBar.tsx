import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useState, useEffect } from 'react';

const tabs = [
    { path: '/', label: 'Home', icon: '🏠', iconOutline: '🏠' },
    { path: '/discover', label: 'Discover', icon: '🔍', iconOutline: '🔍' },
    { path: '/match', label: 'Match', icon: '🎲', iconOutline: '🎲', isCenter: true },
    { path: '/community', label: 'Community', icon: '🎮', iconOutline: '🎮' },
    { path: '/profile', label: 'Profile', icon: '👤', iconOutline: '👤' },
];

export default function BottomTabBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('/');

    useEffect(() => {
        const base = '/' + location.pathname.split('/')[1];
        const matched = tabs.find(t => t.path === base);
        if (matched) setActiveTab(matched.path);
    }, [location]);

    const handleTabClick = (path: string) => {
        setActiveTab(path);
        // Haptic feedback simulation
        if (navigator.vibrate) navigator.vibrate(10);
        navigate(path);
    };

    // Hide on auth pages and chat detail
    const hiddenPaths = ['/login', '/signup', '/chat/'];
    if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null;

    return (
        <div className="ios-tab-bar glass-heavy">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.path;

                if (tab.isCenter) {
                    return (
                        <div key={tab.path} className="tab-center">
                            <motion.button
                                className="tab-center-btn"
                                whileTap={{ scale: 0.85 }}
                                onClick={() => handleTabClick(tab.path)}
                            >
                                {tab.icon}
                            </motion.button>
                            <span style={{ fontSize: 10, color: isActive ? '#007AFF' : '#8E8E93', textAlign: 'center', display: 'block', marginTop: 2 }}>
                                {tab.label}
                            </span>
                        </div>
                    );
                }

                return (
                    <motion.button
                        key={tab.path}
                        className={`tab-item ${isActive ? 'active' : ''}`}
                        onClick={() => handleTabClick(tab.path)}
                        whileTap={{ scale: 0.9 }}
                    >
                        <motion.span
                            className="tab-icon"
                            animate={{ scale: isActive ? 1.1 : 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                            {isActive ? tab.icon : tab.iconOutline}
                        </motion.span>
                        <span>{tab.label}</span>
                    </motion.button>
                );
            })}
        </div>
    );
}
