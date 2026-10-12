import pandas as pd
import random

data = []

base_questions = [
    {
        "question": "What is a HashMap in Java?",
        "expected_answer": "HashMap stores key-value pairs using hashing. It provides average O(1) lookup and insertion.",
        "key_concepts": "key-value, hashing, lookup, insertion",
        "topic": "Java",
        "difficulty": "Medium"
    },
    {
        "question": "What is the difference between supervised and unsupervised learning?",
        "expected_answer": "Supervised learning uses labeled data to train models, while unsupervised learning uses unlabeled data to find hidden patterns or groupings.",
        "key_concepts": "labeled data, unlabeled data, patterns, training",
        "topic": "Machine Learning",
        "difficulty": "Easy"
    },
    {
        "question": "What is a REST API?",
        "expected_answer": "REST API is an architectural style for an application program interface that uses HTTP requests to access and use data.",
        "key_concepts": "architectural style, HTTP requests, data access, interface",
        "topic": "Web Development",
        "difficulty": "Easy"
    },
    {
        "question": "Explain the concept of OOP polymorphism.",
        "expected_answer": "Polymorphism allows objects of different classes to be treated as objects of a common superclass. It allows methods to do different things based on the object it is acting upon.",
        "key_concepts": "objects, classes, superclass, methods, overriding",
        "topic": "Object Oriented Programming",
        "difficulty": "Medium"
    },
    {
        "question": "What is a foreign key in SQL?",
        "expected_answer": "A foreign key is a column or group of columns in a relational database table that provides a link between data in two tables. It refers to the primary key of another table.",
        "key_concepts": "column, link, two tables, primary key, reference",
        "topic": "Databases",
        "difficulty": "Easy"
    },
    {
        "question": "What does the 'yield' keyword do in Python?",
        "expected_answer": "The yield keyword is used to pause a function's execution and send a value back to the caller, while retaining enough state to resume where it left off. It produces a generator.",
        "key_concepts": "pause execution, return value, retain state, generator",
        "topic": "Python",
        "difficulty": "Medium"
    },
    {
        "question": "What is overfitting in machine learning?",
        "expected_answer": "Overfitting occurs when a model learns the training data too well, including its noise and outliers, resulting in poor generalization to new, unseen data.",
        "key_concepts": "learns training data, noise, poor generalization, unseen data",
        "topic": "Machine Learning",
        "difficulty": "Easy"
    },
    {
        "question": "Describe the MVC design pattern.",
        "expected_answer": "MVC stands for Model-View-Controller. It separates an application into three main logical components: Model for data, View for UI, and Controller for business logic.",
        "key_concepts": "Model, View, Controller, data, UI, business logic, separation",
        "topic": "Software Engineering",
        "difficulty": "Medium"
    },
    {
        "question": "What is a promise in JavaScript?",
        "expected_answer": "A Promise is an object representing the eventual completion or failure of an asynchronous operation and its resulting value.",
        "key_concepts": "object, eventual completion, failure, asynchronous operation, value",
        "topic": "JavaScript",
        "difficulty": "Medium"
    },
    {
        "question": "Explain Big O notation.",
        "expected_answer": "Big O notation is used in Computer Science to describe the performance or complexity of an algorithm. It specifically describes the worst-case scenario regarding time or space.",
        "key_concepts": "performance, complexity, algorithm, worst-case, time, space",
        "topic": "Data Structures",
        "difficulty": "Hard"
    }
]

def generate_candidate_answers(base, num_variations=15):
    variations = []
    
    # Excellent (9-10)
    for _ in range(num_variations // 5):
        ans = base["expected_answer"] + " " + random.choice(["This is very important for efficiency.", "I've used this in my previous projects.", "It's a core concept."])
        variations.append((ans, random.randint(9, 10), "Excellent"))
        
    # Good (7-8)
    for _ in range(num_variations // 5):
        words = base["expected_answer"].split()
        ans = " ".join(words[:int(len(words)*0.8)]) + "."
        variations.append((ans, random.randint(7, 8), "Good"))
        
    # Average (5-6)
    for _ in range(num_variations // 5):
        words = base["expected_answer"].split()
        ans = " ".join(words[:int(len(words)*0.5)]) + " and some other things I can't remember right now."
        variations.append((ans, random.randint(5, 6), "Average"))
        
    # Poor (3-4)
    for _ in range(num_variations // 5):
        words = base["expected_answer"].split()
        ans = "I think it has something to do with " + words[len(words)//2] + " but I am not entirely sure."
        variations.append((ans, random.randint(3, 4), "Poor"))
        
    # Very Poor (0-2)
    for _ in range(num_variations // 5):
        ans = random.choice([
            "I don't know the answer to this question.",
            "It is a computer science term.",
            "Maybe it's related to programming?",
            "Can you explain it to me instead?"
        ])
        variations.append((ans, random.randint(0, 2), "Very Poor"))
        
    return variations

for base in base_questions:
    variations = generate_candidate_answers(base, num_variations=30)
    for ans, score, quality in variations:
        row = base.copy()
        row["candidate_answer"] = ans
        row["score"] = score
        row["quality"] = quality
        data.append(row)

# Shuffle
random.shuffle(data)

df = pd.DataFrame(data)
df.to_csv("data/interview_dataset.csv", index=False)
print(f"Dataset created with {len(df)} rows at data/interview_dataset.csv")
