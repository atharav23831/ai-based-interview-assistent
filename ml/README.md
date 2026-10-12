# AI Mock Interview Platform - Machine Learning Pipeline (FROZEN)

> **STATUS: PROTOTYPE-READY & FROZEN**
> The synthetic Machine Learning pipeline has been successfully evaluated, hardened for formatting/spelling robustness, empirically calibrated, and formally frozen. It is now awaiting real human-annotated data for production retraining. See `DATA_COLLECTION_GUIDE.md` for instructions.## 1. Project Objective
This module evaluates a candidate's technical interview answer by comparing it to an expected reference answer and predefined key concepts. It determines the quality of the answer and assigns a numerical score.

This is a **Multi-class Classification** problem to predict the qualitative category (`Very Poor`, `Poor`, `Average`, `Good`, `Excellent`), combined with a **Regression** problem to predict the exact numerical score (0.0-10.0).

## 2. ML Architecture
The pipeline extracts a multi-modal feature vector containing Linguistic features (log-normalized), Heuristic features (TF-IDF similarity), and Semantic features (`sentence-transformers`). These features are passed to a Logistic Regression classifier and an XGBoost Regressor to predict the outputs. 
The prediction API then calculates evidence-based feedback by assessing semantic concept coverage thresholds.

## 3. Dataset
Due to a lack of public real-world annotated data, the dataset (`interview_dataset.csv`) is **Synthetic**.
- **Samples:** 5,500 answers.
- **Questions:** 20 distinct Software Engineering questions.
- **Classes:** 5 (evenly distributed).

## 4. Semantic Concept Matching
Instead of naive substring matching, the pipeline uses semantic embeddings (`all-MiniLM-L6-v2`) to compare the expected concepts against chunks of the candidate's answer. If the cosine similarity exceeds `0.65`, the concept is marked as covered. This enables the model to properly evaluate valid synonyms and paraphrased answers.

## 5. Model Calibration
The Logistic Regression classifier was evaluated for probability calibration. It achieved a multi-class Brier score of `0.1382`, indicating good mathematical calibration against the synthetic distribution. However, confidence scores should be treated as heuristic rather than absolute truth in real-world scenarios.

## 6. Training Process (Leakage Prevention)
We address data leakage via **Grouped Train/Val/Test Splitting**:
- 60% of questions for Training.
- 20% of questions for Validation.
- 20% of questions for Testing (Unseen Questions).
This ensures the model generalizes to entirely new questions rather than memorizing base templates.

## 7. Example JSON Output
```json
{
  "quality": "Average",
  "score": 6.0,
  "confidence": 0.72,
  "feedback": {
    "strengths": [
      "Covers some key technical concepts."
    ],
    "improvements": [
      "Could include more relevant technical terms.",
      "Answer is very short. Consider explaining in more detail."
    ]
  }
}
```

## 8. Limitations
- **Synthetic Data:** The model was trained entirely on synthetic data. The reported accuracy (96%) does **not** establish real-world interview grading accuracy.
- **Length Bias:** Despite log-normalization, synthetic data naturally links answer length to quality. The models still occasionally suffer from length bias when evaluating extremely verbose but irrelevant text.

## 9. How to run the project

### Start the API Server
The frozen ML pipeline is exposed via a FastAPI service:
```bash
uvicorn api.main:app --reload
```
This will start the server on `http://127.0.0.1:8000`. The models are loaded into memory once at startup.

### API Endpoints
- **Health Check**: `GET /health`
- **Prediction**: `POST /predict`

#### Example Request
```bash
curl -X POST "http://127.0.0.1:8000/predict" \
     -H "Content-Type: application/json" \
     -d '{
           "question": "What is a HashMap in Java?",
           "expected_answer": "HashMap stores key-value pairs using a hash table. It provides average O(1) time complexity for lookup.",
           "key_concepts": "key-value, hash table, O(1), lookup",
           "answer": "HashMap stores data in key value form and uses hashing to find values quickly."
         }'
```

#### Example Response
```json
{
  "quality": "Average",
  "score": 6.0,
  "confidence": 0.72,
  "feedback": {
    "strengths": [
      "Covers some key technical concepts."
    ],
    "improvements": [
      "Could include more relevant technical terms."
    ]
  }
}
```

Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### Run the ML Validation Pipeline
If you need to regenerate data or test the pipeline:
```bash
python data/generate_data.py
python src/analyze_bias.py
python src/train.py
python src/evaluate.py
python src/test_adversarial.py
python src/predict.py
```

## 10. Future Improvements
- Train on a real-world annotated dataset to eliminate synthetic length biases.
- Implement LLM-based (e.g. Gemini, OpenAI) zero-shot extraction to augment feature engineering.
