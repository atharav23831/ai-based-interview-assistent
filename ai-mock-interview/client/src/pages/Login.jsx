import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Login failed. Please check your credentials.');
            login(data.token, data.user);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#090d16',
            backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.18), transparent 70%), radial-gradient(ellipse 50% 50% at 90% 80%, rgba(139, 92, 246, 0.1), transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1.5rem',
            boxSizing: 'border-box'
        }}>
            <div className="auth-container" style={{
                width: '100%',
                maxWidth: '1080px',
                display: 'grid',
                gridTemplateColumns: '1.1fr 0.9fr',
                gap: '3.5rem',
                alignItems: 'center'
            }}>
                {/* LEFT SIDE: Brand & Value Proposition */}
                <div className="auth-left-marketing" style={{ paddingRight: '1rem' }}>
                    {/* Brand Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '2rem' }}>
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            fontSize: '1.3rem',
                            boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
                        }}>
                            AI
                        </div>
                        <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.02em' }}>
                                AI Mock Interview
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: '600' }}>
                                Intelligent Interview Preparation Platform
                            </div>
                        </div>
                    </div>

                    <h1 style={{
                        fontSize: '2.6rem',
                        fontWeight: '800',
                        lineHeight: '1.2',
                        color: '#f8fafc',
                        letterSpacing: '-0.03em',
                        marginBottom: '1.25rem'
                    }}>
                        Practice smarter.<br />
                        <span style={{
                            background: 'linear-gradient(135deg, #38bdf8 0%, #a855f7 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            Interview with confidence.
                        </span>
                    </h1>

                    <p style={{
                        fontSize: '1.05rem',
                        color: '#94a3b8',
                        lineHeight: '1.6',
                        marginBottom: '2rem',
                        maxWidth: '480px'
                    }}>
                        Prepare for technical interviews with resume-grounded questions, real-time ML answer evaluation, and detailed performance insights.
                    </p>

                    {/* Features List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            'Resume-based interview questions tailored to your projects',
                            'AI-powered answer evaluation with instant scoring',
                            'Detailed performance reports and weakness analysis'
                        ].map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                    color: '#38bdf8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold'
                                }}>
                                    ✓
                                </div>
                                <span style={{ color: '#cbd5e1', fontSize: '0.95rem', fontWeight: '500' }}>
                                    {item}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT SIDE: Authentication Card */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '440px',
                        backgroundColor: 'rgba(17, 24, 39, 0.85)',
                        backdropFilter: 'blur(16px)',
                        borderRadius: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '2.5rem 2.25rem',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(59, 130, 246, 0.08)',
                        boxSizing: 'border-box'
                    }}>
                        <div style={{ marginBottom: '1.75rem' }}>
                            <h2 style={{ fontSize: '1.65rem', fontWeight: '700', color: '#f8fafc', margin: '0 0 0.4rem', letterSpacing: '-0.02em' }}>
                                Welcome back 👋
                            </h2>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                                Continue your interview preparation journey.
                            </p>
                        </div>

                        {error && (
                            <div style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '10px',
                                padding: '0.75rem 1rem',
                                color: '#f87171',
                                fontSize: '0.88rem',
                                marginBottom: '1.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.45rem' }}>
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    className="saas-input"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1' }}>
                                        Password
                                    </label>
                                    <span
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ fontSize: '0.78rem', color: '#38bdf8', cursor: 'pointer', userSelect: 'none' }}
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </span>
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="saas-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                style={{
                                    marginTop: '0.5rem',
                                    padding: '0.85rem',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 4px 18px rgba(59, 130, 246, 0.4)',
                                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isLoading) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 24px rgba(59, 130, 246, 0.5)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 18px rgba(59, 130, 246, 0.4)';
                                }}
                            >
                                {isLoading ? 'Signing In...' : '✨ Sign In'}
                            </button>
                        </form>

                        <div style={{
                            textAlign: 'center',
                            marginTop: '1.75rem',
                            paddingTop: '1.25rem',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            fontSize: '0.9rem',
                            color: '#94a3b8'
                        }}>
                            Don't have an account?{' '}
                            <Link to="/register" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '600' }}>
                                Create account →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
