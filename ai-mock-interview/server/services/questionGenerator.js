/**
 * questionGenerator.js — Generates personalized interview questions
 * using local Ollama/Qwen2.5 3B model.
 *
 * Called by interviewController.getInterviewQuestions.
 * Falls back gracefully if Ollama is unavailable.
 */

import pool from '../config/db.js';

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'qwen2.5:3b-instruct';
const OLLAMA_TIMEOUT_MS = 60000; // 60 second timeout

/**
 * Extract the first complete JSON object from text using balanced brace counting.
 * Handles nested braces, string literals with escaped characters.
 */
function extractBalancedJSON(text) {
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');

    if (firstBrace === -1 && firstBracket === -1) return null;

    let start, openChar, closeChar;
    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
        start = firstBracket;
        openChar = '[';
        closeChar = ']';
    } else {
        start = firstBrace;
        openChar = '{';
        closeChar = '}';
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (escaped) { escaped = false; continue; }
        if (ch === '\\') { escaped = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === openChar) depth++;
        if (ch === closeChar) {
            depth--;
            if (depth === 0) return text.substring(start, i + 1);
        }
    }
    return null; // Unbalanced
}

/**
 * Build a structured prompt for Qwen.
 * Only includes information actually present in the resume.
 */
function buildPrompt(role, difficulty, skills, projects, experience) {
    const skillList = skills.join(', ');
    const projectBlock = projects.length > 0
        ? `\nCandidate Projects:\n${projects.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
        : '';
    const expBlock = experience.length > 0
        ? `\nCandidate Experience:\n${experience.map((e, i) => `${i + 1}. ${e}`).join('\n')}`
        : '';

    return `You are an expert technical interviewer. Generate exactly 4 interview questions for a candidate.

Candidate Role: ${role}
Interview Difficulty: ${difficulty}
Candidate Skills/Technologies: ${skillList}${projectBlock}${expBlock}

STRICT RULES:
1. Generate EXACTLY 4 questions as a JSON array.
2. At least 2 questions MUST be about specific projects listed above.
3. Questions must ONLY reference technologies and skills listed above. Do NOT introduce any technology, framework, database, tool, or pattern that is NOT in the candidate's skills list.
4. The "expected_answer" should describe what a strong answer should contain — do NOT fabricate what the candidate implemented.
5. The "key_concepts" must only contain concepts from the candidate's listed skills/technologies.
6. Difficulty must be "${difficulty}".
7. Keep each expected_answer concise (2-3 sentences).
8. Do NOT generate generic textbook questions. Ask about the candidate's actual work.

Respond with ONLY valid JSON, no markdown, no explanation:
{"questions":[{"question":"...","topic":"...","difficulty":"${difficulty}","expected_answer":"...","key_concepts":["...",".."]},{"question":"...","topic":"...","difficulty":"${difficulty}","expected_answer":"...","key_concepts":["...",".."]},{"question":"...","topic":"...","difficulty":"${difficulty}","expected_answer":"...","key_concepts":["...",".."]},{"question":"...","topic":"...","difficulty":"${difficulty}","expected_answer":"...","key_concepts":["...",".."]}]}`;
}

/**
 * Extract structured info from resume text for the prompt.
 * Returns { skills, projects, experience } — all string arrays.
 */
function extractResumeInfo(resumeText) {
    const text = resumeText || '';
    const textLower = text.toLowerCase();

    // Detect skills/technologies
    const KNOWN_SKILLS = [
        'Java', 'C++', 'C', 'Python', 'JavaScript', 'TypeScript', 'SQL',
        'React', 'React.js', 'Node.js', 'Express.js', 'Next.js', 'Angular', 'Vue.js',
        'Spring Boot', 'Spring', 'Django', 'Flask', 'FastAPI',
        'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap',
        'PostgreSQL', 'MySQL', 'MongoDB', 'Firebase', 'Redis',
        'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
        'Git', 'GitHub', 'Linux',
        'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
        'Anomaly Detection', 'LLM', 'Ollama',
        'IoT', 'ESP32', 'ESP-NOW', 'MQTT', 'Sensors', 'Sensor Fusion',
        'Blockchain', 'Ethereum', 'Solidity',
        'REST API', 'REST APIs', 'GraphQL', 'WebSocket',
        'Data Structures', 'Algorithms', 'Dynamic Programming',
        'CCNA', 'Networking',
    ];
    const skills = KNOWN_SKILLS.filter(s => textLower.includes(s.toLowerCase()));

    // Extract project entries — handles PDF text with multiple spaces and no newlines
    const projects = [];
    // Pattern: "Project Name — Tech1 • Tech2" (allowing multi-space gaps from PDF)
    const projectTitleRe = /([A-Z][A-Za-z0-9](?:[A-Za-z0-9\s\-–—']*[A-Za-z0-9]))\s+[—–\-]+\s+([A-Z][A-Za-z0-9\s•·,&/\-–]+?)(?=\s{2,}[A-Z•]|\s*$)/g;
    for (const m of text.matchAll(projectTitleRe)) {
        const name = m[1].replace(/\s+/g, ' ').trim();
        const techContext = m[2].replace(/\s+/g, ' ').trim();
        if (name.length > 8 && name.length < 80 &&
            !/^(?:EDUCATION|TECHNICAL\s+SKILLS|CERTIFICATIONS|CONTACT|SUMMARY|EXPERIENCE|PROJECTS?)$/i.test(name) &&
            !/^(?:Class\s|B\.Tech|M\.Tech|CGPA)/i.test(name)) {
            projects.push(`${name} (${techContext})`);
        }
    }

    // Fallback: if no projects found with regex, look for known project-like phrases
    if (projects.length === 0) {
        const projectKeywords = [
            'flood', 'warning system', 'predictive maintenance',
            'article generator', 'mock interview', 'monitoring system',
            'chat app', 'e-commerce', 'management system'
        ];
        for (const kw of projectKeywords) {
            if (textLower.includes(kw)) {
                // Extract surrounding context
                const idx = textLower.indexOf(kw);
                const start = Math.max(0, text.lastIndexOf('  ', idx) + 2);
                const end = Math.min(text.length, text.indexOf('  ', idx + kw.length));
                const snippet = text.substring(start, end > start ? end : idx + 60).replace(/\s+/g, ' ').trim();
                if (snippet.length > 10) projects.push(snippet);
            }
        }
    }

    // Extract experience entries
    const experience = [];
    const expRe = /(?:Intern|Engineer|Developer|Analyst|Scientist|Associate)[^.]*?(?:—|–|-)\s*([A-Za-z0-9\s&.,]+)/gi;
    for (const m of text.matchAll(expRe)) {
        experience.push(m[0].replace(/\s+/g, ' ').trim());
    }

    return { skills, projects: projects.slice(0, 3), experience: experience.slice(0, 2) };
}

/**
 * Call Ollama and parse the response.
 * Returns parsed JSON or null on failure.
 */
async function callOllama(prompt) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

    try {
        const res = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt,
                stream: false,
                options: { temperature: 0.4, num_predict: 2048 }
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!res.ok) {
            console.warn(`[QuestionGenerator] Ollama returned ${res.status}`);
            return null;
        }

        const data = await res.json();
        const responseText = (data.response || '').trim();

        if (!responseText) {
            console.warn('[QuestionGenerator] Ollama returned empty response');
            return null;
        }

        // Extract JSON using balanced brace matching
        const jsonStr = extractBalancedJSON(responseText);
        if (!jsonStr) {
            console.warn('[QuestionGenerator] No JSON object found in response. First 200 chars:', responseText.substring(0, 200));
            return null;
        }

        try {
            return JSON.parse(jsonStr);
        } catch (parseErr) {
            console.warn('[QuestionGenerator] JSON parse error:', parseErr.message, 'First 200 chars:', jsonStr.substring(0, 200));
            return null;
        }
    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
            console.warn('[QuestionGenerator] Ollama request timed out');
        } else {
            console.warn(`[QuestionGenerator] Ollama error: ${err.message}`);
        }
        return null;
    }
}

/**
 * Validate generated questions against candidate's known skills.
 * Rejects questions that hallucinate technologies not in the resume.
 */
export function validateQuestions(questions, knownSkills, difficulty, resumeText = '') {
    if (!Array.isArray(questions)) return [];

    const knownLower = new Set(knownSkills.map(s => s.toLowerCase()));
    const resumeTextLower = (resumeText || '').toLowerCase();

    // Common hallucinated technologies to flag
    const SUSPECT_TECHS = [
        'redis', 'kafka', 'rabbitmq', 'kubernetes', 'docker', 'aws', 'azure', 'gcp',
        'microservices', 'cdn', 'nginx', 'graphql', 'grpc', 'elasticsearch',
        'jenkins', 'terraform', 'ansible', 'prometheus', 'grafana', 'websocket',
        'sse', 'oauth', 'stripe', 'twilio', 'sendgrid',
    ];

    // Common ungrounded implementation claims that should only appear if explicitly in resume
    const UNGROUNDED_IMPLEMENTATION_CLAIMS = [
        'caching', 'cache',
        'real-time communication', 'real-time messaging',
        'load balancing', 'load balancer',
        'ci/cd', 'continuous integration', 'continuous deployment',
        'rate limiting', 'rate limiter',
        'sharding',
        'replication',
        'message queue', 'message broker',
        'smart contracts', 'smart contract',
        'microservices', 'microservice',
        'serverless',
        'cdn',
        'oauth', 'single sign-on', 'sso',
        'service mesh',
        'web scraping',
        'distributed transactions'
    ];

    // Phrasing patterns where the question asks about implementing/using a specific feature
    const IMPLEMENT_PATTERNS = [
        /how (?:did|do) you (?:implement|use|handle|build|integrate|incorporate|deploy|design)\s+([^?.!,;:]+)/gi,
        /explain how you (?:implemented|used|handled|built|integrated|incorporated|deployed|designed)\s+([^?.!,;:]+)/gi,
        /detail your (?:implementation of|approach to)\s+([^?.!,;:]+)/gi,
        /why did you (?:choose|implement|use)\s+([^?.!,;:]+)/gi,
    ];

    const STOP_WORDS = new Set([
        'the', 'and', 'for', 'with', 'from', 'into', 'your', 'using', 'that', 'this',
        'system', 'project', 'application', 'backend', 'frontend', 'ensure', 'about',
        'some', 'what', 'which', 'their', 'work', 'technology', 'technologies',
        'method', 'methods', 'feature', 'features', 'architecture', 'concept', 'concepts',
        'approach', 'implementation', 'process', 'part', 'code', 'data', 'service',
        'services', 'solution', 'solutions', 'role', 'internship'
    ]);

    const valid = [];
    const seenTexts = new Set();

    for (const q of questions) {
        // Check required fields
        if (!q.question || typeof q.question !== 'string' || q.question.length < 15) continue;
        if (!q.expected_answer || typeof q.expected_answer !== 'string' || q.expected_answer.length < 20) continue;
        if (!q.topic || typeof q.topic !== 'string') continue;
        if (!q.key_concepts) continue;

        // Normalize key_concepts to string
        const keyConcepts = Array.isArray(q.key_concepts) ? q.key_concepts.join(', ') : String(q.key_concepts);

        // Enforce difficulty
        if (q.difficulty && q.difficulty.toLowerCase() !== difficulty.toLowerCase()) {
            q.difficulty = difficulty; // Fix it rather than rejecting
        }

        // Check for hallucinated technologies in question text
        const qTextLower = (q.question + ' ' + q.expected_answer).toLowerCase();
        let hallucinated = false;
        for (const suspect of SUSPECT_TECHS) {
            if (qTextLower.includes(suspect) && !knownLower.has(suspect)) {
                console.warn(`[QuestionGenerator] Rejected: hallucinated "${suspect}" in question`);
                hallucinated = true;
                break;
            }
        }
        if (hallucinated) continue;

        // Check for unsupported implementation claims (e.g. caching, load balancing, sharding)
        if (resumeTextLower) {
            let ungroundedClaim = null;
            for (const claim of UNGROUNDED_IMPLEMENTATION_CLAIMS) {
                if ((qTextLower.includes(claim) || keyConcepts.toLowerCase().includes(claim)) && !resumeTextLower.includes(claim)) {
                    ungroundedClaim = claim;
                    break;
                }
            }
            if (ungroundedClaim) {
                console.warn(`[QuestionGenerator] Rejected: unsupported implementation claim "${ungroundedClaim}" not in resume context`);
                continue;
            }

            // Lightweight dynamic grounding check for "How did you implement/use X" patterns
            let hasUngroundedSubject = false;
            for (const pattern of IMPLEMENT_PATTERNS) {
                const matches = q.question.matchAll(pattern);
                for (const match of matches) {
                    const subject = match[1].toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');
                    const words = subject.split(/\s+/).filter(w => w.length >= 4 && !STOP_WORDS.has(w));
                    if (words.length > 0) {
                        const supportedWords = words.filter(w => resumeTextLower.includes(w));
                        if (supportedWords.length === 0) {
                            console.warn(`[QuestionGenerator] Rejected: unsupported implementation subject "${match[1].trim()}"`);
                            hasUngroundedSubject = true;
                            break;
                        }
                    }
                }
                if (hasUngroundedSubject) break;
            }
            if (hasUngroundedSubject) continue;
        }

        // Deduplicate
        if (seenTexts.has(q.question.toLowerCase())) continue;
        seenTexts.add(q.question.toLowerCase());

        valid.push({
            question: q.question.trim(),
            topic: q.topic.trim(),
            difficulty: difficulty,
            expected_answer: q.expected_answer.trim(),
            key_concepts: keyConcepts,
        });
    }

    return valid.slice(0, 2);
}

/**
 * Save generated questions to the questions table so they get real IDs
 * compatible with the existing evaluation pipeline.
 */
async function saveGeneratedQuestions(questions) {
    const saved = [];
    for (const q of questions) {
        try {
            const result = await pool.query(
                `INSERT INTO questions (question, topic, difficulty, role, type, expected_answer, key_concepts)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [q.question, q.topic, q.difficulty, 'Generated', 'Project-Specific', q.expected_answer, q.key_concepts]
            );
            saved.push({ id: result.rows[0].id, question: q.question });
        } catch (err) {
            console.warn(`[QuestionGenerator] Failed to save question: ${err.message}`);
        }
    }
    return saved;
}

