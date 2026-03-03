'use client';

import { useState } from 'react';
import { CategoryBarChart } from '@/components/category-bar-chart';
import { LearnedWordGroups } from '@/components/learned-word-groups';
import { LevelCard } from '@/components/level-card';
import { SessionHistoryGraph } from '@/components/session-history-graph';
import { StackWordGroups } from '@/components/stack-word-groups';
import type { CoreLinguisticTypeOption, FrequencyFilterOption, SessionHistoryPoint } from '@/lib/flashcards';
import { createSupabaseBrowserClient } from '@/server/supabase-browser';

type SignedInLearnedWord = {
  english: string;
  english_2?: string | null;
  english_3?: string | null;
  frequencyRank?: number | null;
  id: number;
  linguisticType: CoreLinguisticTypeOption;
  welsh: string;
};

type SignedInStatsPanelProps = {
  categoryProgress: Record<CoreLinguisticTypeOption, { learned: number; reviewed: number }>;
  currentStreak: number;
  learnedWords: SignedInLearnedWord[];
  longestStreak: number;
  sessionHistory: SessionHistoryPoint[];
  stackWords: SignedInLearnedWord[];
  totalReviewed: number;
  totalsByFrequency: Record<FrequencyFilterOption, Record<CoreLinguisticTypeOption, number>>;
  userId: string;
};

export function SignedInStatsPanel({
  categoryProgress,
  currentStreak,
  learnedWords: initialLearnedWords,
  longestStreak,
  sessionHistory,
  stackWords: initialStackWords,
  totalReviewed,
  totalsByFrequency,
  userId,
}: SignedInStatsPanelProps) {
  const [learnedWords, setLearnedWords] = useState(initialLearnedWords);
  const [stackWords, setStackWords] = useState(initialStackWords);
  const [saveError, setSaveError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  async function handleReinstate(wordId: number) {
    setSaveError(null);

    const { error } = await supabase
      .schema('public')
      .from('user_card_state')
      .upsert(
        {
          status: 'active',
          user_id: userId,
          word_id: wordId,
        },
        {
          onConflict: 'user_id,word_id',
        },
      );

    if (error) {
      setSaveError(error.message);
      return;
    }

    setLearnedWords((currentWords) => currentWords.filter((word) => word.id !== wordId));
  }

  async function handleRemoveFromStack(wordId: number) {
    setSaveError(null);

    const { error } = await supabase
      .schema('public')
      .from('user_card_state')
      .upsert(
        {
          in_stack: false,
          status: 'active',
          user_id: userId,
          word_id: wordId,
        },
        {
          onConflict: 'user_id,word_id',
        },
      );

    if (error) {
      setSaveError(error.message);
      return;
    }

    setStackWords((currentWords) => currentWords.filter((word) => word.id !== wordId));
  }

  const learnedCounts = {
    ADJ: categoryProgress.ADJ.learned,
    NOUN: categoryProgress.NOUN.learned,
    VERB: categoryProgress.VERB.learned,
  };
  const seenCounts = {
    ADJ: categoryProgress.ADJ.reviewed,
    NOUN: categoryProgress.NOUN.reviewed,
    VERB: categoryProgress.VERB.reviewed,
  };

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 rounded-[2rem] border border-white/50 bg-white/84 p-5 shadow-[0_22px_50px_rgba(26,67,46,0.12)] backdrop-blur">
        <div className="rounded-[1.5rem] bg-[#eef4de] p-4">
          <p className="text-sm text-slate-500">Current streak</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{currentStreak}</p>
        </div>
        <div className="rounded-[1.5rem] bg-[#f2f5e5] p-4">
          <p className="text-sm text-slate-500">Longest streak</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{longestStreak}</p>
        </div>
        <div className="rounded-[1.5rem] bg-[#edf1da] p-4">
          <p className="text-sm text-slate-500">Cards reviewed</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalReviewed}</p>
        </div>
        <div className="rounded-[1.5rem] bg-[#f7f1df] p-4">
          <p className="text-sm text-slate-500">Cards learned</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{learnedWords.length}</p>
        </div>
      </section>

      <LevelCard history={sessionHistory} />

      <CategoryBarChart learnedCounts={learnedCounts} seenCounts={seenCounts} totalsByFrequency={totalsByFrequency} />

      <SessionHistoryGraph history={sessionHistory} />

      <StackWordGroups onRemove={handleRemoveFromStack} words={stackWords} />

      <LearnedWordGroups onReinstate={handleReinstate} words={learnedWords} />
      {saveError ? <p className="text-sm text-amber-800">{saveError}</p> : null}
    </div>
  );
}
