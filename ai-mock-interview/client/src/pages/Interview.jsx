import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

/** Format ML score for display: 5.199999809265137 → "5.2" */
export const formatScore = (score) => {
    if (score == null || isNaN(Number(score))) return '—';
    return Number(score).toFixed(1);
};

/** Format ML confidence (0–1 probability) for display: 0.9998 → "99.98%" */
export const formatConfidence = (confidence) => {
    if (confidence == null || isNaN(Number(confidence))) return 'Unavailable';
    const val = Number(confidence);
    if (val < 0 || val > 1) return 'Unavailable';
    return `${(val * 100).toFixed(1)}%`;
};

/** Detect technical topic from question text or role */
const detectTopic = (questionText, role) => {
    if (!questionText) return role || 'General Technical';
    const q = questionText.toLowerCase();
    if (q.includes('hashmap') || q.includes('hash map') || q.includes('array') || q.includes('tree') || q.includes('graph') || q.includes('stack') || q.includes('queue') || q.includes('linked list') || q.includes('binary') || q.includes('heap')) return 'Data Structures';
    if (q.includes('rest') || q.includes('api') || q.includes('http') || q.includes('endpoint') || q.includes('status code')) return 'Web APIs';
    if (q.includes('react') || q.includes('dom') || q.includes('css') || q.includes('component') || q.includes('state') || q.includes('hooks')) return 'Frontend';
    if (q.includes('sql') || q.includes('database') || q.includes('query') || q.includes('acid') || q.includes('index') || q.includes('transaction') || q.includes('postgres') || q.includes('mongodb')) return 'Database';
    if (q.includes('java') || q.includes('jvm') || q.includes('garbage collection') || q.includes('multithreading')) return 'Java';
    if (q.includes('python') || q.includes('gil') || q.includes('generator')) return 'Python';
    if (q.includes('docker') || q.includes('kubernetes') || q.includes('container') || q.includes('ci/cd') || q.includes('deploy')) return 'DevOps & Cloud';
    if (q.includes('system design') || q.includes('cache') || q.includes('scale') || q.includes('load balanc') || q.includes('sharding')) return 'System Design';
    if (q.includes('concurrency') || q.includes('thread') || q.includes('deadlock') || q.includes('mutex') || q.includes('synchroniz')) return 'Concurrency';
    if (q.includes('oop') || q.includes('polymorphism') || q.includes('inheritance') || q.includes('encapsulation') || q.includes('abstraction')) return 'OOP Concepts';
    return role || 'General Technical';
};

/** Map quality band to styling tokens */
const getQualityStyle = (quality) => {
    switch (quality) {
        case 'Excellent':
            return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)', label: 'Excellent' };
        case 'Good':
            return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)', label: 'Good' };
        case 'Average':
            return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)', label: 'Average' };
        case 'Poor':
            return { bg: 'rgba(249, 115, 22, 0.15)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.3)', label: 'Poor' };
        case 'Very Poor':
            return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)', label: 'Very Poor' };
        default:
            return { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)', label: quality || 'Evaluated' };
    }
};

const LOADING_STEPS = [
    { label: 'Analyzing resume' },
    { label: 'Extracting skills and projects' },
    { label: 'Generating personalized questions' },
    { label: 'Validating questions' },
    { label: 'Preparing your interview' }
];

