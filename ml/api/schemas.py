from pydantic import BaseModel, Field
from typing import List, Optional

class PredictionRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000, description="The interview question asked.")
    answer: str = Field(..., max_length=10000, description="The candidate's answer.")
    expected_answer: Optional[str] = Field(default="", max_length=10000, description="The expected ideal answer.")
    key_concepts: Optional[str] = Field(default="", max_length=1000, description="Comma-separated key technical concepts expected.")

class Feedback(BaseModel):
    strengths: List[str]
    improvements: List[str]

class PredictionResponse(BaseModel):
    quality: str
    score: float
    confidence: float
    feedback: Feedback

class HealthResponse(BaseModel):
    status: str
    models_loaded: bool
