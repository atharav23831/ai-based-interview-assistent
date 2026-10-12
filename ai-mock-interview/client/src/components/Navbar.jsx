import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => location.pathname === path;

    return (
        <nav style={{
            backgroundColor: 'rgba(9, 13, 22, 0.85)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '0.75rem 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
            <div style={{
                maxWidth: '1280px',
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                {/* Brand */}
                <div 
                    onClick={() => navigate('/dashboard')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        cursor: 'pointer',
                        userSelect: 'none'
                    }}
                >
                    <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '1.15rem',
                        boxShadow: '0 0 16px rgba(59, 130, 246, 0.4)'
                    }}>
                        AI
                    </div>
                    <div>
                        <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                            AI Mock Interview
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: '700' }}>
                            Intelligent Interview Platform
                        </div>
                    </div>
                </div>

                {/* Nav Links + Profile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Link to="/dashboard" style={{
                        color: isActive('/dashboard') ? '#38bdf8' : '#94a3b8',
                        textDecoration: 'none',
                        fontWeight: isActive('/dashboard') ? '600' : '500',
                        fontSize: '0.92rem',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '8px',
                        backgroundColor: isActive('/dashboard') ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                        border: isActive('/dashboard') ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid transparent',
                        transition: 'all 0.15s ease'
                    }}>
                        Dashboard
                    </Link>

                    <Link to="/history" style={{
                        color: isActive('/history') ? '#38bdf8' : '#94a3b8',
                        textDecoration: 'none',
                        fontWeight: isActive('/history') ? '600' : '500',
                        fontSize: '0.92rem',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '8px',
                        backgroundColor: isActive('/history') ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                        border: isActive('/history') ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid transparent',
                        transition: 'all 0.15s ease'
                    }}>
                        History
                    </Link>

                    {/* User Profile Badge */}
                    {user && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.35rem 0.85rem',
                            backgroundColor: 'rgba(30, 41, 59, 0.6)',
                            borderRadius: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}>
                            <div style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}>
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: '500' }}>
                                {user.name || user.email}
                            </span>
                        </div>
                    )}

                    {/* Logout Button */}
                    <button 
                        onClick={logout}
                        style={{
                            padding: '0.45rem 0.95rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.08)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.borderColor = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
