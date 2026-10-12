import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import string
import re

try:
    from sentence_transformers import SentenceTransformer
    has_sbert = True
except ImportError:
    has_sbert = False

# We will set a configurable threshold that can be tuned.
# Defaulting to 0.65, but can be overridden.
CONCEPT_SIMILARITY_THRESHOLD = 0.65

def compute_linguistic_features(cand_text):
    if not cand_text or pd.isna(cand_text):
        return [0.0, 0.0, 0.0, 0.0, 0.0]
        
    cand_str = str(cand_text)
    words = cand_str.split()
    word_count = len(words)
    
    sentences = re.split(r'[.!?]+', cand_str)
    sentences = [s for s in sentences if s.strip()]
    sentence_count = max(1, len(sentences))
    
    avg_sentence_len = word_count / sentence_count
    
    # Strip punctuation and lowercase for robust vocab diversity
    cleaned_words = [w.lower().translate(str.maketrans('', '', string.punctuation)) for w in words]
    cleaned_words = [w for w in cleaned_words if w]
    
    unique_words = set(cleaned_words)
    unique_word_count = len(unique_words)
    valid_word_count = max(1, len(cleaned_words))
    
    vocab_diversity = unique_word_count / valid_word_count
    repeated_ratio = (valid_word_count - unique_word_count) / valid_word_count
    
    # Log-normalized to prevent long answers from dominating linearly
    log_word_count = np.log1p(word_count)
    log_sentence_count = np.log1p(sentence_count)
    
    return [log_word_count, log_sentence_count, avg_sentence_len, vocab_diversity, repeated_ratio]

def compute_length_ratio(cand, expected):
    if not expected:
        return 0.0
    cand_len = len(str(cand).split())
    exp_len = len(str(expected).split())
    if exp_len == 0: return 0.0
    
    ratio = cand_len / exp_len
    return min(ratio, 2.0)

def compute_semantic_concept_coverage(cand, concepts_str, sbert_model, threshold=CONCEPT_SIMILARITY_THRESHOLD):
    if not concepts_str or pd.isna(concepts_str):
        return 0.0
    
    concepts = [c.strip() for c in str(concepts_str).split(',') if c.strip()]
    if not concepts:
        return 0.0
        
    if not cand or pd.isna(cand) or not str(cand).strip():
        return 0.0
        
    cand_str = str(cand).lower()
    cand_tokens = set(re.findall(r'\b\w+\b', cand_str))
    cand_stems = set(re.sub(r'(ing|ed|es|s)\b', '', w) for w in cand_tokens if len(w) > 2)

    covered = 0
    unmatched_concepts = []
    
    for c in concepts:
        c_clean = c.lower().strip()
        c_words = re.findall(r'\b\w+\b', c_clean)
        if not c_words:
            continue
            
        # 1. Direct substring match in candidate text
        if c_clean in cand_str:
            covered += 1
            continue
            
        # 2. Stem-level / token match for inflections (e.g. 'topological sort' vs 'topological sorting', 'shortest path' vs 'shortest paths')
        c_stems = [re.sub(r'(ing|ed|es|s)\b', '', w) for w in c_words if len(w) > 2]
        if c_stems and all(s in cand_stems or any(cs.startswith(s) for cs in cand_stems) for s in c_stems):
            covered += 1
            continue
            
        unmatched_concepts.append(c)
        
    # 3. Fallback to SBERT semantic similarity for paraphrased/synonym concepts
    if unmatched_concepts and sbert_model:
        sentences = [s.strip() for s in re.split(r'[.!?\n]+', str(cand)) if s.strip()]
        if not sentences:
            sentences = [str(cand)]
            
        concept_embs = sbert_model.encode(unmatched_concepts, show_progress_bar=False)
        cand_embs = sbert_model.encode(sentences, show_progress_bar=False)
        
        for c_emb in concept_embs:
            sims = cosine_similarity([c_emb], cand_embs)[0]
            max_sim = np.max(sims) if len(sims) > 0 else 0
            if max_sim >= threshold:
                covered += 1
                
    return covered / len(concepts)

