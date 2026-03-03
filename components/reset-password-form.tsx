'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/server/supabase-browser';

type ResetPasswordFormProps = {
  nextPath: string;
};

export function ResetPasswordForm({ nextPath }: ResetPasswordFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [password, setPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    async function prepareRecoverySession() {
      if (!accessToken || !refreshToken) {
        setErrorMessage('This password reset link is incomplete or has expired.');
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setIsReady(true);
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }

    void prepareRecoverySession();
  }, [supabase.auth]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      setStatusMessage('Password updated. Redirecting…');
      setPassword('');
      router.push(nextPath);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update password.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h1 className="text-xl font-semibold text-slate-900">Set a new password</h1>
      <p className="mt-2 text-sm text-slate-600">
        Choose a new password for your account, then you can sign in normally on any device.
      </p>

      {isReady ? (
        <form className="mt-4 space-y-3" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block text-sm font-medium text-slate-900" htmlFor="new-password">
            New password
          </label>
          <input
            autoComplete="new-password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            id="new-password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Choose a new password"
            type="password"
            value={password}
          />
          <button
            className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={isLoading || password.trim() === ''}
            style={{ backgroundColor: '#234812' }}
            type="submit"
          >
            Save new password
          </button>
        </form>
      ) : null}

      {statusMessage ? <p className="mt-4 text-sm text-emerald-700">{statusMessage}</p> : null}
      {errorMessage ? <p className="mt-4 text-sm text-amber-700">{errorMessage}</p> : null}
      <Link className="mt-4 inline-flex text-sm font-medium text-slate-700 underline underline-offset-2" href={nextPath}>
        Back
      </Link>
    </section>
  );
}
