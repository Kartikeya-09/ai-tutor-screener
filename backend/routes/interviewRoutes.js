import express from 'express';
import { startInterview, handleResponse, completeInterview } from '../controllers/interviewController.js';

const router = express.Router();

router.post('/start', startInterview);
router.post('/respond', handleResponse);
router.post('/complete', completeInterview);

export default router;
