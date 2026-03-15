'use client';

import { useState } from 'react';

export function AboutFeedbackForm() {
  const [feedback, setFeedback] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!feedback.trim()) {
      setErrorMessage('Please enter some feedback before sending.');
      setStatusMessage(null);
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/app-feedback', {
        body: JSON.stringify({ message: feedback.trim() }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to send feedback.');
      }

      setFeedback('');
      setStatusMessage('Thank you for your feedback.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send feedback.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
      <textarea
        className="min-h-32 w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 text-sm text-slate-900"
        onChange={(event) => setFeedback(event.target.value)}
        placeholder="The app is in development. If notice any bugs or think of any changes that would improve your learning experience, please use this box to send it directly to Louis, the developer."
        value={feedback}
      />
      <button
        className="rounded-full px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        disabled={isSending}
        style={{ backgroundColor: '#2C5439' }}
        type="submit"
      >
        {isSending ? 'Sending...' : 'Submit'}
      </button>
      {statusMessage ? <p className="text-sm text-emerald-700">{statusMessage}</p> : null}
      {errorMessage ? <p className="text-sm text-amber-700">{errorMessage}</p> : null}
    </form>
  );
}
