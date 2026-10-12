import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ScoreProgressionChart from '../components/ScoreProgressionChart';
import { formatScore } from './Interview';

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
    'Easy': { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.3)' },
    'Medium': { bg: 'rgba(234, 179, 8, 0.15)', text: '#facc15', border: 'rgba(234, 179, 8, 0.3)' },
    'Hard': { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' }
};

const QUICK_START_ROLES = [
    {
        title: 'Software Engineer',
        icon: '💻',
        desc: 'Core coding, backend logic, algorithms, and system design',
        defaultDiff: 'Medium'
    },
    {
        title: 'Full Stack Developer',
        icon: '🌐',
        desc: 'React, Node.js, REST APIs, and end-to-end web architecture',
        defaultDiff: 'Medium'
    },
    {
        title: 'Data Scientist',
        icon: '🧠',
        desc: 'Machine learning, Python pipelines, and predictive analytics',
        defaultDiff: 'Medium'
    },
    {
        title: 'IoT Engineer',
        icon: '📡',
        desc: 'ESP32, wireless telemetry, sensor networks, and edge computing',
        defaultDiff: 'Hard'
    }
];

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const setupRef = useRef(null);

    // Time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // Dashboard Data State
    const [historyData, setHistoryData] = useState({ interviews: [], stats: null });
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Interview Setup State
    const [role, setRole] = useState('Software Engineer');
    const [difficulty, setDifficulty] = useState('Medium');
    const [isStarting, setIsStarting] = useState(false);

    // Resume Upload State
    const [resumeFile, setResumeFile] = useState(null);
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [resumeUploading, setResumeUploading] = useState(false);
    const [resumeStatus, setResumeStatus] = useState('');
    const [resumeMessage, setResumeMessage] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoadingData(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/interview/history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.status === 401) { navigate('/login'); return; }
                if (res.ok) {
                    const data = await res.json();
                    setHistoryData(data);
                }
            } catch (err) {
                console.error('Error fetching dashboard history:', err);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    const handleStartInterview = async (customRole, customDiff) => {
        setIsStarting(true);
        try {
            const token = localStorage.getItem('token');
            const targetRole = customRole || role;
            const targetDiff = customDiff || difficulty;

            const res = await fetch(`${API_URL}/interview/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ role: targetRole, difficulty: targetDiff })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to start interview');
            navigate(`/interview/${data.id}`, { state: { role: targetRole, difficulty: targetDiff } });
        } catch (error) {
            alert('Failed to start interview. ' + error.message);
        } finally {
            setIsStarting(false);
        }
    };

    const handleResumeUpload = async (fileToUpload) => {
        const file = fileToUpload || resumeFile;
        if (!file) return;
        setResumeUploading(true);
        setResumeStatus('');
        setResumeMessage('');
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`${API_URL}/resume/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            setResumeStatus('success');
            setUploadedFileName(data.resume?.file_name || file.name);
            setResumeMessage(`Resume ready for personalized questions.`);
            setResumeFile(null);
        } catch (err) {
            setResumeStatus('error');
            setResumeMessage(err.message);
        } finally {
            setResumeUploading(false);
        }
    };

    const stats = historyData.stats || {
        totalInterviews: 0,
        completedInterviews: 0,
        averageScore: 0,
        bestScore: 0,
        totalQuestionsAnswered: 0,
        progression: []
    };

    const recentInterviews = historyData.interviews.slice(0, 4);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', paddingBottom: '5rem' }}>
            <Navbar />

            <div style={{ maxWidth: '1260px', margin: '2rem auto', padding: '0 1.5rem', boxSizing: 'border-box' }}>
                
                {/* 1. HERO / GREETING SECTION */}
                <div className="animate-slide-up" style={{
                    backgroundColor: 'rgba(17, 24, 39, 0.85)',
                    backdropFilter: 'blur(16px)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '2.5rem',
                    marginBottom: '2.5rem',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '2rem'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-60px',
                        right: '-60px',
                        width: '320px',
                        height: '320px',
                        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, rgba(139, 92, 246, 0.08) 50%, transparent 70%)',
                        pointerEvents: 'none'
                    }} />

                    <div style={{ maxWidth: '650px', position: 'relative', zIndex: 1 }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: 'rgba(56, 189, 248, 0.1)',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            color: '#38bdf8',
                            fontWeight: '700',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            marginBottom: '0.75rem'
                        }}>
                            <span>●</span> AI Preparation Dashboard
                        </div>

                        <h1 style={{ fontSize: '2.4rem', fontWeight: '800', margin: '0 0 0.6rem', color: '#f8fafc', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                            {getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Candidate'} 👋
                        </h1>

                        <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0, lineHeight: '1.6' }}>
                            {stats.completedInterviews > 0
                                ? `Welcome back! You have completed ${stats.completedInterviews} interview sessions with a peak score of ${formatScore(stats.bestScore)} / 10. Keep honing your technical edge.`
                                : 'Ready to sharpen your interview skills? Practice personalized technical questions with real-time ML evaluation.'}
                        </p>
                    </div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <button
                            onClick={() => setupRef.current?.scrollIntoView({ behavior: 'smooth' })}
                            style={{
                                padding: '1rem 2.2rem',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '1.05rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 6px 24px rgba(59, 130, 246, 0.45)',
                                transition: 'all 0.2s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.6rem'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 30px rgba(59, 130, 246, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 6px 24px rgba(59, 130, 246, 0.45)';
                            }}
                        >
                            <span>✨</span> Start New Interview
                        </button>
                    </div>
                </div>

                {/* 2. STATISTICS CARDS (4 METRICS) */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '2.5rem'
                }}>
                    {/* Card 1: Completed */}
                    <div style={{
                        backgroundColor: 'rgba(17, 24, 39, 0.85)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '1.5rem',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                                <div style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '10px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.2rem'
                                }}>
                                    🎯
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                                    Completed
                                </span>
                            </div>
                            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#f8fafc', lineHeight: '1.1' }}>
                                {stats.completedInterviews}
                            </div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.6rem' }}>
                            {stats.totalInterviews} total sessions attempted
                        </div>
                    </div>

                    {/* Card 2: Average Score */}
                    <div style={{
                        backgroundColor: 'rgba(17, 24, 39, 0.85)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '1.5rem',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                                <div style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '10px',
                                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.2rem'
                                }}>
                                    ⭐
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                                    Average Score
                                </span>
                            </div>
                            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#38bdf8', lineHeight: '1.1' }}>
                                {formatScore(stats.averageScore)} <span style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 'normal' }}>/ 10</span>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.6rem' }}>
                            Mean evaluation across rounds
                        </div>
                    </div>

                    {/* Card 3: Best Score */}
                    <div style={{
                        backgroundColor: 'rgba(17, 24, 39, 0.85)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '1.5rem',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.4)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                                <div style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '10px',
                                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.2rem'
                                }}>
                                    🏆
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                                    Best Score
                                </span>
                            </div>
                            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#4ade80', lineHeight: '1.1' }}>
                                {formatScore(stats.bestScore)} <span style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 'normal' }}>/ 10</span>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.6rem' }}>
                            Highest performance level so far
                        </div>
                    </div>

                    {/* Card 4: Questions Answered */}
                    <div style={{
                        backgroundColor: 'rgba(17, 24, 39, 0.85)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '1.5rem',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                                <div style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '10px',
                                    backgroundColor: 'rgba(168, 85, 247, 0.12)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.2rem'
                                }}>
                                    💡
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                                    Questions Answered
                                </span>
                            </div>
                            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#c084fc', lineHeight: '1.1' }}>
                                {stats.totalQuestionsAnswered}
                            </div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.6rem' }}>
                            Evaluated technical questions
                        </div>
                    </div>
                </div>

                {/* 3. PERFORMANCE SCORE PROGRESSION SECTION */}
                <div style={{ marginBottom: '2.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
                                📈 Performance Progression
                            </h2>
                            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0.2rem 0 0' }}>
                                Visual trajectory across historical interview attempts
                            </p>
                        </div>
                    </div>
                    <ScoreProgressionChart progression={stats.progression} />
                </div>

                {/* 4. QUICK START PRACTICE SECTION */}
                <div style={{ marginBottom: '2.75rem' }}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f8fafc', margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
                            ⚡ Quick Start Practice
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
                            Choose an industry standard role track to launch an instant tailored session
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '1.25rem'
                    }}>
                        {QUICK_START_ROLES.map((qr) => (
                            <div
                                key={qr.title}
                                onClick={() => handleStartInterview(qr.title, qr.defaultDiff)}
                                style={{
                                    backgroundColor: 'rgba(17, 24, 39, 0.85)',
                                    backdropFilter: 'blur(12px)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    padding: '1.5rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                                    e.currentTarget.style.backgroundColor = 'rgba(22, 32, 51, 0.9)';
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.2)';
                                    const arrow = e.currentTarget.querySelector('.role-arrow');
                                    if (arrow) arrow.style.transform = 'translateX(4px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                    e.currentTarget.style.backgroundColor = 'rgba(17, 24, 39, 0.85)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';
                                    const arrow = e.currentTarget.querySelector('.role-arrow');
                                    if (arrow) arrow.style.transform = 'translateX(0)';
                                }}
                            >
                                <div>
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '12px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.4rem',
                                        marginBottom: '1rem'
                                    }}>
                                        {qr.icon}
                                    </div>
                                    <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.45rem' }}>
                                        {qr.title}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                                        {qr.desc}
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    paddingTop: '0.85rem',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                    fontSize: '0.82rem'
                                }}>
                                    <span style={{
                                        backgroundColor: difficultyColors[qr.defaultDiff].bg,
                                        color: difficultyColors[qr.defaultDiff].text,
                                        border: `1px solid ${difficultyColors[qr.defaultDiff].border}`,
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '6px',
                                        fontWeight: '700'
                                    }}>
                                        {qr.defaultDiff}
                                    </span>
                                    <span className="role-arrow" style={{ color: '#38bdf8', fontWeight: 'bold', transition: 'transform 0.2s ease', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        Practice Track →
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5. INTERVIEW CONFIGURATION & RESUME PERSONALIZATION (2 Columns) */}
                <div ref={setupRef} style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2.75rem'
                }}>
                    {/* Custom Setup Card */}
                    <div style={{
                        backgroundColor: 'rgba(17, 24, 39, 0.85)',
                        backdropFilter: 'blur(16px)',
                        borderRadius: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '2rem',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '1.3rem' }}>🎯</span>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: '700' }}>
                                    Custom Interview Setup
                                </h3>
                            </div>
                            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 1.5rem', lineHeight: '1.5' }}>
                                Configure specific role dimensions and difficulty levels for targeted technical readiness.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', marginBottom: '1.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.45rem' }}>
                                        Target Role
                                    </label>
                                    <select 
                                        value={role} 
                                        onChange={(e) => setRole(e.target.value)}
                                        className="saas-input"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <option>Software Engineer</option>
                                        <option>Frontend Developer</option>
                                        <option>Backend Developer</option>
                                        <option>Full Stack Developer</option>
                                        <option>Data Scientist</option>
                                        <option>DevOps Engineer</option>
                                        <option>IoT Engineer</option>
                                        <option>General</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.45rem' }}>
                                        Interview Difficulty
                                    </label>
                                    <select 
                                        value={difficulty} 
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        className="saas-input"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <option>Easy</option>
                                        <option>Medium</option>
                                        <option>Hard</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => handleStartInterview()}
                            disabled={isStarting}
                            style={{
                                width: '100%',
                                padding: '0.95rem',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '1rem',
                                fontWeight: '700',
                                cursor: isStarting ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 18px rgba(59, 130, 246, 0.4)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (!isStarting) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(59, 130, 246, 0.55)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 18px rgba(59, 130, 246, 0.4)';
                            }}
                        >
                            {isStarting ? 'Preparing Questions...' : '🚀 Launch Interview Session'}
                        </button>
                    </div>

                    {/* Resume Personalization Card (Drop-Zone Style) */}
                    <div style={{
                        backgroundColor: 'rgba(17, 24, 39, 0.85)',
                        backdropFilter: 'blur(16px)',
                        borderRadius: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '2rem',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '1.3rem' }}>📄</span>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: '700' }}>
                                    Resume Personalization
                                </h3>
                            </div>
                            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 1.5rem', lineHeight: '1.5' }}>
                                Upload your PDF resume. Questions will automatically personalize to your real projects and tech stack.
                            </p>

                            {/* Drop-Zone Component */}
                            <input 
                                type="file" 
                                accept=".pdf" 
                                id="resumeDropInput" 
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        setResumeFile(file);
                                        handleResumeUpload(file);
                                    }
                                }}
                            />

                            {uploadedFileName ? (
                                /* Post-upload State */
                                <div style={{
                                    border: '2px solid rgba(34, 197, 94, 0.35)',
                                    borderRadius: '12px',
                                    padding: '1.75rem 1.25rem',
                                    textAlign: 'center',
                                    backgroundColor: 'rgba(34, 197, 94, 0.05)',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                        color: '#4ade80',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold',
                                        margin: '0 auto 0.6rem'
                                    }}>
                                        ✓
                                    </div>
                                    <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.25rem' }}>
                                        Resume uploaded
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: '600', marginBottom: '0.35rem', wordBreak: 'break-all' }}>
                                        {uploadedFileName}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
                                        Resume ready for personalized questions
                                    </div>
                                    <label
                                        htmlFor="resumeDropInput"
                                        style={{
                                            display: 'inline-block',
                                            padding: '0.45rem 1.1rem',
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            color: '#cbd5e1',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            borderRadius: '8px',
                                            fontSize: '0.82rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        Change Resume
                                    </label>
                                </div>
                            ) : (
                                /* Pre-upload State */
                                <label
                                    htmlFor="resumeDropInput"
                                    style={{
                                        display: 'block',
                                        border: '2px dashed rgba(255, 255, 255, 0.15)',
                                        borderRadius: '12px',
                                        padding: '1.75rem 1.25rem',
                                        textAlign: 'center',
                                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        marginBottom: '1rem'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#38bdf8';
                                        e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.04)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                        e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.6)';
                                    }}
                                >
                                    <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>📄</div>
                                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.2rem' }}>
                                        Upload your resume
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.85rem' }}>
                                        PDF format only • Max 5MB
                                    </div>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '0.45rem 1.1rem',
                                        backgroundColor: '#1e293b',
                                        color: '#38bdf8',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(56, 189, 248, 0.3)',
                                        fontSize: '0.85rem',
                                        fontWeight: '600'
                                    }}>
                                        Select Resume
                                    </span>
                                </label>
                            )}
                        </div>

                        {resumeUploading && (
                            <div style={{ textAlign: 'center', padding: '0.5rem', color: '#38bdf8', fontSize: '0.85rem', fontWeight: '600' }}>
                                ⏳ Extracting and analyzing resume text...
                            </div>
                        )}

                        {resumeStatus === 'error' && (
                            <div style={{ padding: '0.65rem', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.82rem' }}>
                                ⚠️ {resumeMessage}
                            </div>
                        )}
                    </div>
                </div>

                {/* 6. RECENT INTERVIEWS SECTION */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
                                🕒 Recent Interviews
                            </h2>
                            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0.2rem 0 0' }}>
                                Your most recently evaluated mock interview rounds
                            </p>
                        </div>
                        <Link 
                            to="/history" 
                            style={{ 
                                color: '#38bdf8', 
                                textDecoration: 'none', 
                                fontSize: '0.92rem', 
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                transition: 'color 0.15s ease'
                            }}
                        >
                            View All History →
                        </Link>
                    </div>

                    {isLoadingData ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                            ⏳ Loading recent interviews...
                        </div>
                    ) : recentInterviews.length === 0 ? (
                        <div style={{
                            backgroundColor: 'rgba(17, 24, 39, 0.85)',
                            backdropFilter: 'blur(12px)',
                            borderRadius: '16px',
                            border: '1px dashed rgba(255, 255, 255, 0.12)',
                            padding: '3rem 1.5rem',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '2.2rem', marginBottom: '0.6rem' }}>🎙️</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.3rem' }}>
                                Your interview journey starts here.
                            </div>
                            <div style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
                                Click "Start New Interview" above to launch your first session.
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {recentInterviews.map((iv) => {
                                const qStyle = qualityColors[iv.quality] || qualityColors['Not Attempted'];
                                const dStyle = difficultyColors[iv.difficulty] || difficultyColors['Medium'];

                                return (
                                    <div
                                        key={iv.id}
                                        style={{
                                            backgroundColor: 'rgba(17, 24, 39, 0.85)',
                                            backdropFilter: 'blur(12px)',
                                            borderRadius: '16px',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            padding: '1.35rem 1.75rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '1.25rem',
                                            transition: 'all 0.2s ease',
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.35)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
                                        }}
                                    >
                                        <div style={{ minWidth: '240px' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.35rem' }}>
                                                {iv.role}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.82rem', color: '#94a3b8' }}>
                                                <span style={{
                                                    backgroundColor: dStyle.bg,
                                                    color: dStyle.text,
                                                    border: `1px solid ${dStyle.border}`,
                                                    padding: '0.1rem 0.45rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.72rem',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {iv.difficulty}
                                                </span>
                                                <span>•</span>
                                                <span>{iv.started_at ? new Date(iv.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}</span>
                                                <span>•</span>
                                                <span>{iv.questions_answered} questions answered</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: iv.overall_score != null ? '#38bdf8' : '#64748b', lineHeight: '1.1' }}>
                                                    {iv.overall_score != null ? formatScore(iv.overall_score) : '—'}
                                                    {iv.overall_score != null && <span style={{ fontSize: '0.85rem', color: '#64748b' }}> / 10</span>}
                                                </div>
                                                <div style={{
                                                    display: 'inline-block',
                                                    backgroundColor: qStyle.bg,
                                                    color: qStyle.text,
                                                    border: `1px solid ${qStyle.border}`,
                                                    padding: '0.1rem 0.55rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.72rem',
                                                    fontWeight: 'bold',
                                                    marginTop: '0.25rem'
                                                }}>
                                                    {iv.quality}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => navigate(`/report/${iv.id}`)}
                                                style={{
                                                    padding: '0.6rem 1.3rem',
                                                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                                    color: '#38bdf8',
                                                    border: '1px solid rgba(56, 189, 248, 0.35)',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.88rem',
                                                    fontWeight: '600',
                                                    transition: 'all 0.15s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#38bdf8';
                                                    e.currentTarget.style.color = '#090d16';
                                                    e.currentTarget.style.borderColor = '#38bdf8';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)';
                                                    e.currentTarget.style.color = '#38bdf8';
                                                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
                                                }}
                                            >
                                                View Report →
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
