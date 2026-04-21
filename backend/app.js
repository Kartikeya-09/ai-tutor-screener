import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import interviewRoutes from './routes/interviewRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { ensureAdminUser } from './services/authService.js';


const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, curl, health checks).
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/assessment', assessmentRoutes);

// Health check route
app.get('/api/healthcheck', (req, res) => {
  const dbState = mongoose.connection.readyState;
  let dbStatus = 'Disconnected';
  if (dbState === 1) {
    dbStatus = 'Connected';
  } else if (dbState === 2) {
    dbStatus = 'Connecting';
  } else if (dbState === 3) {
    dbStatus = 'Disconnecting';
  }
  
  res.status(200).json({
    server: 'Running',
    database: dbStatus,
  });
});

app.get('/', (req, res) => {
  res.send('AI Tutor Screener API is running...');
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing from environment variables.');
    }

    await ensureAdminUser();

    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Connection error', error.message);
  });
