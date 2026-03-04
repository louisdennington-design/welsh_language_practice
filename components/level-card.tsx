'use client';

import type { SessionHistoryPoint } from '@/lib/flashcards';
import { getLevelProgress } from '@/lib/progression';

type LevelCardProps = {
  history: SessionHistoryPoint[];
};

export function LevelCard({ history }: LevelCardProps) {
  const { currentLevel, nextLevel, progressLabel, progressPercentage } = getLevelProgress(history);

  return (
    <section className="rounded-[2rem] border border-white/50 bg-white/84 p-5 shadow-[0_22px_50px_rgba(26,67,46,0.12)] backdrop-blur">
      <p className="text-sm leading-6 text-slate-700">
        <span className="font-semibold text-slate-900">Your current level:</span> {currentLevel.name}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{currentLevel.description}</p>
      <div className="mt-4 rounded-[1.5rem] bg-[#f4f7ea] p-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-semibold text-slate-900">Progress to next level</p>
          <p className="text-slate-600">{nextLevel ? nextLevel.name : 'Complete'}</p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#dfe8c6]">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{ backgroundColor: '#769036', width: `${progressPercentage}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-slate-600">{progressLabel}</p>
      </div>
    </section>
  );
}
