'use client';

import { useState } from 'react';
import emailjs from '@emailjs/browser';

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_kgpkpdg';
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_lp94okg';
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'vlNtOzc_EPXRXfM8s';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({ type: 'error', text: 'Please fill name, email, and message.' });
      return;
    }

    setIsSending(true);
    setStatus({ type: '', text: '' });

    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          from_name: form.name,
          from_email: form.email,
          subject: form.subject || 'New query from AI Tutor Screener',
          message: form.message,
          reply_to: form.email,
        },
        PUBLIC_KEY,
      );

      setStatus({ type: 'success', text: 'Your query has been sent successfully.' });
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setStatus({ type: 'error', text: 'Unable to send right now. Please try again in a moment.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl sm:p-10">
        <header className="border-b border-slate-100 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contact Us</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 sm:text-4xl">Send Your Query</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Have a question about the AI Tutor Screener? Share it below and we will get back to you by email.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Full Name</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
                placeholder="Your name"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Email Address</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
                placeholder="you@example.com"
                required
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Subject</span>
            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
              placeholder="What do you need help with?"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Message</span>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={6}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
              placeholder="Write your query..."
              required
            />
          </label>

          {status.text ? (
            <p className={`rounded-xl px-4 py-3 text-sm ${status.type === 'success' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-rose-200 bg-rose-50 text-rose-700'}`}>
              {status.text}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSending}
            className="inline-flex w-fit items-center rounded-full bg-sky-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSending ? 'Sending...' : 'Submit Query'}
          </button>
        </form>
      </section>
    </div>
  );
}