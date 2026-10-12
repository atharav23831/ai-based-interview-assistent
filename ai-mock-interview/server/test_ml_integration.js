import { evaluateAnswer } from './services/mlService.js';
import dotenv from 'dotenv';
dotenv.config();

const runTests = async () => {
    console.log('--- Starting ML Integration Tests ---');
    
    // 1. Valid Answer
    try {
        console.log('\nTesting Valid Answer...');
        const res = await evaluateAnswer(
            "What is a HashMap in Java?",
            "HashMap stores key-value pairs using a hash table. It provides average O(1) time complexity for lookup and insertion.",
            "key-value, hash table, O(1), lookup, insertion",
            "HashMap stores data in key value form and uses hashing to find values quickly."
        );
        console.log('Result:', res);
        if (res.quality && res.score > 0) {
            console.log('✅ Valid Answer Test Passed');
        } else {
            console.error('❌ Valid Answer Test Failed');
        }
    } catch (error) {
        console.error('❌ Valid Answer Test Failed:', error.message);
    }

    // 2. Empty Answer
    try {
        console.log('\nTesting Empty Answer...');
        const res = await evaluateAnswer(
            "What is a HashMap in Java?",
            "HashMap stores key-value pairs...",
            "key-value",
            "   "
        );
        console.log('Result:', res);
        if (res.quality === 'Very Poor') {
            console.log('✅ Empty Answer Test Passed');
        } else {
            console.error('❌ Empty Answer Test Failed');
        }
    } catch (error) {
        console.error('❌ Empty Answer Test Failed:', error.message);
    }
    
    // 3. FastAPI Unavailable (Mocked by pointing to a dead port)
    try {
        console.log('\nTesting FastAPI Unavailable...');
        process.env.ML_SERVICE_URL = 'http://localhost:9999';
        await evaluateAnswer(
            "Question", "Expected", "Concepts", "Answer"
        );
        console.error('❌ FastAPI Unavailable Test Failed (Should have thrown)');
    } catch (error) {
        console.log('✅ FastAPI Unavailable Test Passed (Caught Error:', error.message, ')');
    }

    console.log('\n--- ML Integration Tests Complete ---');
    process.exit(0);
};

runTests();
