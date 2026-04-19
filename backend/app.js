import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import interviewRoutes from './routes/interviewRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000'
}));
app.use(express.json());

// Routes
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
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Connection error', error.message);
  });
