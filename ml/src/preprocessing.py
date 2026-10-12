import re
import string

def clean_text(text):
    """
    Basic text preprocessing:
    - Convert to lowercase
    - Remove punctuation
    - Remove extra whitespace
    """
    if not isinstance(text, str):
        return ""
    
    text = text.lower()
    # Remove punctuation
    text = text.translate(str.maketrans('', '', string.punctuation))
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def preprocess_dataframe(df):
    """
    Apply preprocessing to the necessary columns in the dataframe.
    """
    df = df.copy()
    
    # Handle missing values
    df.fillna({'candidate_answer': '', 'expected_answer': '', 'key_concepts': '', 'question': ''}, inplace=True)
    
    # Clean text columns
    for col in ['candidate_answer', 'expected_answer', 'key_concepts', 'question']:
        df[f'clean_{col}'] = df[col].apply(clean_text)
        
    return df
