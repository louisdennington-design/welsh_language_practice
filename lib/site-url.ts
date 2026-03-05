const DEFAULT_LOCAL_SITE_URL = 'http://localhost:3000';

function normalizeSiteUrl(value: string) {
  return value.trim().replace(/\/+$/, '');
}

export function getPublicSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;

  if (configured && configured.trim() !== '') {
    return normalizeSiteUrl(configured);
  }

  return DEFAULT_LOCAL_SITE_URL;
}

export function buildPublicUrl(path: string) {
  const siteUrl = getPublicSiteUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${siteUrl}${normalizedPath}`;
}
