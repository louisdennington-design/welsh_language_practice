# Android Deployment Plan -- Next.js + Supabase (Web Wrapper Model)

The architecture assumes: - Frontend: Next.js (App Router) - Auth +
persistence: Supabase - Hosting: Fly.io - Mobile strategy: Capacitor
Android wrapper pointing to hosted production URL - Free app (no ads, no
monetisation)

### Mobile Shell (Capacitor)

-   Add a `mobile/` or `apps/mobile/` Capacitor Android project.
-   Configure:
    -   Android package ID
    -   App name
    -   Icons + splash screen
    -   Versioning (versionName + versionCode)
-   Set WebView to load the production Fly.io URL.

### Supabase Auth in WebView

-   Ensure Supabase auth redirect URLs include:
    -   Production domain
    -   Password reset routes
    -   Email confirmation routes
-   Verify SSR + cookie session handling works inside Android WebView.
-   Confirm correct cookie flags (Secure, SameSite) for HTTPS.
-   Test:
    -   Sign up
    -   Sign in
    -   Password reset
    -   Email confirmation
    -   Cross-device login

### Deep Linking / App Links

-   Implement Android App Links:
    -   assetlinks.json
    -   Android manifest intent filters
-   Ensure links to your domain open inside the installed app when
    present.

### Environment Configuration

-   Define and verify:
    -   NEXT_PUBLIC_SITE_URL
    -   NEXT_PUBLIC_SUPABASE_URL
    -   NEXT_PUBLIC_SUPABASE_ANON_KEY
-   Support staging vs production URL switching if required.

### WebView Hardening

-   Confirm CSP headers allow WebView embedding.
-   Verify:
    -   Signed-out mode uses localStorage/sessionStorage correctly.
    -   Signed-in mode writes to Supabase tables correctly.
-   Confirm no CORS issues with hosted API.

### Android Release Build

-   Configure Gradle for release.
-   Generate Android App Bundle (AAB).
-   Ensure target/compile SDK meet Play requirements.
-   Configure signing (upload key compatible with Play App Signing).

### Mobile Debugging Support

-   Add lightweight diagnostics view:
    -   App version
    -   Build number
    -   Environment URL
    -   Auth status
-   Add basic client-side logging for auth/network errors.

### Documentation

-   Add `MOBILE_BUILD.md`:
    -   Build commands
    -   How to bump versions
    -   How to switch staging/prod
    -   Where AAB is generated

## Key Risk Area

Supabase auth + Android WebView redirect behaviour.

Stabilise this early before investing time in polishing store assets.
