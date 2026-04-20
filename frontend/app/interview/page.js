"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Custom hook for Web Speech API
const useSpeechRecognition = ({ onResult, onEnd }) => {
  const recognition = useRef(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Handle browser incompatibility
      return;
    }

    recognition.current = new SpeechRecognition();
    const rec = recognition.current;
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      onResult(transcript);
    };

    rec.onend = () => {
      setIsListening(false);
      if (onEnd) onEnd();
    };
    
    rec.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
    }

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
  const [isAnswering, setIsAnswering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const TOTAL_QUESTIONS = 6;

  const speak = (text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      // Automatically start listening after the question is spoken
      startListening();
      setIsAnswering(true);
    };
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeechResult = (result) => {
    setTranscript(result);
  };

  const handleSpeechEnd = async () => {
    setIsAnswering(false);
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

    // Fetch the first question
    const fetchFirstQuestion = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interview/start`, {
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
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interview/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId, transcript: userTranscript }),
      });

      if (!response.ok) {
        throw new Error('Failed to send response.');
      }

      const data = await response.json();
      setTranscript(''); // Reset transcript

      if (data.isComplete) {
        // Trigger final assessment generation
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interview/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: session.sessionId }),
        });
        router.push('/thank-you');
      } else {
        setCurrentQuestion(data.nextQuestion);
        setQuestionIndex(prev => prev + 1);
        speak(data.nextQuestion);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl text-center">
        <div className="mb-8">
          <p className="text-lg text-indigo-400 font-semibold">Question {questionIndex} of {TOTAL_QUESTIONS}</p>
          <h1 className="text-4xl font-bold mt-2">{currentQuestion}</h1>
        </div>

        <div className="my-12 h-48 flex items-center justify-center">
            {isListening ? (
                <div className="text-center">
                    <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    </div>
                    <p className="mt-4 text-lg">Listening...</p>
                </div>
            ) : (
                 <div className="text-center">
                    <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    </div>
                    <p className="mt-4 text-lg">{isLoading ? 'Processing...' : 'Ready to listen'}</p>
                </div>
            )}
        </div>

        <div className="min-h-[6rem] bg-gray-800 rounded-lg p-4 text-left">
          <p className="text-lg text-gray-300">{transcript || "Your live transcript will appear here..."}</p>
        </div>

        {error && <p className="mt-4 text-red-400">{error}</p>}

        <div className="mt-8">
            <button 
                onClick={isListening ? stopListening : startListening}
                className="px-8 py-4 bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-500"
                disabled={isLoading || !currentQuestion}
            >
                {isListening ? 'Stop Answering' : 'Start Answering'}
            </button>
        </div>
      </div>
    </div>
  );
}
