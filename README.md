# AI Mock Interview Platform 🎯

An intelligent, AI-powered mock interview platform that generates personalized technical interview questions from a candidate's resume, evaluates answers using a custom machine learning pipeline, and provides detailed performance reports.

The platform combines a locally hosted Large Language Model (LLM) for question generation with a custom ML-based evaluation system for answer scoring and feedback.

## 🚀 Features

- **Resume-Based Personalization:** Upload a PDF resume to generate questions relevant to the candidate's skills, projects, and experience.
- **AI Question Generation:** Generate personalized questions using Qwen2.5 3B Instruct through Ollama.
- **Configurable Interviews:** Select the target role, difficulty level, and number of questions.
- **Hybrid Question Selection:** Combine validated AI-generated questions with questions from a PostgreSQL question bank.
- **Custom ML Evaluation:** Evaluate candidate answers using TF-IDF, semantic similarity, and concept coverage.
- **Quality Classification:** Classify answers into Very Poor, Poor, Average, Good, and Excellent.
- **Numerical Scoring:** Predict an answer score on a 0–10 scale using a regression model.
- **Confidence Estimation:** Provide model confidence information alongside the evaluation.
- **Detailed Feedback:** Identify strengths and areas for improvement.
- **Interview Reports:** Display overall scores, topic-wise performance, and question-by-question feedback.
- **Interview History:** Store and revisit completed interview sessions.
- **Interactive Dashboard:** View performance statistics and score progression.
- **Authentication:** Provide user registration, login, and protected interview data.
- **Local LLM Inference:** Run question generation locally without depending on a paid cloud LLM API.

## 🏗️ System Architecture

```text
                    React Frontend
                          |
                          v
                Node.js + Express API
                          |
             +------------+------------+
             |            |            |
             v            v            v
        PostgreSQL   Resume Parser   Ollama API
             |       (pdfjs-dist)        |
             |                           v
             |                    Qwen2.5 3B
             |                           |
             |                    Generated Questions
             |                           |
             +------------+--------------+
                          |
                          v
                  Candidate Answers
                          |
                          v
                  FastAPI ML Service
                          |
                          v
                   Feature Extraction
             +------------+------------+
             |            |            |
             v            v            v
           TF-IDF      Semantic     Concept
                       Similarity   Coverage
             |            |            |
             +------------+------------+
                          |
                          v
                Custom ML Evaluation
             +------------+------------+
             |                         |
             v                         v
       Classification              Regression
     Logistic Regression            XGBoost
             |                         |
             +------------+------------+
                          |
                          v
                 Score Calibration
                          |
                          v
            Score + Quality + Confidence
                          |
                          v
                 Reports and History
                          |
                          v
                    PostgreSQL
```

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, JavaScript, CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | JWT |
| Resume text extraction | `pdfjs-dist` |
| LLM runtime | Ollama |
| Question-generation model | Qwen2.5 3B Instruct |
| ML API | Python, FastAPI, Uvicorn |
| ML framework | scikit-learn |
| Regression model | XGBoost |
| Text feature extraction | TF-IDF |
| Semantic analysis | Sentence Transformers |
| Data processing | Pandas, NumPy |
| Testing | Vitest, pytest |

## 🧠 AI and Machine Learning

### 1. Personalized Question Generation

The candidate uploads a PDF resume and selects an interview role, difficulty level, and question count.

The backend extracts resume text using `pdfjs-dist` and sends relevant resume information to the question-generation service.

Ollama serves the locally hosted Qwen2.5 3B Instruct model, which generates candidate-specific technical questions.

Generated questions pass through validation and filtering before being combined with suitable questions from the PostgreSQL question bank.

**Question-generation workflow:**

1. Upload and extract the resume.
2. Process resume information, including relevant skills and projects.
3. Construct a prompt using the resume, role, difficulty, and question requirements.
4. Generate questions using Qwen2.5 3B through Ollama.
5. Validate the generated questions.
6. Fill any remaining question slots from the database.
7. Present the final question set to the candidate.

The LLM is used through prompt engineering and inference; it is not fine-tuned as part of this implementation.

### 2. Custom ML-Based Answer Evaluation

The ML service evaluates a candidate's answer against the question and expected answer.

#### Feature engineering

- **TF-IDF:** Represents important terms in numerical form.
- **Semantic similarity:** Measures how closely the candidate's answer matches the meaning of the expected answer using Sentence Transformers.
- **Concept coverage:** Measures the presence of important technical concepts in the answer.
- **Answer characteristics:** Captures relevant answer-level features used by the evaluation pipeline.

#### Machine learning models

**Logistic Regression classifier**

Predicts the answer-quality category:

- Very Poor
- Poor
- Average
- Good
- Excellent

**XGBoost regressor**

Predicts a numerical answer score between 0 and 10.

The prediction pipeline combines classification and regression signals through score calibration. The final quality category is mapped from the calibrated score to prevent contradictions between the displayed score and quality.

| Final score | Quality |
|---|---|
| 9.0–10.0 | Excellent |
| 7.0–8.9 | Good |
| 5.0–6.9 | Average |
| 3.0–4.9 | Poor |
| 0–2.9 | Very Poor |

The evaluator also applies relevance checks and generates feedback based on the evaluation results.

> **Note:** The ML pipeline was developed using a synthetic interview-answer dataset. Evaluation metrics from synthetic data should not be interpreted as proof of equivalent real-world accuracy.

## 🗄️ Database Design

PostgreSQL stores application data and interview results.

| Table | Purpose |
|---|---|
| `users` | User accounts and authentication-related data |
| `resumes` | Uploaded resumes and extracted text |
| `questions` | Technical question bank and generated questions |
| `interviews` | Interview sessions, roles, and difficulty |
| `answers` | Candidate responses and evaluation results |
| `interview_reports` | Aggregated interview performance and feedback |

