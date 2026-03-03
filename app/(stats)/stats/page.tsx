import { LocalStatsPanel } from '@/components/local-stats-panel';
import { SignedInStatsPanel } from '@/components/signed-in-stats-panel';
import {
  CATEGORY_TOTALS,
  getBroadFrequencyFilter,
  type CoreLinguisticTypeOption,
  type FrequencyFilterOption,
  type SessionHistoryPoint,
} from '@/lib/flashcards';
import { fetchAllEligibleLexiconRows } from '@/lib/lexicon-server';
import { createSupabaseAdminClient } from '@/server/supabase-admin';
import { createSupabaseServerClient } from '@/server/supabase-server';
import type { Database } from '@/types/database';

export const dynamic = 'force-dynamic';

function createEmptyTotals() {
  return {
    all: { ...CATEGORY_TOTALS },
    common: { ADJ: 0, NOUN: 0, VERB: 0 },
    intermediate: { ADJ: 0, NOUN: 0, VERB: 0 },
    rare: { ADJ: 0, NOUN: 0, VERB: 0 },
  } satisfies Record<FrequencyFilterOption, Record<CoreLinguisticTypeOption, number>>;
}

type LexiconStatsRow = Pick<
  Database['public']['Tables']['lexicon']['Row'],
  'english_1' | 'english_2' | 'english_3' | 'id' | 'spacy_pos_1' | 'welsh_frequency' | 'welsh_lc' | 'wordnet_themes_reduced'
>;

function createEmptyCategoryProgress() {
  return {
    ADJ: { learned: 0, reviewed: 0 },
    NOUN: { learned: 0, reviewed: 0 },
    VERB: { learned: 0, reviewed: 0 },
  } satisfies Record<CoreLinguisticTypeOption, { learned: number; reviewed: number }>;
}

export default async function StatsPage() {
  const supabaseAdmin = createSupabaseAdminClient();
  const supabaseServer = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const lexiconRows = await fetchAllEligibleLexiconRows<LexiconStatsRow>(
    supabaseServer,
    'id, welsh_lc, english_1, english_2, english_3, spacy_pos_1, wordnet_themes_reduced, welsh_frequency',
  );

  const totalsByFrequency = createEmptyTotals();

  for (const row of lexiconRows) {
    const pos = row.spacy_pos_1 as CoreLinguisticTypeOption;

    if (!Object.hasOwn(CATEGORY_TOTALS, pos)) {
      continue;
    }

    const rarity = getBroadFrequencyFilter(pos, row.welsh_frequency);
    totalsByFrequency[rarity][pos] += 1;
  }

  let signedInPanel = <LocalStatsPanel totalsByFrequency={totalsByFrequency} />;

  if (user) {
    const [{ data: statsRow, error: statsError }, { data: cardStateRows, error: cardStateError }] = await Promise.all([
      supabaseAdmin
        .from('user_stats')
        .select('category_progress, current_streak, longest_streak, total_reviewed, session_history')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabaseAdmin.from('user_card_state').select('word_id, in_stack, status').eq('user_id', user.id),
    ]);

    if (statsError) {
      throw new Error(`Unable to load stats: ${statsError.message}`);
    }

    if (cardStateError) {
      throw new Error(`Unable to load removed cards: ${cardStateError.message}`);
    }

    const removedIds = new Set((cardStateRows ?? []).filter((row) => row.status === 'removed').map((row) => row.word_id));
    const stackedIds = new Set((cardStateRows ?? []).filter((row) => row.in_stack && row.status !== 'removed').map((row) => row.word_id));
    const learnedWords = lexiconRows
      .filter((row) => removedIds.has(row.id) && Object.hasOwn(CATEGORY_TOTALS, row.spacy_pos_1 as CoreLinguisticTypeOption))
      .map((row) => ({
        english: row.english_1 ?? '',
        english_2: row.english_2,
        english_3: row.english_3,
        frequencyRank: row.welsh_frequency,
        id: row.id,
        linguisticType: row.spacy_pos_1 as CoreLinguisticTypeOption,
        welsh: row.welsh_lc ?? '',
      }))
      .sort((left, right) => left.welsh.localeCompare(right.welsh));
    const stackWords = lexiconRows
      .filter((row) => stackedIds.has(row.id) && Object.hasOwn(CATEGORY_TOTALS, row.spacy_pos_1 as CoreLinguisticTypeOption))
      .map((row) => ({
        english: row.english_1 ?? '',
        english_2: row.english_2,
        english_3: row.english_3,
        frequencyRank: row.welsh_frequency,
        id: row.id,
        linguisticType: row.spacy_pos_1 as CoreLinguisticTypeOption,
        welsh: row.welsh_lc ?? '',
      }))
      .sort((left, right) => left.welsh.localeCompare(right.welsh));
    const categoryProgress =
      statsRow?.category_progress && typeof statsRow.category_progress === 'object' && !Array.isArray(statsRow.category_progress)
        ? { ...createEmptyCategoryProgress(), ...(statsRow.category_progress as Record<string, { learned: number; reviewed: number }>) }
        : createEmptyCategoryProgress();

    signedInPanel = (
      <SignedInStatsPanel
        categoryProgress={categoryProgress}
        currentStreak={statsRow?.current_streak ?? 0}
        learnedWords={learnedWords}
        longestStreak={statsRow?.longest_streak ?? 0}
        sessionHistory={Array.isArray(statsRow?.session_history) ? (statsRow.session_history as SessionHistoryPoint[]) : []}
        stackWords={stackWords}
        totalReviewed={statsRow?.total_reviewed ?? 0}
        totalsByFrequency={totalsByFrequency}
        userId={user.id}
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-5 py-8">
      <section
        className="rounded-[2rem] border p-6 shadow-[0_28px_80px_rgba(26,67,46,0.16)] backdrop-blur"
        style={{ backgroundColor: '#769036', borderColor: '#769036' }}
      >
        <h1 className="text-lg font-semibold tracking-tight text-white">Stats</h1>
      </section>
      {signedInPanel}
    </main>
  );
}
