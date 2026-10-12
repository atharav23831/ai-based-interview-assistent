import pandas as pd
import json
import os
from predict import InterviewAnswerEvaluator
import warnings
warnings.filterwarnings('ignore')

def main():
    evaluator = InterviewAnswerEvaluator(model_dir='../models')
    
    question = "What is a HashMap in Java?"
    expected = "HashMap stores key-value pairs using a hash table. It provides average O(1) time complexity for lookup and insertion. It does not maintain order and allows one null key."
    concepts = "key-value, hash table, O(1), lookup, insertion, null key"
    
    test_cases = [
        {
            "desc": "1. Short but correct",
            "ans": "It stores key-value pairs using a hash table for O(1) lookup.",
            "exp_quality": "High",
            "exp_score_min": 7.0
        },
        {
            "desc": "2. Long but wrong",
            "ans": "HashMap is a user interface component. " * 5,
            "exp_quality": "Low",
            "exp_score_max": 4.0
        },
        {
            "desc": "3. Long and irrelevant",
            "ans": "HashMap stores key-value pairs. Java is a programming language. I use Python more. Cats are nice. " * 3,
            "exp_quality": "Low/Medium",
            "exp_score_max": 6.0
        },
        {
            "desc": "4. Short but incomplete",
            "ans": "It uses keys and values.",
            "exp_quality": "Low/Medium",
            "exp_score_max": 6.0
        },
        {
            "desc": "5. Correct answer using synonyms",
            "ans": "A dictionary structure that maps identifiers to values via hashing, giving constant time access.",
            "exp_quality": "High",
            "exp_score_min": 7.0
        },
        {
            "desc": "6. Correct answer using completely different wording",
            "ans": "You can save associative arrays in it. It computes an index from the object to store data fast.",
            "exp_quality": "Medium/High",
            "exp_score_min": 6.0
        },
        {
            "desc": "7. Repeated meaningless text",
            "ans": "key-value key-value key-value key-value key-value key-value key-value key-value",
            "exp_quality": "Low",
            "exp_score_max": 4.0
        },
        {
            "desc": "8. Technically correct but poorly explained",
            "ans": "Hash map is like key value and O(1) and it puts things inside.",
            "exp_quality": "Medium",
            "exp_score_min": 4.0
        },
        {
            "desc": "9. Excellent detailed answer",
            "ans": "A HashMap is a core Java collection that stores elements as key-value pairs. It uses a hashing algorithm to compute an index, providing amortized O(1) time complexity for basic operations like get and put. It allows a single null key and multiple null values, but does not guarantee iteration order.",
            "exp_quality": "High",
            "exp_score_min": 8.0
        },
        {
            "desc": "10. Empty answer",
            "ans": "",
            "exp_quality": "Low",
            "exp_score_max": 1.0
        },
        {
            "desc": "11. Spelling errors",
            "ans": "HshMp stors ke-valu pirs usng hshing. It gives 0(1) lokup.",
            "exp_quality": "Medium/High",
            "exp_score_min": 5.0
        },
        {
            "desc": "12. Excessive punctuation/capitalization",
            "ans": "HASHMAP STORES KEY-VALUE PAIRS!!! IT HAS O(1) LOOKUP TIME!?!",
            "exp_quality": "High",
            "exp_score_min": 7.0
        },
        {
            "desc": "13. Irrelevant technical terminology",
            "ans": "HashMap uses polymorphism and inheritance to implement a REST API for the database.",
            "exp_quality": "Low",
            "exp_score_max": 4.0
        },
        {
            "desc": "14. Very long answer containing only generic statements",
            "ans": "A HashMap is very important in software engineering. Many developers use it every day. It is a fundamental concept that you must learn to pass interviews. I have used it in many projects during my time at university. It is great.",
            "exp_quality": "Low",
            "exp_score_max": 4.0
        },
        {
            "desc": "15. Contradiction / Incorrectness",
            "ans": "HashMap stores data sequentially in an array and does not use hashing. It provides O(N) lookup time.",
            "exp_quality": "Low",
            "exp_score_max": 4.0
        }
    ]
    
    results = []
    passed = 0
    failed = 0
    
    print("Running Adversarial Evaluation...\n")
    
    for tc in test_cases:
        res = evaluator.predict(question, expected, tc['ans'], concepts)
        
        score = res['score']
        
        # Determine pass/fail based on expected bounds
        is_pass = True
        if 'exp_score_min' in tc and score < tc['exp_score_min']:
            is_pass = False
        if 'exp_score_max' in tc and score > tc['exp_score_max']:
            is_pass = False
            
        if is_pass:
            passed += 1
        else:
            failed += 1
            
        output = {
            "test": tc['desc'],
            "input": tc['ans'],
            "predicted_quality": res['quality'],
            "predicted_score": res['score'],
            "confidence": res['confidence'],
            "passed": is_pass
        }
        results.append(output)
        
        print(f"--- {tc['desc']} ---")
        print(f"Prediction: {res['quality']} (Score: {res['score']}, Conf: {res['confidence']}) -> {'PASS' if is_pass else 'FAIL'}")
        
    os.makedirs('../results', exist_ok=True)
    with open('../results/adversarial_results.json', 'w') as f:
        json.dump(results, f, indent=2)
        
    with open('../results/adversarial_results.txt', 'w') as f:
        f.write(f"Adversarial Tests Passed: {passed}/{len(test_cases)}\n")
        f.write(f"Adversarial Tests Failed: {failed}/{len(test_cases)}\n\n")
        for r in results:
            if not r['passed']:
                f.write(f"FAILED: {r['test']}\n")
                f.write(f"Score: {r['predicted_score']}\n")
                f.write(f"Input: {r['input']}\n\n")

if __name__ == '__main__':
    main()
