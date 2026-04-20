import express from 'express';
import { startInterview, handleResponse, getSession, completeInterview } from '../controllers/interviewController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/start', requireAuth, requireRole('candidate'), startInterview);
router.post('/respond', requireAuth, requireRole('candidate'), handleResponse);
router.post('/complete', requireAuth, requireRole('candidate'), completeInterview);
router.get('/session/:sessionId', requireAuth, requireRole('candidate'), getSession);

export default router;
