import { AuthPanel } from '@/components/auth-panel';
import { FlashcardSession } from '@/components/flashcard-session';
import { SessionSetupForm } from '@/components/session-setup-form';
import type { StackedWord } from '@/lib/card-stack';
import { shuffleDeterministically } from '@/lib/queue-state';
import { fetchAllEligibleLexiconRows } from '@/lib/lexicon-server';
import {
  getCoreSelectedTypes,
  getSelectedDuration,
  getSelectedFrontLanguage,
  getSelectedRarity,
  getSelectedThemes,
  getSelectedTypes,
  getQueueSize,
  matchesSelectedThemes,
  matchesSelectedTypes,
  matchesRarityWindow,
  normalizeThemeArray,
  type CoreLinguisticTypeOption,
  type DurationOption,
  type FrontLanguage,
  type RarityOption,
  type ThemeOption,
} from '@/lib/flashcards';
import { createSupabaseAdminClient } from '@/server/supabase-admin';
import { createSupabaseServerClient } from '@/server/supabase-server';
import type { Database } from '@/types/database';

export const dynamic = 'force-dynamic';

type SessionWord = {
  english_1: string | null;
  english_2: string | null;
  english_3: string | null;
  id: number;
  linguistic_type: CoreLinguisticTypeOption;
  themes: ThemeOption[];
  welsh_frequency: number | null;
  welsh_lc: string | null;
};
type SearchParams = {
  duration?: DurationOption;
  front?: FrontLanguage;
  rarity?: RarityOption;
  session?: string;
  stackIds?: string;
  themes?: string;
  types?: string;
};
type FilterableLexiconWord = Pick<
  Database['public']['Tables']['lexicon']['Row'],
  'english_1' | 'english_2' | 'english_3' | 'id' | 'spacy_pos_1' | 'welsh_frequency' | 'welsh_lc' | 'wordnet_themes_reduced'
>;

function matchesSetupCriteria(
  word: Pick<Database['public']['Tables']['lexicon']['Row'], 'spacy_pos_1' | 'welsh_frequency' | 'wordnet_themes_reduced'>,
  rarity: RarityOption,
  types: CoreLinguisticTypeOption[],
  themes: ThemeOption[],
) {
  const pos = word.spacy_pos_1 as CoreLinguisticTypeOption | null;

  if (!pos || !matchesSelectedTypes(pos, types)) {
    return false;
  }

  if (!matchesSelectedThemes(word.wordnet_themes_reduced, themes)) {
    return false;
  }

  return matchesRarityWindow(pos, word.welsh_frequency, rarity);
}

function applyWordFilters(words: FilterableLexiconWord[], rarity: RarityOption, types: CoreLinguisticTypeOption[], themes: ThemeOption[]) {
  return words.filter((word) => matchesSetupCriteria(word, rarity, types, themes));
}

