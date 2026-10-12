import pool from '../config/db.js';

// Get a pending answer to annotate (BLIND — no expected_answer, no model info)
export const getPendingAnnotation = async (req, res) => {
    try {
        const annotatorId = req.user.id;
        
        // Find an answer that hasn't been annotated by this annotator yet
        // IMPORTANT: Only return question + candidate_answer. Do NOT return expected_answer, key_concepts, or model predictions.
        const query = `
            SELECT a.id as answer_id, a.candidate_answer, q.id as question_id, q.question
            FROM answers a
            JOIN questions q ON a.question_id = q.id
            WHERE a.id NOT IN (
                SELECT answer_id FROM answer_annotations WHERE annotator_id = $1
            )
            ORDER BY RANDOM()
            LIMIT 1;
        `;
        
        const result = await pool.query(query, [annotatorId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No pending answers to annotate.' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching pending annotation:', err);
        res.status(500).json({ error: 'Server error fetching pending annotation.' });
    }
};

// Submit an annotation
export const submitAnnotation = async (req, res) => {
    try {
        const annotatorId = req.user.id;
        const {
            answerId,
            technicalCorrectness,
            conceptCoverage,
            relevance,
            explanationQuality,
            score,
            notes
        } = req.body;
        
        if (score == null || score < 0 || score > 10) {
            return res.status(400).json({ error: 'Score must be between 0 and 10.' });
        }
        
        let quality = 'Average';
        if (score <= 2) quality = 'Very Poor';
        else if (score <= 4) quality = 'Poor';
        else if (score <= 6) quality = 'Average';
        else if (score <= 8) quality = 'Good';
        else quality = 'Excellent';
        
        const insertQuery = `
            INSERT INTO answer_annotations 
            (answer_id, annotator_id, technical_correctness, concept_coverage, relevance, explanation_quality, score, quality, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, answer_id, score, quality, created_at;
        `;
        
        const result = await pool.query(insertQuery, [
            answerId,
            annotatorId,
            technicalCorrectness,
            conceptCoverage,
            relevance,
            explanationQuality,
            score,
            quality,
            notes
        ]);
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error submitting annotation:', err);
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'You have already annotated this answer.' });
        }
        res.status(500).json({ error: 'Server error submitting annotation.' });
    }
};
