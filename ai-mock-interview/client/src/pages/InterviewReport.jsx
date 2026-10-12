import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { formatScore, formatConfidence } from './Interview';

const API_URL = 'http://localhost:5000/api';

const getScoreColor = (score) => {
    const s = Number(score) || 0;
    if (s >= 7.0) return { stroke: '#10b981', text: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' };
    if (s >= 5.0) return { stroke: '#f59e0b', text: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' };
    return { stroke: '#ef4444', text: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
};

const getQualityStyle = (quality) => {
    switch (quality) {
        case 'Excellent':
            return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
        case 'Good':
            return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
        case 'Average':
            return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
        case 'Poor':
            return { bg: 'rgba(249, 115, 22, 0.15)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.3)' };
        case 'Very Poor':
            return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
        default:
            return { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
    }
};

const getDiffStyle = (diff) => {
    const d = (diff || '').toLowerCase();
    if (d === 'hard') return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
    if (d === 'easy') return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
    return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
};

const InterviewReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedQuestions, setExpandedQuestions] = useState({});

    const fetchReport = async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/interview/${id}/report`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) { navigate('/login'); return; }
            if (res.status === 403) {
                setError('You are not authorized to view this interview report.');
                setIsLoading(false);
                return;
            }
            if (!res.ok) throw new Error('Failed to load interview report.');
            const data = await res.json();
            setReport(data);
            // Default first question expanded
            if (data?.questions?.length > 0) {
                setExpandedQuestions({ [data.questions[0].questionNumber || 1]: true });
            }
        } catch (err) {
            setError(err.message || 'Error loading report.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [id, navigate]);

    const toggleQuestion = (qNum) => {
        setExpandedQuestions(prev => ({
            ...prev,
            [qNum]: !prev[qNum]
        }));
    };

    const expandAll = () => {
        const all = {};
        (report?.questions || []).forEach(q => {
            all[q.questionNumber] = true;
        });
        setExpandedQuestions(all);
    };

    const collapseAll = () => {
        setExpandedQuestions({});
    };

    // --- SKELETON LOADING STATE ---
    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main, #090d16)', color: '#f8fafc' }}>
                <Navbar />
                <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ width: '140px', height: '36px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }} className="animate-pulse" />
                        <div style={{ width: '120px', height: '24px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px' }} className="animate-pulse" />
                    </div>

                    {/* Header skeleton */}
                    <div style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px', padding: '2rem', marginBottom: '2rem' }}>
                        <div style={{ width: '260px', height: '28px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px', marginBottom: '1rem' }} className="animate-pulse" />
                        <div style={{ width: '380px', height: '18px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px' }} className="animate-pulse" />
                    </div>

                    {/* Executive Score Card Skeleton */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ height: '240px', backgroundColor: 'rgba(17, 24, 39, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px' }} className="animate-pulse" />
                        <div style={{ height: '240px', backgroundColor: 'rgba(17, 24, 39, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px' }} className="animate-pulse" />
                    </div>

                    {/* Topic performance skeleton */}
                    <div style={{ height: '180px', backgroundColor: 'rgba(17, 24, 39, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px', marginBottom: '2rem' }} className="animate-pulse" />

                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.95rem', marginTop: '2rem' }}>
                        Loading AI interview performance analysis...
                    </div>
                </div>
            </div>
        );
    }

    // --- ERROR STATE ---
    if (error || !report) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main, #090d16)', color: '#f8fafc' }}>
                <Navbar />
                <div style={{ maxWidth: '560px', margin: '4rem auto', padding: '2.5rem 2rem', backgroundColor: 'rgba(17, 24, 39, 0.85)', backdropFilter: 'blur(16px)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h3 style={{ color: '#f87171', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Unable to load interview report</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                        {error || 'The requested interview report could not be found or you do not have permission to view it.'}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button
                            onClick={fetchReport}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.95rem'
                            }}
                        >
                            Retry
                        </button>
                        <button
                            onClick={() => navigate('/history')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                color: '#e2e8f0',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.95rem'
                            }}
                        >
                            View History
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const { interview, summary, topicPerformance = [], strengths = [], improvements = [], questions = [] } = report;
    const overallScoreNum = Number(summary.overallScore) || 0;
    const scoreColor = getScoreColor(overallScoreNum);
    const qBadge = getQualityStyle(summary.overallQuality);
    const diffBadge = getDiffStyle(interview.difficulty);

    // SVG Circular Score Gauge values (radius = 70, circumference = 2 * π * 70 ≈ 439.82)
    const gaugeRadius = 70;
    const gaugeCircumference = 2 * Math.PI * gaugeRadius;
    const scorePercent = Math.min(100, Math.max(0, (overallScoreNum / 10) * 100));
    const strokeDashoffset = gaugeCircumference - (gaugeCircumference * scorePercent) / 100;

    const formattedDate = interview.started_at
        ? new Date(interview.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Recent Session';

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main, #090d16)', color: '#f8fafc', paddingBottom: '5rem' }}>
            <Navbar />

            <div style={{ maxWidth: '1240px', margin: '2rem auto', padding: '0 1.5rem' }}>
                {/* SUB-HEADER / NAVIGATION ACTION */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <button
                        onClick={() => navigate('/history')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#cbd5e1',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#f8fafc'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = '#cbd5e1'; }}
                    >
                        <span>←</span> Back to History
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                            fontSize: '0.75rem',
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: '#94a3b8',
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}>
                            Session #{interview.id}
                        </span>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: interview.status === 'completed' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: interview.status === 'completed' ? '#34d399' : '#fbbf24',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            border: interview.status === 'completed' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                        }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: interview.status === 'completed' ? '#34d399' : '#fbbf24' }} />
                            {interview.status === 'completed' ? 'Completed' : 'Ongoing'}
                        </span>
                    </div>
                </div>

                {/* REPORT HERO HEADER CARD */}
                <div style={{
                    backgroundColor: 'rgba(17, 24, 39, 0.75)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '2rem 2.25rem',
                    marginBottom: '2rem',
                    boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.5)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-60px',
                        right: '-60px',
                        width: '260px',
                        height: '260px',
                        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: '#818cf8',
                                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '6px'
                            }}>
                                AI Mock Interview
                            </span>
                            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>•</span>
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{formattedDate}</span>
                        </div>

                        <h1 style={{
                            margin: 0,
                            fontSize: '2rem',
                            fontWeight: 800,
                            letterSpacing: '-0.025em',
                            color: '#f8fafc'
                        }}>
                            AI Interview Performance Report
                        </h1>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            {/* Role Badge */}
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.35rem 0.85rem',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#f8fafc'
                            }}>
                                <span style={{ color: '#818cf8' }}>💼</span> Role: {interview.role}
                            </span>

                            {/* Difficulty Badge */}
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.35rem 0.85rem',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                backgroundColor: diffBadge.bg,
                                color: diffBadge.text,
                                border: `1px solid ${diffBadge.border}`
                            }}>
                                ⚡ Difficulty: {interview.difficulty}
                            </span>
                        </div>
                    </div>
                </div>

                {/* EXECUTIVE SCORE SECTION */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(280px, 340px) 1fr',
                    gap: '1.75rem',
                    marginBottom: '2rem',
                    alignItems: 'stretch'
                }} className="report-score-grid">
                    {/* Visual Score Ring Card */}
                    <div style={{
                        backgroundColor: 'rgba(17, 24, 39, 0.75)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        padding: '2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                    }}>
                        <div style={{ position: 'relative', width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                                {/* Background circle track */}
                                <circle
                                    cx="90"
                                    cy="90"
                                    r={gaugeRadius}
                                    fill="transparent"
                                    stroke="rgba(255, 255, 255, 0.08)"
                                    strokeWidth="12"
                                />
                                {/* Value progress ring */}
                                <circle
                                    cx="90"
                                    cy="90"
                                    r={gaugeRadius}
                                    fill="transparent"
                                    stroke={scoreColor.stroke}
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                    strokeDasharray={gaugeCircumference}
                                    strokeDashoffset={strokeDashoffset}
                                    style={{
                                        transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)'
                                    }}
                                />
                            </svg>

                            {/* Centered Score text */}
                            <div style={{ position: 'absolute', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                                    OVERALL SCORE
                                </span>
                                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.1, marginTop: '0.15rem' }}>
                                    {formatScore(summary.overallScore)}
                                </div>
                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                                    / 10
                                </span>
                            </div>
                        </div>

                        {/* Quality pill below gauge */}
                        <div style={{
                            marginTop: '1.25rem',
                            display: 'inline-block',
                            backgroundColor: qBadge.bg,
                            color: qBadge.text,
                            border: `1px solid ${qBadge.border}`,
                            padding: '0.35rem 1rem',
                            borderRadius: '9999px',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            letterSpacing: '0.02em'
                        }}>
                            {summary.overallQuality}
                        </div>
                    </div>

                    {/* Performance Overview & Metric Tiles */}
                    <div style={{
                        backgroundColor: 'rgba(17, 24, 39, 0.75)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        padding: '2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                    }}>
                        <div>
                            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                                Performance Overview
                            </h3>
                            <p style={{ margin: '0 0 1.75rem', color: '#94a3b8', fontSize: '0.98rem', lineHeight: 1.6 }}>
                                You completed <strong style={{ color: '#f8fafc' }}>{summary.questionsAttempted}</strong> technical interview questions with an average confidence of <strong style={{ color: '#38bdf8' }}>{formatConfidence(summary.averageConfidence)}</strong>.
                            </p>
                        </div>

                        {/* 3 Metric Cards Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                            gap: '1rem'
                        }}>
                            <div style={{
                                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '12px',
                                padding: '1.1rem',
                                textAlign: 'left'
                            }}>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Average Confidence</div>
                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.4rem' }}>
                                    {formatConfidence(summary.averageConfidence)}
                                </div>
                            </div>

                            <div style={{
                                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '12px',
                                padding: '1.1rem',
                                textAlign: 'left'
                            }}>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Questions Attempted</div>
                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.4rem' }}>
                                    {summary.questionsAttempted}
                                </div>
                            </div>

                            <div style={{
                                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '12px',
                                padding: '1.1rem',
                                textAlign: 'left'
                            }}>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Completion Status</div>
                                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#34d399', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <span>✓</span> Completed
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TOPIC PERFORMANCE SECTION */}
                {topicPerformance.length > 0 && (
                    <div style={{
                        backgroundColor: 'rgba(17, 24, 39, 0.75)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        padding: '1.75rem 2rem',
                        marginBottom: '2rem',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>📊</span>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc', fontWeight: 700 }}>
                                    Topic Performance
                                </h3>
                            </div>
                            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                                Evaluated across {topicPerformance.length} core subject areas
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {topicPerformance.map((tp, idx) => {
                                const scorePct = Math.min(100, Math.max(5, (tp.averageScore / 10) * 100));
                                const tpScore = Number(tp.averageScore) || 0;
                                const barColor = tpScore >= 7.0
                                    ? 'linear-gradient(90deg, #4f46e5 0%, #10b981 100%)'
                                    : tpScore >= 5.0
                                        ? 'linear-gradient(90deg, #4f46e5 0%, #f59e0b 100%)'
                                        : 'linear-gradient(90deg, #f97316 0%, #ef4444 100%)';

                                return (
                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ color: '#f8fafc', fontWeight: 600 }}>{tp.topic}</span>
                                                {tp.questionCount && (
                                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                        ({tp.questionCount} {tp.questionCount === 1 ? 'question' : 'questions'})
                                                    </span>
                                                )}
                                            </div>
                                            <span style={{ color: tpScore >= 7.0 ? '#34d399' : tpScore >= 5.0 ? '#fbbf24' : '#f87171', fontWeight: 700 }}>
                                                {formatScore(tp.averageScore)} <span style={{ color: '#64748b', fontWeight: 400 }}>/ 10</span>
                                            </span>
                                        </div>

                                        <div style={{
                                            width: '100%',
                                            height: '10px',
                                            backgroundColor: 'rgba(15, 23, 42, 0.85)',
                                            borderRadius: '9999px',
                                            overflow: 'hidden',
                                            border: '1px solid rgba(255, 255, 255, 0.05)'
                                        }}>
                                            <div style={{
                                                width: `${scorePct}%`,
                                                height: '100%',
                                                background: barColor,
                                                borderRadius: '9999px',
                                                transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* STRENGTHS & AREAS FOR IMPROVEMENT */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '1.75rem',
                    marginBottom: '2rem'
                }}>
                    {/* Strengths Card */}
                    <div style={{
                        backgroundColor: 'rgba(17, 24, 39, 0.75)',
                        backdropFilter: 'blur(16px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        padding: '1.75rem',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                            <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                color: '#34d399',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                                ✓
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#34d399', fontWeight: 700 }}>
                                Key Strengths
                            </h3>
                        </div>

                        {strengths.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {strengths.map((str, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.65rem',
                                        backgroundColor: 'rgba(16, 185, 129, 0.05)',
                                        border: '1px solid rgba(16, 185, 129, 0.18)',
                                        borderRadius: '8px',
                                        padding: '0.85rem 1rem',
                                        fontSize: '0.92rem',
                                        color: '#e2e8f0',
                                        lineHeight: 1.5
                                    }}>
                                        <span style={{ color: '#34d399', fontWeight: 700 }}>✓</span>
                                        <span>{str}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic', margin: 0 }}>
                                Complete additional technical questions to generate personalized strength patterns.
                            </p>
                        )}
                    </div>

                    {/* Areas for Improvement Card */}
                    <div style={{
                        backgroundColor: 'rgba(17, 24, 39, 0.75)',
                        backdropFilter: 'blur(16px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        padding: '1.75rem',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                            <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                color: '#fbbf24',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                border: '1px solid rgba(245, 158, 11, 0.3)'
                            }}>
                                ⚠
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fbbf24', fontWeight: 700 }}>
                                Areas for Improvement
                            </h3>
                        </div>

                        {improvements.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {improvements.map((imp, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.65rem',
                                        backgroundColor: 'rgba(245, 158, 11, 0.05)',
                                        border: '1px solid rgba(245, 158, 11, 0.18)',
                                        borderRadius: '8px',
                                        padding: '0.85rem 1rem',
                                        fontSize: '0.92rem',
                                        color: '#e2e8f0',
                                        lineHeight: 1.5
                                    }}>
                                        <span style={{ color: '#fbbf24', fontWeight: 700 }}>→</span>
                                        <span>{imp}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic', margin: 0 }}>
                                No critical gaps detected. Keep refining technical depth across complex scenarios.
                            </p>
                        )}
                    </div>
                </div>

                {/* QUESTION-BY-QUESTION ANALYSIS ACCORDION */}
                <div style={{
                    backgroundColor: 'rgba(17, 24, 39, 0.75)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '2rem',
                    marginBottom: '2.5rem',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', color: '#f8fafc', fontWeight: 700 }}>
                                Question-by-Question Analysis
                            </h3>
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                In-depth evaluation and ML model feedback per question
                            </span>
                        </div>

                        {questions.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={expandAll}
                                    style={{
                                        padding: '0.35rem 0.75rem',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#94a3b8',
                                        borderRadius: '6px',
                                        fontSize: '0.78rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Expand All
                                </button>
                                <button
                                    onClick={collapseAll}
                                    style={{
                                        padding: '0.35rem 0.75rem',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#94a3b8',
                                        borderRadius: '6px',
                                        fontSize: '0.78rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Collapse All
                                </button>
                            </div>
                        )}
                    </div>

                    {questions.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No question answers recorded for this interview session.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {questions.map((q) => {
                                const qQuality = getQualityStyle(q.quality);
                                const isExpanded = !!expandedQuestions[q.questionNumber];
                                const qDiff = getDiffStyle(q.difficulty);

                                return (
                                    <div
                                        key={q.questionNumber}
                                        style={{
                                            backgroundColor: 'rgba(10, 15, 29, 0.75)',
                                            border: isExpanded ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            transition: 'border-color 0.2s ease'
                                        }}
                                    >
                                        {/* Clickable Header Bar */}
                                        <div
                                            onClick={() => toggleQuestion(q.questionNumber)}
                                            style={{
                                                padding: '1rem 1.25rem',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                backgroundColor: isExpanded ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                                                userSelect: 'none',
                                                gap: '1rem'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                                                <span style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '6px',
                                                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                                    color: '#818cf8',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700,
                                                    flexShrink: 0
                                                }}>
                                                    Q{q.questionNumber}
                                                </span>

                                                <span style={{
                                                    fontSize: '0.95rem',
                                                    fontWeight: 600,
                                                    color: '#f8fafc',
                                                    whiteSpace: isExpanded ? 'normal' : 'nowrap',
                                                    overflow: isExpanded ? 'visible' : 'hidden',
                                                    textOverflow: isExpanded ? 'clip' : 'ellipsis'
                                                }}>
                                                    {q.question}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                                                {/* Topic */}
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    color: '#94a3b8',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                    padding: '0.2rem 0.55rem',
                                                    borderRadius: '4px'
                                                }}>
                                                    {q.topic}
                                                </span>

                                                {/* Quality pill */}
                                                <span style={{
                                                    backgroundColor: qQuality.bg,
                                                    color: qQuality.text,
                                                    border: `1px solid ${qQuality.border}`,
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700
                                                }}>
                                                    {q.quality}
                                                </span>

                                                {/* Score */}
                                                <span style={{
                                                    fontSize: '0.95rem',
                                                    fontWeight: 700,
                                                    color: '#f8fafc',
                                                    minWidth: '58px',
                                                    textAlign: 'right'
                                                }}>
                                                    {formatScore(q.score)} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/ 10</span>
                                                </span>

                                                {/* Chevron */}
                                                <span style={{
                                                    color: '#94a3b8',
                                                    fontSize: '0.85rem',
                                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.2s ease',
                                                    marginLeft: '0.25rem'
                                                }}>
                                                    ▼
                                                </span>
                                            </div>
                                        </div>

                                        {/* Expanded Body */}
                                        {isExpanded && (
                                            <div style={{
                                                padding: '1.25rem',
                                                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '1rem',
                                                backgroundColor: 'rgba(9, 13, 22, 0.5)'
                                            }}>
                                                {/* Full Question Text */}
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '0.35rem' }}>
                                                        Question Prompt
                                                    </div>
                                                    <div style={{ fontSize: '1.05rem', color: '#f8fafc', fontWeight: 500, lineHeight: 1.5 }}>
                                                        {q.question}
                                                    </div>
                                                </div>

                                                {/* Candidate Answer Box */}
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '0.35rem' }}>
                                                        Candidate Answer
                                                    </div>
                                                    <div style={{
                                                        backgroundColor: 'rgba(17, 24, 39, 0.8)',
                                                        borderRadius: '8px',
                                                        padding: '1rem',
                                                        fontSize: '0.92rem',
                                                        color: '#cbd5e1',
                                                        borderLeft: '3px solid #6366f1',
                                                        lineHeight: 1.6,
                                                        whiteSpace: 'pre-wrap'
                                                    }}>
                                                        {q.candidateAnswer || <em style={{ color: '#64748b' }}>No answer submitted</em>}
                                                    </div>
                                                </div>

                                                {/* Question Feedback Breakdown */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                                                            Evaluation Feedback
                                                        </div>
                                                        {q.confidence != null && (
                                                            <span style={{ fontSize: '0.78rem', color: '#38bdf8' }}>
                                                                Confidence: {formatConfidence(q.confidence)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {q.strengths?.length > 0 && (
                                                        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                                                            {q.strengths.map((s, idx) => (
                                                                <div key={idx} style={{ color: '#e2e8f0', display: 'flex', gap: '0.5rem', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: idx < q.strengths.length - 1 ? '0.35rem' : 0 }}>
                                                                    <span style={{ color: '#34d399', fontWeight: 700 }}>✓</span>
                                                                    <span>{s}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {q.improvements?.length > 0 && (
                                                        <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                                                            {q.improvements.map((imp, idx) => (
                                                                <div key={idx} style={{ color: '#e2e8f0', display: 'flex', gap: '0.5rem', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: idx < q.improvements.length - 1 ? '0.35rem' : 0 }}>
                                                                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>→</span>
                                                                    <span>{imp}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* BOTTOM REPORT ACTIONS */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '1.25rem',
                    flexWrap: 'wrap',
                    padding: '1.5rem 0'
                }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            padding: '0.9rem 2.25rem',
                            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '1rem',
                            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.45)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'transform 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <span>Start Next Interview</span>
                        <span style={{ fontSize: '1.1rem' }}>→</span>
                    </button>

                    <button
                        onClick={() => navigate('/history')}
                        style={{
                            padding: '0.9rem 2rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: '#f8fafc',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '1rem',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; }}
                    >
                        View Interview History
                    </button>
                </div>
            </div>

            <style>{`
                @media (max-width: 860px) {
                    .report-score-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default InterviewReport;
