import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const INTERVIEWER_SYSTEM_PROMPT = `You are a professional AI interviewer for Cuemath, an ed-tech company. You are screening tutor candidates for communication clarity, warmth, patience, ability to simplify concepts, and English fluency. You are NOT testing math knowledge. Ask natural, conversational follow-up questions. Keep responses short and conversational. Listen carefully and probe vague answers.`;

const QUESTIONS_POOL = [
  "Tell me about yourself and why you want to be a tutor.",
  "How would you explain fractions to a 9-year-old who is confused?",
  "A student has been stuck on the same problem for 10 minutes and looks frustrated. What do you do?",
  "Can you give me an example of a time you explained something difficult in a simple way?",
  "What does patience mean to you as a teacher?",
  "How do you keep a child engaged when they lose interest?"
];

/**
 * Gets the next interview question from Claude.
 * @param {Array<Object>} conversationHistory - The conversation history so far.
 * @param {number} currentIndex - The current question index.
 * @returns {Promise<string>} The next question from Claude.
 */
export const getNextQuestion = async (conversationHistory, currentIndex) => {
  // For the first question, return from the pool directly.
  if (currentIndex === 0) {
    return QUESTIONS_POOL[0];
  }

  // If we've asked all questions, signal completion.
  if (currentIndex >= QUESTIONS_POOL.length) {
    return null; // Or a specific completion message
  }

  // Logic to decide the next question can be more sophisticated.
  // For now, we'll just progress through the pool.
  // A more advanced implementation would use Claude to adaptively select the next question.
  const nextQuestion = QUESTIONS_POOL[currentIndex];
  
  // This is where you would typically call Claude to get a more dynamic question
  // based on the conversation history. For this step, we will return a static question.
  
  return nextQuestion;
};

/**
 * Generates a structured assessment report using Claude.
 * @param {string} fullConversation - The full transcript of the interview.
 * @param {string} candidateName - The name of the candidate.
 * @returns {Promise<Object>} The structured assessment report.
 */
export const generateAssessment = async (fullConversation, candidateName) => {
  // Placeholder for the assessment generation logic.
  // This function will call the Claude API with the full conversation
  // and a prompt to generate the structured assessment report.
  
  console.log(`Generating assessment for ${candidateName}...`);
  
  // This is a mock response structure. The actual implementation will
  // parse the response from the Claude API.
  const mockAssessment = {
    overallScore: 8.2,
    recommendation: 'Proceed',
    dimensions: {
      clarity: { score: 8, evidence: "Candidate provided clear, well-structured answers." },
      warmth: { score: 9, evidence: "Maintained a friendly and encouraging tone throughout." },
      simplicity: { score: 8, evidence: "Effectively broke down a complex topic (fractions)." },
      patience: { score: 7, evidence: "Showed a calm demeanor when discussing a frustrated student." },
      fluency: { score: 9, evidence: "Spoke fluent, natural English with confidence." }
    },
    fullTranscript: fullConversation,
    strengths: ["Excellent communication skills", "Personable and warm demeanor"],
    areasOfConcern: ["Could provide more specific examples for patience."],
  };

  return mockAssessment;
};
