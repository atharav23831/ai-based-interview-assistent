# AI Mock Interview Platform

A full-stack application that provides AI-powered mock interviews. The platform is designed with a frozen ML service isolated behind a secure backend, ensuring candidates cannot spoof or manipulate their interview grades.

## End-to-End Architecture (Phase 20)

```text
┌─────────────────┐      ┌─────────────┐      ┌──────────────┐
│  React Client   │ ───► │   Node.js   │ ───► │  PostgreSQL  │
│ (Browser State) │ ◄─── │  (Express)  │ ◄─── │  (Questions) │
└─────────────────┘      └──────┬──────┘      └──────────────┘
                                │
                                ▼
                         ┌──────────────┐     ┌──────────────┐
                         │ FastAPI (ML) │ ──► │  Frozen ML   │
                         └──────────────┘     │    Models    │
                                              └──────────────┘
```

The flow:
1. React client sends `questionId`, `interviewId`, and `answer`.
2. Node.js authorizes the request and fetches trusted metadata (`expected_answer`, `key_concepts`) from PostgreSQL.
3. Node.js sends the text strings securely to the FastAPI container.
4. FastAPI uses LogisticRegression + TFIDF/SBERT to compute `quality`, `score`, `confidence`, and array `feedback`.
5. Node.js persists the ML output to PostgreSQL and returns it to React.

## Getting Started with Docker (Phase 21)

The entire architecture is containerized and orchestrated via Docker Compose.

### Prerequisites
* Docker
* Docker Compose

### Start the Application
Clone the repository and run:
```bash
docker compose up --build
```

This command will:
1. Initialize the PostgreSQL database (`mock_interview`) and seed it with technical questions.
2. Build the FastAPI ML Service container, caching the SentenceTransformer model and freezing XGBoost weights.
3. Build the Node.js Express backend and connect it to the ML Service and PostgreSQL.
4. Build the React frontend into an optimized static bundle served by Nginx.

### Access the Services
* **React Frontend**: `http://localhost:5173`
* **Node.js API**: `http://localhost:5000/api` (Internal network name: `backend:5000`)
* **FastAPI ML**: `http://localhost:8000` (Internal network name: `ml-service:8000`)
* **PostgreSQL**: `localhost:5432` (Internal network name: `postgres:5432`)

### Reset the Database
If you need to wipe the persistent database volume and re-seed the questions:
```bash
docker compose down -v
docker compose up --build
```

## API Contracts

**Endpoint:** `POST /api/interview/evaluate` (Requires `Bearer` token)

**Request from React:**
```json
{
  "interviewId": 1,
  "questionId": 4,
  "answer": "This is the candidate's typed response."
}
```
*(Notice that `expected_answer` and `key_concepts` are purposely omitted here to prevent frontend manipulation.)*

**Response to React:**
```json
{
  "questionId": 4,
  "evaluation": {
    "quality": "Good",
    "score": 7.5,
    "confidence": 0.88,
    "feedback": {
      "strengths": ["Matched key concepts"],
      "improvements": ["Elaborate on secondary concepts"]
    },
    "modelVersion": "synthetic-v1"
  }
}
```
