"use client";

import { useState } from 'react';

export default function FaqItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3 transition hover:border-slate-300 hover:shadow-sm">
      <button
        className="flex w-full items-center justify-between gap-4 text-left text-base font-semibold text-slate-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{question}</span>
        <span className={`rounded-full bg-slate-100 p-1.5 text-slate-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {isOpen && <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-6 text-slate-600">{answer}</p>}
    </div>
  );
}
