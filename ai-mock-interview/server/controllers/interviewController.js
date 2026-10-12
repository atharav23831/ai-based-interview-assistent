import pool from '../config/db.js';
import { evaluateAnswer as evaluateWithML } from '../services/mlService.js';
import { generatePersonalizedQuestions } from '../services/questionGenerator.js';

export const mapScoreToQuality = (score) => {
    const s = Number(score) || 0;
    if (s >= 9.0) return 'Excellent';
    if (s >= 7.0) return 'Good';
    if (s >= 5.0) return 'Average';
    if (s >= 3.0) return 'Poor';
    return 'Very Poor';
};

export const evaluateInterviewAnswer = async (req, res) => {
    try {
        const { questionId, answer, interviewId } = req.body;

        if (!questionId) return res.status(400).json({ error: 'questionId is required' });
        if (!interviewId) return res.status(400).json({ error: 'interviewId is required' });
        if (!answer || answer.trim().length === 0) return res.status(400).json({ error: 'answer is required and cannot be empty' });

        // Verify interview ownership
        const interviewCheck = await pool.query('SELECT user_id FROM interviews WHERE id = $1', [interviewId]);
        if (interviewCheck.rows.length === 0) return res.status(404).json({ error: 'Interview session not found' });
        if (interviewCheck.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized to access this interview session' });

        // Fetch question metadata from trusted database
        const questionResult = await pool.query('SELECT question, expected_answer, key_concepts FROM questions WHERE id = $1', [questionId]);
        if (questionResult.rows.length === 0) return res.status(404).json({ error: 'Question not found' });

        const questionData = questionResult.rows[0];

        // Call the FastAPI ML Service
        let mlResult;
        try {
            mlResult = await evaluateWithML(questionData.question, questionData.expected_answer, questionData.key_concepts || '', answer);
        } catch (mlError) {
            console.error('FastAPI Service Error:', mlError);
            return res.status(503).json({ error: 'ML Evaluation Service is currently unavailable. Please try again later.' });
        }

        // Strictly align quality with canonical application score bands
        const consistentQuality = mapScoreToQuality(mlResult.score);

        // Persist answer + ML evaluation
        const feedbackMetadata = JSON.stringify({
            quality: consistentQuality,
            confidence: mlResult.confidence,
            modelVersion: mlResult.modelVersion,
            strengths: mlResult.feedback?.strengths || [],
            improvements: mlResult.feedback?.improvements || []
        });

        await pool.query(
            'INSERT INTO answers (interview_id, question_id, candidate_answer, score, feedback) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [interviewId, questionId, answer, mlResult.score, feedbackMetadata]
        );

        return res.status(200).json({
            questionId,
            evaluation: {
                quality: consistentQuality,
                score: mlResult.score,
                confidence: mlResult.confidence,
                feedback: mlResult.feedback,
                modelVersion: mlResult.modelVersion
            }
        });
    } catch (error) {
        console.error('Error in evaluateInterviewAnswer controller:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

export const startInterview = async (req, res) => {
    try {
        const { role = 'General', difficulty = 'Medium' } = req.body;
        const insertRes = await pool.query(
            "INSERT INTO interviews (user_id, role, difficulty, status) VALUES ($1, $2, $3, 'ongoing') RETURNING id, role, difficulty, status, started_at",
            [req.user.id, role, difficulty]
        );
        res.status(201).json(insertRes.rows[0]);
    } catch (error) {
        console.error('Error starting interview:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ============================================================
// PERSONALIZED QUESTION SELECTION
// ============================================================

// Role → priority topics (ordered by relevance)
const ROLE_TOPICS = {
    'software engineer':    ['Data Structures', 'Algorithms', 'OOP', 'Java', 'Python', 'Database', 'Backend', 'REST', 'Operating Systems', 'Computer Networks', 'System Design'],
    'sde':                  ['Data Structures', 'Algorithms', 'OOP', 'Java', 'Python', 'Database', 'Backend', 'REST', 'Operating Systems', 'System Design'],
    'backend developer':    ['Java', 'Spring Boot', 'Node.js', 'Backend', 'REST', 'Database', 'SQL', 'PostgreSQL', 'MongoDB', 'Python'],
    'frontend developer':   ['JavaScript', 'React', 'HTML', 'CSS', 'Frontend', 'REST'],
    'full stack developer': ['JavaScript', 'React', 'Node.js', 'Backend', 'Database', 'REST', 'Java', 'Python', 'SQL'],
    'data scientist':       ['Python', 'Machine Learning', 'Algorithms', 'Data Structures', 'Database', 'SQL'],
    'machine learning engineer': ['Machine Learning', 'Python', 'Algorithms', 'Data Structures', 'Database'],
    'devops engineer':      ['Cloud Computing', 'Operating Systems', 'Computer Networks', 'Database', 'Backend'],
    'cloud engineer':       ['Cloud Computing', 'Computer Networks', 'Database', 'Backend', 'Operating Systems'],
    'iot engineer':         ['IoT', 'ESP32', 'Computer Networks', 'Python', 'C++', 'Cloud Computing', 'Database'],
    'general':              ['Data Structures', 'Algorithms', 'OOP', 'Database', 'Backend', 'REST', 'Operating Systems'],
};

// Technology keywords to detect in resume (word-boundary-aware where possible)
const TECH_KEYWORDS = [
    // Languages
    { keyword: 'java', topic: 'Java', score: 3 },
    { keyword: 'c++', topic: 'C++', score: 3 },
    { keyword: 'python', topic: 'Python', score: 3 },
    { keyword: 'javascript', topic: 'JavaScript', score: 3 },
    { keyword: 'typescript', topic: 'JavaScript', score: 2 },
    { keyword: 'sql', topic: 'SQL', score: 2 },
    // Frameworks
    { keyword: 'react', topic: 'React', score: 3 },
    { keyword: 'react.js', topic: 'React', score: 3 },
    { keyword: 'node.js', topic: 'Node.js', score: 3 },
    { keyword: 'express.js', topic: 'Node.js', score: 2 },
    { keyword: 'express', topic: 'Node.js', score: 2 },
    { keyword: 'spring boot', topic: 'Spring Boot', score: 3 },
    { keyword: 'spring', topic: 'Spring Boot', score: 2 },
    { keyword: 'next.js', topic: 'JavaScript', score: 2 },
    { keyword: 'tailwind', topic: 'React', score: 1 },
    // Databases
    { keyword: 'postgresql', topic: 'Database', score: 3 },
    { keyword: 'mysql', topic: 'Database', score: 3 },
    { keyword: 'mongodb', topic: 'Database', score: 3 },
    { keyword: 'firebase', topic: 'Database', score: 2 },
    { keyword: 'redis', topic: 'Database', score: 2 },
    // AI/ML
    { keyword: 'machine learning', topic: 'Machine Learning', score: 3 },
    { keyword: 'deep learning', topic: 'Machine Learning', score: 3 },
    { keyword: 'tensorflow', topic: 'Machine Learning', score: 2 },
    { keyword: 'pytorch', topic: 'Machine Learning', score: 2 },
    { keyword: 'anomaly detection', topic: 'Machine Learning', score: 3 },
    { keyword: 'llm', topic: 'Machine Learning', score: 2 },
    { keyword: 'artificial intelligence', topic: 'Machine Learning', score: 2 },
    { keyword: 'ai/ml', topic: 'Machine Learning', score: 3 },
    { keyword: 'sensor fusion', topic: 'IoT', score: 3 },
    // IoT
    { keyword: 'iot', topic: 'IoT', score: 3 },
    { keyword: 'esp32', topic: 'IoT', score: 3 },
    { keyword: 'esp-now', topic: 'IoT', score: 3 },
    { keyword: 'mqtt', topic: 'IoT', score: 2 },
    { keyword: 'sensors', topic: 'IoT', score: 2 },
    { keyword: 'embedded', topic: 'IoT', score: 2 },
    // Blockchain
    { keyword: 'blockchain', topic: 'Blockchain', score: 3 },
    { keyword: 'decentralized', topic: 'Blockchain', score: 2 },
    // Cloud / DevOps
    { keyword: 'docker', topic: 'Cloud Computing', score: 3 },
    { keyword: 'kubernetes', topic: 'Cloud Computing', score: 3 },
    { keyword: 'aws', topic: 'Cloud Computing', score: 3 },
    { keyword: 'cloud', topic: 'Cloud Computing', score: 2 },
    { keyword: 'edge computing', topic: 'Cloud Computing', score: 3 },
    // CS Fundamentals
    { keyword: 'data structures', topic: 'Data Structures', score: 3 },
    { keyword: 'algorithms', topic: 'Algorithms', score: 3 },
    { keyword: 'dynamic programming', topic: 'Algorithms', score: 2 },
    { keyword: 'dijkstra', topic: 'Algorithms', score: 2 },
    { keyword: 'object oriented', topic: 'OOP', score: 2 },
    { keyword: 'oop', topic: 'OOP', score: 2 },
    // Web
    { keyword: 'rest api', topic: 'REST', score: 3 },
    { keyword: 'rest', topic: 'REST', score: 2 },
    { keyword: 'backend', topic: 'Backend', score: 2 },
    // Networking
    { keyword: 'ccna', topic: 'Computer Networks', score: 3 },
    { keyword: 'networking', topic: 'Computer Networks', score: 2 },
    { keyword: 'routing', topic: 'Computer Networks', score: 2 },
];

// Project section headings pattern
const PROJECT_HEADING_RE = /(?:^|\n)\s*(?:PROJECTS?|ACADEMIC\s+PROJECTS?|TECHNICAL\s+PROJECTS?|EXPERIENCE|INTERNSHIPS?|WORK\s+EXPERIENCE)\s*(?:\n|$)/gi;
// Project title pattern: line with tech keywords after dash/em-dash/colon
const PROJECT_TITLE_RE = /^([A-Z][A-Za-z0-9\s\-–—]+?)(?:\s*[—–\-:•|])/gm;

function analyzeResume(resumeText) {
    const textLower = resumeText.toLowerCase();

    // 1. Detect technologies → topic scores
    const topicScores = {};
    for (const { keyword, topic, score } of TECH_KEYWORDS) {
        if (textLower.includes(keyword)) {
            topicScores[topic] = (topicScores[topic] || 0) + score;
        }
    }

    // 2. Extract project names
    const projects = [];
    const matches = resumeText.matchAll(PROJECT_TITLE_RE);
    for (const m of matches) {
        const name = m[1].trim();
        // Filter out non-project headings (all caps section headers, short words)
        if (name.length > 5 && name.length < 80 && !/^(?:EDUCATION|TECHNICAL\s+SKILLS|CERTIFICATIONS|CONTACT|SUMMARY)$/i.test(name)) {
            projects.push(name);
        }
    }

    return { topicScores, projects };
}

function scoreQuestion(question, resumeTopicScores, roleTopics, interviewDifficulty) {
    let score = 0;
    const qTopicLower = (question.topic || '').toLowerCase();
    const qDiffLower = (question.difficulty || '').toLowerCase();
    const diffLower = (interviewDifficulty || '').toLowerCase();

    // Resume relevance (max +6 per topic)
    for (const [topic, resumeScore] of Object.entries(resumeTopicScores)) {
        if (qTopicLower === topic.toLowerCase()) {
            score += Math.min(resumeScore, 6);
        }
    }

    // Role relevance
    const roleIdx = roleTopics.findIndex(t => t.toLowerCase() === qTopicLower);
    if (roleIdx !== -1) {
        score += Math.max(4 - roleIdx * 0.5, 1); // First topics get higher scores
    }

    // Difficulty match
    if (qDiffLower === diffLower) {
        score += 2;
    } else if (
        (diffLower === 'medium' && (qDiffLower === 'easy' || qDiffLower === 'hard')) ||
        (diffLower === 'easy' && qDiffLower === 'medium') ||
        (diffLower === 'hard' && qDiffLower === 'medium')
    ) {
        score += 0.5; // Adjacent difficulty gets a small bonus
    }

    return score;
}

export const getInterviewQuestions = async (req, res) => {
    try {
        const { id } = req.params;
        const MAX_QUESTIONS = 5;

        // Verify interview ownership + get role & difficulty
        const interviewCheck = await pool.query(
            'SELECT user_id, role, difficulty FROM interviews WHERE id = $1', [id]
        );
        if (interviewCheck.rows.length === 0) return res.status(404).json({ error: 'Interview not found' });
        if (interviewCheck.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

        const interviewRole = interviewCheck.rows[0].role || 'General';
        const interviewDifficulty = interviewCheck.rows[0].difficulty || 'Medium';
        const roleTopics = ROLE_TOPICS[interviewRole.toLowerCase()] || ROLE_TOPICS['general'];

        // Fetch latest resume
        const resumeResult = await pool.query(
            'SELECT extracted_text FROM resumes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.user.id]
        );
        const resumeText = resumeResult.rows[0]?.extracted_text?.trim() || '';

        // Analyze resume
        const { topicScores: resumeTopicScores, projects } = resumeText
            ? analyzeResume(resumeText)
            : { topicScores: {}, projects: [] };

        // --- STEP 1: Generate personalized questions via Ollama/Qwen ---
        let generatedQuestions = [];
        if (resumeText) {
            generatedQuestions = await generatePersonalizedQuestions(resumeText, interviewRole, interviewDifficulty);
        }
        const generatedCount = generatedQuestions.length;
        const dbSlotsNeeded = MAX_QUESTIONS - generatedCount;

        // --- STEP 2: Select remaining questions from DB ---
        // Exclude generated question IDs from DB selection
        const excludeIds = new Set(generatedQuestions.map(q => q.id));

        const allRelevantTopics = new Set([
            ...Object.keys(resumeTopicScores),
            ...roleTopics.slice(0, 6)
        ]);

        let dbQuestions = [];
        if (allRelevantTopics.size > 0) {
            const topics = [...allRelevantTopics];
            const topicParams = topics.map((_, i) => `LOWER($${i + 1})`).join(', ');
            const result = await pool.query(
                `SELECT id, question, topic, difficulty, role FROM questions
                 WHERE LOWER(topic) IN (${topicParams})
                 ORDER BY RANDOM()`,
                topics
            );
            dbQuestions = result.rows.filter(q => !excludeIds.has(q.id));
        }

        if (dbQuestions.length < dbSlotsNeeded * 3) {
            const existingIds = [...excludeIds, ...dbQuestions.map(q => q.id)];
            let fallbackQuery, fallbackParams;
            if (existingIds.length > 0) {
                const excludes = existingIds.map((_, i) => `$${i + 1}`).join(', ');
                fallbackQuery = `SELECT id, question, topic, difficulty, role FROM questions WHERE id NOT IN (${excludes}) ORDER BY RANDOM()`;
                fallbackParams = existingIds;
            } else {
                fallbackQuery = 'SELECT id, question, topic, difficulty, role FROM questions ORDER BY RANDOM()';
                fallbackParams = [];
            }
            const fallback = await pool.query(fallbackQuery, fallbackParams);
            dbQuestions = [...dbQuestions, ...fallback.rows];
        }

        // Score and rank DB questions
        const scored = dbQuestions.map(q => ({
            ...q,
            _score: scoreQuestion(q, resumeTopicScores, roleTopics, interviewDifficulty)
        }));
        scored.sort((a, b) => b._score - a._score);

        // Select top DB questions with topic diversity
        const selectedDb = [];
        const usedTopics = new Set();
        const usedTexts = new Set(generatedQuestions.map(q => q.question));

        // Pass 1: diverse topics
        for (const q of scored) {
            if (selectedDb.length >= dbSlotsNeeded) break;
            const topicKey = (q.topic || '').toLowerCase();
            if (!usedTopics.has(topicKey) && !usedTexts.has(q.question)) {
                selectedDb.push(q);
                usedTopics.add(topicKey);
                usedTexts.add(q.question);
            }
        }

        // Pass 2: fill remaining
        for (const q of scored) {
            if (selectedDb.length >= dbSlotsNeeded) break;
            if (!usedTexts.has(q.question)) {
                selectedDb.push(q);
                usedTexts.add(q.question);
            }
        }

        // --- STEP 3: Combine generated + DB questions ---
        // Interleave: generated first, then DB questions
        const finalQuestions = [
            ...generatedQuestions.map(q => ({ id: q.id, question: q.question })),
            ...selectedDb.map(q => ({ id: q.id, question: q.question }))
        ].slice(0, MAX_QUESTIONS);

        res.status(200).json(finalQuestions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getInterviewHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(`
            SELECT 
                i.id,
                i.role,
                i.difficulty,
                i.status,
                i.overall_score,
                i.started_at,
                i.completed_at,
                COUNT(a.id)::int AS questions_answered,
                ROUND(AVG(a.score), 2) AS calculated_score
            FROM interviews i
            LEFT JOIN answers a ON a.interview_id = i.id
            WHERE i.user_id = $1
            GROUP BY i.id
            ORDER BY i.started_at DESC
        `, [userId]);

        const answersResult = await pool.query(`
            SELECT a.interview_id, a.score, a.feedback
            FROM answers a
            JOIN interviews i ON i.id = a.interview_id
            WHERE i.user_id = $1
        `, [userId]);

        const feedbackMap = {};
        for (const row of answersResult.rows) {
            if (!feedbackMap[row.interview_id]) {
                feedbackMap[row.interview_id] = { confidences: [], qualities: [] };
            }
            try {
                const fb = typeof row.feedback === 'string' ? JSON.parse(row.feedback) : row.feedback;
                if (fb?.confidence != null) feedbackMap[row.interview_id].confidences.push(Number(fb.confidence));
                if (fb?.quality) feedbackMap[row.interview_id].qualities.push(fb.quality);
            } catch (e) {}
        }

        const interviews = result.rows.map(row => {
            const fb = feedbackMap[row.id] || { confidences: [], qualities: [] };
            const avgConf = fb.confidences.length > 0 
                ? fb.confidences.reduce((a, b) => a + b, 0) / fb.confidences.length 
                : null;
            
            const scoreNum = Number(row.overall_score != null ? row.overall_score : (row.calculated_score != null ? row.calculated_score : 0));
            let quality = 'Not Attempted';
            if (row.questions_answered > 0) {
                quality = mapScoreToQuality(scoreNum);
            }

            return {
                id: row.id,
                role: row.role,
                difficulty: row.difficulty,
                status: row.status,
                overall_score: row.overall_score != null ? Number(row.overall_score) : (row.calculated_score != null ? Number(row.calculated_score) : null),
                questions_answered: row.questions_answered,
                avg_confidence: avgConf,
                quality,
                started_at: row.started_at,
                completed_at: row.completed_at
            };
        });

        const completed = interviews.filter(iv => iv.questions_answered > 0);
        const totalQuestions = interviews.reduce((sum, iv) => sum + iv.questions_answered, 0);
        const scores = completed.map(iv => iv.overall_score).filter(s => s != null && !isNaN(s));
        const avgScore = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0;
        const bestScore = scores.length > 0 ? Number(Math.max(...scores).toFixed(1)) : 0;

        const progression = [...completed]
            .filter(iv => iv.overall_score != null)
            .reverse()
            .map((iv, idx) => ({
                interviewNumber: idx + 1,
                id: iv.id,
                role: iv.role,
                difficulty: iv.difficulty,
                score: iv.overall_score,
                date: iv.started_at
            }));

        res.status(200).json({
            interviews,
            stats: {
                totalInterviews: interviews.length,
                completedInterviews: completed.length,
                averageScore: avgScore,
                bestScore: bestScore,
                totalQuestionsAnswered: totalQuestions,
                progression
            }
        });
    } catch (error) {
        console.error('Error fetching interview history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const completeInterview = async (req, res) => {
    try {
        const { id } = req.params;

        const interviewCheck = await pool.query(
            'SELECT id, user_id, role, difficulty, status FROM interviews WHERE id = $1', [id]
        );
        if (interviewCheck.rows.length === 0) return res.status(404).json({ error: 'Interview not found' });
        if (interviewCheck.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

        const answersRes = await pool.query(
            'SELECT score, feedback FROM answers WHERE interview_id = $1', [id]
        );

        let overallScore = 0;
        const strengths = [];
        const improvements = [];

        if (answersRes.rows.length > 0) {
            const scores = answersRes.rows.map(a => Number(a.score) || 0);
            overallScore = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));

            for (const a of answersRes.rows) {
                try {
                    const fb = typeof a.feedback === 'string' ? JSON.parse(a.feedback) : a.feedback;
                    if (fb?.strengths) strengths.push(...fb.strengths);
                    if (fb?.improvements) improvements.push(...fb.improvements);
                } catch (e) {}
            }
        }

        await pool.query(`
            UPDATE interviews 
            SET status = 'completed', overall_score = $1, completed_at = CURRENT_TIMESTAMP 
            WHERE id = $2
        `, [overallScore, id]);

        const uniqueStrengths = [...new Set(strengths)].join('; ');
        const uniqueWeaknesses = [...new Set(improvements)].join('; ');
        const recommendations = overallScore >= 7.0 
            ? 'Candidate demonstrates solid conceptual and practical knowledge.'
            : 'Focus on core system concepts, architectural trade-offs, and concrete implementation details.';

        // Check if report already exists for this interview
        const existingReport = await pool.query('SELECT id FROM interview_reports WHERE interview_id = $1', [id]);
        if (existingReport.rows.length > 0) {
            await pool.query(`
                UPDATE interview_reports 
                SET overall_score = $1, strengths = $2, weaknesses = $3, recommendations = $4
                WHERE interview_id = $5
            `, [overallScore, uniqueStrengths, uniqueWeaknesses, recommendations, id]);
        } else {
            await pool.query(`
                INSERT INTO interview_reports (interview_id, overall_score, strengths, weaknesses, recommendations)
                VALUES ($1, $2, $3, $4, $5)
            `, [id, overallScore, uniqueStrengths, uniqueWeaknesses, recommendations]);
        }

        res.status(200).json({
            message: 'Interview marked as completed',
            interviewId: Number(id),
            overallScore
        });
    } catch (error) {
        console.error('Error completing interview:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getInterviewReport = async (req, res) => {
    try {
        const { id } = req.params;

        const interviewCheck = await pool.query(
            'SELECT id, user_id, role, difficulty, status, overall_score, started_at, completed_at FROM interviews WHERE id = $1', [id]
        );
        if (interviewCheck.rows.length === 0) return res.status(404).json({ error: 'Interview not found' });
        if (interviewCheck.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized to view this interview report' });

        const interview = interviewCheck.rows[0];

        const answersResult = await pool.query(`
            SELECT 
                a.id AS answer_id,
                a.question_id,
                a.candidate_answer,
                a.score,
                a.feedback,
                q.question,
                q.topic,
                q.difficulty AS question_difficulty
            FROM answers a
            JOIN questions q ON q.id = a.question_id
            WHERE a.interview_id = $1
            ORDER BY a.id ASC
        `, [id]);

        const answers = answersResult.rows;

        const allStrengths = [];
        const allImprovements = [];
        const topicScores = {};
        const confidences = [];
        const questionBreakdown = [];

        for (let i = 0; i < answers.length; i++) {
            const ans = answers[i];
            let fb = {};
            try {
                fb = typeof ans.feedback === 'string' ? JSON.parse(ans.feedback) : ans.feedback;
            } catch (e) {}

            const score = Number(ans.score) || 0;
            const confidence = fb.confidence != null ? Number(fb.confidence) : null;
            const quality = mapScoreToQuality(score);

            if (confidence != null) confidences.push(confidence);
            if (fb.strengths) allStrengths.push(...fb.strengths);
            if (fb.improvements) allImprovements.push(...fb.improvements);

            const topic = ans.topic || 'General';
            if (!topicScores[topic]) {
                topicScores[topic] = { total: 0, count: 0 };
            }
            topicScores[topic].total += score;
            topicScores[topic].count += 1;

            questionBreakdown.push({
                questionNumber: i + 1,
                questionId: ans.question_id,
                question: ans.question,
                topic,
                difficulty: ans.question_difficulty,
                candidateAnswer: ans.candidate_answer,
                score,
                quality,
                confidence,
                strengths: fb.strengths || [],
                improvements: fb.improvements || []
            });
        }

        const avgScore = answers.length > 0 
            ? Number((answers.reduce((acc, a) => acc + Number(a.score || 0), 0) / answers.length).toFixed(1))
            : (interview.overall_score != null ? Number(interview.overall_score) : 0);

        const avgConfidence = confidences.length > 0
            ? Number((confidences.reduce((a, b) => a + b, 0) / confidences.length).toFixed(2))
            : null;

        let overallQuality = 'Not Attempted';
        if (answers.length > 0) {
            overallQuality = mapScoreToQuality(avgScore);
        }

        const topicPerformance = Object.entries(topicScores).map(([topic, data]) => ({
            topic,
            averageScore: Number((data.total / data.count).toFixed(1)),
            questionCount: data.count
        }));

        const uniqueStrengths = [...new Set(allStrengths)];
        const uniqueImprovements = [...new Set(allImprovements)];

        if (uniqueStrengths.length === 0 && avgScore >= 6.0) {
            uniqueStrengths.push('Demonstrated solid conceptual foundations');
            uniqueStrengths.push('Structured answers with relevant technical terminology');
        }
        if (uniqueImprovements.length === 0 && avgScore < 7.0) {
            uniqueImprovements.push('Provide deeper concrete implementation details and edge-case handling');
        }

        res.status(200).json({
            interview: {
                id: interview.id,
                role: interview.role,
                difficulty: interview.difficulty,
                status: interview.status,
                started_at: interview.started_at,
                completed_at: interview.completed_at
            },
            summary: {
                overallScore: avgScore,
                overallQuality,
                averageConfidence: avgConfidence,
                questionsAttempted: answers.length
            },
            topicPerformance,
            strengths: uniqueStrengths,
            improvements: uniqueImprovements,
            questions: questionBreakdown
        });
    } catch (error) {
        console.error('Error fetching interview report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

