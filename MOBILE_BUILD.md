# Mobile Build

## Purpose
This app uses a hosted `Next.js` web app wrapped in `Capacitor Android`.

The Android shell should point at the hosted environment URL rather than a bundled static export.

## Environment URLs
Set `NEXT_PUBLIC_SITE_URL` per environment.

- Local web development:
  - `http://localhost:3000`
- Staging:
  - your staging HTTPS domain
- Production:
  - your production HTTPS domain

This value is used for:
- Supabase sign-up email confirmation redirects
- Supabase password reset redirects
- general auth callback consistency across web and mobile

Set `CAPACITOR_SERVER_URL` if the Android shell should target a different hosted URL from `NEXT_PUBLIC_SITE_URL`.

- If unset, Capacitor falls back to `NEXT_PUBLIC_SITE_URL`
- Use this if you want a staging Android shell against a staging deployment while the web app still points elsewhere

## Current Android Shell
- App name: `CymruCards`
- Package ID: `com.welshvocab.practice`
- WebView source: hosted URL via Capacitor `server.url`
- Diagnostics route: `/settings`

## Supabase Auth URLs
In Supabase `Authentication -> URL Configuration`, add the correct site and redirect URLs for every environment you actually use.

For production:
- `https://your-production-domain`
- `https://your-production-domain/auth/callback`
- `https://your-production-domain/auth/reset-password`

For staging:
- `https://your-staging-domain`
- `https://your-staging-domain/auth/callback`
- `https://your-staging-domain/auth/reset-password`

For local development:
- `http://localhost:3000`
- `http://localhost:3000/auth/callback`
- `http://localhost:3000/auth/reset-password`

## Next Step
The next engineering step is WebView auth verification:

1. Verify sign up inside Android WebView
2. Verify sign in inside Android WebView
3. Verify password reset flow inside Android WebView
4. Verify email confirmation returns to the app correctly
5. Verify Supabase session cookies persist across app restarts
