'use client';

import { useState } from 'react';
import {
  CORE_TYPE_OPTIONS,
  FREQUENCY_FILTER_OPTIONS,
  type CoreLinguisticTypeOption,
  type FrequencyFilterOption,
} from '@/lib/flashcards';

type CategoryBarChartProps = {
  learnedCounts: Record<CoreLinguisticTypeOption, number>;
  seenCounts: Record<CoreLinguisticTypeOption, number>;
  totalsByFrequency: Record<FrequencyFilterOption, Record<CoreLinguisticTypeOption, number>>;
};

const BAR_COLORS = ['#234812', '#4f6a24', '#769036'];

export function CategoryBarChart({ learnedCounts, seenCounts, totalsByFrequency }: CategoryBarChartProps) {
  const categories = [...CORE_TYPE_OPTIONS].sort((left, right) => left.label.localeCompare(right.label));
  const [frequencyFilter, setFrequencyFilter] = useState<FrequencyFilterOption>('all');
  const [metric, setMetric] = useState<'learned' | 'seen'>('learned');

  return (
    <section className="rounded-[2rem] border border-white/50 bg-white/84 p-5 shadow-[0_22px_50px_rgba(26,67,46,0.12)] backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Total cards</h2>
          <select
            className="rounded-full border border-[#d5dfbb] bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm"
            onChange={(event) => setMetric(event.target.value as 'learned' | 'seen')}
            value={metric}
          >
            <option value="learned">learned</option>
            <option value="seen">seen</option>
          </select>
        </div>
        <select
          className="rounded-full border border-[#d5dfbb] bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm"
          onChange={(event) => setFrequencyFilter(event.target.value as FrequencyFilterOption)}
          value={frequencyFilter}
        >
          {FREQUENCY_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4 space-y-4">
        {categories.map((category, index) => {
          const selectedValue = metric === 'learned' ? learnedCounts[category.value] ?? 0 : seenCounts[category.value] ?? 0;
          const total = totalsByFrequency[frequencyFilter][category.value] || 1;
          const percentage = Math.round((selectedValue / total) * 100);

          return (
            <div key={category.value}>
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span>{category.label}</span>
                <span>{percentage}%</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#edf2e0]">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{ backgroundColor: BAR_COLORS[index % BAR_COLORS.length], width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
