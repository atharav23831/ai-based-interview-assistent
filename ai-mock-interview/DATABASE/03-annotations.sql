CREATE TABLE IF NOT EXISTS answer_annotations (
    id SERIAL PRIMARY KEY,
    answer_id INTEGER REFERENCES answers(id) ON DELETE CASCADE,
    annotator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    technical_correctness INTEGER CHECK (technical_correctness >= 0 AND technical_correctness <= 10),
    concept_coverage INTEGER CHECK (concept_coverage >= 0 AND concept_coverage <= 10),
    relevance INTEGER CHECK (relevance >= 0 AND relevance <= 10),
    explanation_quality INTEGER CHECK (explanation_quality >= 0 AND explanation_quality <= 10),
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
    quality VARCHAR(20) NOT NULL CHECK (quality IN ('Very Poor', 'Poor', 'Average', 'Good', 'Excellent')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(answer_id, annotator_id)
);
