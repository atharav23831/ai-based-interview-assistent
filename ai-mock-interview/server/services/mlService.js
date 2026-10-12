const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8765';
const MODEL_VERSION = 'synthetic-v1';

/**
 * Evaluate an interview answer using the external ML Service.
 * 
 * @param {string} question The interview question
 * @param {string} expectedAnswer The expected ideal answer from the trusted DB
 * @param {string} keyConcepts Comma-separated key concepts from the trusted DB
 * @param {string} candidateAnswer The actual candidate answer text
 * @returns {Object} Evaluation result containing quality, score, confidence, and feedback
 */
export const evaluateAnswer = async (question, expectedAnswer, keyConcepts, candidateAnswer) => {
    try {
        const response = await fetch(`${ML_SERVICE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: question,
                expected_answer: expectedAnswer,
                key_concepts: keyConcepts,
                answer: candidateAnswer
            }),
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`ML Service responded with ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return {
            quality: data.quality,
            score: data.score,
            confidence: data.confidence,
            feedback: data.feedback,
            modelVersion: MODEL_VERSION
        };
    } catch (error) {
        console.error('ML Service Error:', error);
        throw new Error('Failed to evaluate answer via ML service.');
    }
};