The database supports persistent interview history and report retrieval.

## 📁 Project Structure

```text
AI-Mock-Interview-Platform/
│
├── client/                     # React frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       └── ...
│
├── server/                     # Node.js + Express backend
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── database/
│   ├── server.js
│   └── ...
│
├── ml/                         # Custom ML evaluation
│   ├── api/
│   │   ├── main.py
│   │   ├── schemas.py
│   │   └── predictor.py
│   ├── data/
│   ├── src/
│   │   ├── preprocessing.py
│   │   ├── features.py
│   │   ├── train.py
│   │   ├── evaluate.py
│   │   └── predict.py
│   ├── models/
│   ├── requirements.txt
│   └── README.md
│
└── README.md
```

*The structure above represents the main project organization; individual filenames may differ in your local checkout.*

## ⚙️ Installation and Setup

### Prerequisites

Install the following before running the application:

- Node.js and npm
- Python 3.10 or another version compatible with the project's ML dependencies
- PostgreSQL
- Ollama
- Git

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_PROJECT_FOLDER>
```

### 2. Set up PostgreSQL

Create a database named `ai_mock_interview`.

```sql
CREATE DATABASE ai_mock_interview;
```

Load the project's database schema and seed data using the SQL files supplied with your backend.

Configure the PostgreSQL connection details in the backend environment file.

### 3. Configure the backend

```bash
cd server
npm install
```

Create or update the backend `.env` file with the appropriate values for your local environment.

Example configuration:

```env
PORT=5000
DATABASE_URL=postgresql://<USER>:<PASSWORD>@localhost:5432/ai_mock_interview
JWT_SECRET=<YOUR_SECRET>
```

Use the actual variable names expected by your backend configuration. Do not commit credentials or real secrets to GitHub.

Start the backend:

```bash
npm run dev
```

If your `package.json` does not define a `dev` script, use the start command defined in that file.

### 4. Set up the ML service

From the project root:

```bash
cd ml
python -m venv .venv
```

Activate the environment.

**Windows PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Ensure the required trained model artifacts are present in the `ml/models/` directory.

Start FastAPI:

```bash
python -m uvicorn api.main:app --host 127.0.0.1 --port 8765
```

The ML API should be available at:

`http://127.0.0.1:8765`

If the model artifacts are missing, follow the ML training instructions before starting the service.

### 5. Set up Ollama

Install Ollama and download the required model:

```bash
ollama pull qwen2.5:3b-instruct
```

Start or open Ollama and verify that its local API is accessible:

`http://localhost:11434`

The backend question-generation service should use this local endpoint.

### 6. Start the frontend

Open a separate terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL displayed by the frontend development server.

Ensure PostgreSQL, the Node.js backend, the FastAPI service, and Ollama are running before testing the complete interview workflow.

## 🔌 Main API Endpoints

The Node.js backend exposes the following application endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Authenticate a user |
| POST | `/api/resume/upload` | Upload a resume |
| POST | `/api/interview/start` | Start an interview |
| GET | `/api/interview/:id/questions` | Retrieve interview questions |
| POST | `/api/interview/evaluate` | Evaluate an answer |
| POST | `/api/interview/:id/complete` | Complete an interview |
| GET | `/api/interview/history` | Retrieve interview history |
| GET | `/api/interview/:id/report` | Retrieve an interview report |
| POST | `/api/annotation` | Submit annotation data |

The ML service exposes its prediction endpoint at:

`POST /predict`

The endpoint accepts the input schema defined by the FastAPI service and returns the evaluation result. Consult the implementation for the exact request and response fields.

## 🔄 End-to-End Workflow

1. A candidate registers or logs in.
2. The candidate uploads a resume.
3. The backend extracts the PDF text.
4. The candidate configures the interview.
5. The question-generation service produces personalized questions and combines them with database questions.
6. The candidate answers questions in the interview interface.
7. Node.js sends answer-evaluation requests to FastAPI.
8. The ML service computes features and predicts the answer score and quality.
9. Evaluation results are stored in PostgreSQL.
10. The platform generates the final report and updates interview history.
11. The dashboard displays performance statistics and previous interviews.

## 🧪 Testing

Run the frontend tests from the client directory:

```bash
npx vitest run
```

Run the ML tests using the configured Python environment:

```bash
python -m pytest
```

Build the frontend:

```bash
npm run build
```

These commands validate the relevant frontend and ML test suites and the frontend production build. Run them in the appropriate project directories.

## 🔐 Security Considerations

- Store passwords securely using the project's password-hashing implementation.
- Protect private endpoints using JWT authentication.
- Enforce interview and report ownership checks.
- Validate uploaded files and generated questions.
- Keep secrets and environment files out of version control.
- Avoid exposing sensitive resume information in logs or API responses.

## 🔮 Future Enhancements

- Performance-based adaptive question selection.
- More comprehensive real-world interview datasets.
- Improved ML calibration and confidence validation.
- Additional technical roles and question categories.
- Interview recommendations based on historical performance.
- Optional speech-to-text and spoken-interview support.
- More detailed learning recommendations based on weak topics.

## 🎯 Project Objective

The objective is to make technical interview preparation more personalized and measurable by combining resume-aware question generation, machine learning-based answer evaluation, and persistent performance analytics.

## 👨‍💻 Author

**Atharav Date**

Third-year engineering student  
Computer Science and Engineering — IoT and Cyber Security

---

*Built as an AI-powered interview preparation platform combining full-stack development, local LLM inference, and custom machine learning.*
