import express from 'express';
import { getAllReports, getReportById, getAllSessions } from '../controllers/assessmentController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/all', requireAuth, requireRole('admin'), getAllReports);
router.get('/sessions', requireAuth, requireRole('admin'), getAllSessions);
router.get('/report/:id', requireAuth, requireRole('admin'), getReportById);

export default router;
