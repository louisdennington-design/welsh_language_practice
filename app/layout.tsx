import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AppShell } from '@/components/app-shell';
import { GoogleAnalytics } from '@/components/google-analytics';
import './globals.css';

export const metadata: Metadata = {
  title: 'CymruCards',
  description: 'Mobile-first Welsh vocabulary spaced repetition app',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const runtimeClientEnv = {
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  };
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || 'G-MTT3Q5TMES';

  return (
    <html lang="en">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__CYMRUCARDS_RUNTIME_ENV__ = ${JSON.stringify(runtimeClientEnv)};`,
          }}
        />
        <Suspense fallback={null}>
          <GoogleAnalytics measurementId={gaMeasurementId} />
        </Suspense>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
