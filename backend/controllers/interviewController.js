import Session from '../models/Session.js';
import { getNextQuestion } from '../services/claudeService.js';

/**
 * Starts a new interview session.
 */
export const startInterview = async (req, res) => {
  const { candidateName, candidateEmail } = req.body;

  if (!candidateName || !candidateEmail) {
    return res.status(400).json({ message: 'Candidate name and email are required.' });
  }

  try {
    const firstQuestion = await getNextQuestion([], 0);

    const newSession = new Session({
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

    // Add user's response to conversation history
    session.conversation.push({ role: 'user', content: transcript });

    const nextQuestionIndex = session.currentQuestionIndex + 1;
    const nextQuestion = await getNextQuestion(session.conversation, nextQuestionIndex);

    let isComplete = false;
    if (nextQuestion) {
      session.conversation.push({ role: 'assistant', content: nextQuestion });
      session.currentQuestionIndex = nextQuestionIndex;
    } else {
      session.status = 'completed';
      session.completedAt = new Date();
      isComplete = true;
    }

    await session.save();

    res.status(200).json({
      nextQuestion: nextQuestion,
      isComplete: isComplete,
    });
  } catch (error) {
    console.error('Error handling response:', error);
    res.status(500).json({ message: 'Failed to handle response.' });
  }
};

/**
 * Marks the interview as complete and triggers assessment.
 */
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

    // In a real application, this would trigger a background job
    // to generate the assessment. For now, we'll just log it.
    console.log(`Assessment generation triggered for session: ${sessionId}`);

    // The reportId will be created when the assessment is actually generated.
    // For now, we'll return a placeholder.
    res.status(200).json({ message: 'Assessment generation initiated.', reportId: null });
  } catch (error) {
    console.error('Error completing interview:', error);
    res.status(500).json({ message: 'Failed to complete interview.' });
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

    res.status(200).json(session);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ message: 'Failed to get session.' });
  }
};
