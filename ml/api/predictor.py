import sys
import os
import logging

# Ensure src module is in path so we can import the existing ML logic
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.insert(0, os.path.join(project_root, 'src'))

from predict import InterviewAnswerEvaluator
from api.schemas import PredictionRequest, PredictionResponse

logger = logging.getLogger(__name__)

class MLService:
    def __init__(self):
        self.evaluator = None
        self.is_loaded = False
        
    def load_models(self):
        if not self.is_loaded:
            logger.info("Loading ML models into memory...")
            model_dir = os.getenv("MODEL_DIR", os.path.join(project_root, 'models'))
            self.evaluator = InterviewAnswerEvaluator(model_dir=model_dir)
            self.is_loaded = True
            logger.info("Models loaded successfully.")
            
    def predict(self, request: PredictionRequest) -> dict:
        if not self.is_loaded:
            raise RuntimeError("Models are not loaded.")
            
        return self.evaluator.predict(
            question=request.question,
            expected_answer=request.expected_answer,
            candidate_answer=request.answer,
            key_concepts=request.key_concepts
        )

# Global instance initialized once per server worker
ml_service = MLService()
