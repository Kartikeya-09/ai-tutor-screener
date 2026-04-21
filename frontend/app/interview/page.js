"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCandidateAuth } from '@/lib/authStorage';

const useSpeechRecognition = ({ onResult, onEnd, onError }) => {
  const recognition = useRef(null);
  const shouldCapture = useRef(false);
  const stopRequested = useRef(false);
  const latestTranscript = useRef('');
  const silenceTimer = useRef(null);
  const submittedForTurn = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [isCaptureMode, setIsCaptureMode] = useState(false);

  const clearSilenceTimer = () => {
    if (silenceTimer.current) {
      window.clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) {
        onError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      }
      return;
    }

    recognition.current = new SpeechRecognition();
    const rec = recognition.current;
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en-US';

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const piece = result?.[0]?.transcript || '';
        if (!piece) continue;

        if (result.isFinal) {
          finalText = `${finalText} ${piece}`.trim();
        } else {
          interimText = `${interimText} ${piece}`.trim();
        }
      }

      const nextTranscript = `${finalText} ${interimText}`.trim();

      latestTranscript.current = nextTranscript;
      onResult(nextTranscript);

      clearSilenceTimer();
      if (shouldCapture.current && nextTranscript) {
        silenceTimer.current = window.setTimeout(() => {
          if (!recognition.current || !shouldCapture.current) return;

          if (!submittedForTurn.current && onEnd) {
            submittedForTurn.current = true;
            onEnd(nextTranscript);
          }

          shouldCapture.current = false;
          stopRequested.current = true;
          setIsCaptureMode(false);
          recognition.current.stop();
        }, 1800);
      }
    };

    rec.onend = () => {
      setIsListening(false);

      if (stopRequested.current) {
        stopRequested.current = false;
        setIsCaptureMode(false);
        if (!submittedForTurn.current && onEnd) {
          onEnd(latestTranscript.current);
        }
        latestTranscript.current = '';
        submittedForTurn.current = false;
        clearSilenceTimer();
        return;
      }

      // Keep capture mode stable and restart recognition on benign end events.
      if (shouldCapture.current) {
        window.setTimeout(() => {
          if (!recognition.current || !shouldCapture.current) return;
          try {
            recognition.current.start();
          } catch {
            // Ignore restart race conditions.
          }
        }, 200);
      }
    };

    rec.onerror = (event) => {
      setIsListening(false);

      // These are common during normal stop/restart cycles and should not alarm users.
      if (event?.error === 'aborted' || event?.error === 'no-speech') {
        return;
      }

      if (event?.error === 'audio-capture') {
        if (onError) {
          onError('No microphone was detected. Please connect/enable a mic and try again.');
        }
        return;
      }

      if (event?.error === 'network') {
        if (onError) {
          onError('Speech service had a temporary network issue. Please try again.');
        }
        return;
      }

      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        if (onError) {
          onError('Microphone permission was denied. Please enable microphone access in your browser settings.');
        }
        return;
      }

      if (onError) {
        onError('Audio capture was interrupted. Please try again and speak clearly.');
      }
    };

    return () => {
      clearSilenceTimer();
      rec.stop();
    };
  }, [onResult, onEnd, onError]);

  const startListening = async () => {
    if (recognition.current && !shouldCapture.current) {
      shouldCapture.current = true;
      stopRequested.current = false;
      latestTranscript.current = '';
      submittedForTurn.current = false;
      clearSilenceTimer();
      setIsCaptureMode(true);
      try {
        recognition.current.start();
        onResult('');
      } catch {
        setIsListening(false);
        if (onError) {
          onError('Unable to start microphone capture. Please retry.');
        }
      }
    }
  };

  const stopListening = () => {
    if (recognition.current && (isListening || shouldCapture.current)) {
      shouldCapture.current = false;
      stopRequested.current = true;
      setIsCaptureMode(false);
      clearSilenceTimer();
      recognition.current.stop();
      setIsListening(false);
    }
  };

  return { isListening, isCaptureMode, startListening, stopListening };
};

