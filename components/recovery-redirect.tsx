'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function RecoveryRedirect() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined' || pathname === '/auth/reset-password' || pathname === '/auth/callback') {
      return;
    }

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const hashType = hashParams.get('type');
    const hasRecoveryTokens = hashParams.get('access_token') && hashParams.get('refresh_token');
    const queryType = searchParams.get('type');
    const authCode = searchParams.get('code');

    if ((hashType === 'recovery' && hasRecoveryTokens) || queryType === 'recovery' || authCode) {
      const nextPath = pathname.startsWith('/') ? pathname : '/flashcards';
      const nextQuery = searchParams.toString();
      const nextValue = nextQuery ? `${nextPath}?${nextQuery}` : nextPath;
      const target = `/auth/reset-password?next=${encodeURIComponent(nextValue)}${window.location.hash}`;
      window.location.replace(target);
    }
  }, [pathname, searchParams]);

  return null;
}
