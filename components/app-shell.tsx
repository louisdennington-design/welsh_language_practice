'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type AppShellProps = {
  children: React.ReactNode;
};

const NAV_ITEMS = [
  { href: '/flashcards', label: 'Flashcards' },
  { href: '/stats', label: 'Stats' },
  { href: '/learning-tips', label: 'Tips' },
  { href: '/about', label: 'About' },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isSplashFading, setIsSplashFading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setIsSplashFading(true);
    }, 1000);
    const hideTimer = window.setTimeout(() => {
      setShowSplash(false);
    }, 1240);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  return (
    <div className="app-shell">
      <div className={`app-shell-content ${showSplash ? 'app-shell-content-hidden' : 'app-shell-content-visible'}`}>{children}</div>
      {showSplash ? (
        <div className={`app-launch-splash ${isSplashFading ? 'app-launch-splash-fade' : ''}`}>
          <h1 className="app-launch-title">CymruCards</h1>
        </div>
      ) : null}
      <nav className="app-bottom-nav" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href === '/flashcards' && pathname === '/');

          return (
            <Link
              className={`app-bottom-nav-link ${isActive ? 'app-bottom-nav-link-active' : ''} ${
                pendingHref === item.href ? (isActive ? 'app-bottom-nav-link-pending-active' : 'app-bottom-nav-link-pending-inactive') : ''
              }`}
              href={item.href}
              key={item.href}
              onClick={() => setPendingHref(item.href)}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
