import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import annotationRoutes from './routes/annotationRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost'];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json()); // Parses incoming JSON requests

// Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'backend' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/annotations', annotationRoutes);
app.use('/api/resume', resumeRoutes);

// Base route for testing
app.get('/', (req, res) => {
    res.send('AI Mock Interview API is running...');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
