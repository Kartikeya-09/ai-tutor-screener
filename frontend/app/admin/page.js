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
        setSessions(response.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch sessions.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans p-4 sm:p-8">
      <main className="flex-1 w-full max-w-6xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        {isLoading && <p>Loading sessions...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 border-b text-left">Candidate</th>
                  <th className="py-3 px-4 border-b text-left">Status</th>
                  <th className="py-3 px-4 border-b text-left">Started At</th>
                  <th className="py-3 px-4 border-b text-left">Completed At</th>
                  <th className="py-3 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length > 0 ? sessions.map((session) => (
                  <tr key={session._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b">
                        <div>{session.candidateName}</div>
                        <div className="text-sm text-gray-500">{session.candidateEmail}</div>
                    </td>
                    <td className="py-3 px-4 border-b">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        session.status === 'completed' ? 'bg-green-100 text-green-800' :
                        session.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b">{new Date(session.startedAt).toLocaleString()}</td>
                    <td className="py-3 px-4 border-b">{session.completedAt ? new Date(session.completedAt).toLocaleString() : 'N/A'}</td>
                    <td className="py-3 px-4 border-b">
                      {session.reportId ? (
                        <Link href={`/admin/report/${session.reportId}`} className="text-blue-600 hover:underline">
                            View Report
                        </Link>
                      ) : (
                        <span className="text-gray-400">No report</span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">No sessions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}