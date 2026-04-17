import express from 'express';
import { getAllReports, getReportById } from '../controllers/assessmentController.js';

const router = express.Router();

router.get('/all', getAllReports);
router.get('/report/:id', getReportById);

export default router;
