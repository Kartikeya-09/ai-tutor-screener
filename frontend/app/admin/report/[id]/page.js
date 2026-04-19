'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

export default function ReportPage() {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const params = useParams();
  const { id } = params;

  useEffect(() => {
    if (id) {
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
    }
  }, [id]);

  if (isLoading) return <div className="p-8">Loading report...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!report) return <div className="p-8">Report not found.</div>;

  const DimensionScore = ({ label, score, evidence }) => (
    <div className="mb-4 p-4 border rounded-lg">
        <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold">{label}</h4>
            <span className="font-bold text-lg">{score}/10</span>
        </div>
        <p className="text-sm text-gray-600">{evidence}</p>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans p-4 sm:p-8">
      <main className="flex-1 w-full max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <div className="border-b pb-4 mb-6">
            <h1 className="text-3xl font-bold">Screening Report</h1>
            <p className="text-gray-600">For: {report.candidateName} ({report.candidateEmail})</p>
            <p className="text-sm text-gray-500">Generated on: {new Date(report.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="p-6 bg-blue-50 rounded-lg text-center">
                <h3 className="text-lg font-semibold text-blue-800">Overall Score</h3>
                <p className="text-5xl font-bold text-blue-900">{report.overallScore}<span className="text-2xl">/10</span></p>
            </div>
            <div className="p-6 bg-green-50 rounded-lg text-center">
                <h3 className="text-lg font-semibold text-green-800">Recommendation</h3>
                <p className="text-2xl font-bold text-green-900">{report.recommendation}</p>
            </div>
        </div>

        <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Performance Dimensions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Object.entries(report.dimensions).map(([key, value]) => (
                    <DimensionScore key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} score={value.score} evidence={value.evidence} />
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
                <h3 className="text-xl font-semibold mb-3">Strengths</h3>
                <ul className="list-disc list-inside space-y-2">
                    {report.strengths.map((strength, i) => <li key={i}>{strength}</li>)}
                </ul>
            </div>
            <div>
                <h3 className="text-xl font-semibold mb-3">Areas of Concern</h3>
                <ul className="list-disc list-inside space-y-2">
                    {report.areasOfConcern.map((concern, i) => <li key={i}>{concern}</li>)}
                </ul>
            </div>
        </div>

        <div>
            <h3 className="text-xl font-semibold mb-3">Full Transcript</h3>
            <div className="p-4 bg-gray-50 border rounded-lg max-h-96 overflow-y-auto">
                <p className="whitespace-pre-wrap text-sm">{report.fullTranscript}</p>
            </div>
        </div>
      </main>
    </div>
  );
}