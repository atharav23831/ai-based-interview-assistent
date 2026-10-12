import pandas as pd
import random
import uuid
import os

random.seed(42)

# Define 20 software engineering questions
base_questions = [
    {
        "q_id": "Q01", "topic": "Java", "difficulty": "Medium",
        "question": "What is a HashMap in Java?",
        "expected_answer": "HashMap stores key-value pairs using a hash table. It provides average O(1) time complexity for lookup and insertion. It does not maintain order and allows one null key.",
        "key_concepts": "key-value, hash table, O(1), lookup, insertion, null key",
        "core_components": ["stores data in key-value format", "uses hashing technique", "O(1) average time", "does not maintain insertion order"]
    },
    {
        "q_id": "Q02", "topic": "Machine Learning", "difficulty": "Easy",
        "question": "What is the difference between supervised and unsupervised learning?",
        "expected_answer": "Supervised learning trains models on labeled data where the target outcome is known. Unsupervised learning finds patterns in unlabeled data without explicit targets.",
        "key_concepts": "labeled data, unlabeled data, target outcome, patterns, training",
        "core_components": ["supervised uses labeled data", "unsupervised uses unlabeled data", "supervised predicts targets", "unsupervised finds patterns"]
    },
    {
        "q_id": "Q03", "topic": "Web Development", "difficulty": "Easy",
        "question": "What is a REST API?",
        "expected_answer": "REST API is an architectural style for web services that uses standard HTTP methods like GET, POST, PUT, DELETE to access and manipulate resources.",
        "key_concepts": "architectural style, web services, HTTP methods, GET, POST, resources",
        "core_components": ["architectural style", "uses HTTP methods", "stateless communication", "manipulates resources"]
    },
    {
        "q_id": "Q04", "topic": "OOP", "difficulty": "Medium",
        "question": "Explain polymorphism in Object-Oriented Programming.",
        "expected_answer": "Polymorphism allows objects of different classes to be treated as objects of a common superclass. It enables a single interface to represent different underlying forms, often through method overriding or overloading.",
        "key_concepts": "objects, classes, superclass, interface, overriding, overloading",
        "core_components": ["treat different classes as common superclass", "single interface for different forms", "method overriding", "method overloading"]
    },
    {
        "q_id": "Q05", "topic": "Databases", "difficulty": "Easy",
        "question": "What is a foreign key in SQL?",
        "expected_answer": "A foreign key is a column or group of columns in one table that uniquely identifies a row of another table, establishing a link between the two tables.",
        "key_concepts": "column, link, tables, uniquely identifies, relationship",
        "core_components": ["column in one table", "links to primary key of another table", "establishes relationship", "maintains referential integrity"]
    },
    {
        "q_id": "Q06", "topic": "Python", "difficulty": "Medium",
        "question": "What does the 'yield' keyword do in Python?",
        "expected_answer": "The yield keyword is used in a function like a return statement, but instead of terminating the function, it pauses execution, saves state, and returns a generator object.",
        "key_concepts": "pause execution, save state, generator object, function, return",
        "core_components": ["creates a generator", "pauses execution", "saves local state", "returns value multiple times"]
    },
    {
        "q_id": "Q07", "topic": "Machine Learning", "difficulty": "Easy",
        "question": "What is overfitting in machine learning?",
        "expected_answer": "Overfitting occurs when a model learns the training data and its noise too well, resulting in high accuracy on training data but poor generalization to unseen test data.",
        "key_concepts": "learns noise, poor generalization, unseen data, training data",
        "core_components": ["learns training data too well", "captures noise", "poor generalization", "performs badly on unseen data"]
    },
    {
        "q_id": "Q08", "topic": "Software Engineering", "difficulty": "Medium",
        "question": "Describe the MVC design pattern.",
        "expected_answer": "MVC separates an application into Model (data and business logic), View (user interface presentation), and Controller (handles user input and updates Model/View).",
        "key_concepts": "Model, View, Controller, data, UI, business logic, separation",
        "core_components": ["Model handles data", "View handles UI", "Controller handles input", "separation of concerns"]
    },
    {
        "q_id": "Q09", "topic": "JavaScript", "difficulty": "Medium",
        "question": "What is a Promise in JavaScript?",
        "expected_answer": "A Promise is an object representing the eventual completion or failure of an asynchronous operation. It can be in pending, fulfilled, or rejected states.",
        "key_concepts": "object, eventual completion, failure, asynchronous, pending, fulfilled, rejected",
        "core_components": ["handles asynchronous operations", "represents eventual completion", "has three states", "pending fulfilled rejected"]
    },
    {
        "q_id": "Q10", "topic": "Data Structures", "difficulty": "Hard",
        "question": "Explain Big O notation.",
        "expected_answer": "Big O notation describes the worst-case time or space complexity of an algorithm as the input size grows towards infinity.",
        "key_concepts": "time complexity, space complexity, algorithm, worst-case, input size, asymptotic",
        "core_components": ["measures algorithm complexity", "describes worst-case scenario", "evaluates time or space", "as input size grows"]
    },
    {
        "q_id": "Q11", "topic": "Git", "difficulty": "Easy",
        "question": "What is the difference between git pull and git fetch?",
        "expected_answer": "Git fetch downloads new data from a remote repository without integrating it. Git pull downloads the data and immediately merges it into the current branch.",
        "key_concepts": "download, remote repository, integrating, merge, branch",
        "core_components": ["fetch only downloads", "fetch does not merge", "pull downloads and merges", "pull affects current working directory"]
    },
    {
        "q_id": "Q12", "topic": "Docker", "difficulty": "Medium",
        "question": "What is a Docker container?",
        "expected_answer": "A Docker container is a lightweight, standalone, executable package that includes everything needed to run an application: code, runtime, system tools, and libraries.",
        "key_concepts": "lightweight, standalone, executable, application, runtime, libraries",
        "core_components": ["lightweight executable package", "contains everything needed to run", "isolated environment", "shares host OS kernel"]
    },
    {
        "q_id": "Q13", "topic": "Networking", "difficulty": "Medium",
        "question": "What is the difference between TCP and UDP?",
        "expected_answer": "TCP is a connection-oriented protocol that ensures reliable, ordered data delivery. UDP is a connectionless protocol that sends data quickly but does not guarantee delivery or order.",
        "key_concepts": "connection-oriented, reliable, connectionless, ordered, guarantee delivery",
        "core_components": ["TCP is connection-oriented", "TCP is reliable", "UDP is connectionless", "UDP is faster but unreliable"]
    },
    {
        "q_id": "Q14", "topic": "Java", "difficulty": "Hard",
        "question": "What is garbage collection in Java?",
        "expected_answer": "Garbage collection is an automatic memory management process in Java that identifies and discards objects that are no longer referenced by the program to free up memory.",
        "key_concepts": "automatic memory management, identifies, discards, unreferenced objects, free memory",
        "core_components": ["automatic memory management", "frees up memory", "removes unreferenced objects", "prevents memory leaks"]
    },
    {
        "q_id": "Q15", "topic": "React", "difficulty": "Medium",
        "question": "What is the virtual DOM in React?",
        "expected_answer": "The virtual DOM is a lightweight in-memory representation of the real DOM. React uses it to efficiently batch DOM updates by comparing the virtual DOM with a previous snapshot (diffing).",
        "key_concepts": "in-memory representation, real DOM, batch updates, diffing, snapshot",
        "core_components": ["in-memory copy of real DOM", "improves performance", "diffing algorithm", "batches actual DOM updates"]
    },
    {
        "q_id": "Q16", "topic": "SQL", "difficulty": "Hard",
        "question": "Explain the difference between INNER JOIN and LEFT JOIN.",
        "expected_answer": "INNER JOIN returns only the rows that have matching values in both tables. LEFT JOIN returns all rows from the left table, and the matched rows from the right table, filling with NULLs if no match exists.",
        "key_concepts": "matching values, both tables, left table, matched rows, NULLs",
        "core_components": ["INNER JOIN requires match in both", "LEFT JOIN returns all left rows", "LEFT JOIN uses NULL for missing right matches"]
    },
    {
        "q_id": "Q17", "topic": "Cybersecurity", "difficulty": "Medium",
        "question": "What is Cross-Site Scripting (XSS)?",
        "expected_answer": "XSS is a vulnerability where an attacker injects malicious client-side scripts into web pages viewed by other users, often to steal session cookies or manipulate the DOM.",
        "key_concepts": "vulnerability, injects, malicious scripts, client-side, steal cookies, DOM",
        "core_components": ["injects malicious scripts", "executes in victim's browser", "steals session tokens", "client-side attack"]
    },
    {
        "q_id": "Q18", "topic": "Cloud", "difficulty": "Easy",
        "question": "What is meant by horizontal scaling?",
        "expected_answer": "Horizontal scaling, or scaling out, means adding more machines or nodes to a pool of resources to handle increased load, rather than upgrading a single machine's hardware.",
        "key_concepts": "scaling out, adding machines, pool of resources, increased load",
        "core_components": ["adding more machines", "scaling out", "distributed load", "differs from vertical scaling"]
    },
    {
        "q_id": "Q19", "topic": "Data Structures", "difficulty": "Easy",
        "question": "What is a stack?",
        "expected_answer": "A stack is a linear data structure that follows the Last-In-First-Out (LIFO) principle, where elements are added and removed from the same end, called the top.",
        "key_concepts": "linear data structure, LIFO, Last-In-First-Out, top",
        "core_components": ["linear structure", "LIFO principle", "push and pop operations", "access from top only"]
    },
    {
        "q_id": "Q20", "topic": "Agile", "difficulty": "Easy",
        "question": "What is the purpose of a daily standup meeting in Scrum?",
        "expected_answer": "A daily standup is a short timeboxed meeting where team members synchronize activities, discuss progress since the last meeting, and identify any impediments blocking their work.",
        "key_concepts": "synchronize activities, progress, impediments, blocking, timeboxed",
        "core_components": ["synchronize team", "discuss yesterday and today", "identify blockers", "short daily meeting"]
    }
]

