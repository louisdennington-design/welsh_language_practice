import { FlashcardSession } from '@/components/flashcard-session';
import { createSupabaseAdminClient } from '@/server/supabase-admin';
import { createSupabaseServerClient } from '@/server/supabase-server';

export const dynamic = 'force-dynamic';

export default async function FlashcardsPage() {
  const supabaseAdmin = createSupabaseAdminClient();
  const supabaseServer = createSupabaseServerClient();
  const [{ data: words, error }, { data: userData }] = await Promise.all([
    supabaseAdmin.from('words').select('id, welsh, english').limit(10),
    supabaseServer.auth.getUser(),
  ]);

  if (error) {
    throw new Error(`Unable to load flashcards: ${error.message}`);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Flashcard session</h1>
        <p className="text-sm text-slate-600">
          Minimal Phase 2 session loop. Text only, no gestures, no scheduling.
        </p>
      </div>
      <FlashcardSession initialUser={userData.user ? { id: userData.user.id } : null} words={words ?? []} />
    </main>
  );
}