export default async function FlashcardsPage({ searchParams }: { searchParams?: SearchParams }) {
  const supabaseAdmin = createSupabaseAdminClient();
  const supabaseServer = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  const selectedDuration = getSelectedDuration(searchParams?.duration);
  const selectedFrontLanguage = getSelectedFrontLanguage(searchParams?.front);
  const selectedRarity = getSelectedRarity(searchParams?.rarity);
  const selectedThemes = getSelectedThemes(searchParams?.themes);
  const sessionKey = searchParams?.session ?? null;
  const selectedTypes = getSelectedTypes(searchParams?.types);
  const selectedCoreTypes = getCoreSelectedTypes(selectedTypes);
  const requestedStackIds = (searchParams?.stackIds ?? '')
    .split(',')
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  const allLexiconRows = await fetchAllEligibleLexiconRows<FilterableLexiconWord>(
    supabaseServer,
    'id, welsh_lc, welsh_frequency, english_1, english_2, english_3, spacy_pos_1, wordnet_themes_reduced',
  );

  let initialStackWords: StackedWord[] = [];

  if (!sessionKey) {
    if (user) {
      const { data: stackedRows } = await supabaseAdmin
        .from('user_card_state')
        .select('word_id')
        .eq('user_id', user.id)
        .eq('in_stack', true)
        .eq('status', 'active');

      const stackIds = new Set((stackedRows ?? []).map((row) => row.word_id));
      initialStackWords = allLexiconRows
        .filter((word) => stackIds.has(word.id))
        .map((word) => ({
          english: word.english_1 ?? '',
          english_2: word.english_2,
          english_3: word.english_3,
          frequencyRank: word.welsh_frequency,
          id: word.id,
          linguisticType: word.spacy_pos_1 as CoreLinguisticTypeOption,
          welsh: word.welsh_lc ?? '',
        }));
    }

    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-5 py-8">
        <SessionSetupForm
          availableCards={allLexiconRows
            .filter((word) => {
              const pos = word.spacy_pos_1 as CoreLinguisticTypeOption | null;
              return Boolean(pos);
            })
            .map((word) => ({
              frequency: word.welsh_frequency,
              id: word.id,
              linguistic_type: word.spacy_pos_1 as CoreLinguisticTypeOption,
              themes: normalizeThemeArray(word.wordnet_themes_reduced),
            }))}
          initialStackWords={initialStackWords}
          initialFrontLanguage={selectedFrontLanguage}
          initialRarity={selectedRarity}
          initialThemes={selectedThemes}
          initialTypes={selectedTypes}
        />
        <AuthPanel initialUserEmail={user?.email ?? null} redirectPath="/flashcards" />
      </main>
    );
  }

  const queueSize = getQueueSize(selectedDuration);
  let words: SessionWord[] = [];
  let stackIds = new Set<number>(requestedStackIds);

  if (user) {
    const { data: cardStateRows, error: cardStateError } = await supabaseAdmin
      .from('user_card_state')
      .select('word_id, status, in_stack')
      .eq('user_id', user.id);

    if (cardStateError) {
      throw new Error(`Unable to load card state: ${cardStateError.message}`);
    }

    const removedWordIds = new Set((cardStateRows ?? []).filter((row) => row.status === 'removed').map((row) => row.word_id));
    stackIds = new Set((cardStateRows ?? []).filter((row) => row.in_stack && row.status !== 'removed').map((row) => row.word_id));
    const filteredWords = applyWordFilters(allLexiconRows, selectedRarity, selectedCoreTypes, selectedThemes).filter(
      (word) => !removedWordIds.has(word.id),
    );
    const stackWords = allLexiconRows.filter((word) => stackIds.has(word.id) && !removedWordIds.has(word.id));
    const wordMap = new Map<number, FilterableLexiconWord>();

    filteredWords.forEach((word) => wordMap.set(word.id, word));

    if (selectedTypes.includes('STACK')) {
      stackWords.forEach((word) => wordMap.set(word.id, word));
    }

    const shuffledWords = shuffleDeterministically([...wordMap.values()], `${sessionKey}:${user.id}`);
    words = (queueSize === null ? shuffledWords : shuffledWords.slice(0, queueSize)).map((word) => ({
      english_1: word.english_1,
      english_2: word.english_2,
      english_3: word.english_3,
      id: word.id,
      linguistic_type: word.spacy_pos_1 as CoreLinguisticTypeOption,
      themes: normalizeThemeArray(word.wordnet_themes_reduced),
      welsh_frequency: word.welsh_frequency,
      welsh_lc: word.welsh_lc,
    }));
  } else {
    const filteredWords = applyWordFilters(allLexiconRows, selectedRarity, selectedCoreTypes, selectedThemes);
    const stackWords = allLexiconRows.filter((word) => stackIds.has(word.id));
    const wordMap = new Map<number, FilterableLexiconWord>();

    filteredWords.forEach((word) => wordMap.set(word.id, word));

    if (selectedTypes.includes('STACK')) {
      stackWords.forEach((word) => wordMap.set(word.id, word));
    }

    const shuffledWords = shuffleDeterministically([...wordMap.values()], sessionKey);
    words = (queueSize === null ? shuffledWords : shuffledWords.slice(0, queueSize)).map((word) => ({
      english_1: word.english_1,
      english_2: word.english_2,
      english_3: word.english_3,
      id: word.id,
      linguistic_type: word.spacy_pos_1 as CoreLinguisticTypeOption,
      themes: normalizeThemeArray(word.wordnet_themes_reduced),
      welsh_frequency: word.welsh_frequency,
      welsh_lc: word.welsh_lc,
    }));
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-5 py-8">
      <FlashcardSession
        initialFrontLanguage={selectedFrontLanguage}
        initialUser={user ? { id: user.id } : null}
        sessionKey={sessionKey}
        words={words}
      />
    </main>
  );
}
