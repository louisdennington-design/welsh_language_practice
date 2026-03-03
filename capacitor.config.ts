import type { CapacitorConfig } from '@capacitor/cli';
const serverUrl = (process.env.CAPACITOR_SERVER_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000').replace(
  /\/+$/,
  '',
);
const isCleartextServer = serverUrl.startsWith('http://');

const config: CapacitorConfig = {
  appId: 'com.welshvocab.practice',
  appName: 'CymruCards',
  server: {
    cleartext: isCleartextServer,
    url: serverUrl,
  },
  webDir: 'out',
};

export default config;
