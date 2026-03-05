import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back! 👋');
            navigate('/');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-ios-bg)' }}>
            <div className="safe-top flex-1" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {/* Logo & Branding */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, type: 'spring' }}
                    style={{ textAlign: 'center', marginBottom: 48 }}
                >
                    <motion.div
                        style={{
                            width: 80, height: 80, borderRadius: 22,
                            background: 'linear-gradient(135deg, #007AFF 0%, #AF52DE 50%, #FF2D55 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px', fontSize: 36, color: 'white',
                            boxShadow: '0 8px 32px rgba(0, 122, 255, 0.3)'
                        }}
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                        🌐
                    </motion.div>
                    <h1 style={{ fontSize: 34, fontWeight: 700, margin: '0 0 4px', letterSpacing: -0.5 }}>ConnectSphere</h1>
                    <p style={{ color: 'var(--color-ios-gray)', fontSize: 15, margin: 0 }}>Connect. Play. Stream.</p>
                </motion.div>

                <motion.form
                    onSubmit={handleLogin}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                    <input
                        className="ios-input"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        autoComplete="email"
                        style={{ fontSize: 17 }}
                    />

                    <div style={{ position: 'relative' }}>
                        <input
                            className="ios-input"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="current-password"
                            style={{ fontSize: 17, paddingRight: 50 }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', color: 'var(--color-ios-blue)',
                                fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ios)'
                            }}
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>

                    <motion.button
                        type="submit"
                        className="ios-btn ios-btn-primary ios-btn-full"
                        style={{ height: 50, fontSize: 17, marginTop: 8 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="spinner" style={{ borderTopColor: 'white', width: 22, height: 22 }} />
                        ) : 'Sign In'}
                    </motion.button>
                </motion.form>

                <motion.button
                    className="ios-btn ios-btn-secondary ios-btn-full"
                    style={{ height: 50, fontSize: 17, marginTop: 12 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                        localStorage.setItem('demoMode', 'true');
                        window.location.href = '/';
                    }}
                >
                    Try Demo Mode 🚀
                </motion.button>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    style={{ textAlign: 'center', marginTop: 24 }}
                >
                    <p style={{ fontSize: 15, color: 'var(--color-ios-gray)' }}>
                        Don't have an account?{' '}
                        <Link to="/signup" style={{ color: 'var(--color-ios-blue)', textDecoration: 'none', fontWeight: 600 }}>
                            Sign Up
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
