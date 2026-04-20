'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getAdminAuth } from '@/lib/authStorage';

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const auth = getAdminAuth();
    if (!auth?.token) {
      router.push('/admin/login');
      return;
    }

    if (!id) return;

    const fetchReport = async () => {
      try {
        const response = await api.get(`/assessment/report/${id}`);
        setReport(response.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch report.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [id, router]);

  if (isLoading) {
    return <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 text-slate-600">Loading report...</div>;
  }

  if (error) {
    return <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 text-rose-600">{error}</div>;
  }

  if (!report) {
    return <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 text-slate-600">Report not found.</div>;
  }

  const recommendationTone = {
    'Strong Hire': 'bg-emerald-100 text-emerald-800',
    Hire: 'bg-green-100 text-green-800',
    Consider: 'bg-amber-100 text-amber-800',
    'No Hire': 'bg-rose-100 text-rose-800',
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl sm:p-8">
        <header className="border-b border-slate-100 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Candidate Assessment Report</p>
          <h1 className="mt-1 text-4xl font-bold text-slate-900">{report.candidateName}</h1>
          <p className="mt-2 text-sm text-slate-600">{report.candidateEmail}</p>
          <p className="mt-1 text-xs text-slate-500">Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
        </header>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Overall Score</p>
            <p className="mt-1 text-4xl font-bold text-slate-900">{report.overallScore}<span className="text-xl text-slate-500">/10</span></p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:col-span-2">
            <p className="text-sm text-slate-500">Recommendation</p>
            <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${recommendationTone[report.recommendation] || 'bg-slate-100 text-slate-700'}`}>
              {report.recommendation}
            </p>
          </article>
        </div>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-slate-900">Performance Dimensions</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {Object.entries(report.dimensions || {}).map(([key, value]) => (
              <article key={key} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">{key.charAt(0).toUpperCase() + key.slice(1)}</h3>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-800">{value.score}/10</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{value.evidence}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-emerald-50 p-5">
            <h3 className="text-lg font-semibold text-emerald-900">Strengths</h3>
            <ul className="mt-3 space-y-2 text-sm text-emerald-900/90">
              {(report.strengths || []).map((strength, index) => (
                <li key={`${strength}-${index}`} className="flex gap-2">
                  <span>•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-amber-50 p-5">
            <h3 className="text-lg font-semibold text-amber-900">Areas of Concern</h3>
            <ul className="mt-3 space-y-2 text-sm text-amber-900/90">
              {(report.areasOfConcern || []).map((concern, index) => (
                <li key={`${concern}-${index}`} className="flex gap-2">
                  <span>•</span>
                  <span>{concern}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mt-8">
          <h3 className="text-xl font-semibold text-slate-900">Full Transcript</h3>
          <div className="mt-3 max-h-96 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            <p className="whitespace-pre-wrap">{report.fullTranscript}</p>
          </div>
        </section>
      </section>
    </div>
  );
}
