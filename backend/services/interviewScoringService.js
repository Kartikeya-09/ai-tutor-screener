const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const tokenize = (text = '') => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
};

const QUESTIONS_POOL = [
  "Tell me about yourself and why you want to be a tutor?",
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

const getWordCount = (text = '') => tokenize(text).length;

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
  if (isLikelyTangent(lastUserAnswer)) {
    return 'Let us focus on tutoring behavior. How would you support the student in that exact classroom moment?';
  }

  if (isVagueAnswer(lastUserAnswer)) {
    return buildFallbackFollowUp(currentQuestion);
  }

  if (currentQuestion.toLowerCase().includes('fractions')) {
    return 'What child-friendly example and exact words would you use in your first explanation?';
  }

  if (currentQuestion.toLowerCase().includes('frustrated')) {
    return 'How would you calm the student first, and what would you say in your first two sentences?';
  }

  return 'Can you give one concrete tutoring scenario and how you handled it step by step?';
};

const getInterviewMode = (answer = '') => {
  if (isLikelyTangent(answer)) return 'Refocusing';
  if (isVagueAnswer(answer)) return 'Clarifying';
  return 'Exploring';
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
    return { nextQuestion: null, nextIndex: currentIndex, isComplete: true, interviewMode: 'Completed' };
  }

  const currentQuestion = QUESTIONS_POOL[currentIndex];
  const lastUserAnswer = getLastByRole(conversationHistory, 'user');
  const lastAssistantQuestion = getLastByRole(conversationHistory, 'assistant');

  const answeredCoreQuestionNow = normalizeText(lastAssistantQuestion) === normalizeText(currentQuestion);
  const shouldProbe = isVagueAnswer(lastUserAnswer) || isLikelyTangent(lastUserAnswer);
  const interviewMode = getInterviewMode(lastUserAnswer);

  if (answeredCoreQuestionNow && shouldProbe) {
    const followUp = await generateFollowUpQuestion(currentQuestion, lastUserAnswer);
    return {
      nextQuestion: followUp,
      nextIndex: currentIndex,
      isComplete: false,
      interviewMode,
    };
  }

  const nextIndex = currentIndex + 1;
  if (nextIndex >= QUESTIONS_POOL.length) {
    return { nextQuestion: null, nextIndex: currentIndex, isComplete: true, interviewMode: 'Completed' };
  }

  return {
    nextQuestion: QUESTIONS_POOL[nextIndex],
    nextIndex,
    isComplete: false,
    interviewMode: 'Exploring',
  };
};

const KEYWORDS_BY_DIMENSION = {
  clarity: ['clear', 'clarify', 'explain', 'step', 'understand', 'simple', 'break'],
  warmth: ['encourage', 'reassure', 'support', 'kind', 'friendly', 'listen', 'motivate'],
  simplicity: ['example', 'analogy', 'visual', 'simple', 'easy', 'real-life', 'story'],
  patience: ['patient', 'calm', 'repeat', 'slowly', 'again', 'time', 'guide'],
  fluency: ['because', 'then', 'first', 'next', 'finally', 'therefore'],
};

const findBestQuote = (answers, keywords) => {
  for (const answer of answers) {
    const normalized = normalizeText(answer);
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return { quote: answer, matched: true };
    }
  }

  const fallback = answers[0] || 'No direct quote available.';
  return {
    quote: fallback,
    matched: false,
  };
};

const summarizeEvidence = (dimension, score) => {
  if (score >= 8) return `Strong ${dimension} signals across multiple responses with concrete tutoring actions.`;
  if (score >= 6) return `${dimension} is generally adequate but could be more specific in difficult student situations.`;
  return `${dimension} needs improvement through clearer, more detailed and student-focused communication.`;
};

const getConfidence = ({ score, matchedQuote, avgWordsPerAnswer, answerCount }) => {
  if (!matchedQuote || answerCount < 2) return 'Low';
  if (score >= 8 && avgWordsPerAnswer >= 10) return 'High';
  if (score >= 6 && avgWordsPerAnswer >= 6) return 'Medium';
  return 'Low';
};

