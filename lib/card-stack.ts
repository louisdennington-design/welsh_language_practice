import type { CoreLinguisticTypeOption } from '@/lib/flashcards';

export type StackedWord = {
  english: string;
  english_2?: string | null;
  english_3?: string | null;
  frequencyRank?: number | null;
  id: number;
  linguisticType: CoreLinguisticTypeOption;
  welsh: string;
};

const STORAGE_KEY = 'cymrucards-my-stack';

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readLocalStack() {
  if (!canUseLocalStorage()) {
    return [] as StackedWord[];
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return [] as StackedWord[];
  }

  try {
    const parsed = JSON.parse(rawValue) as StackedWord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as StackedWord[];
  }
}

export function writeLocalStack(words: StackedWord[]) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

export function isWordInLocalStack(wordId: number) {
  return readLocalStack().some((word) => word.id === wordId);
}

export function upsertLocalStackWord(word: StackedWord) {
  const stack = readLocalStack();
  const nextStack = [word, ...stack.filter((stackedWord) => stackedWord.id !== word.id)];
  writeLocalStack(nextStack);
  return nextStack;
}

export function removeLocalStackWord(wordId: number) {
  const nextStack = readLocalStack().filter((word) => word.id !== wordId);
  writeLocalStack(nextStack);
  return nextStack;
}
