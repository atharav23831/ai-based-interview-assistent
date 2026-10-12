from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
import traceback

from api.schemas import PredictionRequest, PredictionResponse, HealthResponse
from api.predictor import ml_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Mock Interview ML API",
    description="API for evaluating mock interview answers using frozen ML models.",
    version="1.0.0"
)

# CORS configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    try:
        ml_service.load_models()
    except Exception as e:
        logger.error(f"Failed to load ML models at startup: {e}")
        logger.error(traceback.format_exc())

@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="ok",
        models_loaded=ml_service.is_loaded
    )

@app.post("/predict", response_model=PredictionResponse)
def predict_answer(request: PredictionRequest):
    if not ml_service.is_loaded:
        raise HTTPException(status_code=503, detail="ML models are not loaded or failed to load.")
        
    try:
        # The existing predict handles empty answer safely, but we add an explicit fallback here just in case.
        result = ml_service.predict(request)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
            
        return PredictionResponse(**result)
        
    except ValueError as ve:
        logger.error(f"Validation error during prediction: {ve}")
        raise HTTPException(status_code=422, detail="Invalid input data format.")
    except Exception as e:
        logger.error(f"Unexpected prediction error: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error during prediction.")
