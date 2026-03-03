'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/server/supabase-browser';

type MobileDiagnosticsPanelProps = {
  appVersion: string;
  environment: string;
  siteUrl: string;
};

export function MobileDiagnosticsPanel({ appVersion, environment, siteUrl }: MobileDiagnosticsPanelProps) {
  const [authStatus, setAuthStatus] = useState('Checking...');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    let isMounted = true;

    void supabase.auth.getUser().then(({ data, error }) => {
      if (!isMounted) {
        return;
      }

      if (error) {
        setAuthStatus(`Error: ${error.message}`);
        return;
      }

      if (data.user) {
        setAuthStatus('Signed in');
        setUserEmail(data.user.email ?? null);
        return;
      }

      setAuthStatus('Signed out');
    });

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  return (
    <section className="rounded-[2rem] border border-white/50 bg-white/84 p-5 shadow-[0_22px_50px_rgba(26,67,46,0.12)] backdrop-blur">
      <h2 className="text-lg font-semibold text-slate-900">Diagnostics</h2>
      <div className="mt-4 space-y-3 text-sm text-slate-700">
        <p>
          <span className="font-semibold text-slate-900">App version:</span> {appVersion}
        </p>
        <p>
          <span className="font-semibold text-slate-900">Environment:</span> {environment}
        </p>
        <p className="break-words">
          <span className="font-semibold text-slate-900">Site URL:</span> {siteUrl}
        </p>
        <p>
          <span className="font-semibold text-slate-900">Auth status:</span> {authStatus}
        </p>
        {userEmail ? (
          <p className="break-words">
            <span className="font-semibold text-slate-900">Signed in as:</span> {userEmail}
          </p>
        ) : null}
      </div>
    </section>
  );
}
