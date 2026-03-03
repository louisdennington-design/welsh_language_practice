'use client';

import { useEffect, useState } from 'react';
import { CategoryBarChart } from '@/components/category-bar-chart';
import { LearnedWordGroups } from '@/components/learned-word-groups';
import { LevelCard } from '@/components/level-card';
import { SessionHistoryGraph } from '@/components/session-history-graph';
import { StackWordGroups } from '@/components/stack-word-groups';
import { readLocalStack, removeLocalStackWord, type StackedWord } from '@/lib/card-stack';
import type { CoreLinguisticTypeOption, FrequencyFilterOption } from '@/lib/flashcards';
import { readLocalSessionStats, reinstateLocalLearnedWord, type LocalSessionStats } from '@/lib/local-session-stats';

type LocalStatsPanelProps = {
  totalsByFrequency: Record<FrequencyFilterOption, Record<CoreLinguisticTypeOption, number>>;
};

export function LocalStatsPanel({ totalsByFrequency }: LocalStatsPanelProps) {
  const [stats, setStats] = useState<LocalSessionStats | null>(null);
  const [stackWords, setStackWords] = useState<StackedWord[]>([]);

  useEffect(() => {
    setStats(readLocalSessionStats());
    setStackWords(readLocalStack());
  }, []);

  if (!stats) {
    return null;
  }

  const currentLearnedTotal = stats.learnedWords.length;

  function handleReinstate(wordId: number) {
    reinstateLocalLearnedWord(wordId);
    setStats(readLocalSessionStats());
  }

  function handleRemoveFromStack(wordId: number) {
    setStackWords(removeLocalStackWord(wordId));
  }

  const learnedCounts = {
    ADJ: stats.categoryProgress.ADJ.learned,
    NOUN: stats.categoryProgress.NOUN.learned,
    VERB: stats.categoryProgress.VERB.learned,
  };
  const seenCounts = {
    ADJ: stats.categoryProgress.ADJ.reviewed,
    NOUN: stats.categoryProgress.NOUN.reviewed,
    VERB: stats.categoryProgress.VERB.reviewed,
  };

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 rounded-[2rem] border border-white/50 bg-white/84 p-5 shadow-[0_22px_50px_rgba(26,67,46,0.12)] backdrop-blur">
        <div className="rounded-[1.5rem] bg-[#eef4de] p-4">
          <p className="text-sm text-slate-500">Current streak</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.currentStreak}</p>
        </div>
        <div className="rounded-[1.5rem] bg-[#f2f5e5] p-4">
          <p className="text-sm text-slate-500">Longest streak</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.longestStreak}</p>
        </div>
        <div className="rounded-[1.5rem] bg-[#edf1da] p-4">
          <p className="text-sm text-slate-500">Cards reviewed</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.totalReviewed}</p>
        </div>
        <div className="rounded-[1.5rem] bg-[#f7f1df] p-4">
          <p className="text-sm text-slate-500">Cards learned</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{currentLearnedTotal}</p>
        </div>
      </section>

      <LevelCard history={stats.sessionHistory} />

      <CategoryBarChart learnedCounts={learnedCounts} seenCounts={seenCounts} totalsByFrequency={totalsByFrequency} />

      <SessionHistoryGraph history={stats.sessionHistory} requiresLogin />

      <StackWordGroups onRemove={handleRemoveFromStack} words={stackWords} />

      <LearnedWordGroups onReinstate={handleReinstate} words={stats.learnedWords} />
    </div>
  );
}
