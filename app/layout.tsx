import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { AppShell } from '@/components/app-shell';
import { GoogleAnalytics } from '@/components/google-analytics';
import { PwaRegistration } from '@/components/pwa-registration';
import { RecoveryRedirect } from '@/components/recovery-redirect';
import './globals.css';

export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CymruCards',
  },
  title: 'CymruCards',
  description: 'Mobile-first Welsh vocabulary spaced repetition app',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#2C5439',
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
          <RecoveryRedirect />
        </Suspense>
        <PwaRegistration />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
