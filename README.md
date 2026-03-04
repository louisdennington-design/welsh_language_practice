# Welsh Vocabulary Practice

Phase 1 foundation for the Welsh vocabulary flashcards rewrite.

## Stack
- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS
- Supabase (Postgres/Auth/RLS)
- Capacitor Android

## Environment variables
Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SITE_URL`: canonical site URL for auth redirects. Use `http://localhost:3000` locally and your HTTPS domain in staging/production
- `CAPACITOR_SERVER_URL`: optional hosted URL for the Android WebView. If unset, it falls back to `NEXT_PUBLIC_SITE_URL`
- `ANDROID_APP_LINK_PRODUCTION_HOST`: production App Links host for Android. Default: `app-winter-fire-9745.fly.dev`
- `ANDROID_APP_LINK_STAGING_HOST`: staging App Links host placeholder for Android
- `ANDROID_APP_LINK_SHA256_RELEASE`: release SHA-256 signing fingerprint placeholder for Android App Links
- `ANDROID_APP_LINK_SHA256_DEBUG`: debug SHA-256 signing fingerprint placeholder for Android App Links
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public anon key for browser and server session clients
- `SUPABASE_SERVICE_ROLE_KEY`: service role key for admin-only scripts such as the legacy import

## Local development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create local environment config:
   ```bash
   cp .env.example .env.local
   ```
3. Start the Next.js app:
   ```bash
   npm run dev
   ```

## Viewing the UI
Once `npm run dev` is running, open:

- `http://localhost:3000/`
This redirects into the flashcards setup screen.
- `http://localhost:3000/flashcards`
  This shows the flashcard session setup screen with:
  - session size selector
  - rarity slider
  - linguistic-type filters
-  - theme filters
- After starting a session on `/flashcards`, the card UI shows:
  - tap to flip
  - swipe right to see the card more often
  - swipe left to see the card less often

You can see UI changes as soon as the dev server recompiles. In practice that means:

- I change code here
- you refresh the browser on `localhost:3000`
- Next.js hot reload usually updates automatically for component/style changes

## Supabase auth setup
To make email/password auth, sign-up confirmation, and reset flows work correctly, configure your Supabase project:

1. Open Supabase Dashboard.
2. Go to `Authentication` -> `URL Configuration`.
3. Set `Site URL` to your current environment URL. For local development:
   ```text
   http://localhost:3000
   ```
4. Add these redirect URLs for the environments you actually use. For local development:
   ```text
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/reset-password
   ```
5. In `Authentication` -> `Providers` -> `Email`, ensure email auth is enabled.

### Staging vs production
`NEXT_PUBLIC_SITE_URL` should be set per environment:

- local: `http://localhost:3000`
- staging: your staging HTTPS app URL
- production: `https://app-winter-fire-9745.fly.dev`

The app uses that value when generating Supabase email confirmation and password reset redirect URLs. This matters for Android WebView too, because the hosted URL is what Capacitor will load.

For Android App Links, the app also serves `/.well-known/assetlinks.json`. Populate these on the hosted deployment:

- `ANDROID_APP_LINK_SHA256_RELEASE`
- `ANDROID_APP_LINK_SHA256_DEBUG`

The Android manifest reads App Links hosts from:

- `ANDROID_APP_LINK_PRODUCTION_HOST`
- `ANDROID_APP_LINK_STAGING_HOST`

## How to test the auth flow
1. Start the app with:
   ```bash
   npm run dev
   ```
2. Open:
   ```text
   http://localhost:3000/
   ```
3. Create an account or sign in with email and password.
4. If your Supabase project requires confirmation, open the confirmation email and click the link.
5. If you test password reset, use the reset form and then open the emailed reset link.
6. After the callback/reset completes, refresh should show you as signed in on `/flashcards`.
7. Go to:
   ```text
   http://localhost:3000/flashcards
   ```
8. Choose a session size and filters, then start a session.
9. Review a few cards and finish the session.

If auth is working correctly, progress writes and `user_stats.last_session_date` updates will use your real Supabase user session instead of local-only fallback.

## Database schema and migrations
Schema migrations live in `supabase/migrations`.

Recommended migration workflow with the Supabase CLI installed:

```bash
supabase db push
```

For a local reset:

```bash
supabase db reset
```

Generated TypeScript database types live in `types/database.ts` and should be kept aligned with the schema.

## Legacy JSON import
The legacy dataset source is `data.json`.

Generate seed artifacts from the legacy JSON:

```bash
npm run db:legacy:generate
```

This writes:
- `supabase/seed/legacy-words.json`
- `supabase/seed/legacy-seed.sql`

Apply the legacy dataset directly to Supabase with an explicit wipe-and-reseed flow:

```bash
npm run db:legacy:apply
```

That command requires `SUPABASE_SERVICE_ROLE_KEY` and intentionally runs with `--apply --wipe` so the import is deterministic and does not duplicate words.

## Next.js build
Create the production web build:

```bash
npm run build:web
```

The app is configured with static export output so the build artifacts are written to `out/`, which matches the Capacitor web directory.

## Capacitor Android
Android platform files live in `android/`, with config in `capacitor.config.ts`.

Sync the Android shell:

```bash
npm run cap:sync:android
```

Open the Android project:

```bash
npm run cap:open:android
```

The Android shell is configured to load the hosted URL from `CAPACITOR_SERVER_URL` or `NEXT_PUBLIC_SITE_URL`, rather than a bundled static export.

## Mobile deployment
See [MOBILE_BUILD.md](/workspaces/welsh_language_practice/MOBILE_BUILD.md) for the current Android deployment notes and environment URL requirements.

## Validation
Run the standard checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Legacy app
The previous Flask implementation remains in `/legacy` for reference-only migration context.
// test
