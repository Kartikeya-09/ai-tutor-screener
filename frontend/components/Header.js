import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-900 text-sm font-bold text-white">
            C
          </span>
          <span className="text-lg font-semibold text-slate-900">Cuemath Screener</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/" className="px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900">
            Candidate Portal
          </Link>
          <Link href="/admin" className="rounded-full bg-sky-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800">
            Recruiter Dashboard
          </Link>
        </div>
      </nav>
    </header>
  );
}
