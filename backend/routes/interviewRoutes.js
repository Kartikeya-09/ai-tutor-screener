import express from 'express';
import { startInterview, handleResponse, getSession } from '../controllers/interviewController.js';

const router = express.Router();

router.post('/start', startInterview);
router.post('/respond', handleResponse);
router.get('/session/:sessionId', getSession);

export default router;
