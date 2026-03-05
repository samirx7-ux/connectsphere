import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const INTERESTS = ['Gaming', 'Music', 'Art', 'Sports', 'Tech', 'Travel', 'Fitness', 'Food', 'Movies', 'Photography', 'Reading', 'Fashion', 'Science', 'Nature', 'Comedy', 'Anime', 'Streaming'];

export default function Signup() {
    const navigate = useNavigate();
    const { signup } = useAuthStore();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        username: '', email: '', password: '', confirmPassword: '',
        displayName: '', gender: '', dateOfBirth: '', bio: '', interests: [] as string[]
    });

    const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

    const toggleInterest = (interest: string) => {
        setForm(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const handleSubmit = async () => {
        if (form.password !== form.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await signup(form);
            toast.success('Welcome to ConnectSphere! 🎉');
            navigate('/');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    const canProceed = () => {
        if (step === 1) return form.username && form.email && form.password && form.confirmPassword;
        if (step === 2) return form.gender && form.dateOfBirth;
        if (step === 3) return form.interests.length >= 2;
        return true;
    };

    return (
        <div className="min-h-screen" style={{ background: 'var(--color-ios-bg)' }}>
            <div className="safe-top" style={{ padding: '16px' }}>
                {/* Progress Bar */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
                    {[1, 2, 3].map(s => (
                        <motion.div
                            key={s}
                            style={{
                                flex: 1, height: 4, borderRadius: 2,
                                background: s <= step ? 'var(--color-ios-blue)' : 'var(--color-ios-gray4)'
                            }}
                            animate={{ background: s <= step ? '#007AFF' : '#D1D1D6' }}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h1 style={{ fontSize: 34, fontWeight: 700, margin: '0 0 8px' }}>Create Account</h1>
                            <p style={{ color: 'var(--color-ios-gray)', fontSize: 15, marginBottom: 32 }}>Join ConnectSphere and connect with amazing people</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <input className="ios-input" placeholder="Username" value={form.username}
                                    onChange={e => updateField('username', e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} />
                                <input className="ios-input" placeholder="Display Name" value={form.displayName}
                                    onChange={e => updateField('displayName', e.target.value)} />
                                <input className="ios-input" type="email" placeholder="Email" value={form.email}
                                    onChange={e => updateField('email', e.target.value)} />
                                <input className="ios-input" type="password" placeholder="Password" value={form.password}
                                    onChange={e => updateField('password', e.target.value)} />
                                <input className="ios-input" type="password" placeholder="Confirm Password" value={form.confirmPassword}
                                    onChange={e => updateField('confirmPassword', e.target.value)} />
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h1 style={{ fontSize: 34, fontWeight: 700, margin: '0 0 8px' }}>About You</h1>
                            <p style={{ color: 'var(--color-ios-gray)', fontSize: 15, marginBottom: 32 }}>Tell us a bit about yourself</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ios-gray)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8, paddingLeft: 4 }}>Gender</label>
                                    <div className="ios-segment">
                                        {['male', 'female', 'other'].map(g => (
                                            <button key={g} className={`ios-segment-btn ${form.gender === g ? 'active' : ''}`}
                                                onClick={() => updateField('gender', g)}>
                                                {g === 'male' ? '♂ Male' : g === 'female' ? '♀ Female' : '⚧ Other'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ios-gray)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8, paddingLeft: 4 }}>Date of Birth</label>
                                    <input className="ios-input" type="date" value={form.dateOfBirth}
                                        onChange={e => updateField('dateOfBirth', e.target.value)} />
                                    <p style={{ fontSize: 12, color: 'var(--color-ios-gray)', marginTop: 4, paddingLeft: 4 }}>You must be 18+ to use ConnectSphere</p>
                                </div>

                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ios-gray)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8, paddingLeft: 4 }}>Bio</label>
                                    <textarea className="ios-input" placeholder="Write something about yourself..."
                                        maxLength={150} value={form.bio} rows={3} style={{ resize: 'none' }}
                                        onChange={e => updateField('bio', e.target.value)} />
                                    <p style={{ fontSize: 12, color: 'var(--color-ios-gray)', textAlign: 'right', marginTop: 4 }}>{form.bio.length}/150</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h1 style={{ fontSize: 34, fontWeight: 700, margin: '0 0 8px' }}>Your Interests</h1>
                            <p style={{ color: 'var(--color-ios-gray)', fontSize: 15, marginBottom: 24 }}>Select at least 2 interests to find your people</p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {INTERESTS.map(interest => {
                                    const selected = form.interests.includes(interest);
                                    return (
                                        <motion.button
                                            key={interest}
                                            onClick={() => toggleInterest(interest)}
                                            whileTap={{ scale: 0.95 }}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: 20,
                                                border: 'none',
                                                fontSize: 14,
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                fontFamily: 'var(--font-ios)',
                                                background: selected ? 'var(--color-ios-blue)' : 'var(--color-ios-gray6)',
                                                color: selected ? 'white' : '#000',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {interest}
                                        </motion.button>
                                    );
                                })}
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--color-ios-gray)', marginTop: 12 }}>
                                {form.interests.length} selected
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div style={{ marginTop: 40, display: 'flex', gap: 12 }}>
                    {step > 1 && (
                        <motion.button
                            className="ios-btn ios-btn-secondary"
                            style={{ flex: 1 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setStep(s => s - 1)}
                        >
                            Back
                        </motion.button>
                    )}
                    <motion.button
                        className="ios-btn ios-btn-primary"
                        style={{ flex: 2, opacity: canProceed() ? 1 : 0.5 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={!canProceed() || loading}
                        onClick={() => step < 3 ? setStep(s => s + 1) : handleSubmit()}
                    >
                        {loading ? <span className="spinner" style={{ borderTopColor: 'white' }} /> : step < 3 ? 'Continue' : 'Create Account'}
                    </motion.button>
                </div>

                <p style={{ textAlign: 'center', marginTop: 24, fontSize: 15, color: 'var(--color-ios-gray)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--color-ios-blue)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
                </p>
            </div>
        </div>
    );
}