const buildDimensionScores = (answers) => {
  const allTokens = answers.flatMap((answer) => tokenize(answer));
  const avgWordsPerAnswer = answers.length
    ? Math.round((answers.reduce((acc, answer) => acc + tokenize(answer).length, 0) / answers.length) * 10) / 10
    : 0;
  const hasVeryShortResponses = answers.some((answer) => getWordCount(answer) <= 3);

  const dimensions = {};

  Object.entries(KEYWORDS_BY_DIMENSION).forEach(([dimension, keywords]) => {
    const keywordHits = allTokens.filter((token) => keywords.includes(token)).length;
    let score = clamp(5 + keywordHits, 1, 10);
    const { quote, matched } = findBestQuote(answers, keywords);

    // Fairness guardrail: do not infer fluency from accent; only use structure/length coherence signals.
    if (!matched && score > 7) {
      score = 7;
    }

    // Edge-case guardrail for one-word/choppy responses.
    if (hasVeryShortResponses && score > 6) {
      score = 6;
    }

    if (dimension === 'fluency') {
      if (avgWordsPerAnswer >= 14) score += 1;
      if (avgWordsPerAnswer <= 5) score -= 2;
      score = clamp(score, 1, 10);
    }

    score = clamp(score, 1, 10);

    const confidence = getConfidence({
      score,
      matchedQuote: matched,
      avgWordsPerAnswer,
      answerCount: answers.length,
    });

    dimensions[dimension] = {
      score,
      evidence: summarizeEvidence(dimension, score),
      quote,
      confidence,
    };
  });

  return dimensions;
};

const buildRecommendation = (overallScore) => {
  if (overallScore >= 7.5) return 'Proceed';
  if (overallScore >= 5.5) return 'Hold';
  return 'Reject';
};

const buildSummary = (candidateAnswers, overallScore) => {
  if (!candidateAnswers.length) {
    return 'Insufficient candidate responses were captured to produce a high-confidence communication assessment.';
  }

  if (overallScore >= 7.5) {
    return 'Candidate showed strong tutoring communication with clear explanations, supportive tone, and practical examples appropriate for student learning. Fluency observations are based on response structure, not accent.';
  }

  if (overallScore >= 5.5) {
    return 'Candidate demonstrated baseline tutoring communication but needs more consistent specificity and stronger child-level simplification in difficult moments. Fluency observations are based on response structure, not accent.';
  }

  return 'Candidate responses lacked consistent clarity and concrete tutoring strategy, indicating significant coaching is needed before next-round progression. Fluency observations are based on response structure, not accent.';
};

/**
 * Generates a comprehensive assessment report from conversation history using local deterministic scoring.
 * @param {Array<Object>} conversation - The full conversation history.
 * @returns {Promise<Object>} - The generated report object.
 */
export const generateReport = async (conversation) => {
  console.log('Generating report using local scoring engine...');

  const fullTranscript = conversation
    .map((entry) => `${entry.role}: ${entry.content}`)
    .join('\n');

  const candidateAnswers = conversation
    .filter((entry) => entry.role === 'user')
    .map((entry) => String(entry.content || '').trim())
    .filter(Boolean);

  const dimensions = buildDimensionScores(candidateAnswers);
  const dimensionScores = Object.values(dimensions).map((dimension) => dimension.score);
  const overallScore = dimensionScores.length
    ? Math.round((dimensionScores.reduce((sum, score) => sum + score, 0) / dimensionScores.length) * 10) / 10
    : 0;

  const rankedDimensions = Object.entries(dimensions)
    .sort((a, b) => b[1].score - a[1].score);

  const strengths = rankedDimensions
    .slice(0, 3)
    .map(([name, data]) => `${name.charAt(0).toUpperCase() + name.slice(1)}: ${data.evidence}`);

  const areasOfConcern = rankedDimensions
    .slice(-2)
    .map(([name, data]) => `${name.charAt(0).toUpperCase() + name.slice(1)}: ${data.evidence}`);

  return {
    overallScore,
    recommendation: buildRecommendation(overallScore),
    dimensions,
    strengths,
    areasOfConcern,
    summary: buildSummary(candidateAnswers, overallScore),
    fullTranscript,
  };
};
