'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '../../lib/api';

// A simple microphone icon component
const MicrophoneIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 14a2 2 0 002-2V6a2 2 0 00-4 0v6a2 2 0 002 2z" />
    <path d="M12 18a4 4 0 01-4-4H6a6 6 0 1012 0h-2a4 4 0 01-4 4z" />
    <path d="M12 4a1 1 0 011 1v6a1 1 0 11-2 0V5a1 1 0 011-1z" />
    <path d="M15 7a1 1 0 11-2 0 1 1 0 012 0z" />
    <path d="M9 7a1 1 0 11-2 0 1 1 0 012 0z" />
    <path
      fillRule="evenodd"
      d="M12 2a8 8 0 00-8 8v2a1 1 0 001 1h1a1 1 0 001-1v-2a6 6 0 1112 0v2a1 1 0 001 1h1a1 1 0 001-1v-2a8 8 0 00-8-8zM6 12a1 1 0 01-1-1V9a1 1 0 112 0v2a1 1 0 01-1 1zm12 0a1 1 0 01-1-1V9a1 1 0 112 0v2a1 1 0 01-1 1z"
      clipRule="evenodd"
    />
  </svg>
);

export default function InterviewPage() {
  const [isSupported, setIsSupported] = useState(false);
  const [interviewState, setInterviewState] = useState('loading'); // 'loading', 'in-progress', 'completed'
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const router = useRouter();
  const params = useParams();
  const { sessionId } = params;

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await api.get(`/interview/session/${sessionId}`);
        setCurrentQuestion(response.data.conversation.find(m => m.role === 'assistant').content);
        setInterviewState('in-progress');
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Could not fetch interview session.');
        setInterviewState('error');
      }
    };

    if (sessionId) {
      fetchInitialData();
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const currentTranscript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError('An error occurred during speech recognition.');
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [sessionId]);

  const handleToggleRecording = () => {
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleSendResponse = async () => {
    if (!transcript.trim()) {
      setError('Cannot submit an empty answer.');
      return;
    }
    setError(null);
    setInterviewState('loading');

    try {
      const response = await api.post('/interview/respond', { sessionId, transcript });

      if (response.data.isComplete) {
        router.push('/thank-you');
      } else {
        setCurrentQuestion(response.data.nextQuestion);
        setTranscript('');
        setInterviewState('in-progress');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send response.');
      setInterviewState('in-progress');
    }
  };
  
  useEffect(() => {
    if (!isRecording && transcript.trim()) {
        handleSendResponse();
    }
  }, [isRecording, transcript]);


  if (!isSupported) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-red-50 text-red-800 p-8">
        <h1 className="text-2xl font-bold mb-4">Browser Not Supported</h1>
        <p>Please use Google Chrome or Microsoft Edge to proceed.</p>
      </div>
    );
  }
  
  if (interviewState === 'error') {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-red-50 text-red-800 p-8">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans p-4 sm:p-8">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center bg-white shadow-lg rounded-lg p-8">
        {(interviewState === 'in-progress' || interviewState === 'loading') && (
          <div className="w-full flex flex-col items-center">
            <p className="text-zinc-500 mb-4">Question</p>
            <h2 className="text-2xl font-semibold text-center mb-8 min-h-[6rem]">
              {currentQuestion}
            </h2>

            <button
              onClick={handleToggleRecording}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-colors ${
                isRecording ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
              disabled={interviewState === 'loading'}
            >
              <MicrophoneIcon className="w-10 h-10" />
              {isRecording && (
                <span className="absolute inset-0 rounded-full bg-red-500 opacity-75 animate-ping"></span>
              )}
            </button>
            <p className="mt-4 text-sm text-zinc-600">
              {isRecording ? 'Listening...' : 'Tap to Speak'}
            </p>

            <div className="w-full mt-8 p-4 border rounded-md bg-gray-50 min-h-[8rem]">
              <p className="text-zinc-800">{transcript || 'Your answer will appear here...'}</p>
            </div>

            {error && <p className="text-red-500 mt-4">{error}</p>}

            {interviewState === 'loading' && currentQuestion && (
                <div className="mt-4 text-blue-600">Processing your answer...</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}