import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import Header from '../components/layout/Header';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Settings() {
    const { user, updateProfile, logout } = useAuthStore();
    const navigate = useNavigate();
    const [theme, setTheme] = useState(user?.settings?.theme || 'system');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        document.body.classList.remove('dark');
        if (newTheme === 'dark') document.body.classList.add('dark');
        else if (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) document.body.classList.add('dark');
        updateProfile({ settings: { ...user?.settings, theme: newTheme as any } } as any);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
        toast.success('Logged out');
    };

    const handleDeleteAccount = async () => {
        try {
            await api.delete('/auth/delete-account');
            await logout();
            navigate('/login');
            toast.success('Account deleted');
        } catch { toast.error('Failed to delete account'); }
    };

    const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <div style={{ marginBottom: 24 }}>
            <p style={{ padding: '0 16px 4px 32px', fontSize: 13, fontWeight: 600, color: 'var(--color-ios-gray)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {title}
            </p>
            <div className="ios-list-group">{children}</div>
        </div>
    );

    const Item = ({ icon, label, value, onClick, danger, toggle, toggleValue, onToggle }: any) => (
        <div className="ios-list-item" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            {icon && <span style={{ fontSize: 20, width: 30, textAlign: 'center' }}>{icon}</span>}
            <span style={{ flex: 1, fontSize: 16, color: danger ? 'var(--color-ios-red)' : undefined }}>{label}</span>
            {value && <span style={{ fontSize: 15, color: 'var(--color-ios-gray)' }}>{value}</span>}
            {toggle && <div className={`ios-toggle ${toggleValue ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onToggle?.(); }} />}
            {onClick && !toggle && <span style={{ color: 'var(--color-ios-gray3)', fontSize: 18 }}>›</span>}
        </div>
    );

    return (
        <div style={{ paddingBottom: 90 }}>
            <Header title="Settings" showBack />

            {/* Profile Preview */}
            <div style={{ textAlign: 'center', padding: '20px 16px 24px' }}>
                <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.displayName}&background=007AFF&color=fff&size=80`}
                    alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 8px' }} />
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 2px' }}>{user?.displayName}</h3>
                <p style={{ fontSize: 14, color: 'var(--color-ios-gray)', margin: 0 }}>@{user?.username}</p>
            </div>

            <Section title="Account">
                <Item icon="👤" label="Edit Profile" onClick={() => { }} />
                <Item icon="🔒" label="Change Password" onClick={() => { }} />
                <Item icon="📧" label="Email" value={user?.email} />
            </Section>

            <Section title="Privacy">
                <Item icon="💬" label="Who can message me" value="Everyone" onClick={() => { }} />
                <Item icon="📞" label="Who can call me" value="Everyone" onClick={() => { }} />
                <Item icon="👁" label="Show online status" toggle toggleValue={user?.settings?.showOnlineStatus !== false}
                    onToggle={() => updateProfile({ settings: { ...user?.settings, showOnlineStatus: !(user?.settings?.showOnlineStatus !== false) } } as any)} />
            </Section>

            <Section title="Appearance">
                <div style={{ padding: '8px 16px' }}>
                    <div className="ios-segment">
                        {['light', 'dark', 'system'].map(t => (
                            <button key={t} className={`ios-segment-btn ${theme === t ? 'active' : ''}`}
                                onClick={() => handleThemeChange(t)}>
                                {t === 'light' ? '☀️ Light' : t === 'dark' ? '🌙 Dark' : '📱 System'}
                            </button>
                        ))}
                    </div>
                </div>
            </Section>

            <Section title="Notifications">
                <Item icon="💬" label="Messages" toggle toggleValue={true} />
                <Item icon="📞" label="Calls" toggle toggleValue={true} />
                <Item icon="❤️" label="Likes" toggle toggleValue={true} />
                <Item icon="👤" label="New Followers" toggle toggleValue={true} />
                <Item icon="📡" label="Live Streams" toggle toggleValue={true} />
            </Section>

            <Section title="Blocked Users">
                <Item icon="🚫" label="Blocked Users" value="0" onClick={() => { }} />
            </Section>

            <Section title="About">
                <Item icon="ℹ️" label="App Version" value="1.0.0" />
                <Item icon="📄" label="Terms of Service" onClick={() => { }} />
                <Item icon="🔐" label="Privacy Policy" onClick={() => { }} />
            </Section>

            {/* Logout */}
            <div className="ios-list-group" style={{ marginBottom: 16 }}>
                <Item icon="🚪" label="Log Out" danger onClick={handleLogout} />
            </div>

            {/* Danger Zone */}
            <div className="ios-list-group" style={{ marginBottom: 40 }}>
                <Item icon="⚠️" label="Delete Account" danger onClick={() => setShowDeleteConfirm(true)} />
            </div>

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="action-sheet-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <motion.div className="action-sheet" initial={{ y: 100 }} animate={{ y: 0 }}
                        onClick={e => e.stopPropagation()}>
                        <div className="action-sheet-group">
                            <div style={{ padding: '16px', textAlign: 'center' }}>
                                <p style={{ fontSize: 13, color: 'var(--color-ios-gray)', margin: 0 }}>This will permanently delete your account and all data.</p>
                            </div>
                            <button className="action-sheet-btn destructive" onClick={handleDeleteAccount}>Delete Account</button>
                        </div>
                        <div className="action-sheet-group">
                            <button className="action-sheet-btn cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
