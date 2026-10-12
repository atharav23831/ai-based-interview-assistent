import time
import pytest
from fastapi.testclient import TestClient
import sys
import os
import json

# Ensure src module is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.insert(0, os.path.join(project_root, 'src'))

from api.main import app
from src.predict import InterviewAnswerEvaluator

# We create a fixture for the TestClient to trigger startup events
@pytest.fixture(scope="module")
def api_client():
    with TestClient(app) as client:
        yield client

@pytest.fixture(scope="module")
def cli_evaluator():
    return InterviewAnswerEvaluator(model_dir=os.path.join(project_root, 'models'))

def test_health_check(api_client):
    response = api_client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["models_loaded"] is True

def test_valid_answer(api_client, cli_evaluator):
    payload = {
        "question": "What is a HashMap in Java?",
        "expected_answer": "HashMap stores key-value pairs using a hash table. It provides average O(1) time complexity for lookup and insertion.",
        "key_concepts": "key-value, hash table, O(1), lookup, insertion",
        "answer": "HashMap stores data in key-value format and uses hashing to find values quickly in O(1) time."
    }
    
    # API Prediction
    start_time = time.time()
    response = api_client.post("/predict", json=payload)
    api_time = time.time() - start_time
    
    assert response.status_code == 200
    api_res = response.json()
    assert "quality" in api_res
    assert "score" in api_res
    assert "confidence" in api_res
    
    # CLI Prediction
    cli_res = cli_evaluator.predict(
        payload["question"], 
        payload["expected_answer"], 
        payload["answer"], 
        payload["key_concepts"]
    )
    
    # Consistency Check
    assert api_res["quality"] == cli_res["quality"]
    assert abs(api_res["score"] - cli_res["score"]) < 1e-4
    assert abs(api_res["confidence"] - cli_res["confidence"]) < 1e-4
    
    print(f"\nAPI Latency (Valid Answer): {api_time*1000:.2f} ms")

def test_poor_answer(api_client):
    payload = {
        "question": "What is a HashMap in Java?",
        "expected_answer": "HashMap stores key-value pairs using a hash table. It provides average O(1) time complexity for lookup and insertion.",
        "key_concepts": "key-value, hash table, O(1), lookup, insertion",
        "answer": "It is a class used for networking and connecting to databases."
    }
    response = api_client.post("/predict", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["quality"] not in ["Excellent", "Good"]

def test_empty_answer(api_client):
    payload = {
        "question": "What is a HashMap?",
        "expected_answer": "Stores key value pairs.",
        "key_concepts": "key-value",
        "answer": "   "
    }
    response = api_client.post("/predict", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["quality"] == "Very Poor"
    assert res["score"] == 0.0

def test_very_long_answer(api_client):
    payload = {
        "question": "What is a HashMap?",
        "expected_answer": "Stores key value pairs.",
        "key_concepts": "key-value",
        "answer": "HashMap " * 2000
    }
    response = api_client.post("/predict", json=payload)
    # The Pydantic schema enforces max_length=10000 characters
    assert response.status_code in [422, 200]

def test_invalid_request_missing_field(api_client):
    payload = {
        "answer": "A HashMap stores key-value pairs."
    }
    response = api_client.post("/predict", json=payload)
    assert response.status_code == 422

def test_malformed_json(api_client):
    response = api_client.post("/predict", data="This is not json")
    assert response.status_code == 422

def test_multiple_sequential_requests(api_client):
    payload = {
        "question": "What is a HashMap?",
        "expected_answer": "Stores key value pairs.",
        "key_concepts": "key-value",
        "answer": "A dictionary mapping keys to values."
    }
    
    res1 = api_client.post("/predict", json=payload).json()
    res2 = api_client.post("/predict", json=payload).json()
    res3 = api_client.post("/predict", json=payload).json()
    
    assert res1["score"] == res2["score"]
    assert res2["score"] == res3["score"]
