import express from 'express';
import { 
    evaluateInterviewAnswer, 
    startInterview, 
    getInterviewQuestions,
    getInterviewHistory,
    completeInterview,
    getInterviewReport
} from '../controllers/interviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Specific routes before parameterized :id routes
router.get('/history', protect, getInterviewHistory);
router.post('/start', protect, startInterview);
router.post('/evaluate', protect, evaluateInterviewAnswer);

// Parameterized interview routes
router.get('/:id/questions', protect, getInterviewQuestions);
router.post('/:id/complete', protect, completeInterview);
router.get('/:id/report', protect, getInterviewReport);

export default router;
