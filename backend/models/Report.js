import mongoose from 'mongoose';
const reportSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  candidateName: {
    type: String,
    required: true,
  },
  candidateEmail: {
    type: String,
    required: true,
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 10,
  },
  recommendation: {
    type: String,
    enum: ['Proceed', 'Hold', 'Reject'],
  },
  dimensions: {
    clarity: {
      score: { type: Number, min: 1, max: 10 },
      evidence: String,
      quote: String,
    },
    warmth: {
      score: { type: Number, min: 1, max: 10 },
      evidence: String,
      quote: String,
    },
    simplicity: {
      score: { type: Number, min: 1, max: 10 },
      evidence: String,
      quote: String,
    },
    patience: {
      score: { type: Number, min: 1, max: 10 },
      evidence: String,
      quote: String,
    },
    fluency: {
      score: { type: Number, min: 1, max: 10 },
      evidence: String,
      quote: String,
    },
  },
  fullTranscript: {
    type: String,
  },
  strengths: [String],
  areasOfConcern: [String],
  summary: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Report = mongoose.model('Report', reportSchema);

export default Report;
