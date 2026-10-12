import React, { useState } from 'react';

const ScoreProgressionChart = ({ progression = [] }) => {
    const [hoveredPoint, setHoveredPoint] = useState(null);

    if (!progression || progression.length === 0) {
        return (
            <div style={{
                padding: '3rem 1.5rem',
                textAlign: 'center',
                color: '#94a3b8',
                backgroundColor: 'rgba(17, 24, 39, 0.85)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                border: '1px dashed rgba(255, 255, 255, 0.12)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>📈</div>
                <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#f8fafc' }}>No interview scores yet</div>
                <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.35rem' }}>
                    Complete your first mock interview to track and visualize your performance trajectory.
                </div>
            </div>
        );
    }

    // Chart dimensions
    const svgWidth = 720;
    const svgHeight = 260;
    const padding = { top: 35, right: 40, bottom: 45, left: 45 };
    const chartWidth = svgWidth - padding.left - padding.right;
    const chartHeight = svgHeight - padding.top - padding.bottom;

    const data = progression.slice(-10); // Last 10 interviews
    const totalPoints = data.length;

    // Header metrics
    const scores = data.map(d => Number(d.score)).filter(s => !isNaN(s));
    const latestScore = scores.length > 0 ? scores[scores.length - 1].toFixed(1) : '—';
    const bestScore = scores.length > 0 ? Math.max(...scores).toFixed(1) : '—';
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';

    // Scales
    const getY = (score) => {
        const clamped = Math.max(0, Math.min(10, Number(score) || 0));
        return padding.top + chartHeight - (clamped / 10) * chartHeight;
    };

    const getX = (index) => {
        if (totalPoints === 1) return padding.left + chartWidth / 2;
        return padding.left + (index / (totalPoints - 1)) * chartWidth;
    };

    const points = data.map((d, i) => ({
        x: getX(i),
        y: getY(d.score),
        score: Number(d.score).toFixed(1),
        role: d.role,
        difficulty: d.difficulty,
        num: d.interviewNumber || i + 1,
        date: d.date ? new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''
    }));

    const pathD = points.length === 1
        ? `M ${points[0].x} ${points[0].y}`
        : points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

    const areaD = points.length === 1
        ? ''
        : `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

    const yGridValues = [10, 8, 6, 4, 2, 0];

    return (
        <div className="animate-fade-in" style={{
            position: 'relative',
            backgroundColor: 'rgba(17, 24, 39, 0.85)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.5rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            overflow: 'hidden'
        }}>
            {/* Top Bar with Dynamic Metrics */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                paddingBottom: '0.85rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#38bdf8',
                        boxShadow: '0 0 10px #38bdf8'
                    }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#f8fafc' }}>
                        Performance Curve
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        ({data.length} session{data.length !== 1 ? 's' : ''})
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', fontSize: '0.82rem' }}>
                    <div>
                        <span style={{ color: '#94a3b8' }}>Latest: </span>
                        <strong style={{ color: '#38bdf8' }}>{latestScore} / 10</strong>
                    </div>
                    <div>
                        <span style={{ color: '#94a3b8' }}>Average: </span>
                        <strong style={{ color: '#cbd5e1' }}>{avgScore} / 10</strong>
                    </div>
                    <div>
                        <span style={{ color: '#94a3b8' }}>Best: </span>
                        <strong style={{ color: '#4ade80' }}>{bestScore} / 10</strong>
                    </div>
                </div>
            </div>

            {/* SVG Chart */}
            <svg 
                viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
            >
                <defs>
                    <linearGradient id="scoreAreaGradientSaaS" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                        <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="scoreLineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                    <filter id="glowSaaS" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.7" />
                    </filter>
                </defs>

                {/* Y-axis gridlines */}
                {yGridValues.map((val) => {
                    const y = getY(val);
                    return (
                        <g key={val}>
                            <line 
                                x1={padding.left} 
                                y1={y} 
                                x2={svgWidth - padding.right} 
                                y2={y} 
                                stroke="rgba(255, 255, 255, 0.05)" 
                                strokeDasharray="4 4" 
                                strokeWidth="1" 
                            />
                            <text 
                                x={padding.left - 12} 
                                y={y + 3.5} 
                                fill="#64748b" 
                                fontSize="11" 
                                fontWeight="500"
                                textAnchor="end"
                                fontFamily="sans-serif"
                            >
                                {val}
                            </text>
                        </g>
                    );
                })}

                {/* Gradient area fill */}
                {areaD && (
                    <path d={areaD} fill="url(#scoreAreaGradientSaaS)" />
                )}

                {/* Main trajectory line */}
                {points.length > 1 && (
                    <path 
                        d={pathD} 
                        fill="none" 
                        stroke="url(#scoreLineGradient)" 
                        strokeWidth="3.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        filter="url(#glowSaaS)"
                    />
                )}

                {/* Points & Interactive Nodes */}
                {points.map((p, i) => {
                    const isHovered = hoveredPoint === p;
                    return (
                        <g 
                            key={i} 
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredPoint(p)}
                            onMouseLeave={() => setHoveredPoint(null)}
                        >
                            {/* Outer Glow ring on hover */}
                            {isHovered && (
                                <circle 
                                    cx={p.x} 
                                    cy={p.y} 
                                    r="11" 
                                    fill="rgba(56, 189, 248, 0.25)" 
                                />
                            )}
                            <circle 
                                cx={p.x} 
                                cy={p.y} 
                                r={isHovered ? "7" : "5.5"} 
                                fill="#0284c7" 
                                stroke="#ffffff" 
                                strokeWidth="2.5" 
                                filter="url(#glowSaaS)"
                                style={{ transition: 'all 0.15s ease' }}
                            />
                            {/* Numeric label above point */}
                            <text 
                                x={p.x} 
                                y={p.y - 12} 
                                fill={isHovered ? "#38bdf8" : "#94a3b8"} 
                                fontSize={isHovered ? "12" : "11"} 
                                fontWeight="bold" 
                                textAnchor="middle"
                                fontFamily="sans-serif"
                            >
                                {p.score}
                            </text>
                            {/* X-axis date label */}
                            <text 
                                x={p.x} 
                                y={padding.top + chartHeight + 22} 
                                fill="#64748b" 
                                fontSize="10.5" 
                                fontWeight="500"
                                textAnchor="middle"
                                fontFamily="sans-serif"
                            >
                                {p.date || `#${p.num}`}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
                <div style={{
                    position: 'absolute',
                    top: '14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid #38bdf8',
                    borderRadius: '8px',
                    padding: '0.45rem 1rem',
                    fontSize: '0.8rem',
                    color: '#f8fafc',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 15px rgba(56, 189, 248, 0.3)',
                    pointerEvents: 'none',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                }}>
                    <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>{hoveredPoint.role}</span>
                    <span style={{ color: '#64748b' }}>•</span>
                    <span style={{ color: '#facc15' }}>{hoveredPoint.difficulty}</span>
                    <span style={{ color: '#64748b' }}>•</span>
                    <span>Score: <strong style={{ color: '#4ade80' }}>{hoveredPoint.score} / 10</strong></span>
                </div>
            )}
        </div>
    );
};

export default ScoreProgressionChart;
