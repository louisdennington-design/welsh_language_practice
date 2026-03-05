import type { FrontLanguage, LinguisticTypeOption, RarityOption, ThemeOption } from '@/lib/flashcards';

export type StoredDisplayCard =
  | { fact: string; id: string; kind: 'fact'; wordProgress: number }
  | {
      kind: 'word';
      word: {
        english_1: string | null;
        english_2: string | null;
        english_3: string | null;
        id: number;
        linguistic_type: LinguisticTypeOption;
        themes: ThemeOption[];
        welsh_frequency: number | null;
        welsh_lc: string | null;
      };
      wordProgress: number;
    };

export type ActiveFlashcardSession = {
  currentIndex: number;
  displayCards: StoredDisplayCard[];
  dismissedCount: number;
  frontLanguage: FrontLanguage;
  keepLearningCount: number;
  learnedCount: number;
  repeatTracker: Record<number, number>;
  reviewedCount: number;
  sessionKey: string;
  sessionUrl: string;
};

const STORAGE_KEY = 'cymrucards-active-session';
const SETUP_STORAGE_KEY = 'cymrucards-setup-snapshot';

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readActiveFlashcardSession() {
  if (!canUseSessionStorage()) {
    return null;
  }

  const rawSession = window.sessionStorage.getItem(STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as ActiveFlashcardSession;
  } catch {
    return null;
  }
}

export function writeActiveFlashcardSession(session: ActiveFlashcardSession) {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearActiveFlashcardSession() {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(STORAGE_KEY);
}

export type SessionSetupSnapshot = {
  duration: string;
  front: FrontLanguage;
  rarity: RarityOption;
  themes: ThemeOption[];
  types: LinguisticTypeOption[];
};

export function readSessionSetupSnapshot() {
  if (!canUseLocalStorage()) {
    return null;
  }

  const rawSnapshot = window.localStorage.getItem(SETUP_STORAGE_KEY);

  if (!rawSnapshot) {
    return null;
  }

  try {
    return JSON.parse(rawSnapshot) as SessionSetupSnapshot;
  } catch {
    return null;
  }
}

export function writeSessionSetupSnapshot(snapshot: SessionSetupSnapshot) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(snapshot));
}
