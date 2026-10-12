import pandas as pd
import numpy as np
import joblib
import json
import warnings
import sys
warnings.filterwarnings('ignore')

from preprocessing import preprocess_dataframe
from features import FeatureExtractor

def map_score_to_quality(score: float) -> str:
    """Maps continuous score [0.0 - 10.0] to canonical application quality bands:
       0 - 2 = Very Poor
       3 - 4 = Poor
       5 - 6 = Average
       7 - 8 = Good
       9 - 10 = Excellent
    """
    if score >= 9.0:
        return "Excellent"
    elif score >= 7.0:
        return "Good"
    elif score >= 5.0:
        return "Average"
    elif score >= 3.0:
        return "Poor"
    else:
        return "Very Poor"

class InterviewAnswerEvaluator:
    def __init__(self, model_dir='../models'):
        try:
            self.extractor = joblib.load(f'{model_dir}/feature_extractor.pkl')
            self.class_model = joblib.load(f'{model_dir}/best_model_classifier.pkl')
            self.reg_model = joblib.load(f'{model_dir}/best_model_regressor.pkl')
            
            with open(f'{model_dir}/best_model_name.txt', 'r') as f:
                self.model_name = f.read().strip()
                
            if self.model_name == 'XGBoost':
                self.le = joblib.load(f'{model_dir}/label_encoder.pkl')
        except FileNotFoundError as e:
            raise RuntimeError(f"Failed to load models from {model_dir}. Ensure training script has run. Error: {e}")
            
    def generate_feedback(self, df):
        strengths = []
        improvements = []
        
        cand = str(df['candidate_answer'].iloc[0]).strip()
        if not cand:
            return {"strengths": [], "improvements": ["Answer is empty."]}
            
        word_count = len(cand.split())
        
        # Calculate heuristics directly for feedback
        from features import compute_semantic_concept_coverage
        coverage = compute_semantic_concept_coverage(cand, df['key_concepts'].iloc[0], self.extractor.sbert_model)
        
        if coverage >= 0.8:
            strengths.append("Excellent technical concept coverage.")
        elif coverage >= 0.5:
            strengths.append("Covers some key technical concepts.")
            improvements.append("Could include more relevant technical terms.")
        else:
            improvements.append("Missing major key concepts. Review the core technical definitions.")
            
        if word_count < 10:
            improvements.append("Answer is very short. Consider explaining in more detail.")
        elif word_count > 150:
            improvements.append("Answer is quite long. Try to be more concise and focused.")
            
        return {
            "strengths": strengths,
            "improvements": improvements
        }

    def predict(self, question, expected_answer, candidate_answer, key_concepts):
        # Graceful handling
        if not question or not str(question).strip():
            return {"error": "Missing question."}
        if candidate_answer is None or not str(candidate_answer).strip():
            return {
                "quality": "Very Poor",
                "score": 0.0,
                "confidence": 0.99,
                "feedback": {"strengths": [], "improvements": ["Answer is empty."]}
            }
            
        df = pd.DataFrame([{
            'question': question,
            'expected_answer': expected_answer,
            'candidate_answer': candidate_answer,
            'key_concepts': key_concepts
        }])
        
        df = preprocess_dataframe(df)
        X = self.extractor.transform(df)
        
        # Predict Quality and Confidence
        if self.model_name == 'XGBoost':
            probs = self.class_model.predict_proba(X)[0]
            classes = self.le.classes_
        else:
            probs = self.class_model.predict_proba(X)[0]
            classes = self.class_model.classes_
        confidence = float(np.max(probs))
            
        # Predict Score
        band_centers = {'Very Poor': 1.0, 'Poor': 3.5, 'Average': 5.5, 'Good': 7.5, 'Excellent': 9.5}
        score_clf = sum(float(p) * band_centers.get(c, 5.0) for c, p in zip(classes, probs))
        score_reg = float(self.reg_model.predict(X)[0])

        # Semantic relevance check: if semantic_sim is very low and concept_coverage is 0,
        # the answer is off-topic/irrelevant (e.g. answering BFS when asked about HashMap)
        sem_sim = float(X[0, 8]) if X.shape[1] > 8 else 0.0
        cov = float(X[0, 6]) if X.shape[1] > 6 else 0.0
        if sem_sim < 0.25 and cov == 0.0:
            raw_score = min(score_reg, score_clf, 2.0)
        else:
            raw_score = confidence * score_clf + (1.0 - confidence) * score_reg

        score = float(np.clip(round(raw_score, 1), 0.0, 10.0))
        
        # Enforce canonical application quality bands strictly aligned with score:
        # 0 - 2 = Very Poor, 3 - 4 = Poor, 5 - 6 = Average, 7 - 8 = Good, 9 - 10 = Excellent
        quality = map_score_to_quality(score)
        
        feedback = self.generate_feedback(df)
        
        return {
            "quality": str(quality),
            "score": score,
            "confidence": round(confidence, 2),
            "feedback": feedback
        }

if __name__ == '__main__':
    # Test example
    try:
        evaluator = InterviewAnswerEvaluator(model_dir='../models')
        
        question = "What is a HashMap in Java?"
        expected_answer = "HashMap stores key-value pairs using a hash table. It provides average O(1) time complexity for lookup and insertion."
        candidate_answer = "HashMap stores data in key value form and uses hashing to find values quickly."
        key_concepts = "key-value, hash table, O(1), lookup, insertion"
        
        result = evaluator.predict(question, expected_answer, candidate_answer, key_concepts)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
