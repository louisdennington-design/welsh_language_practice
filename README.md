# Welsh Vocabulary Practice

Phase 1 scaffold for the Welsh vocabulary flashcards rewrite.

## Stack
- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS
- Supabase (Postgres/Auth/RLS)
- Capacitor Android

## Getting started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env values:
   ```bash
   cp .env.example .env.local
   ```
3. Run the web app:
   ```bash
   npm run dev
   ```

## Database
- Schema migrations are in `supabase/migrations`.
- Generated database types are in `types/database.ts`.
- Legacy JSON conversion script:
  ```bash
  npm run db:migrate
  ```
  This generates:
  - `supabase/seed/legacy-words.json`
  - `supabase/seed/legacy-seed.sql`

## Capacitor Android
Android platform has been initialised in `android/`.

Common commands:
```bash
npx cap sync android
npx cap open android
```

## Legacy app
The previous Flask implementation remains in `/legacy` for reference-only migration context.
