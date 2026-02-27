import legacyWords from '@/supabase/seed/legacy-words.json';
import Link from 'next/link';

export default function HomePage() {
  const categoryCount = new Set(legacyWords.words.map((word) => word.legacy_type)).size;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Welsh Vocabulary Practice</h1>
      <p className="text-sm text-slate-600">
        A minimal text-only flashcard session is now available. Gestures, scheduling,
        and other later-scope features are still intentionally excluded.
      </p>
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold">Data pipeline status</h2>
        <dl className="mt-3 space-y-3 text-sm text-slate-600">
          <div className="flex items-center justify-between gap-4">
            <dt>Legacy words prepared</dt>
            <dd className="font-medium text-slate-900">{legacyWords.words.length}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt>Derived categories</dt>
            <dd className="font-medium text-slate-900">{categoryCount}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-slate-600">
          Seed artifacts are generated from <code>data.json</code> into
          <code> supabase/seed/legacy-words.json</code> and
          <code> supabase/seed/legacy-seed.sql</code>.
        </p>
      </section>
      <Link
        className="inline-flex w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        href="/flashcards"
      >
        Start minimal flashcards
      </Link>
    </main>
  );
}
