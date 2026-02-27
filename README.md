# Welsh Vocabulary Practice

Phase 1 foundation for the Welsh vocabulary flashcards rewrite.

## Stack
- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS
- Supabase (Postgres/Auth/RLS)
- Capacitor Android

## Environment variables
Copy `.env.example` to `.env.local` and set:

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
  This shows the home page, magic-link auth panel, and the entry point into flashcards.
- `http://localhost:3000/flashcards`
  This shows the flashcard session setup screen with:
  - session length selector
  - rarity slider
  - linguistic-type filters
- After starting a session on `/flashcards`, the card UI shows:
  - tap to flip
  - swipe right to keep learning
  - swipe left to mark learned

You can see UI changes as soon as the dev server recompiles. In practice that means:

- I change code here
- you refresh the browser on `localhost:3000`
- Next.js hot reload usually updates automatically for component/style changes

## Supabase auth setup for local testing
To make magic-link sign-in work locally, configure your Supabase project:

1. Open Supabase Dashboard.
2. Go to `Authentication` -> `URL Configuration`.
3. Set `Site URL` to:
   ```text
   http://localhost:3000
   ```
4. Add this redirect URL:
   ```text
   http://localhost:3000/auth/callback
   ```
5. In `Authentication` -> `Providers` -> `Email`, ensure email auth is enabled.

## How to test the magic-link flow
1. Start the app with:
   ```bash
   npm run dev
   ```
2. Open:
   ```text
   http://localhost:3000/
   ```
3. Enter your email in the sign-in panel and send the magic link.
4. Open the email from Supabase and click the link.
5. After the callback completes, refresh should show you as signed in on `/`.
6. Go to:
   ```text
   http://localhost:3000/flashcards
   ```
7. Choose a session length and filters, then start a session.
8. Review a few cards and finish the session.

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

Build the web bundle and sync it into Android:

```bash
npm run build:web
npm run cap:sync:android
```

Open the Android project:

```bash
npm run cap:open:android
```

## Validation
Run the standard checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Legacy app
The previous Flask implementation remains in `/legacy` for reference-only migration context.
