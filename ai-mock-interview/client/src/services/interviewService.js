import API from './api.js';

/**
 * Starts a new interview session.
 * @param {string} role - The role for the interview
 * @param {string} difficulty - The difficulty level
 */
export const startInterview = async (role, difficulty) => {
    const response = await API.post('/interview/start', { role, difficulty });
    return response.data;
};

/**
 * Fetches the questions for an interview session.
 * @param {number} interviewId 
 */
export const getInterviewQuestions = async (interviewId) => {
    const response = await API.get(`/interview/${interviewId}/questions`);
    return response.data;
};

/**
 * Submits an answer for ML evaluation.
 * @param {number} interviewId - The ID of the current interview session
 * @param {number} questionId - The ID of the question being answered
 * @param {string} answer - The candidate's text answer
 */
export const evaluateAnswer = async (interviewId, questionId, answer) => {
    const response = await API.post('/interview/evaluate', {
        interviewId,
        questionId,
        answer
    });
    return response.data;
};
