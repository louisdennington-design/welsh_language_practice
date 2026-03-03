'use client';

import { useState } from 'react';
import { CORE_TYPE_OPTIONS, type CoreLinguisticTypeOption } from '@/lib/flashcards';

type StackWord = {
  english: string;
  id: number;
  linguisticType: CoreLinguisticTypeOption;
  welsh: string;
};

type StackWordGroupsProps = {
  onRemove?: (wordId: number) => Promise<void> | void;
  words: StackWord[];
};

const CATEGORY_LABELS = Object.fromEntries(CORE_TYPE_OPTIONS.map((option) => [option.value, option.label])) as Record<
  CoreLinguisticTypeOption,
  string
>;

export function StackWordGroups({ onRemove, words }: StackWordGroupsProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [pendingWordId, setPendingWordId] = useState<number | null>(null);

  const groupedWords = Object.entries(
    words.reduce<Record<string, StackWord[]>>((groups, word) => {
      const group = groups[word.linguisticType] ?? [];
      group.push(word);
      groups[word.linguisticType] = group;
      return groups;
    }, {}),
  )
    .map(([category, categoryWords]) => ({
      category: category as CoreLinguisticTypeOption,
      label: CATEGORY_LABELS[category as CoreLinguisticTypeOption],
      words: [...categoryWords].sort((left, right) => left.welsh.localeCompare(right.welsh)),
    }))
    .sort((left, right) => left.label.localeCompare(right.label));

  async function handleRemove(wordId: number) {
    if (!onRemove) {
      return;
    }

    setPendingWordId(wordId);

    try {
      await onRemove(wordId);
    } finally {
      setPendingWordId(null);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/50 bg-white/84 p-5 shadow-[0_22px_50px_rgba(26,67,46,0.12)] backdrop-blur">
      <h2 className="text-lg font-semibold text-slate-900">My stack</h2>
      {groupedWords.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-slate-600">You have not added any cards to your stack yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {groupedWords.map((group) => {
            const isOpen = openGroups[group.category] === true;

            return (
              <div className="overflow-hidden rounded-[1.5rem] border border-[#d7e2b9] bg-[#f6f9ee]" key={group.category}>
                <button
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-900"
                  onClick={() => setOpenGroups((current) => ({ ...current, [group.category]: !isOpen }))}
                  type="button"
                >
                  <span>{group.label}</span>
                  <span className="text-slate-500">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen ? (
                  <div className="border-t border-[#d7e2b9] bg-white/86 px-4 py-3">
                    <div className="space-y-3">
                      {group.words.map((word) => (
                        <div className="flex items-center justify-between gap-3" key={word.id}>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{word.welsh}</p>
                            <p className="text-sm text-slate-600">{word.english}</p>
                          </div>
                          {onRemove ? (
                            <button
                              className="rounded-full border border-[#769036] px-3 py-2 text-xs font-semibold text-[#234812]"
                              disabled={pendingWordId === word.id}
                              onClick={() => void handleRemove(word.id)}
                              type="button"
                            >
                              {pendingWordId === word.id ? 'Saving...' : 'Remove'}
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
