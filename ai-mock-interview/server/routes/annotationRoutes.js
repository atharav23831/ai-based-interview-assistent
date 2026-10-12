import express from 'express';
import { getPendingAnnotation, submitAnnotation } from '../controllers/annotationController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Annotation endpoints require authentication AND annotator/admin role
router.get('/pending', protect, requireRole('annotator', 'admin'), getPendingAnnotation);
router.post('/', protect, requireRole('annotator', 'admin'), submitAnnotation);

export default router;
