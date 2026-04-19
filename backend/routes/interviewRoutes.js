import express from 'express';
import { startInterview, handleResponse, completeInterview, getSession } from '../controllers/interviewController.js';

const router = express.Router();

router.post('/start', startInterview);
router.post('/respond', handleResponse);
router.post('/complete', completeInterview);
router.get('/session/:sessionId', getSession);

export default router;
