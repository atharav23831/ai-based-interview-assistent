import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { uploadResume } from '../controllers/resumeController.js';

const router = express.Router();

router.post('/upload', protect, upload.single('file'), uploadResume);

export default router;
