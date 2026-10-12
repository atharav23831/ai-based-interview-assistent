import json
import os
from predict import InterviewAnswerEvaluator
import warnings
warnings.filterwarnings('ignore')

def main():
    evaluator = InterviewAnswerEvaluator(model_dir='../models')
    
    question = "What is a process?"
    expected = "A process is a program in execution."
    concepts = "program, execution"
    
    # 1. Spelling Robustness
    spelling_cases = [
        {"desc": "Original", "ans": "A process is a program in execution."},
        {"desc": "Lightly misspelled", "ans": "A proces is a program in execusion."}
    ]
    
    spell_results = []
    for tc in spelling_cases:
        res = evaluator.predict(question, expected, tc['ans'], concepts)
        spell_results.append({
            "test": tc['desc'],
            "input": tc['ans'],
            "quality": res['quality'],
            "score": res['score'],
            "confidence": res['confidence']
        })
        
    os.makedirs('../results', exist_ok=True)
    with open('../results/spelling_robustness.json', 'w') as f:
        json.dump(spell_results, f, indent=2)
        
    # 2. Formatting Robustness
    question_hash = "What is a HashMap in Java?"
    expected_hash = "HashMap stores key-value pairs using a hash table."
    concepts_hash = "key-value, hash table"
    
    formatting_cases = [
        {"desc": "Normal", "ans": "HashMap stores key-value pairs."},
        {"desc": "Excessive", "ans": "HashMap!!! stores??? key-value pairs!!!"},
        {"desc": "No punctuation", "ans": "HashMap stores key value pairs"}
    ]
    
    fmt_results = []
    for tc in formatting_cases:
        res = evaluator.predict(question_hash, expected_hash, tc['ans'], concepts_hash)
        fmt_results.append({
            "test": tc['desc'],
            "input": tc['ans'],
            "quality": res['quality'],
            "score": res['score'],
            "confidence": res['confidence']
        })
        
    with open('../results/formatting_robustness.json', 'w') as f:
        json.dump(fmt_results, f, indent=2)

if __name__ == '__main__':
    main()