/**
 * Main entry point: generate 2 personalized questions using Ollama/Qwen.
 * Returns array of { id, question } or empty array on failure.
 */
export async function generatePersonalizedQuestions(resumeText, role, difficulty) {
    if (!resumeText || resumeText.trim().length < 30) {
        return []; // Not enough resume content
    }

    try {
        const { skills, projects, experience } = extractResumeInfo(resumeText);

        if (skills.length < 2) {
            console.warn('[QuestionGenerator] Too few skills detected, skipping generation');
            return [];
        }

        console.log(`[QuestionGenerator] Detected ${skills.length} skills: ${skills.slice(0, 8).join(', ')}...`);
        console.log(`[QuestionGenerator] Detected ${projects.length} projects`);

        const prompt = buildPrompt(role, difficulty, skills, projects, experience);
        const parsed = await callOllama(prompt);

        if (!parsed) {
            console.warn('[QuestionGenerator] callOllama returned null');
            return [];
        }

        // Normalize response: Qwen may return a single object, an array, or {questions:[...]}
        let questions;
        if (parsed.questions && Array.isArray(parsed.questions)) {
            questions = parsed.questions;
        } else if (Array.isArray(parsed)) {
            questions = parsed;
        } else if (parsed.question && parsed.topic) {
            // Single question object returned directly
            questions = [parsed];
        } else {
            console.warn('[QuestionGenerator] Unexpected response shape. Keys:', Object.keys(parsed).join(', '));
            return [];
        }

        const validated = validateQuestions(questions, skills, difficulty, resumeText);
        console.log(`[QuestionGenerator] Qwen candidates: ${questions.length}, passing validation: ${validated.length}`);

        if (validated.length === 0) {
            console.warn('[QuestionGenerator] All generated questions failed validation');
            return [];
        }

        const saved = await saveGeneratedQuestions(validated);
        console.log(`[QuestionGenerator] Generated and saved ${saved.length} personalized questions`);
        return saved;
    } catch (err) {
        console.warn(`[QuestionGenerator] Generation failed: ${err.message}`);
        return [];
    }
}
