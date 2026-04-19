import express from 'express';
import { getAllReports, getReportById, getAllSessions } from '../controllers/assessmentController.js';

const router = express.Router();

router.get('/all', getAllReports);
router.get('/sessions', getAllSessions); // Add this route
router.get('/report/:id', getReportById);

export default router;