# Vocabulary and structural variations
fillers = ["Well, basically, ", "I think that ", "In my understanding, ", "To put it simply, ", "As far as I know, ", "", "", "", ""]
good_adjectives = ["highly efficient", "crucial", "fundamental", "important", "standard"]
poor_phrases = ["It has something to do with computers.", "I'm not exactly sure, but maybe", "It's a way to code better.", "I read about this once."]
irrelevant_sentences = [
    " I usually prefer writing code in Python because it has easier syntax.",
    " The internet is very important for this.",
    " In my last project, we used agile methodologies to track our progress.",
    " Computers process everything in binary.",
    " It's kind of like how a car engine works, if you think about it.",
    " My professor talked about this last semester."
]

def generate_answer(base, quality):
    components = base["core_components"]
    
    if quality == "Excellent":
        # Includes all components, professional language, maybe some extra correct detail
        ans = random.choice(fillers) + ", and ".join(components[:2]) + ". Furthermore, it " + ", and ".join(components[2:]) + "."
        score = random.uniform(9.0, 10.0)
    elif quality == "Good":
        # Includes most components, clear language
        subset = random.sample(components, k=len(components)-1)
        ans = random.choice(fillers) + ". ".join([c.capitalize() for c in subset]) + "."
        score = random.uniform(7.0, 8.9)
    elif quality == "Average":
        # Includes half components, some informal wording, maybe a slight misconception or irrelevant info
        subset = random.sample(components, k=max(1, len(components)//2))
        ans = random.choice(fillers) + "It is when " + " and ".join(subset) + "."
        if random.random() < 0.3:
            ans += random.choice(irrelevant_sentences)
        score = random.uniform(5.0, 6.9)
    elif quality == "Poor":
        # 1 component only, lots of filler, maybe irrelevant info
        ans = random.choice(poor_phrases) + " it is about " + components[0] + "."
        if random.random() < 0.6:
            ans += random.choice(irrelevant_sentences)
        score = random.uniform(3.0, 4.9)
    else: # Very Poor
        # 0 correct components, complete guess, or just irrelevant
        if random.random() < 0.5:
            ans = random.choice(poor_phrases) + random.choice(irrelevant_sentences)
        else:
            ans = random.choice(["I don't know.", "Can we skip this?", "I haven't learned this yet.", "It is a programming concept."])
            if random.random() < 0.3:
                ans += " " + random.choice(["Maybe related to data?", "I think it runs on the server.", "It's for the frontend."])
        score = random.uniform(0.0, 2.9)
        
    # Apply some random mutations (typos, casing)
    if random.random() < 0.1: # typo
        ans = ans.replace("a", "e", 1)
    if random.random() < 0.05: # all lower
        ans = ans.lower()
        
    return ans, round(score, 1)

data = []
target_samples = 5500
qualities = ["Excellent", "Good", "Average", "Poor", "Very Poor"]

print("Generating dataset...")
for i in range(target_samples):
    base = random.choice(base_questions)
    quality = random.choice(qualities)
    cand_ans, score = generate_answer(base, quality)
    
    # Rare edge cases for robustness
    if random.random() < 0.01:
        # Extremely short but good
        cand_ans = base["core_components"][0]
    elif random.random() < 0.01:
        # Extremely long but bad
        cand_ans = " ".join([random.choice(irrelevant_sentences) for _ in range(5)])
        score = random.uniform(0, 2)
        quality = "Very Poor"
        
    row = {
        "q_id": base["q_id"],
        "question": base["question"],
        "expected_answer": base["expected_answer"],
        "candidate_answer": cand_ans,
        "key_concepts": base["key_concepts"],
        "topic": base["topic"],
        "difficulty": base["difficulty"],
        "score": score,
        "quality": quality
    }
    data.append(row)

# Shuffle
random.shuffle(data)

os.makedirs('data', exist_ok=True)
df = pd.DataFrame(data)
df.to_csv("data/interview_dataset.csv", index=False)
print(f"Dataset created with {len(df)} rows at data/interview_dataset.csv")
print("Class distribution:")
print(df['quality'].value_counts())
print("Question distribution:")
print(df['q_id'].value_counts())
