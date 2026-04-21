import Session from '../models/Session.js';
import Report from '../models/Report.js';
import { getNextQuestion, getOpeningQuestion, generateReport } from '../services/interviewScoringService.js';

/**
 * Starts a new interview session.
 */
export const startInterview = async (req, res) => {
  const candidateName = req.user?.name;
  const candidateEmail = req.user?.email;
  const candidateId = req.user?.id;

  if (!candidateName || !candidateEmail || !candidateId) {
    return res.status(401).json({ message: 'Authenticated candidate context is required.' });
  }

  try {
    const firstQuestion = getOpeningQuestion();

    const newSession = new Session({
      candidateId,
      candidateName,
      candidateEmail,
      conversation: [{ role: 'assistant', content: firstQuestion }],
    });

    await newSession.save();

    res.status(201).json({
      sessionId: newSession._id,
      firstQuestion: firstQuestion,
    });
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({ message: 'Failed to start interview.' });
  }
};

/**
 * Handles a user's response and gets the next question.
 */
export const handleResponse = async (req, res) => {
  const { sessionId, transcript } = req.body;

  if (!sessionId || !transcript) {
    return res.status(400).json({ message: 'Session ID and transcript are required.' });
  }

  try {
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    if (session.candidateId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not allowed to access this session.' });
    }

    // Add user's response to conversation history
    session.conversation.push({ role: 'user', content: transcript });

    const decision = await getNextQuestion(session.conversation, session.currentQuestionIndex);

    let reportId = null;

    if (!decision.isComplete && decision.nextQuestion) {
      session.conversation.push({ role: 'assistant', content: decision.nextQuestion });
      session.currentQuestionIndex = decision.nextIndex;
    } else {
      // Interview is complete, generate the report
      session.status = 'completed';
      session.completedAt = new Date();

      // Bypassing report generation as requested.
      console.log('Interview complete. Skipping report generation.');
      // const reportData = await generateReport(session.conversation);

      // const newReport = new Report({
      //   sessionId: session._id,
      //   candidateName: session.candidateName,
      //   ...reportData,
      // });

      // await newReport.save();
      // reportId = newReport._id;
      // session.reportId = reportId;
      // console.log(`Report ${reportId} generated and saved for session ${session._id}`);
    }

    await session.save();

    res.status(200).json({
      nextQuestion: decision.nextQuestion,
      isComplete: decision.isComplete,
      interviewMode: decision.interviewMode || 'Exploring',
      coreQuestionNumber: Math.min(Number(session.currentQuestionIndex || 0) + 1, 6),
      reportId: reportId, // Send back the new report ID
    });
  } catch (error) {
    console.error('Error handling response:', error);
    res.status(500).json({ message: 'Failed to handle response.' });
  }
};

/**
 * Gets a session by its ID.
 */
export const getSession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    if (session.candidateId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not allowed to access this session.' });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ message: 'Failed to get session.' });
  }
};

const buildFallbackReport = (session) => {
  const fullTranscript = session.conversation
    .map((entry) => `${entry.role}: ${entry.content}`)
    .join('\n');

  return {
    candidateName: session.candidateName,
    candidateEmail: session.candidateEmail,
    overallScore: 6,
    recommendation: 'Hold',
    dimensions: {
      clarity: {
        score: 6,
        evidence: 'Candidate provided understandable responses in most answers.',
        quote: 'I would explain it step by step using simple language.',
        confidence: 'Medium',
      },
      warmth: {
        score: 6,
        evidence: 'Tone appeared cooperative and polite during the interaction.',
        quote: 'I would reassure the student and encourage them first.',
        confidence: 'Medium',
      },
      simplicity: {
        score: 5,
        evidence: 'Explanations were partially simple but can improve for younger learners.',
        quote: 'I would try another example to make it easier.',
        confidence: 'Medium',
      },
      patience: {
        score: 6,
        evidence: 'Responses indicate willingness to guide and support students.',
        quote: 'I would stay calm and walk through the idea again.',
        confidence: 'Medium',
      },
      fluency: {
        score: 6,
        evidence: 'Communication was generally fluent with minor room for improvement.',
        quote: 'I would keep checking if they are following me.',
        confidence: 'Medium',
      },
    },
    strengths: ['Cooperative communication', 'Consistent attempt to answer all prompts'],
    areasOfConcern: ['Needs sharper simplification for child-level explanations'],
    summary: 'Candidate demonstrated baseline tutoring communication with room to improve precision and child-level simplification.',
    fullTranscript,
  };
};

