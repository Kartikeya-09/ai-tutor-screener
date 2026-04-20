import Session from '../models/Session.js';
import Report from '../models/Report.js';
import { getNextQuestion, generateReport } from '../services/geminiService.js';

/**
 * Starts a new interview session.
 */
export const startInterview = async (req, res) => {
  const { candidateName, candidateEmail } = req.body;

  if (!candidateName || !candidateEmail) {
    return res.status(400).json({ message: 'Candidate name and email are required.' });
  }

  try {
    // Use the simple function for now
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
    // Use the simple function for now
        const nextQuestion = await getNextQuestion(session.conversation, nextQuestionIndex); 

    let isComplete = false;
    let reportId = null;

    if (nextQuestion) {
      // Continue the interview
      session.conversation.push({ role: 'assistant', content: nextQuestion });
      session.currentQuestionIndex = nextQuestionIndex;
    } else {
      // Interview is complete, generate the report
      session.status = 'completed';
      session.completedAt = new Date();
      isComplete = true;

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
      nextQuestion: nextQuestion,
      isComplete: isComplete,
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

    res.status(200).json(session);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ message: 'Failed to get session.' });
  }
};
