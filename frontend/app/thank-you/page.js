'use client';

import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <main className="w-full rounded-3xl border border-slate-200 bg-white/95 p-8 text-center shadow-xl sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-9 w-9 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="mt-6 text-4xl font-bold text-slate-900">Interview Submitted</h1>
        <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-600">
          Thank you for completing the AI tutor screener. Your responses have been captured successfully and the recruiter team can now review your assessment report.
        </p>

        <div className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">What happens next?</p>
            <p className="mt-1 text-sm text-slate-600">Your communication performance is analyzed and summarized in a structured recruiter report.</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Need to return?</p>
            <p className="mt-1 text-sm text-slate-600">You can go back to the candidate portal at any time using the button below.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="rounded-full bg-sky-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800">
            Back to Candidate Home
          </Link>
          <Link href="/admin" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900">
            Open Recruiter Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