class FeatureExtractor:
    def __init__(self, use_sbert=True, sbert_model_name='all-MiniLM-L6-v2', concept_threshold=CONCEPT_SIMILARITY_THRESHOLD):
        self.use_sbert = use_sbert and has_sbert
        self.concept_threshold = concept_threshold
        self.tfidf = None
        self.sbert_model = None
        if self.use_sbert:
            self.sbert_model = SentenceTransformer(sbert_model_name)
            
    def fit(self, df):
        df = df.copy()
        df.fillna('', inplace=True)
        self.tfidf = TfidfVectorizer(max_features=300, stop_words='english')
        # Use clean text for fitting TF-IDF to ensure casing/punct invariance
        combined_text = df['clean_question'] + " " + df['clean_expected_answer'] + " " + df['clean_candidate_answer']
        self.tfidf.fit(combined_text)
        
    def transform(self, df):
        df = df.copy()
        df.fillna('', inplace=True)
        
        # 1. Linguistic / Length Features (Normalized)
        ling_features = np.array(df['candidate_answer'].apply(compute_linguistic_features).tolist())
        length_ratio = df.apply(lambda row: compute_length_ratio(row['candidate_answer'], row['expected_answer']), axis=1).values.reshape(-1, 1)
        
        # 2. Technical / Semantic Features
        concept_coverage = df.apply(lambda row: compute_semantic_concept_coverage(row['candidate_answer'], row['key_concepts'], self.sbert_model, self.concept_threshold), axis=1).values.reshape(-1, 1)
        
        # TF-IDF similarity (using cleaned text for robustness with dynamic fallback for unseen vocabularies)
        exp_tfidf = self.tfidf.transform(df['clean_expected_answer'])
        cand_tfidf = self.tfidf.transform(df['clean_candidate_answer'])
        sims = []
        for i in range(exp_tfidf.shape[0]):
            v_exp = exp_tfidf[i]
            v_cand = cand_tfidf[i]
            if v_exp.nnz > 0 and v_cand.nnz > 0:
                sim = cosine_similarity(v_exp, v_cand)[0][0]
            else:
                c_exp = str(df['clean_expected_answer'].iloc[i]).strip()
                c_cand = str(df['clean_candidate_answer'].iloc[i]).strip()
                if c_exp and c_cand:
                    dyn_vec = TfidfVectorizer(stop_words='english')
                    try:
                        m = dyn_vec.fit_transform([c_exp, c_cand])
                        sim = cosine_similarity(m[0:1], m[1:2])[0][0]
                    except Exception:
                        sim = 0.0
                else:
                    sim = 0.0
            sims.append(sim)
        tfidf_sim = np.array(sims).reshape(-1, 1)
        
        # Question Relevance & Answer Semantic Similarity
        if self.use_sbert:
            exp_emb = self.sbert_model.encode(df['expected_answer'].tolist(), show_progress_bar=False)
            cand_emb = self.sbert_model.encode(df['candidate_answer'].tolist(), show_progress_bar=False)
            q_emb = self.sbert_model.encode(df['question'].tolist(), show_progress_bar=False)
            
            semantic_sim = np.array([cosine_similarity([exp_emb[i]], [cand_emb[i]])[0][0] for i in range(exp_emb.shape[0])]).reshape(-1, 1)
            q_relevance = np.array([cosine_similarity([q_emb[i]], [cand_emb[i]])[0][0] for i in range(q_emb.shape[0])]).reshape(-1, 1)
            
            # Combine
            features = [ling_features, length_ratio, concept_coverage, tfidf_sim, semantic_sim, q_relevance, cand_tfidf.toarray()]
        else:
            q_relevance = np.zeros((df.shape[0], 1))
            semantic_sim = np.zeros((df.shape[0], 1))
            features = [ling_features, length_ratio, concept_coverage, tfidf_sim, semantic_sim, q_relevance, cand_tfidf.toarray()]
            
        X = np.hstack(features)
        return X
