import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { formatScore, formatConfidence } from './Interview';

const API_URL = 'http://localhost:5000/api';

const qualityColors = {
    'Excellent': { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.3)' },
    'Good': { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' },
    'Average': { bg: 'rgba(234, 179, 8, 0.15)', text: '#facc15', border: 'rgba(234, 179, 8, 0.3)' },
    'Poor': { bg: 'rgba(249, 115, 22, 0.15)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.3)' },
    'Very Poor': { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' },
    'Not Attempted': { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' }
};

const difficultyColors = {
    'Easy': { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80' },
    'Medium': { bg: 'rgba(234, 179, 8, 0.15)', text: '#facc15' },
    'Hard': { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171' }
};

const InterviewHistory = () => {
    const navigate = useNavigate();

    const [interviews, setInterviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [roleFilter, setRoleFilter] = useState('All');
    const [difficultyFilter, setDifficultyFilter] = useState('All');

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/interview/history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.status === 401) { navigate('/login'); return; }
                if (!res.ok) throw new Error('Failed to load interview history');
                const data = await res.json();
                setInterviews(data.interviews || []);
                setStats(data.stats || null);
            } catch (err) {
                setError(err.message || 'Error fetching history.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [navigate]);

    // Unique roles for filter dropdown
    const availableRoles = ['All', ...new Set(interviews.map(i => i.role).filter(Boolean))];

    // Filtered list
    const filtered = interviews.filter(iv => {
        const matchRole = roleFilter === 'All' || iv.role === roleFilter;
        const matchDiff = difficultyFilter === 'All' || iv.difficulty === difficultyFilter;
        return matchRole && matchDiff;
    });

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0b0f19', color: '#f8fafc', paddingBottom: '4rem' }}>
            <Navbar />

            <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1.5rem' }}>
                {/* Header with Title & Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.02em' }}>
                                Interview History
                            </h1>
                            <span style={{
                                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                color: '#38bdf8',
                                padding: '0.2rem 0.65rem',
                                borderRadius: '12px',
                                fontSize: '0.82rem',
                                fontWeight: 'bold'
                            }}>
                                {interviews.length} Total
                            </span>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '0.92rem', margin: '0.4rem 0 0' }}>
                            Review your previous mock interview attempts and performance evaluations.
                        </p>
                    </div>

                    <button 
                        onClick={() => navigate('/dashboard')}
                        style={{
                            padding: '0.65rem 1.4rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.92rem',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                        }}
                    >
                        + New Interview
                    </button>
                </div>

                {/* Filter Controls */}
                <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>Role:</span>
                        <select 
                            value={roleFilter} 
                            onChange={(e) => setRoleFilter(e.target.value)}
                            style={{
                                backgroundColor: '#0f172a',
                                color: '#f8fafc',
                                border: '1px solid #334155',
                                borderRadius: '6px',
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.85rem',
                                outline: 'none'
                            }}
                        >
                            {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>Difficulty:</span>
                        <select 
                            value={difficultyFilter} 
                            onChange={(e) => setDifficultyFilter(e.target.value)}
                            style={{
                                backgroundColor: '#0f172a',
                                color: '#f8fafc',
                                border: '1px solid #334155',
                                borderRadius: '6px',
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.85rem',
                                outline: 'none'
                            }}
                        >
                            <option value="All">All Difficulties</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>

                    {(roleFilter !== 'All' || difficultyFilter !== 'All') && (
                        <button
                            onClick={() => { setRoleFilter('All'); setDifficultyFilter('All'); }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#38bdf8',
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Reset filters
                        </button>
                    )}
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>⏳</div>
                        <div>Loading your interview records...</div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && filtered.length === 0 && (
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '16px',
                        border: '1px dashed #334155',
                        padding: '3rem 1.5rem',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
                        <h3 style={{ margin: '0 0 0.5rem', color: '#f8fafc' }}>
                            {interviews.length === 0 ? 'Your interview journey starts here.' : 'No interviews match your filters.'}
                        </h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
                            {interviews.length === 0 
                                ? 'Practice mock technical interviews with instant AI evaluation and detailed scoring reports.'
                                : 'Try changing or clearing your role and difficulty filters.'}
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            style={{
                                padding: '0.75rem 1.75rem',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {interviews.length === 0 ? 'Start Your First Interview' : 'Go to Dashboard'}
                        </button>
                    </div>
                )}

                {/* Interviews List */}
                {!isLoading && !error && filtered.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filtered.map((iv) => {
                            const qStyle = qualityColors[iv.quality] || qualityColors['Not Attempted'];
                            const dStyle = difficultyColors[iv.difficulty] || difficultyColors['Medium'];
                            const isDone = iv.status === 'completed' || iv.questions_answered > 0;

                            return (
                                <div 
                                    key={iv.id}
                                    style={{
                                        backgroundColor: '#1e293b',
                                        borderRadius: '14px',
                                        border: '1px solid #334155',
                                        padding: '1.25rem 1.5rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '1rem',
                                        transition: 'transform 0.15s ease, border-color 0.15s ease',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#475569';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#334155';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    {/* Left Details */}
                                    <div style={{ minWidth: '220px' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                                            <span style={{
                                                backgroundColor: dStyle.bg,
                                                color: dStyle.text,
                                                padding: '0.15rem 0.5rem',
                                                borderRadius: '4px',
                                                fontSize: '0.72rem',
                                                fontWeight: 'bold'
                                            }}>
                                                {iv.difficulty}
                                            </span>
                                            <span style={{
                                                fontSize: '0.78rem',
                                                color: '#64748b'
                                            }}>
                                                {iv.started_at ? new Date(iv.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                                            </span>
                                            <span style={{
                                                backgroundColor: iv.status === 'completed' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                                                color: iv.status === 'completed' ? '#4ade80' : '#facc15',
                                                padding: '0.1rem 0.45rem',
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold'
                                            }}>
                                                {iv.status === 'completed' ? 'Completed' : 'Incomplete'}
                                            </span>
                                        </div>

                                        <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc' }}>
                                            {iv.role}
                                        </div>

                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                                            <span>Questions: <strong>{iv.questions_answered}</strong></span>
                                            {iv.avg_confidence != null && (
                                                <span>Confidence: <strong>{formatConfidence(iv.avg_confidence)}</strong></span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Middle Score Pill */}
                                    <div style={{ textAlign: 'center', minWidth: '120px' }}>
                                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
                                            Score
                                        </div>
                                        <div style={{ fontSize: '1.6rem', fontWeight: '800', color: iv.overall_score != null ? '#38bdf8' : '#64748b' }}>
                                            {iv.overall_score != null ? formatScore(iv.overall_score) : '—'}
                                            {iv.overall_score != null && <span style={{ fontSize: '0.85rem', color: '#64748b' }}> / 10</span>}
                                        </div>
                                        <div style={{
                                            display: 'inline-block',
                                            backgroundColor: qStyle.bg,
                                            color: qStyle.text,
                                            border: `1px solid ${qStyle.border}`,
                                            padding: '0.1rem 0.5rem',
                                            borderRadius: '8px',
                                            fontSize: '0.72rem',
                                            fontWeight: 'bold',
                                            marginTop: '0.2rem'
                                        }}>
                                            {iv.quality}
                                        </div>
                                    </div>

                                    {/* Right Action Button */}
                                    <div>
                                        {isDone ? (
                                            <button
                                                onClick={() => navigate(`/report/${iv.id}`)}
                                                style={{
                                                    padding: '0.55rem 1.25rem',
                                                    backgroundColor: '#0f172a',
                                                    color: '#38bdf8',
                                                    border: '1px solid #38bdf8',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    fontSize: '0.88rem',
                                                    transition: 'all 0.15s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#38bdf8';
                                                    e.currentTarget.style.color = '#0f172a';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#0f172a';
                                                    e.currentTarget.style.color = '#38bdf8';
                                                }}
                                            >
                                                View Report →
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => navigate(`/interview/${iv.id}`)}
                                                style={{
                                                    padding: '0.55rem 1.25rem',
                                                    backgroundColor: '#3b82f6',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    fontSize: '0.88rem'
                                                }}
                                            >
                                                Resume →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InterviewHistory;
