export type AnalyticsEventParams = Record<string, boolean | null | number | string | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function canTrack() {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

export function trackPageView(url: string) {
  if (!canTrack()) {
    return;
  }

  window.gtag?.('event', 'page_view', {
    page_location: window.location.href,
    page_path: url,
    page_title: document.title,
  });
}

export function trackEvent(name: string, params?: AnalyticsEventParams) {
  if (!canTrack()) {
    return;
  }

  window.gtag?.('event', name, params ?? {});
}
