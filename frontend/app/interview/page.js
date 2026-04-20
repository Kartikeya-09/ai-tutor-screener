"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const useSpeechRecognition = ({ onResult, onEnd }) => {
  const recognition = useRef(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    recognition.current = new SpeechRecognition();
    const rec = recognition.current;
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      const nextTranscript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('');
      onResult(nextTranscript);
    };

    rec.onend = () => {
      setIsListening(false);
      if (onEnd) onEnd();
    };

    rec.onerror = () => {
      setIsListening(false);
    };

    return () => {
      rec.stop();
    };
  }, [onResult, onEnd]);

  const startListening = () => {
    if (recognition.current && !isListening) {
      recognition.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognition.current && isListening) {
      recognition.current.stop();
      setIsListening(false);
    }
  };

  return { isListening, startListening, stopListening };
};

export default function InterviewPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);

  const TOTAL_QUESTIONS = 6;

  const speak = (text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      startListening();
    };
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeechResult = (result) => {
    setTranscript(result);
  };

  const handleSpeechEnd = async () => {
    if (transcript.trim()) {
      await sendResponse(transcript);
    }
  };

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onResult: handleSpeechResult,
    onEnd: handleSpeechEnd,
  });

  useEffect(() => {
    const storedSession = JSON.parse(localStorage.getItem('interviewSession'));
    if (!storedSession || !storedSession.sessionId) {
      router.push('/');
      return;
    }

    setSession(storedSession);

    const fetchFirstQuestion = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateName: storedSession.name, candidateEmail: storedSession.email }),
        });

        if (!response.ok) throw new Error('Could not fetch the first question.');

        const data = await response.json();
        setCurrentQuestion(data.firstQuestion);
        setQuestionIndex(1);
        speak(data.firstQuestion);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFirstQuestion();
  }, [router]);

  const sendResponse = async (userTranscript) => {
    if (!session?.sessionId) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId, transcript: userTranscript }),
      });

      if (!response.ok) {
        throw new Error('Failed to send response.');
      }

      const data = await response.json();
      setTranscript('');

      if (data.isComplete) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session.sessionId }),
        });
        router.push('/thank-you');
        return;
      }

      setCurrentQuestion(data.nextQuestion);
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
            {isLoading ? 'Processing' : isListening ? 'Listening' : 'Ready'}
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Current Prompt</p>
          <p className="mt-3 text-xl leading-8 text-slate-800">{currentQuestion || 'Loading first question...'}</p>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[180px_1fr] lg:items-start">
          <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5">
            <div className={`flex h-24 w-24 items-center justify-center rounded-full ${isListening ? 'bg-rose-500 animate-pulse' : 'bg-sky-100'}`}>
              <svg className={`h-10 w-10 ${isListening ? 'text-white' : 'text-sky-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <p className="mt-4 text-center text-sm font-medium text-slate-600">
              {isListening ? 'Voice capture is active' : 'Tap below to respond'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Live Transcript</p>
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className="rounded-full bg-sky-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={isLoading || !currentQuestion}
              >
                {isListening ? 'Stop Answering' : 'Start Answering'}
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
