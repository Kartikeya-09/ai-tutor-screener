import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Cuemath AI Tutor Screener</p>
          <p className="text-sm text-slate-500">Voice-first interview workflow for faster and fairer tutor hiring.</p>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-600">
          <Link href="/" className="transition hover:text-slate-900">Home</Link>
          <Link href="/contact" className="transition hover:text-slate-900">Contact</Link>
          <Link href="/admin" className="transition hover:text-slate-900">Admin</Link>
        </div>

        <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} Cuemath. All rights reserved.</p>
      </div>
    </footer>
  );
}
