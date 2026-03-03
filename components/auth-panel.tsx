'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildPublicUrl } from '@/lib/site-url';
import { createSupabaseBrowserClient } from '@/server/supabase-browser';

type AuthMode = 'reset' | 'sign-in' | 'sign-up';

type AuthPanelProps = {
  initialUserEmail: string | null;
  redirectPath: string;
};

function getPanelCopy(mode: AuthMode) {
  if (mode === 'sign-up') {
    return {
      action: 'Create account',
      description: 'Create an account with your email and password so your progress stays with you on any device.',
      title: 'Sign up',
    };
  }

  if (mode === 'reset') {
    return {
      action: 'Send reset email',
      description: 'Enter your email and we will send you a password reset link.',
      title: 'Reset password',
    };
  }

  return {
    action: 'Sign in',
    description: 'Sign in with your email and password so your progress, learned cards, and stats stay synced across devices.',
    title: 'Sign in',
  };
}

export function AuthPanel({ initialUserEmail, redirectPath }: AuthPanelProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState(initialUserEmail);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleResetPassword() {
    const redirectTo = `${buildPublicUrl('/auth/reset-password')}?next=${encodeURIComponent(redirectPath)}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      throw error;
    }

    setStatusMessage(`Password reset email sent to ${email}.`);
    setPassword('');
  }

  async function handleSignIn() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    setUserEmail(data.user.email ?? email);
    setStatusMessage('Signed in successfully.');
    setPassword('');
    router.refresh();
  }

  async function handleSignUp() {
    const redirectTo = `${buildPublicUrl('/auth/callback')}?next=${encodeURIComponent(redirectPath)}`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      throw error;
    }

    if (data.session) {
      setUserEmail(data.user?.email ?? email);
      setStatusMessage('Account created and signed in.');
      router.refresh();
      return;
    }

    setStatusMessage(`Check ${email} to confirm your account, then sign in.`);
    setPassword('');
    setMode('sign-in');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'reset') {
        await handleResetPassword();
      } else if (mode === 'sign-up') {
        await handleSignUp();
      } else {
        await handleSignIn();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete authentication.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignOut() {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUserEmail(null);
      setMode('sign-in');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign out.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  if (userEmail) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold">Signed in</h2>
        <p className="mt-2 text-sm text-slate-600">{userEmail}</p>
        <button
          className="mt-4 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 disabled:opacity-60"
          disabled={isLoading}
          onClick={() => void handleSignOut()}
          type="button"
        >
          Sign out
        </button>
        {statusMessage ? <p className="mt-3 text-sm text-emerald-700">{statusMessage}</p> : null}
        {errorMessage ? <p className="mt-3 text-sm text-amber-700">{errorMessage}</p> : null}
      </section>
    );
  }

  const copy = getPanelCopy(mode);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex gap-2">
        {(['sign-in', 'sign-up', 'reset'] as AuthMode[]).map((nextMode) => (
          <button
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              mode === nextMode ? 'text-white' : 'border border-slate-300 text-slate-700'
            }`}
            key={nextMode}
            onClick={() => {
              setMode(nextMode);
              setErrorMessage(null);
              setStatusMessage(null);
            }}
            style={mode === nextMode ? { backgroundColor: '#234812' } : undefined}
            type="button"
          >
            {nextMode === 'sign-in' ? 'Sign in' : nextMode === 'sign-up' ? 'Sign up' : 'Reset'}
          </button>
        ))}
      </div>

      <h2 className="mt-4 text-base font-semibold">{copy.title}</h2>
      <p className="mt-2 text-sm text-slate-600">{copy.description}</p>

      <form className="mt-4 space-y-3" onSubmit={(event) => void handleSubmit(event)}>
        <label className="block text-sm font-medium text-slate-900" htmlFor="auth-email">
          Email
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          id="auth-email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          type="email"
          value={email}
        />

        {mode !== 'reset' ? (
          <>
            <label className="block text-sm font-medium text-slate-900" htmlFor="auth-password">
              Password
            </label>
            <input
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
              id="auth-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter a password"
              type="password"
              value={password}
            />
          </>
        ) : null}

        <button
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={
            isLoading ||
            email.trim() === '' ||
            (mode !== 'reset' && password.trim() === '')
          }
          style={{ backgroundColor: '#234812' }}
          type="submit"
        >
          {copy.action}
        </button>
      </form>

      {mode === 'sign-in' ? (
        <button
          className="mt-3 text-sm font-medium text-slate-700 underline underline-offset-2"
          onClick={() => {
            setMode('reset');
            setErrorMessage(null);
            setStatusMessage(null);
          }}
          type="button"
        >
          Forgot your password?
        </button>
      ) : null}

      {statusMessage ? <p className="mt-3 text-sm text-emerald-700">{statusMessage}</p> : null}
      {errorMessage ? <p className="mt-3 text-sm text-amber-700">{errorMessage}</p> : null}
    </section>
  );
}
