'use client';

import type { SessionHistoryPoint } from '@/lib/flashcards';
import { getCurrentLevel } from '@/lib/progression';

type LevelCardProps = {
  history: SessionHistoryPoint[];
};

export function LevelCard({ history }: LevelCardProps) {
  const level = getCurrentLevel(history);

  return (
    <section className="rounded-[2rem] border border-white/50 bg-white/84 p-5 shadow-[0_22px_50px_rgba(26,67,46,0.12)] backdrop-blur">
      <p className="text-sm leading-6 text-slate-700">
        <span className="font-semibold text-slate-900">Your current level:</span> {level.name}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{level.description}</p>
    </section>
  );
}
