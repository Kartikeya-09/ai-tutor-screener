'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MicIcon from '../components/MicIcon';
import FaqItem from '../components/FaqItem';
import { getCandidateAuth } from '@/lib/authStorage';

const faqs = [
  {
    question: 'How long is the interview process?',
    answer: 'The screener includes 6 guided questions and usually takes 8 to 12 minutes to complete.',
  },
  {
    question: 'What exactly is being evaluated?',
    answer: 'We evaluate communication quality for tutoring: clarity, empathy, structure, confidence, and learner-friendly explanations.',
  },
  {
    question: 'Do I need any software download?',
    answer: 'No downloads. Use a modern browser (Chrome or Edge) with microphone permission enabled.',
  },
  {
    question: 'Can I pause and continue later?',
    answer: 'This is a continuous screening flow. Please begin only when you are ready in a quiet environment.',
  },
  {
    question: 'Will my responses be reviewed by humans?',
    answer: 'Yes. AI provides first-pass scoring, and final hiring decisions are made by the recruiting team.',
  },
];

const requirements = [
  'Quiet room with minimal interruptions',
  'Laptop or desktop with stable internet',
  'Working microphone and browser permissions',
  '8 to 12 minutes of uninterrupted time',
  'After answering each question, please wait at least 30 seconds for the next question to load',
];

const steps = [
  {
    title: 'Profile Setup',
    description: 'Enter your name and email so your responses are tied to your evaluation profile.',
  },
  {
    title: 'Audio Readiness',
    description: 'Run a quick microphone check before entering the interview room.',
  },
  {
    title: 'Voice Interview',
    description: 'Answer six spoken prompts naturally while your transcript is captured in real time.',
  },
  {
    title: 'Assessment Review',
    description: 'Recruiters receive a structured report with strengths, concerns, and recommendation.',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [candidateAuth, setCandidateAuth] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isMicReady, setIsMicReady] = useState(false);

  useEffect(() => {
    const auth = getCandidateAuth();
    if (auth?.user) {
      setCandidateAuth(auth);
      setName(auth.user.name || '');
      setEmail(auth.user.email || '');
    }
  }, []);

  const checkMicPermission = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Your browser does not support microphone access.");
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsMicReady(true);
      setError('');
    } catch {
      setIsMicReady(false);
      setError('Microphone access is required. Please allow microphone permission and try again.');
    }
  };

  const handleStartInterview = async (e) => {
    e.preventDefault();

    if (!candidateAuth?.token) {
      setError('Please login as a candidate before starting the interview.');
      return;
    }

    if (!name || !email) {
      setError('Please provide both name and email to continue.');
      return;
    }

    if (!isMicReady) {
      await checkMicPermission();
      if (navigator.mediaDevices?.getUserMedia) {
        setError('Microphone is ready. Click Start Interview once more to begin.');
      }
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${candidateAuth.token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Unable to start interview session. Please try again.');
      }

      const data = await response.json();
      localStorage.setItem(
        'interviewSession',
        JSON.stringify({ sessionId: data.sessionId, name, email, firstQuestion: data.firstQuestion })
      );
      router.push('/interview');
    } catch (err) {
      setError(err.message || 'Something went wrong while starting your session.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg sm:p-10">
        <div className="absolute -right-14 -top-14 h-48 w-48 rounded-full bg-orange-200/45 blur-3xl" />
        <div className="absolute -bottom-20 left-10 h-52 w-52 rounded-full bg-emerald-200/45 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-800">
              AI Tutor Screening Platform
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
              Hire Better Tutors with a
              <span className="block text-sky-900">Voice-First Screening Flow</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              This interview experience evaluates communication style and tutoring readiness at scale.
              Complete a short guided conversation and let recruiters review your structured assessment.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#start" className="rounded-full bg-sky-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800">
                Start Candidate Journey
              </a>
              <a href="#faq" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900">
                View FAQs
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Interview Length</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">~10 min</p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Question Count</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">6 prompts</p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Input Mode</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">Voice</p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Evaluation</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">AI + Human</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="start" className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md lg:col-span-2 sm:p-8">
          <h2 className="text-3xl font-bold text-slate-900">Begin Your Interview</h2>
          <p className="mt-2 text-slate-600">Provide your details, test your mic, and launch the live screener.</p>

          {!candidateAuth?.token && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Please authenticate first: <Link href="/register" className="font-semibold underline">Register</Link> or <Link href="/login" className="font-semibold underline">Login</Link>.
            </div>
          )}
          <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 font-medium">
            Note: After finishing your answer, wait at least 30 seconds for the next question.
          </div>

          <form onSubmit={handleStartInterview} className="mt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  readOnly={Boolean(candidateAuth?.token)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  readOnly={Boolean(candidateAuth?.token)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={checkMicPermission}
                className={`inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                  isMicReady
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-sky-100 text-sky-800 hover:bg-sky-200'
                }`}
              >
                <MicIcon />
                <span className="ml-2">{isMicReady ? 'Microphone Ready' : 'Test Microphone'}</span>
              </button>

              <button
                type="submit"
                disabled={!name || !email || !candidateAuth?.token}
                className="inline-flex items-center rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Start Interview
              </button>
            </div>

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
            )}
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md sm:p-8">
          <h3 className="text-xl font-semibold text-slate-900">Before You Start</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {requirements.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-orange-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md sm:p-8">
        <h2 className="text-3xl font-bold text-slate-900">How It Works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, idx) => (
            <article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Step {idx + 1}</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="mt-10 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md sm:p-8">
        <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
        <div className="mt-5 space-y-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </section>
    </div>
  );
}
