import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
 * Gets the next interview question.
 * @param {Array<Object>} conversationHistory - The conversation history so far.
 * @param {number} currentIndex - The current question index.
 * @returns {Promise<string>} The next question.
 */
export const getNextQuestion = async (conversationHistory, currentIndex) => {
  // For the first question, return from the pool directly.
  if (currentIndex === 0) {
    return QUESTIONS_POOL[0];
  }

  // If we've asked all questions, signal completion.
  if (currentIndex >= QUESTIONS_POOL.length) {
    return null;
  }

  // For subsequent questions, we'll just pull from the static pool for now.
  // A more advanced implementation could use Gemini to generate dynamic follow-up questions.
  return QUESTIONS_POOL[currentIndex];
};

/**
 * Generates a comprehensive assessment report from a conversation history using Gemini.
 * @param {Array<Object>} conversation - The full conversation history.
 * @returns {Promise<Object>} - The parsed JSON report.
 */
export const generateReport = async (conversation) => {
  console.log('Generating report for conversation with Gemini...');

  const systemPrompt = `
You are an expert HR analyst. Your task is to analyze the provided interview transcript and generate a comprehensive assessment report.
The report must be in JSON format and include the following fields:
- "overallScore": A score from 1 to 10, where 1 is poor and 10 is excellent.
- "strengths": A brief paragraph highlighting the candidate's key strengths based on their answers.
- "areasForImprovement": A brief paragraph suggesting areas where the candidate could improve.
- "recommendation": A final recommendation, either "Recommend for next round", "Consider with reservations", or "Do not recommend".
- "summary": A concise summary of the entire interview, touching upon key responses and overall impression.

Analyze the conversation provided and return ONLY the JSON object. Do not include any explanatory text or markdown formatting.
`;

  // Gemini uses a different format for conversation history. We need to adapt it.
  const history = conversation.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  // The last message should be the prompt to generate the report.
  const finalPrompt = 'Based on the entire conversation, please generate the assessment report as a JSON object.';

  try {
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "Understood. I will analyze the interview and provide the report in JSON format." }] },
        ...history
      ],
      generationConfig: {
        maxOutputTokens: 2048,
      },
    });

    const result = await chat.sendMessage(finalPrompt);
    const response = result.response;
    const reportJsonString = response.text();
    
    console.log('Raw report from Gemini:', reportJsonString);

    // Clean the string in case Gemini wraps it in markdown
    const cleanedJson = reportJsonString.replace(/```json\n|```/g, '').trim();
    
    const report = JSON.parse(cleanedJson);
    console.log('Successfully parsed report from Gemini.');
    return report;
  } catch (error) {
    console.error('Error generating report from Gemini:', error);
    throw new Error('Failed to generate assessment report from Gemini.');
  }
};
