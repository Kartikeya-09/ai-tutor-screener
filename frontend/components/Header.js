"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearCandidateAuth, getCandidateAuth, startCandidateAutoLogout } from '@/lib/authStorage';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [candidateLoggedIn, setCandidateLoggedIn] = useState(false);

  useEffect(() => {
    const auth = getCandidateAuth();
    setCandidateLoggedIn(Boolean(auth?.token));

    const timeoutId = startCandidateAutoLogout(() => {
      setCandidateLoggedIn(false);
      if (!pathname?.startsWith('/admin')) {
        router.push('/login');
      }
    });

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [pathname, router]);

  const handleCandidateLogout = () => {
    clearCandidateAuth();
    setCandidateLoggedIn(false);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-900 text-sm font-bold text-white">
            B
          </span>
          <span className="text-lg font-semibold text-slate-900">BrightPath Screener</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/" className="px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900">
            Candidate Portal
          </Link>

          <Link href="/contact" className="px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900">
            Contact Us
          </Link>

          {candidateLoggedIn ? (
            <button
              type="button"
              onClick={handleCandidateLogout}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Candidate Logout
            </button>
          ) : (
            <Link href="/login" className="px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900">
              Candidate Login
            </Link>
          )}

          <Link href="/admin/login" className="rounded-full bg-sky-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800">
            Admin Login
          </Link>
        </div>
      </nav>
    </header>
  );
}
