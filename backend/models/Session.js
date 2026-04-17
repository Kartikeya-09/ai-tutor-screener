import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  candidateName: {
    type: String,
    required: true,
  },
  candidateEmail: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned'],
    default: 'in-progress',
  },
  conversation: [
    {
      role: String,
      content: String,
    },
  ],
  audioBlobs: [
    {
      questionIndex: Number,
      transcript: String,
    },
  ],
  currentQuestionIndex: {
    type: Number,
    default: 0,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
  },
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
