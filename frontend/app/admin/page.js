'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function AdminDashboard() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await api.get('/assessment/sessions');
        setSessions(response.data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch sessions.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const completedCount = sessions.filter((session) => session.status === 'completed').length;
  const inProgressCount = sessions.filter((session) => session.status === 'in-progress').length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recruiter Workspace</p>
            <h1 className="mt-1 text-4xl font-bold text-slate-900">Interview Sessions</h1>
            <p className="mt-2 text-slate-600">Track candidate progress and open individual screening reports.</p>
          </div>

          <Link href="/" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900">
            Candidate Landing
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total Sessions</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{sessions.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">Completed</p>
            <p className="mt-2 text-3xl font-bold text-emerald-800">{completedCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">In Progress</p>
            <p className="mt-2 text-3xl font-bold text-amber-800">{inProgressCount}</p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
          {isLoading && <p className="p-6 text-slate-600">Loading sessions...</p>}
          {error && <p className="p-6 text-rose-600">{error}</p>}

          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-slate-50 text-sm text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Candidate</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Started At</th>
                    <th className="px-4 py-3 text-left font-semibold">Completed At</th>
                    <th className="px-4 py-3 text-left font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {sessions.length > 0 ? (
                    sessions.map((session) => (
                      <tr key={session._id} className="border-t border-slate-100 text-sm text-slate-700">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{session.candidateName}</p>
                          <p className="text-xs text-slate-500">{session.candidateEmail}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              session.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : session.status === 'in-progress'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {session.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{new Date(session.startedAt).toLocaleString()}</td>
                        <td className="px-4 py-3">{session.completedAt ? new Date(session.completedAt).toLocaleString() : 'N/A'}</td>
                        <td className="px-4 py-3">
                          {session.reportId ? (
                            <Link
                              href={`/admin/report/${session.reportId}`}
                              className="rounded-full bg-sky-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-800"
                            >
                              View Report
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-400">No report yet</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                        No sessions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
