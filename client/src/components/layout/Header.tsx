import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface HeaderProps {
    title: string;
    showBack?: boolean;
    rightAction?: React.ReactNode;
    transparent?: boolean;
}

export default function Header({ title, showBack, rightAction, transparent }: HeaderProps) {
    const navigate = useNavigate();

    return (
        <motion.header
            className={`safe-top ${transparent ? '' : 'glass-heavy'}`}
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px 8px',
                minHeight: 44,
                borderBottom: transparent ? 'none' : '0.5px solid var(--color-ios-separator)'
            }}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div style={{ width: 60, display: 'flex', alignItems: 'center' }}>
                {showBack && (
                    <motion.button
                        onClick={() => navigate(-1)}
                        whileTap={{ scale: 0.9 }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-ios-blue)',
                            fontSize: 17,
                            fontWeight: 400,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontFamily: 'var(--font-ios)',
                            padding: 0
                        }}
                    >
                        <span style={{ fontSize: 22 }}>‹</span> Back
                    </motion.button>
                )}
            </div>

            <h1 style={{
                fontSize: 17,
                fontWeight: 600,
                margin: 0,
                textAlign: 'center',
                flex: 1
            }}>
                {title}
            </h1>

            <div style={{ width: 60, display: 'flex', justifyContent: 'flex-end' }}>
                {rightAction}
            </div>
        </motion.header>
    );
}