const Interview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingStep, setLoadingStep] = useState(0);
    const [evaluationResult, setEvaluationResult] = useState(null);
    const [error, setError] = useState('');
    const [allEvaluations, setAllEvaluations] = useState([]);
    const [interviewComplete, setInterviewComplete] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);

    const [meta, setMeta] = useState({
        role: location.state?.role || 'Software Engineer',
        difficulty: location.state?.difficulty || 'Medium'
    });

    // Staged visual progress progression while waiting for question-generation API
    useEffect(() => {
        if (!isLoading) return;
        const delays = [1800, 2200, 3200, 2400];
        let timer = null;
        let step = 0;

        const scheduleNext = () => {
            if (step < LOADING_STEPS.length - 1) {
                const delay = delays[step] || 2500;
                timer = setTimeout(() => {
                    step += 1;
                    setLoadingStep(step);
                    scheduleNext();
                }, delay);
            }
        };

        scheduleNext();

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [isLoading]);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/interview/${id}/questions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.status === 401) { navigate('/login'); return; }
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setQuestions(data);
                setIsLoading(false);
            } catch (err) {
                setError('Failed to load interview questions. Please try again.');
                setIsLoading(false);
            }
        };

        const fetchMetadata = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/interview/${id}/report`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data?.interview) {
                        setMeta(prev => ({
                            role: data.interview.role || prev.role,
                            difficulty: data.interview.difficulty || prev.difficulty
                        }));
                    }
                }
            } catch (e) {
                // Keep default or location.state
            }
        };

        fetchQuestions();
        if (!location.state?.role) {
            fetchMetadata();
        }
    }, [id, navigate, location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!answer.trim()) { setError('Answer cannot be empty.'); return; }
        setError('');
        setIsSubmitting(true);

        try {
            const currentQuestionId = questions[currentIndex].id;
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/interview/evaluate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ interviewId: parseInt(id), questionId: currentQuestionId, answer })
            });
            if (res.status === 401) { navigate('/login'); return; }
            if (res.status === 503) { setError('ML Evaluation Service is currently unavailable. Please try again.'); setIsSubmitting(false); return; }
            if (!res.ok) throw new Error('Evaluation failed');
            const data = await res.json();
            setEvaluationResult(data.evaluation);
            setAllEvaluations(prev => [...prev, { question: questions[currentIndex].question, ...data.evaluation }]);
        } catch (err) {
            setError("We couldn't evaluate your answer right now. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNextQuestion = async () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setAnswer('');
            setEvaluationResult(null);
            setError('');
        } else {
            setIsCompleting(true);
            try {
                const token = localStorage.getItem('token');
                await fetch(`${API_URL}/interview/${id}/complete`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                navigate(`/report/${id}`);
            } catch (err) {
                console.warn('Failed to call complete endpoint, showing summary:', err);
                setInterviewComplete(true);
                setIsCompleting(false);
            }
        }
    };

    // Word & char count
    const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
    const charCount = answer.length;

    // Difficulty chip color
    const getDiffBadge = (diff) => {
        const d = (diff || '').toLowerCase();
        if (d === 'hard') return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
        if (d === 'easy') return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
    };

    // --- COMPLETING TRANSITION STATE ---
    if (isCompleting) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                <div style={{ backgroundColor: 'rgba(17, 24, 39, 0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '3rem 2rem', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem' }}>Interview Complete!</h2>
                    <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                        Generating your comprehensive AI performance report...
                    </p>
                    <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    // --- FALLBACK SUMMARY (if complete API failed) ---
    if (interviewComplete) {
        const totalQ = allEvaluations.length;
        const avgScore = totalQ > 0 ? (allEvaluations.reduce((s, e) => s + (Number(e.score) || 0), 0) / totalQ) : 0;
        const qualityCounts = {};
        const allStrengths = [];
        const allImprovements = [];
        for (const ev of allEvaluations) {
            qualityCounts[ev.quality] = (qualityCounts[ev.quality] || 0) + 1;
            if (ev.feedback?.strengths) allStrengths.push(...ev.feedback.strengths);
            if (ev.feedback?.improvements) allImprovements.push(...ev.feedback.improvements);
        }
        const qualityOrder = ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'];
        const qualityColors = { Excellent: '#34d399', Good: '#60a5fa', Average: '#fbbf24', Poor: '#fb923c', 'Very Poor': '#f87171' };

        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', padding: '2rem 1rem' }}>
                <div style={{ maxWidth: '820px', margin: '0 auto', backgroundColor: 'rgba(17, 24, 39, 0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
                        <h2 style={{ fontSize: '1.85rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>Interview Complete!</h2>
                        <p style={{ color: '#94a3b8', margin: 0 }}>Here is your performance summary.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem', fontWeight: 600 }}>Overall Score</div>
                            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f8fafc' }}>{formatScore(avgScore)} <span style={{ fontSize: '1.1rem', color: '#94a3b8' }}>/ 10</span></div>
                        </div>
                        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem', fontWeight: 600 }}>Questions Attempted</div>
                            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f8fafc' }}>{totalQ}</div>
                        </div>
                    </div>

                    <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1.1rem' }}>Quality Distribution</h3>
                        {qualityOrder.map(q => (
                            <div key={q} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <span style={{ color: qualityColors[q], fontWeight: 500 }}>{q}</span>
                                <span style={{ fontWeight: 700, color: '#f8fafc' }}>{qualityCounts[q] || 0}</span>
                            </div>
                        ))}
                    </div>

                    {allStrengths.length > 0 && (
                        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 0.75rem 0', color: '#34d399', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>✓</span> Key Strengths
                            </h3>
                            {[...new Set(allStrengths)].map((s, i) => (
                                <p key={i} style={{ margin: '0.4rem 0', color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.5 }}>• {s}</p>
                            ))}
                        </div>
                    )}

                    {allImprovements.length > 0 && (
                        <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 0.75rem 0', color: '#fbbf24', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>⚠</span> Areas for Improvement
                            </h3>
                            {[...new Set(allImprovements)].map((s, i) => (
                                <p key={i} style={{ margin: '0.4rem 0', color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.5 }}>• {s}</p>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{ padding: '0.85rem 2rem', width: '100%', background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)' }}
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#070b14',
                backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99, 102, 241, 0.18), transparent 70%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem 1rem',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                color: '#f8fafc'
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '540px',
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: '20px',
                    padding: '2.25rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.1)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Top Accent Shimmer Line */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: 'linear-gradient(90deg, #4f46e5, #818cf8, #c084fc, #6366f1)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2.5s ease infinite'
                    }} />

                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '56px',
                            height: '56px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.25) 0%, rgba(147, 51, 234, 0.25) 100%)',
                            border: '1px solid rgba(129, 140, 248, 0.35)',
                            boxShadow: '0 0 25px rgba(99, 102, 241, 0.35)',
                            marginBottom: '1rem',
                            position: 'relative'
                        }}>
                            <span style={{ fontSize: '1.75rem' }}>✨</span>
                            <div style={{
                                position: 'absolute',
                                inset: '-4px',
                                borderRadius: '20px',
                                border: '1px dashed rgba(129, 140, 248, 0.4)',
                                animation: 'spin 12s linear infinite'
                            }} />
                        </div>

                        <h2 style={{
                            fontSize: '1.65rem',
                            fontWeight: 700,
                            letterSpacing: '-0.025em',
                            margin: '0 0 0.5rem 0',
                            background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            Preparing Your Interview
                        </h2>

                        <p style={{
                            fontSize: '0.92rem',
                            color: '#94a3b8',
                            margin: '0 auto 1.1rem auto',
                            lineHeight: 1.5,
                            maxWidth: '420px'
                        }}>
                            Personalizing your interview based on your resume and selected role.
                        </p>

                        {/* Selected Role & Difficulty Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.3rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                background: 'rgba(99, 102, 241, 0.15)',
                                color: '#a5b4fc',
                                border: '1px solid rgba(99, 102, 241, 0.3)'
                            }}>
                                <span>🎯</span> Role: {meta.role}
                            </span>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.3rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                background: meta.difficulty === 'Hard' ? 'rgba(239, 68, 68, 0.15)' : meta.difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: meta.difficulty === 'Hard' ? '#f87171' : meta.difficulty === 'Easy' ? '#34d399' : '#fbbf24',
                                border: meta.difficulty === 'Hard' ? '1px solid rgba(239, 68, 68, 0.3)' : meta.difficulty === 'Easy' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                            }}>
                                <span>⚡</span> {meta.difficulty}
                            </span>
                        </div>
                    </div>

                    {/* Staged Step Progress List */}
                    <div style={{
                        background: 'rgba(11, 17, 33, 0.65)',
                        border: '1px solid rgba(51, 65, 85, 0.5)',
                        borderRadius: '16px',
                        padding: '1.25rem 1.25rem 1rem 1.25rem',
                        marginBottom: '1.5rem',
                        position: 'relative'
                    }}>
                        {LOADING_STEPS.map((step, idx) => {
                            const isCompleted = idx < loadingStep;
                            const isActive = idx === loadingStep;

                            return (
                                <div key={idx} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    position: 'relative',
                                    paddingBottom: idx === LOADING_STEPS.length - 1 ? '0' : '1.35rem'
                                }}>
                                    {/* Connecting Line between steps */}
                                    {idx < LOADING_STEPS.length - 1 && (
                                        <div style={{
                                            position: 'absolute',
                                            left: '15px',
                                            top: '32px',
                                            bottom: '0px',
                                            width: '2px',
                                            background: isCompleted ? '#10b981' : 'rgba(51, 65, 85, 0.6)',
                                            transition: 'background 0.5s ease'
                                        }} />
                                    )}

                                    {/* Step Indicator Icon */}
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        zIndex: 1,
                                        transition: 'all 0.4s ease',
                                        background: isCompleted
                                            ? 'rgba(16, 185, 129, 0.2)'
                                            : isActive
                                            ? 'rgba(99, 102, 241, 0.25)'
                                            : 'rgba(30, 41, 59, 0.6)',
                                        border: isCompleted
                                            ? '2px solid #10b981'
                                            : isActive
                                            ? '2px solid #818cf8'
                                            : '2px solid rgba(71, 85, 105, 0.5)',
                                        boxShadow: isActive
                                            ? '0 0 16px rgba(99, 102, 241, 0.55)'
                                            : isCompleted
                                            ? '0 0 10px rgba(16, 185, 129, 0.3)'
                                            : 'none'
                                    }}>
                                        {isCompleted ? (
                                            <span style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 800 }}>✓</span>
                                        ) : isActive ? (
                                            <div style={{
                                                width: '14px',
                                                height: '14px',
                                                border: '2px solid rgba(129, 140, 248, 0.3)',
                                                borderTop: '2px solid #a5b4fc',
                                                borderRadius: '50%',
                                                animation: 'spin 0.8s linear infinite'
                                            }} />
                                        ) : (
                                            <span style={{ color: '#475569', fontSize: '0.75rem' }}>○</span>
                                        )}
                                    </div>

                                    {/* Step Label */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '0.95rem',
                                            fontWeight: isActive ? 600 : 500,
                                            color: isCompleted ? '#e2e8f0' : isActive ? '#ffffff' : '#64748b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            transition: 'color 0.3s ease'
                                        }}>
                                            <span>{step.label}</span>
                                            {isActive && (
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    padding: '0.15rem 0.5rem',
                                                    borderRadius: '6px',
                                                    background: 'rgba(99, 102, 241, 0.25)',
                                                    color: '#c7d2fe',
                                                    fontWeight: 600,
                                                    letterSpacing: '0.02em',
                                                    animation: 'pulse 1.8s ease-in-out infinite'
                                                }}>
                                                    IN PROGRESS
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Progress Bar & Footer Status */}
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.8rem',
                            color: '#94a3b8',
                            marginBottom: '0.5rem'
                        }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{
                                    display: 'inline-block',
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: '#6366f1',
                                    animation: 'pulse 1.5s infinite'
                                }} />
                                Loading interview...
                            </span>
                            <span style={{ fontWeight: 600, color: '#c7d2fe' }}>
                                {Math.min(95, Math.round(((loadingStep + 1) / LOADING_STEPS.length) * 100))}%
                            </span>
                        </div>

                        <div style={{
                            height: '6px',
                            background: 'rgba(30, 41, 59, 0.7)',
                            borderRadius: '9999px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${Math.min(95, Math.round(((loadingStep + 1) / LOADING_STEPS.length) * 100))}%`,
                                background: 'linear-gradient(90deg, #4f46e5 0%, #818cf8 50%, #c084fc 100%)',
                                borderRadius: '9999px',
                                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                            }} />
                        </div>
                    </div>

                    {/* CSS Animations */}
                    <style>{`
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        @keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }
                        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                    `}</style>
                </div>
            </div>
        );
    }

    if (error && !questions.length) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                <div style={{ backgroundColor: 'rgba(17, 24, 39, 0.85)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '2rem', maxWidth: '440px', textAlign: 'center' }}>
                    <div style={{ color: '#f87171', fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 500 }}>{error}</div>
                    <button onClick={() => navigate('/dashboard')} style={{ padding: '0.7rem 1.5rem', background: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!questions.length) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                No questions found.
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const detectedTopic = detectTopic(currentQuestion.question, meta.role);
    const diffBadge = getDiffBadge(meta.difficulty);
    const progressPercent = Math.round(((currentIndex + (evaluationResult ? 1 : 0)) / questions.length) * 100);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main, #090d16)', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
            {/* TOP INTERVIEW HEADER */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 40,
                backgroundColor: 'rgba(9, 13, 22, 0.88)',
                backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '0.75rem 1.5rem'
            }}>
                <div style={{ maxWidth: '1260px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Left: Branding & Session Meta */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)'
                            }}>
                                <span style={{ fontSize: '1rem' }}>⚡</span>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em', color: '#f8fafc' }}>
                                AI Mock Interview
                            </span>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '9999px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                color: '#34d399',
                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                letterSpacing: '0.04em'
                            }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                                LIVE ARENA
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {/* Role badge */}
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#cbd5e1'
                            }}>
                                Role: <strong style={{ color: '#f8fafc' }}>{meta.role}</strong>
                            </span>

                            {/* Difficulty badge */}
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                backgroundColor: diffBadge.bg,
                                color: diffBadge.text,
                                border: `1px solid ${diffBadge.border}`
                            }}>
                                Difficulty: {meta.difficulty}
                            </span>
                        </div>
                    </div>

                    {/* Right: Progress & Exit */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        {/* Question counter & progress */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
                                Question {currentIndex + 1} / {questions.length}
                            </span>
                            <div style={{ width: '90px', height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${progressPercent}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #4f46e5 0%, #38bdf8 100%)',
                                    transition: 'width 0.4s ease'
                                }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', minWidth: '32px' }}>
                                {progressPercent}%
                            </span>
                        </div>

                        {/* Exit button */}
                        <button
                            onClick={() => setShowExitModal(true)}
                            style={{
                                padding: '0.4rem 0.85rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#94a3b8',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#f87171'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'; e.currentTarget.style.color = '#94a3b8'; }}
                        >
                            Exit Arena
                        </button>
                    </div>
                </div>
            </header>

            {/* STEPPER PROGRESS INDICATOR */}
            <div style={{
                maxWidth: '1260px',
                margin: '1.25rem auto 0',
                padding: '0 1.5rem',
                width: '100%'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'rgba(17, 24, 39, 0.4)',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                    {questions.map((q, idx) => {
                        const isDone = idx < currentIndex || (idx === currentIndex && evaluationResult);
                        const isCurrent = idx === currentIndex && !evaluationResult;
                        return (
                            <div key={q.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: '180px' }}>
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    transition: 'all 0.3s ease',
                                    backgroundColor: isDone
                                        ? '#10b981'
                                        : isCurrent
                                            ? '#6366f1'
                                            : 'rgba(255, 255, 255, 0.06)',
                                    color: isDone || isCurrent ? '#ffffff' : '#64748b',
                                    boxShadow: isCurrent ? '0 0 12px rgba(99, 102, 241, 0.5)' : 'none',
                                    border: isCurrent ? '2px solid #818cf8' : 'none'
                                }}>
                                    {isDone ? '✓' : idx + 1}
                                </div>
                                <span style={{
                                    fontSize: '0.8rem',
                                    fontWeight: isCurrent ? 600 : 400,
                                    color: isCurrent ? '#f8fafc' : isDone ? '#94a3b8' : '#475569',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    Q{idx + 1}
                                </span>
                                {idx < questions.length - 1 && (
                                    <div style={{
                                        flex: 1,
                                        height: '2px',
                                        backgroundColor: idx < currentIndex ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                                        margin: '0 0.25rem',
                                        transition: 'background-color 0.3s'
                                    }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MAIN ARENA WORKSPACE */}
            <main style={{
                maxWidth: '1260px',
                margin: '1.5rem auto 3rem',
                padding: '0 1.5rem',
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 300px',
                gap: '1.75rem',
                alignItems: 'start'
            }} className="arena-grid">
                {/* PRIMARY STAGE (Question + Response / Evaluation) */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* QUESTION CARD */}
                    <div style={{
                        backgroundColor: 'rgba(17, 24, 39, 0.75)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        padding: '1.75rem 2rem',
                        boxShadow: '0 12px 30px -6px rgba(0, 0, 0, 0.45)',
                        animation: 'slideUp 0.3s ease-out'
                    }}>
                        {/* Meta bar */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    color: '#818cf8',
                                    backgroundColor: 'rgba(99, 102, 241, 0.12)',
                                    padding: '0.25rem 0.65rem',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(99, 102, 241, 0.25)'
                                }}>
                                    Question {currentIndex + 1}
                                </span>
                                <span style={{
                                    fontSize: '0.78rem',
                                    fontWeight: 500,
                                    color: '#94a3b8',
                                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                    padding: '0.25rem 0.65rem',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(255, 255, 255, 0.08)'
                                }}>
                                    Topic: <strong style={{ color: '#e2e8f0' }}>{detectedTopic}</strong>
                                </span>
                            </div>

                            <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                backgroundColor: diffBadge.bg,
                                color: diffBadge.text,
                                border: `1px solid ${diffBadge.border}`
                            }}>
                                {meta.difficulty}
                            </span>
                        </div>

                        {/* Large Question Typography */}
                        <div style={{
                            fontSize: '1.32rem',
                            fontWeight: 600,
                            lineHeight: 1.6,
                            color: '#f8fafc',
                            wordBreak: 'break-word'
                        }}>
                            {currentQuestion.question}
                        </div>
                    </div>

                    {/* ANSWER SUBMISSION OR EVALUATION DISPLAY */}
                    {!evaluationResult ? (
                        <div style={{
                            backgroundColor: 'rgba(17, 24, 39, 0.75)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            padding: '1.75rem 2rem',
                            boxShadow: '0 12px 30px -6px rgba(0, 0, 0, 0.45)'
                        }}>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {/* Label & Live word counter */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>✍️</span> Your Technical Response
                                    </label>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                        {wordCount} words · {charCount} characters
                                    </span>
                                </div>

                                {/* Textarea Editor */}
                                <div style={{ position: 'relative' }}>
                                    <textarea
                                        style={{
                                            width: '100%',
                                            minHeight: '220px',
                                            padding: '1.1rem',
                                            backgroundColor: 'rgba(10, 15, 29, 0.85)',
                                            color: '#f8fafc',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            borderRadius: '10px',
                                            fontSize: '1rem',
                                            lineHeight: 1.6,
                                            boxSizing: 'border-box',
                                            fontFamily: 'inherit',
                                            resize: 'vertical',
                                            outline: 'none',
                                            transition: 'border-color 0.2s, box-shadow 0.2s'
                                        }}
                                        placeholder="Type your answer here..."
                                        value={answer}
                                        onChange={(e) => setAnswer(e.target.value)}
                                        disabled={isSubmitting}
                                        onFocus={e => {
                                            e.target.style.borderColor = '#6366f1';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.25)';
                                        }}
                                        onBlur={e => {
                                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                {/* Error alert banner */}
                                {error && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.75rem 1rem',
                                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '8px',
                                        color: '#f87171',
                                        fontSize: '0.9rem'
                                    }}>
                                        <span>⚠️</span>
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Submitting feedback banner */}
                                {isSubmitting && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.85rem 1.25rem',
                                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                        border: '1px solid rgba(99, 102, 241, 0.25)',
                                        borderRadius: '8px',
                                        color: '#cbd5e1',
                                        fontSize: '0.9rem'
                                    }}>
                                        <div style={{ width: '18px', height: '18px', border: '2px solid rgba(99, 102, 241, 0.3)', borderTop: '2px solid #818cf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                        <span>AI is analyzing your response with ML model...</span>
                                    </div>
                                )}

                                {/* Form Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                        Tip: Explain key mechanisms, algorithmic trade-offs, and practical edge cases.
                                    </span>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        style={{
                                            padding: '0.85rem 1.85rem',
                                            borderRadius: '8px',
                                            color: '#ffffff',
                                            fontWeight: 600,
                                            fontSize: '0.95rem',
                                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                            background: isSubmitting
                                                ? '#334155'
                                                : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%)',
                                            border: 'none',
                                            boxShadow: isSubmitting ? 'none' : '0 4px 15px rgba(99, 102, 241, 0.35)',
                                            transition: 'transform 0.15s, box-shadow 0.15s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                        onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                        onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                                <span>Evaluating your answer...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Submit Answer</span>
                                                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>→</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        /* EVALUATION RESULT POLISHED CARD */
                        <div style={{
                            backgroundColor: 'rgba(17, 24, 39, 0.8)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            borderRadius: '16px',
                            padding: '1.75rem 2rem',
                            boxShadow: '0 12px 35px -6px rgba(0, 0, 0, 0.5)',
                            animation: 'slideUp 0.3s ease-out'
                        }}>
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                                        ⚡
                                    </div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                                        Evaluation Result
                                    </h3>
                                </div>
                                <span style={{ fontSize: '0.78rem', color: '#94a3b8', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                                    ML Answer Evaluator
                                </span>
                            </div>

                            {/* 3 Metric Summary Tiles */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                {/* Quality */}
                                {(() => {
                                    const qStyle = getQualityStyle(evaluationResult.quality);
                                    return (
                                        <div style={{
                                            backgroundColor: 'rgba(15, 23, 42, 0.7)',
                                            border: `1px solid ${qStyle.border}`,
                                            padding: '1rem',
                                            borderRadius: '10px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem', fontWeight: 600 }}>Quality</div>
                                            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: qStyle.text }}>
                                                {evaluationResult.quality}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Score */}
                                <div style={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem', fontWeight: 600 }}>Score</div>
                                    <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#f8fafc' }}>
                                        {formatScore(evaluationResult.score)} / 10
                                    </div>
                                </div>

                                {/* Confidence */}
                                <div style={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem', fontWeight: 600 }}>Confidence</div>
                                    <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#38bdf8' }}>
                                        {formatConfidence(evaluationResult.confidence)}
                                    </div>
                                </div>
                            </div>

                            {/* Feedback Cards */}
                            {evaluationResult.feedback && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1', margin: 0 }}>Feedback</h4>

                                    {/* Strengths */}
                                    {evaluationResult.feedback.strengths?.length > 0 && (
                                        <div style={{
                                            backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                            border: '1px solid rgba(16, 185, 129, 0.25)',
                                            borderRadius: '8px',
                                            padding: '1rem 1.25rem'
                                        }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                                                Key Strengths
                                            </div>
                                            {evaluationResult.feedback.strengths.map((str, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: '0.6rem', color: '#e2e8f0', alignItems: 'flex-start', marginBottom: '0.35rem', fontSize: '0.92rem', lineHeight: 1.5 }}>
                                                    <span style={{ color: '#34d399', fontWeight: 700 }}>✓</span>
                                                    <span>{str}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Improvements */}
                                    {evaluationResult.feedback.improvements?.length > 0 && (
                                        <div style={{
                                            backgroundColor: 'rgba(245, 158, 11, 0.08)',
                                            border: '1px solid rgba(245, 158, 11, 0.25)',
                                            borderRadius: '8px',
                                            padding: '1rem 1.25rem'
                                        }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                                                Areas for Improvement
                                            </div>
                                            {evaluationResult.feedback.improvements.map((imp, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: '0.6rem', color: '#e2e8f0', alignItems: 'flex-start', marginBottom: '0.35rem', fontSize: '0.92rem', lineHeight: 1.5 }}>
                                                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>⚠</span>
                                                    <span>{imp}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Next Question / Finish Action */}
                            <button
                                onClick={handleNextQuestion}
                                style={{
                                    padding: '0.85rem 1.5rem',
                                    width: '100%',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                                    color: '#ffffff',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                                    transition: 'transform 0.15s, box-shadow 0.15s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Interview'}</span>
                                <span style={{ fontSize: '1.1rem' }}>{currentIndex < questions.length - 1 ? '→' : '🎉'}</span>
                            </button>
                        </div>
                    )}
                </section>

                {/* CONTEXT SIDEBAR */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Session Specs Card */}
                    <div style={{
                        backgroundColor: 'rgba(17, 24, 39, 0.65)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '14px',
                        padding: '1.5rem',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                    }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', margin: '0 0 1rem 0' }}>
                            Session Overview
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#64748b' }}>Target Role</span>
                                <span style={{ fontWeight: 600, color: '#f8fafc' }}>{meta.role}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#64748b' }}>Difficulty</span>
                                <span style={{ fontWeight: 600, color: diffBadge.text }}>{meta.difficulty}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#64748b' }}>Current Step</span>
                                <span style={{ fontWeight: 600, color: '#f8fafc' }}>{currentIndex + 1} of {questions.length}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#64748b' }}>Answered</span>
                                <span style={{ fontWeight: 600, color: '#34d399' }}>{allEvaluations.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Interview Guidance Tips */}
                    <div style={{
                        backgroundColor: 'rgba(17, 24, 39, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '14px',
                        padding: '1.5rem'
                    }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#818cf8', margin: '0 0 0.85rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span>💡</span> Pro Tips
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <li>Lead with the direct definition or approach before details.</li>
                            <li>Discuss time and space complexity where appropriate.</li>
                            <li>Mention concurrency, null safety, or edge conditions.</li>
                            <li>Ground your points in real-world engineering trade-offs.</li>
                        </ul>
                    </div>
                </aside>
            </main>

            {/* EXIT CONFIRMATION MODAL */}
            {showExitModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 50,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div style={{
                        backgroundColor: '#111827',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '16px',
                        padding: '2rem',
                        maxWidth: '440px',
                        width: '100%',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                        animation: 'slideUp 0.25s ease-out'
                    }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.75rem 0' }}>
                            Exit Interview Arena?
                        </h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
                            Your answered questions and evaluations have been saved. You can always review past sessions from your Dashboard or History.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowExitModal(false)}
                                style={{
                                    padding: '0.65rem 1.25rem',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    color: '#cbd5e1',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Continue Interview
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                style={{
                                    padding: '0.65rem 1.25rem',
                                    borderRadius: '6px',
                                    backgroundColor: '#ef4444',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 10px rgba(239, 68, 68, 0.4)'
                                }}
                            >
                                Exit to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @media (max-width: 960px) {
                    .arena-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default Interview;

