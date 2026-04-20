import express from 'express';
import { registerCandidate, loginCandidate, loginAdmin } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerCandidate);
router.post('/login', loginCandidate);
router.post('/admin/login', loginAdmin);

export default router;