export default function InterviewPage() {
  const router = useRouter();
  const startListeningTimeoutRef = useRef(null);
  const [candidateToken, setCandidateToken] = useState('');
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isPreparingToListen, setIsPreparingToListen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [interviewMode, setInterviewMode] = useState('Exploring');

  const TOTAL_QUESTIONS = 6;
  const THINKING_GAP_MS = 1800;

  const speak = (text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      setIsPreparingToListen(true);
      startListeningTimeoutRef.current = window.setTimeout(() => {
        setIsPreparingToListen(false);
        startListening();
      }, THINKING_GAP_MS);
    };
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeechResult = (result) => {
    setTranscript(result);
  };

  const handleSpeechEnd = async (finalTranscript) => {
    const cleanedTranscript = String(finalTranscript || '').trim();
    if (cleanedTranscript) {
      await sendResponse(cleanedTranscript);
    }
  };

  const handleSpeechError = (message) => {
    setError(message);
  };

  const { isListening, isCaptureMode, startListening, stopListening } = useSpeechRecognition({
    onResult: handleSpeechResult,
    onEnd: handleSpeechEnd,
    onError: handleSpeechError,
  });

  useEffect(() => {
    return () => {
      if (startListeningTimeoutRef.current) {
        window.clearTimeout(startListeningTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const auth = getCandidateAuth();
    if (!auth?.token) {
      router.push('/login');
      return;
    }

    setCandidateToken(auth.token);

    const storedSession = JSON.parse(localStorage.getItem('interviewSession'));
    if (!storedSession || !storedSession.sessionId) {
      router.push('/');
      return;
    }

    setSession(storedSession);

    if (storedSession.firstQuestion) {
      setCurrentQuestion(storedSession.firstQuestion);
      setQuestionIndex(1);
      speak(storedSession.firstQuestion);
    } else {
      setError('Unable to load first question. Please restart your interview.');
    }
  }, [router]);

  const sendResponse = async (userTranscript) => {
    if (!session?.sessionId || !candidateToken) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${candidateToken}`,
        },
        body: JSON.stringify({ sessionId: session.sessionId, transcript: userTranscript }),
      });

      if (!response.ok) {
        throw new Error('Failed to send response.');
      }

      const data = await response.json();
      setTranscript('');

      if (data.isComplete) {
        const completionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${candidateToken}`,
          },
          body: JSON.stringify({ sessionId: session.sessionId }),
        });

        if (!completionResponse.ok) {
          throw new Error('Interview finished, but report generation failed. Please retry in a moment.');
        }

        router.push('/thank-you');
        return;
      }

      setCurrentQuestion(data.nextQuestion);
      setInterviewMode(data.interviewMode || 'Exploring');
      setQuestionIndex((prev) => prev + 1);
      speak(data.nextQuestion);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Live Interview Session</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900 sm:text-4xl">Question {questionIndex} of {TOTAL_QUESTIONS}</h1>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {isLoading ? 'Processing' : isPreparingToListen ? 'Preparing' : isCaptureMode ? 'Listening' : 'Ready'}
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Current Prompt</p>
            <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-900">
              Interview Mode: {interviewMode}
            </span>
          </div>
          <p className="mt-3 text-xl leading-8 text-slate-800">{currentQuestion || 'Loading first question...'}</p>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[180px_1fr] lg:items-start">
          <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5">
            <div className={`flex h-24 w-24 items-center justify-center rounded-full ${isCaptureMode ? 'bg-rose-500 animate-pulse' : 'bg-sky-100'}`}>
              <svg className={`h-10 w-10 ${isCaptureMode ? 'text-white' : 'text-sky-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <p className="mt-4 text-center text-sm font-medium text-slate-600">
              {isPreparingToListen ? 'Take a moment, recording will start shortly' : isCaptureMode ? 'Voice capture is active' : 'Tap below to respond'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Live Transcript</p>
              <button
                type="button"
                onClick={isCaptureMode ? stopListening : startListening}
                className="rounded-full bg-sky-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={isLoading || !currentQuestion}
              >
                {isCaptureMode ? 'Stop Answering' : 'Start Answering'}
              </button>
            </div>
            <div className="mt-4 min-h-24 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
              {transcript || 'Your spoken response will appear here in real time...'}
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        )}
      </section>
    </div>
  );
}
