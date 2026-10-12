import pandas as pd
import numpy as np
import joblib
import os

from predict import InterviewAnswerEvaluator

def main():
    evaluator = InterviewAnswerEvaluator(model_dir='../models')
    
    question = "What is a HashMap in Java?"
    expected = "HashMap stores key-value pairs using a hash table. It provides average O(1) time complexity for lookup and insertion. It does not maintain order and allows one null key."
    concepts = "key-value, hash table, O(1), lookup, insertion, null key"
    
    test_cases = [
        {
            "case": "A. Short technically correct answer.",
            "ans": "It stores key-value pairs using hashing and provides O(1) lookup."
        },
        {
            "case": "B. Same answer expanded with irrelevant sentences.",
            "ans": "It stores key-value pairs using hashing and provides O(1) lookup. I like programming in Java because it is object-oriented. My professor told me that HashMaps are widely used in the industry."
        },
        {
            "case": "C. Same answer expanded with meaningless repetition.",
            "ans": "It stores key-value pairs using hashing and provides O(1) lookup. It stores key-value pairs using hashing and provides O(1) lookup. It stores key-value pairs using hashing and provides O(1) lookup."
        },
        {
            "case": "D. Long technically incorrect answer.",
            "ans": "HashMap is a class in Java that is used to create graphical user interfaces. It provides a map of the screen where you can place buttons and text fields. I used it a lot when building my web browser project last year. It relies on the internet to function properly."
        },
        {
            "case": "E. Short technically excellent answer.",
            "ans": "Key-value structure, hashing, O(1) access, single null key."
        }
    ]
    
    results = []
    
    for tc in test_cases:
        ans = tc['ans']
        res = evaluator.predict(question, expected, ans, concepts)
        
        # We also need word count, etc.
        word_count = len(ans.split())
        
        results.append({
            "case": tc['case'],
            "word_count": word_count,
            "predicted_quality": res['quality'],
            "predicted_score": res['score'],
            "confidence": res['confidence']
        })
        
    df = pd.DataFrame(results)
    os.makedirs('../results', exist_ok=True)
    df.to_csv('../results/length_bias_analysis.csv', index=False)
    
    with open('../results/bias_analysis.txt', 'w') as f:
        f.write("--- Length Bias Analysis ---\n\n")
        for r in results:
            f.write(f"Case: {r['case']}\n")
            f.write(f"Word Count: {r['word_count']}\n")
            f.write(f"Predicted Quality: {r['predicted_quality']}\n")
            f.write(f"Predicted Score: {r['predicted_score']}\n")
            f.write(f"Confidence: {r['confidence']}\n\n")
            
    print("Bias analysis completed. Results saved to results/bias_analysis.txt and results/length_bias_analysis.csv")

if __name__ == '__main__':
    main()
