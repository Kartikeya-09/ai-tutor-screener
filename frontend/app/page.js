'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';

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
      <main className="flex flex-1 w-full max-w-lg flex-col items-center justify-center bg-white shadow-lg rounded-lg p-8">
        <div className="w-full">
          <h1 className="text-3xl font-bold mb-2 text-center">AI Tutor Screener</h1>
          <p className="text-zinc-600 mb-8 text-center">
            Enter your details to begin the automated interview.
          </p>
          <form onSubmit={handleStartInterview} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Your Name"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              required
              className="p-3 border rounded-md"
              disabled={isLoading}
            />
            <input
              type="email"
              placeholder="Your Email"
              value={candidateEmail}
              onChange={(e) => setCandidateEmail(e.target.value)}
              required
              className="p-3 border rounded-md"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              disabled={isLoading}
            >
              {isLoading ? 'Starting...' : 'Start Interview'}
            </button>
            {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
          </form>
        </div>
      </main>
    </div>
  );
}
