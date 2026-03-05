import { getPublicSiteUrl } from '@/lib/site-url';

export function getAppVersion() {
  return '0.1.0';
}

export function getEnvironmentName() {
  const siteUrl = getPublicSiteUrl();

  if (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')) {
    return 'local';
  }

  if (siteUrl.includes('staging')) {
    return 'staging';
  }

  return 'production';
}

export function getCapacitorServerUrl() {
  const configured = process.env.CAPACITOR_SERVER_URL?.trim();

  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  return getPublicSiteUrl();
}
