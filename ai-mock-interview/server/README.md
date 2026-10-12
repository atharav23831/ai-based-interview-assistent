# AI Mock Interview Platform - Backend

This is the Express/Node.js backend for the AI Mock Interview platform.

## ML Service Integration (Phase 18)
The backend now communicates with the **FastAPI ML Evaluation Service** to score candidate answers.

### Flow
1. A candidate submits a `questionId` and their `answer` text.
2. The Node.js backend retrieves the official `expected_answer` and `key_concepts` for that question from the secure PostgreSQL database.
3. The Node.js backend sends all 4 pieces of data to the FastAPI ML service.
4. FastAPI evaluates the answer and returns a `quality` category, a numeric `score` (0-10), statistical `confidence`, and array-based `feedback`.
5. The Node.js backend parses the ML metadata, stores the answer/score into the `answers` table, and returns the result to the React client.

*Security Note: The client cannot tamper with the expected answers or the key concepts.*

### Architecture
```text
┌──────────────┐
│ React Client │
└──────┬───────┘
       │ questionId + answer
       ▼
┌──────────────────┐
│ Node.js / Express│
└────────┬─────────┘
         │
         │ retrieve question metadata
         ▼
┌──────────────────┐
│ Question Database│
└────────┬─────────┘
         │
         │ expected_answer
         │ key_concepts
         ▼
┌──────────────────┐
│ FastAPI ML API   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Frozen ML Models │
└────────┬─────────┘
         │
         ▼
 quality / score / confidence
```

## PostgreSQL Setup (Phase 19)
The application now uses a real PostgreSQL database to store users, questions, and evaluation metadata securely.

### Environment Setup
Create a `.env` file in the `server` directory with the following variables:
```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mock_interview
JWT_SECRET=your_jwt_secret_key
ML_SERVICE_URL=http://localhost:8005
```

### Database Migration and Seeding
Ensure you have PostgreSQL running and a database named `mock_interview` (or your chosen `DB_NAME`) created.
Run the schema and seed scripts using `psql`:
```bash
psql -U postgres -d mock_interview -f ../DATABASE/schema.sql
psql -U postgres -d mock_interview -f ../DATABASE/seed.sql
```

## Running the Architecture Locally
1. **Start PostgreSQL**: Ensure your DB server is running.
2. **Start FastAPI**: Navigate to the ML project and start the Python API.
   ```bash
   python -m uvicorn api.main:app --host 127.0.0.1 --port 8005
   ```
3. **Start Express Backend**: In the `server` directory, run:
   ```bash
   npm install
   npm run dev
   ```

### Testing the Evaluation Flow
You can run the end-to-end integration tests which simulate an authenticated client workflow:
```bash
node test_e2e.js
```
