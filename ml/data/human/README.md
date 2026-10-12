# AI Mock Interview: Human Dataset

This directory holds the infrastructure and outputs for the **Real Human-Data Collection Phase**. The ML model evaluates answers based on a strictly frozen synthetic benchmark (`synthetic-v1`). This dataset will serve as the first genuine, un-fabricated human benchmark.

## Privacy & Handling
- **Anonymity First**: Annotator IDs and User IDs are used internally. No personally identifiable information (PII), such as names or emails, should be exported into `raw` or `processed` datasets.
- **Raw Data**: Stored in PostgreSQL, but periodically backed up to `raw/`.
- **Annotations**: Linked via `answer_id` and `annotator_id`.

## Schema (`answer_annotations`)
The dataset is tracked in PostgreSQL with the following shape:
```sql
id SERIAL PRIMARY KEY,
answer_id INTEGER,
annotator_id INTEGER,
technical_correctness INTEGER,
concept_coverage INTEGER,
relevance INTEGER,
explanation_quality INTEGER,
score INTEGER NOT NULL,  -- 0-10
quality VARCHAR(20) NOT NULL, -- 'Very Poor' to 'Excellent'
notes TEXT,
created_at TIMESTAMP
```

## Annotation Guidelines
All human annotators MUST adhere strictly to the following 0-10 scale and sub-criteria when rating answers. 

### Label Definitions
* **0–2 (Very Poor):** Answer is completely incorrect, completely misses the point, or contains zero technical value.
* **3–4 (Poor):** Answer is mostly incorrect or vastly incomplete, missing the core concepts entirely.
* **5–6 (Average):** Answer touches on the correct topic but is notably shallow, incomplete, or slightly confused.
* **7–8 (Good):** Answer is technically accurate, hits the core concepts, and directly addresses the prompt.
* **9–10 (Excellent):** Answer is completely accurate, hits all key concepts natively, demonstrates deep understanding, and communicates logically.

### Evaluation Criteria
1. **Technical Correctness:** Does the answer contain technically correct information? Penalize factual errors and contradictions.
2. **Concept Coverage:** Does it address the *important* concepts required by the question? (Synonyms and valid paraphrases are acceptable).
3. **Relevance:** Does it *directly* answer the question, or does it ramble into unrelated domains?
4. **Explanation Quality:** Is the reasoning logically structured and understandable?
5. **Verbosity (WARNING):** Do **NOT** reward an answer merely because it is long. A concise, technically correct answer should score higher than a rambling, overly long answer filled with fluff.

### Blind Review
* Annotators MUST NOT see the model's prediction while assigning their human label.
* Conflicts between multiple annotators on the same `answer_id` are *preserved* intentionally to measure Inter-Rater Agreement, not automatically overwritten.

## Data Quality Pipeline & Split
* **Leakage Prevention**: We enforce a **Question-Level Split**. (Questions in the training set will never appear in the test set).
* **Validation**: Run `python src/data_quality.py` to trigger dataset analysis, looking for duplicate answers, invalid scores, question overlap, and calculating the Weighted Cohen's Kappa for agreement.
* **Status**: *Currently waiting for annotators to utilize the platform.* (Target: 300-500 answers across 20-30 questions).
