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

const getLastByRole = (conversationHistory, role) => {
  for (let i = conversationHistory.length - 1; i >= 0; i -= 1) {
    if (conversationHistory[i].role === role) {
      return conversationHistory[i].content || '';
    }
  }
  return '';
};

const normalizeText = (value = '') => value.trim().toLowerCase();

const isVagueAnswer = (answer = '') => {
  const trimmed = answer.trim();
  if (!trimmed) return true;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= 3) return true;

  const vaguePhrases = [
    'i dont know',
    "i don't know",
    'not sure',
    'maybe',
    'it depends',
    'yes',
    'no',
    'okay',
  ];

  const normalized = normalizeText(trimmed);
  return vaguePhrases.some((phrase) => normalized === phrase || normalized.startsWith(`${phrase} `));
};

const isLikelyTangent = (answer = '') => {
  const normalized = normalizeText(answer);
  if (!normalized) return false;

  const offTopicSignals = [
    'salary',
    'package',
    'vacation',
    'leave policy',
    'office location',
    'promotion',
  ];

  const onTopicSignals = [
    'student',
    'child',
    'explain',
    'teach',
    'lesson',
    'fractions',
    'patience',
    'engage',
  ];

  const hasOffTopic = offTopicSignals.some((term) => normalized.includes(term));
  const hasOnTopic = onTopicSignals.some((term) => normalized.includes(term));

  return hasOffTopic && !hasOnTopic;
};

const buildFallbackFollowUp = (currentQuestion) => {
  if (currentQuestion.toLowerCase().includes('fractions')) {
    return 'Could you explain that as if the child is still confused after your first explanation?';
  }

  if (currentQuestion.toLowerCase().includes('frustrated')) {
    return 'What exact words would you use in that first 30 seconds with the student?';
  }

  return 'Could you share a specific example so I can understand your tutoring approach better?';
};

const generateFollowUpQuestion = async (currentQuestion, lastUserAnswer) => {
  try {
    const prompt = `
You are an AI interviewer for Cuemath tutor screening.
Current interview question: "${currentQuestion}"
Candidate answer: "${lastUserAnswer}"

Write ONE short follow-up question to get clearer, concrete details.
Rules:
- Keep it conversational and warm.
- Do not ask multiple questions.
- Max 22 words.
- Focus on tutoring behavior and communication.
- Return only the question text.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text.replace(/\n/g, ' ');
  } catch {
    return buildFallbackFollowUp(currentQuestion);
  }
};

export const getOpeningQuestion = () => QUESTIONS_POOL[0];

/**
 * Determines the next interviewer turn based on answer quality.
 * @param {Array<Object>} conversationHistory - The conversation history so far.
 * @param {number} currentIndex - The current core question index.
 * @returns {Promise<{ nextQuestion: string | null, nextIndex: number, isComplete: boolean }>} The next interviewer decision.
 */
export const getNextQuestion = async (conversationHistory, currentIndex) => {
  if (currentIndex >= QUESTIONS_POOL.length) {
    return { nextQuestion: null, nextIndex: currentIndex, isComplete: true };
  }

  const currentQuestion = QUESTIONS_POOL[currentIndex];
  const lastUserAnswer = getLastByRole(conversationHistory, 'user');
  const lastAssistantQuestion = getLastByRole(conversationHistory, 'assistant');

  const answeredCoreQuestionNow = normalizeText(lastAssistantQuestion) === normalizeText(currentQuestion);
  const shouldProbe = isVagueAnswer(lastUserAnswer) || isLikelyTangent(lastUserAnswer);

  if (answeredCoreQuestionNow && shouldProbe) {
    const followUp = await generateFollowUpQuestion(currentQuestion, lastUserAnswer);
    return {
      nextQuestion: followUp,
      nextIndex: currentIndex,
      isComplete: false,
    };
  }

  const nextIndex = currentIndex + 1;
  if (nextIndex >= QUESTIONS_POOL.length) {
    return { nextQuestion: null, nextIndex: currentIndex, isComplete: true };
  }

  return {
    nextQuestion: QUESTIONS_POOL[nextIndex],
    nextIndex,
    isComplete: false,
  };
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
