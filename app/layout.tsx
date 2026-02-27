import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Welsh Vocabulary Practice',
  description: 'Mobile-first Welsh vocabulary spaced repetition app',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