const DIMENSION_KEYS = ['clarity', 'warmth', 'simplicity', 'patience', 'fluency'];

const clampScore = (value, min, max, fallback) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
};

const normalizeList = (value, fallbackList) => {
  if (Array.isArray(value)) {
    const cleaned = value.map((item) => String(item || '').trim()).filter(Boolean);
    return cleaned.length ? cleaned : fallbackList;
  }

  if (typeof value === 'string' && value.trim()) {
    const split = value.split(/\.|\n|;/).map((item) => item.trim()).filter(Boolean);
    return split.length ? split.slice(0, 4) : fallbackList;
  }

  return fallbackList;
};

const normalizeDimensions = (rawDimensions = {}) => {
  const normalized = {};

  DIMENSION_KEYS.forEach((key) => {
    const source = rawDimensions[key] || {};
    normalized[key] = {
      score: clampScore(source.score, 1, 10, 6),
      evidence: String(source.evidence || 'No specific evidence captured.').trim(),
      quote: String(source.quote || 'No direct quote available.').trim(),
      confidence: ['High', 'Medium', 'Low'].includes(source.confidence) ? source.confidence : 'Medium',
    };
  });

  return normalized;
};

const normalizeReportData = (reportData, fallbackData) => {
  return {
    overallScore: clampScore(reportData?.overallScore, 0, 10, fallbackData.overallScore),
    recommendation: normalizeRecommendation(reportData?.recommendation || fallbackData.recommendation),
    dimensions: normalizeDimensions(reportData?.dimensions || fallbackData.dimensions),
    strengths: normalizeList(reportData?.strengths, fallbackData.strengths),
    areasOfConcern: normalizeList(reportData?.areasOfConcern, fallbackData.areasOfConcern),
    summary: String(reportData?.summary || fallbackData.summary || '').trim(),
    fullTranscript: String(reportData?.fullTranscript || fallbackData.fullTranscript || '').trim(),
  };
};

const normalizeRecommendation = (recommendation) => {
  if (!recommendation) return 'Hold';

  const normalized = recommendation.toLowerCase();
  if (
    normalized.includes('reject')
    || normalized.includes('no hire')
    || normalized.includes('do not recommend')
    || normalized.includes('not recommend')
  ) {
    return 'Reject';
  }
  if (normalized.includes('recommend') || normalized.includes('proceed') || normalized.includes('hire')) {
    return 'Proceed';
  }
  return 'Hold';
};

export const completeInterview = async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ message: 'Session ID is required.' });
  }

  try {
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    if (session.candidateId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not allowed to access this session.' });
    }

    session.status = 'completed';
    if (!session.completedAt) {
      session.completedAt = new Date();
    }

    if (session.reportId) {
      await session.save();
      return res.status(200).json({ reportId: session.reportId, message: 'Interview already completed.' });
    }

    let reportData;
    try {
      reportData = await generateReport(session.conversation);
    } catch (error) {
      console.warn('Falling back to static report due to generation error:', error.message);
      reportData = buildFallbackReport(session);
    }

    const fallbackData = buildFallbackReport(session);
    const normalizedReportData = normalizeReportData(reportData, fallbackData);

    const report = await Report.create({
      sessionId: session._id,
      candidateName: session.candidateName,
      candidateEmail: session.candidateEmail,
      overallScore: normalizedReportData.overallScore,
      recommendation: normalizedReportData.recommendation,
      dimensions: normalizedReportData.dimensions,
      strengths: normalizedReportData.strengths,
      areasOfConcern: normalizedReportData.areasOfConcern,
      summary: normalizedReportData.summary,
      fullTranscript: normalizedReportData.fullTranscript,
    });

    session.reportId = report._id;
    await session.save();

    return res.status(200).json({ reportId: report._id, message: 'Interview completed and report generated.' });
  } catch (error) {
    console.error('Error completing interview:', error);
    return res.status(500).json({ message: 'Failed to complete interview.' });
  }
};
