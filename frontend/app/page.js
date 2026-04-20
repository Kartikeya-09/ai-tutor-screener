'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function LandingPage() {
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStartInterview = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post('/interview/start', {
        candidateName,
        candidateEmail,
      });
      router.push(`/interview/${response.data.sessionId}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to start interview.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans p-4 sm:p-8">
      "use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// You can replace these with actual icons from a library like react-icons
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 py-4">
      <button
        className="w-full flex justify-between items-center text-left text-lg font-medium text-gray-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{question}</span>
        <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {isOpen && <p className="mt-2 text-gray-600">{answer}</p>}
    </div>
  );
};

export default function LandingPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isMicReady, setIsMicReady] = useState(false);
  const router = useRouter();

  const checkMicPermission = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Your browser doesn't support microphone access.");
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsMicReady(true);
      setError('');
    } catch (err) {
      setError('Microphone access is required for the interview. Please allow access and try again.');
      setIsMicReady(false);
    }
  };

  const handleStartInterview = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Please enter your name and email.');
      return;
    }
    if (!isMicReady) {
        await checkMicPermission();
        // If permission is granted, the user needs to click again.
        // This is a browser security feature.
        if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            setError('Microphone is ready. Click "Start Interview" again to begin.');
        }
        return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateName: name, candidateEmail: email }),
      });

      if (!response.ok) {
        throw new Error('Failed to start the interview session.');
      }

      const data = await response.json();
      // Store session details and navigate to the interview page
      localStorage.setItem('interviewSession', JSON.stringify({ sessionId: data.sessionId, name, email }));
      router.push('/interview');

    } catch (err) {
      setError(err.message);
    }
  };

  const faqs = [
    { question: "How long is the interview?", answer: "The interview consists of 6 questions and typically takes about 10 minutes to complete." },
    { question: "What is the interview about?", answer: "This is a screening interview to assess your communication skills, such as clarity, warmth, and patience. We are not testing your math knowledge." },
    { question: "Do I need any special equipment?", answer: "You will need a working microphone and a modern web browser like Chrome or Edge on a desktop or laptop computer." },
    { question: "Can I retake the interview?", answer: "This is a one-time screening. Please make sure you are in a quiet environment before you begin." },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800">Cuemath Tutor Screening</h1>
          <p className="text-lg text-gray-600 mt-2">Welcome! Let's get you started with your automated interview.</p>
        </header>

        <main className="bg-white p-8 rounded-lg shadow-md">
          <form onSubmit={handleStartInterview}>
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={checkMicPermission}
                className={`w-full flex items-center justify-center px-6 py-3 border rounded-md text-lg font-medium transition-colors duration-200 ${
                  isMicReady
                    ? 'bg-green-100 border-green-400 text-green-800'
                    : 'bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-200'
                }`}
              >
                <MicIcon />
                <span className="ml-3">{isMicReady ? 'Microphone Ready!' : 'Test Your Microphone'}</span>
              </button>
            </div>

            {error && <p className="mt-4 text-sm text-center text-red-600">{error}</p>}

            <div className="mt-8">
              <button
                type="submit"
                className="w-full flex items-center justify-center px-6 py-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                disabled={!name || !email}
              >
                Start Interview
              </button>
            </div>
          </form>
        </main>

        <section className="mt-12">
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Frequently Asked Questions</h2>
            <div className="bg-white p-8 rounded-lg shadow-md">
                {faqs.map((faq, index) => (
                    <FaqItem key={index} question={faq.question} answer={faq.answer} />
                ))}
            </div>
        </section>

        <footer className="text-center text-gray-500 mt-12 py-4">
            <p>&copy; {new Date().getFullYear()} Cuemath. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

    </div>
  );
}
