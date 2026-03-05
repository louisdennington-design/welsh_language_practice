import type { CoreLinguisticTypeOption } from '@/lib/flashcards';

export type RevisionStackWord = {
  english: string;
  id: string;
  linguisticType: CoreLinguisticTypeOption;
  welsh: string;
};

const STORAGE_KEY = 'cymrucards-revision-stack';

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readRevisionStack() {
  if (!canUseLocalStorage()) {
    return [];
  }

  const rawStack = window.localStorage.getItem(STORAGE_KEY);

  if (!rawStack) {
    return [] as RevisionStackWord[];
  }

  try {
    const parsed = JSON.parse(rawStack) as RevisionStackWord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readRevisionStackIds() {
  return readRevisionStack().map((word) => word.id);
}

export function isWordInRevisionStack(wordId: string) {
  return readRevisionStack().some((word) => word.id === wordId);
}

export function toggleRevisionStackWord(word: RevisionStackWord) {
  if (!canUseLocalStorage()) {
    return false;
  }

  const currentStack = readRevisionStack();
  const alreadyIncluded = currentStack.some((entry) => entry.id === word.id);
  const nextStack = alreadyIncluded
    ? currentStack.filter((entry) => entry.id !== word.id)
    : [word, ...currentStack];

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStack));

  return !alreadyIncluded;
}
