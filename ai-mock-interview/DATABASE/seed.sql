-- Seed Data for AI Mock Interview Platform

-- Users
INSERT INTO users (name, email, password) VALUES 
('Test User 1', 'test1@example.com', 'hashed_password_placeholder'),
('Test User 2', 'test2@example.com', 'hashed_password_placeholder');

-- Questions (Software Engineering)
INSERT INTO questions (question, topic, difficulty, role, type, expected_answer, key_concepts) VALUES
('What is a HashMap in Java?', 'Data Structures', 'Medium', 'Backend Developer', 'Technical', 'A HashMap stores key-value pairs using a hash table. It provides average O(1) time complexity for lookup and insertion.', 'key-value, hash table, O(1), lookup, insertion'),
('Explain the difference between let, const, and var in JavaScript.', 'JavaScript', 'Easy', 'Frontend Developer', 'Technical', 'var is function-scoped and hoisted. let and const are block-scoped. let can be reassigned, while const cannot be reassigned after declaration.', 'block-scoped, function-scoped, hoisted, reassignment'),
('What is dependency injection?', 'Software Design', 'Medium', 'Software Engineer', 'Technical', 'Dependency injection is a design pattern where an object receives its dependencies from an external source rather than creating them itself, promoting loose coupling.', 'design pattern, dependencies, external source, loose coupling'),
('How does garbage collection work in Python?', 'Python', 'Medium', 'Backend Developer', 'Technical', 'Python uses reference counting primarily, along with a cyclic garbage collector that detects and cleans up reference cycles.', 'reference counting, cyclic garbage collector, reference cycles'),
('What is a REST API?', 'Web Services', 'Easy', 'Full Stack Developer', 'Technical', 'REST is an architectural style for designing networked applications. It relies on stateless, client-server communication using standard HTTP methods like GET, POST, PUT, and DELETE.', 'architectural style, stateless, client-server, HTTP methods'),
('What is the difference between TCP and UDP?', 'Networking', 'Medium', 'Systems Engineer', 'Technical', 'TCP is connection-oriented, reliable, and ensures ordered delivery. UDP is connectionless, faster, but does not guarantee delivery or order.', 'connection-oriented, reliable, connectionless, guaranteed delivery'),
('What are SOLID principles?', 'Object-Oriented Design', 'Hard', 'Software Engineer', 'Technical', 'SOLID stands for Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion. They are design principles to make software more maintainable.', 'Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion'),
('Explain the concept of virtualization.', 'Cloud Computing', 'Medium', 'DevOps', 'Technical', 'Virtualization allows multiple virtual machines to run on a single physical machine by sharing hardware resources, managed by a hypervisor.', 'virtual machines, physical machine, hardware resources, hypervisor'),
('What is the purpose of an index in a database?', 'Databases', 'Easy', 'Data Engineer', 'Technical', 'An index is a data structure that improves the speed of data retrieval operations on a database table at the cost of additional storage space and slower writes.', 'data retrieval, speed, data structure, storage space'),
('Describe how a load balancer works.', 'System Architecture', 'Medium', 'Site Reliability Engineer', 'Technical', 'A load balancer distributes incoming network traffic across multiple servers to ensure no single server becomes overwhelmed, improving responsiveness and availability.', 'distributes traffic, multiple servers, overwhelmed, responsiveness, availability');

-- Interviews
INSERT INTO interviews (user_id, role, difficulty, status) VALUES
(1, 'Backend Developer', 'Medium', 'ongoing'),
(2, 'Frontend Developer', 'Easy', 'ongoing');
