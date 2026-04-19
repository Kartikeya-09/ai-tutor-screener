'use client';

import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans p-4 sm:p-8">
      <main className="flex flex-1 w-full max-w-lg flex-col items-center justify-center bg-white shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Interview Complete!</h1>
        <p className="text-zinc-700 mb-8">
          Thank you for your time. We have received your responses and will be in touch shortly.
        </p>
        <p className="text-sm text-zinc-500">You may now close this window.</p>
        <div className="mt-8">
            <Link href="/" className="text-blue-600 hover:underline">
                Return to Home
            </Link>
        </div>
      </main>
    </div>
  );
}