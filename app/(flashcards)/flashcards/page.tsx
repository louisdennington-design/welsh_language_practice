import { FlashcardSession } from '@/components/flashcard-session';
import { createSupabaseAdminClient } from '@/server/supabase-admin';
import { createSupabaseServerClient } from '@/server/supabase-server';
import type { Database } from '@/types/database';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const CARDS_PER_MINUTE = 10;

type SessionWord = Pick<Database['public']['Tables']['words']['Row'], 'english' | 'id' | 'welsh'>;
type DurationOption = '1' | '3' | '5' | 'unlimited';
type SearchParams = {
  duration?: DurationOption;
};
type UserProgressSelection = Pick<Database['public']['Tables']['user_progress']['Row'], 'due_date' | 'word_id'>;

const SESSION_OPTIONS: Array<{ estimatedCards: number | null; label: string; value: DurationOption }> = [
  { estimatedCards: 10, label: '1 minute', value: '1' },
  { estimatedCards: 30, label: '3 minutes', value: '3' },
  { estimatedCards: 50, label: '5 minutes', value: '5' },
  { estimatedCards: null, label: 'Unlimited', value: 'unlimited' },
];

function getQueueSize(duration: DurationOption) {
  if (duration === 'unlimited') {
    return null;
  }

  return Number(duration) * CARDS_PER_MINUTE;
}

function buildScheduledWords(
  allWords: SessionWord[],
  progressRows: UserProgressSelection[],
  limit: number | null,
  today: string,
) {
  const progressByWordId = new Map(progressRows.map((row) => [row.word_id, row]));
  const dueWords = allWords.filter((word) => {
    const progress = progressByWordId.get(word.id);

    if (!progress) {
      return false;
    }

    return progress.due_date !== null && progress.due_date <= today;
  });
  const newWords = allWords.filter((word) => !progressByWordId.has(word.id));
  const backlogWords = allWords.filter((word) => {
    const progress = progressByWordId.get(word.id);

    if (!progress) {
      return false;
    }

    return progress.due_date === null || progress.due_date > today;
  });

  const orderedWords = [...dueWords, ...newWords, ...backlogWords];

  return limit === null ? orderedWords : orderedWords.slice(0, limit);
}

export default async function FlashcardsPage({ searchParams }: { searchParams?: SearchParams }) {
  const supabaseAdmin = createSupabaseAdminClient();
  const supabaseServer = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  const selectedDuration = searchParams?.duration;

  if (!selectedDuration) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Flashcard session</h1>
          <p className="text-sm text-slate-600">
            Select a session length to begin the text-only flashcard review.
          </p>
        </div>
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold">Session length</h2>
          <div className="mt-4 grid gap-3">
            {SESSION_OPTIONS.map((option) => (
              <Link
                className="rounded-md border border-slate-200 px-4 py-3 text-sm text-slate-900"
                href={`/flashcards?duration=${option.value}`}
                key={option.value}
              >
                <span className="block font-medium">{option.label}</span>
                <span className="block text-slate-600">
                  {option.estimatedCards === null ? 'No card limit' : `About ${option.estimatedCards} cards`}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    );
  }

  const queueSize = getQueueSize(selectedDuration);
  const sessionLabel = SESSION_OPTIONS.find((option) => option.value === selectedDuration)?.label ?? 'Custom';
  let words: SessionWord[] = [];

  if (user) {
    const [{ data: allWords, error: wordsError }, { data: progressRows, error: progressError }] =
      await Promise.all([
        supabaseAdmin.from('words').select('id, welsh, english'),
        supabaseAdmin
          .from('user_progress')
          .select('word_id, due_date')
          .eq('user_id', user.id),
      ]);

    if (wordsError) {
      throw new Error(`Unable to load flashcards: ${wordsError.message}`);
    }

    if (progressError) {
      throw new Error(`Unable to load review progress: ${progressError.message}`);
    }

    words = buildScheduledWords(allWords ?? [], progressRows ?? [], queueSize, new Date().toISOString().slice(0, 10));
  } else {
    const { data: fallbackWords, error } = await supabaseAdmin.from('words').select('id, welsh, english').limit(10);

    if (error) {
      throw new Error(`Unable to load flashcards: ${error.message}`);
    }

    words = fallbackWords ?? [];
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Flashcard session</h1>
        <p className="text-sm text-slate-600">
          Text-only session flow with spec-aligned SM-2 review priority and no gestures.
        </p>
      </div>
      <FlashcardSession
        initialUser={user ? { id: user.id } : null}
        isUnlimited={selectedDuration === 'unlimited'}
        sessionLabel={sessionLabel}
        words={words}
      />
    </main>
  );
}
