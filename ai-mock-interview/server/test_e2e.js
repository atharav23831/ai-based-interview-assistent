import fetch from 'node-fetch'; // assuming node 18+ native fetch or run natively
import pool from './config/db.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:5000/api';

const runE2ETests = async () => {
    console.log('--- Starting Phase 19 End-to-End Integration Tests ---\n');

    // 1. Setup Test User and Token
    const userRes = await pool.query('SELECT id FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
        console.error('❌ No users found in database. Run seed.sql first.');
        process.exit(1);
    }
    const userId = userRes.rows[0].id;
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 2. Setup Test Interview Session
    const interviewRes = await pool.query('SELECT id FROM interviews WHERE user_id = $1 LIMIT 1', [userId]);
    let interviewId;
    if (interviewRes.rows.length === 0) {
        const insertRes = await pool.query("INSERT INTO interviews (user_id, role, difficulty, status) VALUES ($1, 'Test', 'Easy', 'ongoing') RETURNING id", [userId]);
        interviewId = insertRes.rows[0].id;
    } else {
        interviewId = interviewRes.rows[0].id;
    }

    // 3. Setup Test Question
    const questionRes = await pool.query('SELECT id, question FROM questions LIMIT 1');
    if (questionRes.rows.length === 0) {
        console.error('❌ No questions found in database.');
        process.exit(1);
    }
    const questionId = questionRes.rows[0].id;

    // Helper function to send evaluation request
    const evaluate = async (payload, headers) => {
        const response = await fetch(`${API_URL}/interview/evaluate`, {
            method: 'POST',
            headers: headers || authHeaders,
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        return { status: response.status, data };
    };

    // --- TEST SUITE --- //

    // Test A: Unauthorized Request (No Token)
    console.log('Testing: Unauthorized request');
    let res = await evaluate({ questionId, interviewId, answer: "Test" }, { 'Content-Type': 'application/json' });
    if (res.status === 401) console.log('✅ Passed: Unauthenticated request rejected.');
    else console.error('❌ Failed:', res);

    // Test B: Attempt to manipulate metadata
    console.log('\nTesting: Security - Manipulating expected metadata');
    res = await evaluate({
        questionId,
        interviewId,
        answer: "Hacked answer",
        expected_answer: "Hacked answer",
        key_concepts: "Hacked, answer"
    });
    // The backend should ignore the manipulated expected_answer and use the real one. 
    // Thus, "Hacked answer" will get a Very Poor score.
    if (res.status === 200 && res.data.evaluation.quality === 'Very Poor') {
        console.log('✅ Passed: Client metadata overrides successfully ignored.');
    } else {
        console.error('❌ Failed:', res);
    }

    // Test C: Good technical answer
    console.log('\nTesting: Good technical answer');
    // We assume the first question is the HashMap one from our seed
    res = await evaluate({
        questionId,
        interviewId,
        answer: "A HashMap stores key-value pairs using hashing. It provides O(1) time complexity for lookup operations."
    });
    if (res.status === 200 && (res.data.evaluation.quality === 'Good' || res.data.evaluation.quality === 'Excellent')) {
        console.log('✅ Passed: Good answer evaluated correctly.');
    } else {
        console.error('❌ Failed:', res);
    }

    // Test D: Empty answer
    console.log('\nTesting: Empty answer');
    res = await evaluate({ questionId, interviewId, answer: "   " });
    if (res.status === 400) {
        console.log('✅ Passed: Empty answer rejected gracefully.');
    } else {
        console.error('❌ Failed:', res);
    }

    // Test E: Database Persistence Check
    console.log('\nTesting: Database Persistence');
    const answerRes = await pool.query('SELECT * FROM answers WHERE interview_id = $1 ORDER BY id DESC LIMIT 1', [interviewId]);
    let targetAnswerId;
    if (answerRes.rows.length > 0) {
        const savedAnswer = answerRes.rows[0];
        targetAnswerId = savedAnswer.id;
        const feedback = JSON.parse(savedAnswer.feedback);
        if (feedback.modelVersion === 'synthetic-v1' && savedAnswer.score > 0) {
            console.log('✅ Passed: Evaluation successfully persisted with ML metadata.');
        } else {
            console.error('❌ Failed: Metadata mismatch in DB.', savedAnswer);
        }
    } else {
        console.error('❌ Failed: Answer not saved to DB.');
    }

    // --- PHASE 23: ANNOTATION TESTS ---
    console.log('\n--- Phase 23: Annotation Tests ---');

    // Helper for Annotations
    const submitAnnotation = async (payload) => {
        const response = await fetch(`${API_URL}/annotations`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        return { status: response.status, data };
    };

    if (targetAnswerId) {
        // Clear previous annotations for this test answer to allow idempotency during testing
        await pool.query('DELETE FROM answer_annotations WHERE answer_id = $1', [targetAnswerId]);

        console.log('Testing: Invalid Negative Score');
        res = await submitAnnotation({ answerId: targetAnswerId, score: -1, technicalCorrectness: 5, conceptCoverage: 5, relevance: 5, explanationQuality: 5 });
        if (res.status === 400) console.log('✅ Passed: Negative score rejected.');
        else console.error('❌ Failed:', res);

        console.log('Testing: Invalid Overscore (>10)');
        res = await submitAnnotation({ answerId: targetAnswerId, score: 11, technicalCorrectness: 5, conceptCoverage: 5, relevance: 5, explanationQuality: 5 });
        if (res.status === 400) console.log('✅ Passed: >10 score rejected.');
        else console.error('❌ Failed:', res);

        console.log('Testing: Valid Annotation Submission');
        res = await submitAnnotation({ 
            answerId: targetAnswerId, 
            score: 8, 
            technicalCorrectness: 8, 
            conceptCoverage: 8, 
            relevance: 9, 
            explanationQuality: 7 
        });
        if (res.status === 201 && res.data.quality === 'Good') console.log('✅ Passed: Valid annotation saved with quality auto-mapped.');
        else console.error('❌ Failed:', res);

        console.log('Testing: Duplicate Annotation by Same User');
        res = await submitAnnotation({ answerId: targetAnswerId, score: 9 });
        if (res.status === 400) console.log('✅ Passed: Duplicate annotation rejected natively.');
        else console.error('❌ Failed:', res);
    } else {
        console.log('⚠️ Skipped: Annotation tests skipped because no answer was persisted.');
    }

    console.log('\n--- End-to-End Tests Complete ---');
    process.exit(0);
};

runE2ETests();
