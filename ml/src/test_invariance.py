import pandas as pd
import json
import os
import random
from predict import InterviewAnswerEvaluator
import warnings
warnings.filterwarnings('ignore')

def main():
    evaluator = InterviewAnswerEvaluator(model_dir='../models')
    
    question = "What is a HashMap in Java?"
    expected = "HashMap stores key-value pairs using a hash table. It provides average O(1) time complexity for lookup and insertion. It does not maintain order and allows one null key."
    concepts = "key-value, hash table, O(1), lookup, insertion, null key"
    
    base_ans = "A HashMap stores key-value pairs using a hash table. It offers O(1) average time complexity for lookups."
    
    test_cases = [
        {"desc": "Original", "ans": base_ans},
        {"desc": "Lowercase", "ans": base_ans.lower()},
        {"desc": "Uppercase", "ans": base_ans.upper()},
        {"desc": "Random capitalization", "ans": "".join(c.upper() if random.random() > 0.5 else c.lower() for c in base_ans)},
        {"desc": "Punctuation stripped", "ans": base_ans.replace(".", "").replace("-", " ")},
        {"desc": "Excessive punctuation", "ans": base_ans.replace(".", "!!!").replace(" ", ", ")},
        {"desc": "Extra spaces", "ans": "  A   HashMap   stores   key-value   pairs.  "},
        {"desc": "Minor spelling errors", "ans": "A HshMap stors key-value pirs using a hash tabl. It ofers O(1) avg time complexity for lukups."},
        {"desc": "Synonymous wording", "ans": "A dictionary structure saves identifiers mapped to values via hashing, delivering constant average access time for searches."},
        {"desc": "Sentence reordering", "ans": "It offers O(1) average time complexity for lookups. A HashMap stores key-value pairs using a hash table."}
    ]
    
    results = []
    base_res = evaluator.predict(question, expected, base_ans, concepts)
    
    print("Running Invariance Evaluation...\n")
    print(f"Base Score: {base_res['score']}, Base Quality: {base_res['quality']}")
    
    diffs = []
    conf_diffs = []
    stable_count = 0
    
    for tc in test_cases[1:]:
        res = evaluator.predict(question, expected, tc['ans'], concepts)
        
        score_diff = abs(res['score'] - base_res['score'])
        conf_diff = abs(res['confidence'] - base_res['confidence'])
        
        diffs.append(score_diff)
        conf_diffs.append(conf_diff)
        
        # Consider it stable if score change <= 1.0 and quality doesn't drop by more than 1 category
        is_stable = score_diff <= 1.5
        if is_stable:
            stable_count += 1
            
        results.append({
            "transformation": tc['desc'],
            "input": tc['ans'],
            "predicted_quality": res['quality'],
            "predicted_score": res['score'],
            "confidence": res['confidence'],
            "score_diff": score_diff
        })
        
        print(f"--- {tc['desc']} ---")
        print(f"Prediction: {res['quality']} (Score: {res['score']}, Conf: {res['confidence']}) -> Diff: {score_diff:.2f}")
        
    os.makedirs('../results', exist_ok=True)
    
    avg_diff = sum(diffs)/len(diffs)
    max_diff = max(diffs)
    avg_conf_diff = sum(conf_diffs)/len(conf_diffs)
    rate = stable_count / len(diffs)
    
    with open('../results/invariance_report.md', 'w') as f:
        f.write("# Invariance Testing Report\n\n")
        f.write(f"- **Prediction Consistency Rate:** {rate*100:.1f}%\n")
        f.write(f"- **Average Score Difference:** {avg_diff:.3f}\n")
        f.write(f"- **Maximum Score Difference:** {max_diff:.3f}\n")
        f.write(f"- **Average Confidence Difference:** {avg_conf_diff:.3f}\n\n")
        
        f.write("## Transformations\n")
        for r in results:
            f.write(f"### {r['transformation']}\n")
            f.write(f"- **Input:** {r['input']}\n")
            f.write(f"- **Score:** {r['predicted_score']} (Diff: {r['score_diff']:.2f})\n")
            f.write(f"- **Quality:** {r['predicted_quality']}\n\n")

if __name__ == '__main__':
    main()
