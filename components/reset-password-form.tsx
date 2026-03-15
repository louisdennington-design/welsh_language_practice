'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClientOrNull } from '@/server/supabase-browser';

type ResetPasswordFormProps = {
  nextPath: string;
};

export function ResetPasswordForm({ nextPath }: ResetPasswordFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowserClientOrNull();

  useEffect(() => {
    if (!supabase) {
      setErrorMessage('Supabase auth is not configured.');
      return;
    }
    const client = supabase;

    const searchParams = new URLSearchParams(window.location.search);
    const authCode = searchParams.get('code');
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    async function prepareRecoverySession() {
      let error: { message: string } | null = null;

      if (authCode) {
        ({ error } = await client.auth.exchangeCodeForSession(authCode));
      } else if (accessToken && refreshToken) {
        ({ error } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }));
      } else {
        const sessionResult = await client.auth.getSession();
        if (sessionResult.error) {
          error = { message: sessionResult.error.message };
        } else if (!sessionResult.data.session) {
          setErrorMessage('This password reset link is incomplete or has expired.');
          return;
        }
      }

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setIsReady(true);
      const nextParams = new URLSearchParams(window.location.search);
      nextParams.delete('code');
      nextParams.delete('type');
      const nextQuery = nextParams.toString();
      window.history.replaceState({}, document.title, window.location.pathname + (nextQuery ? `?${nextQuery}` : ''));
    }

    void prepareRecoverySession();
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setErrorMessage('Supabase auth is not configured.');
      return;
    }

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
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('cymrucards-password-reset-success', '1');
      }
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
      <h1 className="text-xl font-semibold text-slate-900">Password reset</h1>
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
            type={showPassword ? 'text' : 'password'}
            value={password}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700" htmlFor="show-password">
            <input
              checked={showPassword}
              className="h-4 w-4 rounded border-slate-300"
              id="show-password"
              onChange={(event) => setShowPassword(event.target.checked)}
              type="checkbox"
            />
            Show password
          </label>
          <button
            className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={isLoading || password.trim() === ''}
            style={{ backgroundColor: isLoading ? '#96A99C' : '#2C5439' }}
            type="submit"
          >
            Submit
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
