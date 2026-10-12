import pandas as pd
import json
from predict import InterviewAnswerEvaluator
import warnings
warnings.filterwarnings('ignore')

def main():
    evaluator = InterviewAnswerEvaluator(model_dir='../models')
    
    base_question = "What is a HashMap in Java?"
    expected_answer = "HashMap stores key-value pairs using a hash table. It provides average O(1) time complexity for lookup and insertion. It does not maintain order and allows one null key."
    key_concepts = "key-value, hash table, O(1), lookup, insertion, null key"
    
    test_cases = [
        {
            "desc": "1. Very short but technically correct answer.",
            "ans": "It stores key-value pairs using hashing and provides O(1) lookup."
        },
        {
            "desc": "2. Long but technically incorrect answer.",
            "ans": "HashMap is a class in Java that is used to create graphical user interfaces. It provides a map of the screen where you can place buttons and text fields. I used it a lot when building my web browser project last year. It relies on the internet to function properly."
        },
        {
            "desc": "3. Correct answer using completely different wording.",
            "ans": "It's a dictionary-like data structure that maps identifiers to values via a hash function, allowing for constant time access on average without guaranteeing element sequence."
        },
        {
            "desc": "4. Partially correct answer.",
            "ans": "It holds data in keys and values. But it is very slow."
        },
        {
            "desc": "5. Correct concept but poor explanation.",
            "ans": "Hash map is like key value and O(1) and it puts things inside."
        },
        {
            "desc": "6. Excellent answer with concise wording.",
            "ans": "A key-value data structure backed by an array and hashing function, offering amortized O(1) reads/writes. Unordered, permits single null key."
        },
        {
            "desc": "7. Answer containing irrelevant information.",
            "ans": "HashMap stores key-value pairs using a hash table. It provides average O(1) time complexity. By the way, I really like programming in Python and my favorite color is blue."
        },
        {
            "desc": "8. Empty answer.",
            "ans": ""
        },
        {
            "desc": "9. Extremely short answer.",
            "ans": "key value"
        },
        {
            "desc": "10. Extremely long answer.",
            "ans": ("HashMap is a part of Java's collection framework since Java 1.2. " * 10) + "It stores key-value pairs."
        },
        {
            "desc": "11. Unknown question.",
            "q": "What is the capital of France?",
            "e": "Paris is the capital of France.",
            "k": "Paris",
            "ans": "Paris."
        },
        {
            "desc": "12. Answer with spelling mistakes.",
            "ans": "HshMp stors ke-valu pirs usng hshing. It gives 0(1) lokup."
        },
        {
            "desc": "13. Answer with unusual capitalization.",
            "ans": "hASHmAP STORES KEY-VALUE PAIRS USING A HASH TABLE. IT HAS O(1) LOOKUP."
        },
        {
            "desc": "14. Answer with excessive punctuation.",
            "ans": "HashMap stores key-value pairs!!! It uses hashing?? Yes... O(1) lookup time!!"
        }
    ]
    
    print("Running Robustness Tests...\n")
    
    for tc in test_cases:
        print(f"--- {tc['desc']} ---")
        print(f"Input: {tc['ans']}")
        
        q = tc.get('q', base_question)
        e = tc.get('e', expected_answer)
        k = tc.get('k', key_concepts)
        
        result = evaluator.predict(q, e, tc['ans'], k)
        print(f"Prediction: {result['quality']} (Score: {result['score']}, Conf: {result['confidence']})")
        print(f"Feedback: {json.dumps(result.get('feedback', {}), indent=2)}")
        print()

if __name__ == '__main__':
    main()
