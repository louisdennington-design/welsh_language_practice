import type { CoreLinguisticTypeOption, SessionHistoryPoint } from '@/lib/flashcards';

export type LocalLearnedWord = {
  english: string;
  english_2?: string | null;
  english_3?: string | null;
  frequencyRank?: number | null;
  id: number;
  linguisticType: CoreLinguisticTypeOption;
  welsh: string;
};

export type LocalCategoryProgress = Record<CoreLinguisticTypeOption, { learned: number; reviewed: number }>;

export type LocalSessionStats = {
  categoryProgress: LocalCategoryProgress;
  completedSessions: number;
  currentStreak: number;
  graceDaysUsed: number;
  keptWords: number;
  lastSessionDate: string | null;
  learnedWords: LocalLearnedWord[];
  longestStreak: number;
  sessionHistory: SessionHistoryPoint[];
  totalLearned: number;
  totalReviewed: number;
};

const STORAGE_KEY = 'welsh-local-session-stats';

const EMPTY_STATS: LocalSessionStats = {
  categoryProgress: {
    ADJ: { learned: 0, reviewed: 0 },
    NOUN: { learned: 0, reviewed: 0 },
    VERB: { learned: 0, reviewed: 0 },
  },
  completedSessions: 0,
  currentStreak: 0,
  graceDaysUsed: 0,
  keptWords: 0,
  lastSessionDate: null,
  learnedWords: [],
  longestStreak: 0,
  sessionHistory: [],
  totalLearned: 0,
  totalReviewed: 0,
};

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function isYesterday(today: Date, candidateIsoDate: string) {
  const candidate = new Date(`${candidateIsoDate}T00:00:00`);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  return candidate.toDateString() === yesterday.toDateString();
}

export function readLocalSessionStats() {
  if (!canUseSessionStorage()) {
    return EMPTY_STATS;
  }

  const rawStats = window.sessionStorage.getItem(STORAGE_KEY);

  if (!rawStats) {
    return EMPTY_STATS;
  }

  try {
    const parsed = JSON.parse(rawStats) as Partial<LocalSessionStats>;

    return {
      ...EMPTY_STATS,
      ...parsed,
      categoryProgress: {
        ...EMPTY_STATS.categoryProgress,
        ...parsed.categoryProgress,
      },
      learnedWords: Array.isArray(parsed.learnedWords) ? parsed.learnedWords : [],
      sessionHistory: Array.isArray(parsed.sessionHistory) ? parsed.sessionHistory : [],
    };
  } catch {
    return EMPTY_STATS;
  }
}

export function writeLocalSessionStats(stats: LocalSessionStats) {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function recordLocalAnswer(word: LocalLearnedWord, isLearned: boolean) {
  const stats = readLocalSessionStats();
  const nextLearnedWords = isLearned
    ? [word, ...stats.learnedWords.filter((learnedWord) => learnedWord.id !== word.id)]
    : stats.learnedWords;
  const currentCategoryProgress = stats.categoryProgress[word.linguisticType];

  writeLocalSessionStats({
    ...stats,
    categoryProgress: {
      ...stats.categoryProgress,
      [word.linguisticType]: {
        learned: currentCategoryProgress.learned + (isLearned ? 1 : 0),
        reviewed: currentCategoryProgress.reviewed + 1,
      },
    },
    keptWords: stats.keptWords + (isLearned ? 0 : 1),
    learnedWords: nextLearnedWords,
    totalLearned: stats.totalLearned + (isLearned ? 1 : 0),
    totalReviewed: stats.totalReviewed + 1,
  });
}

export function recordLocalSessionCompletion(wordsShown: number) {
  const stats = readLocalSessionStats();
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);

  let currentStreak = stats.currentStreak;

  if (stats.lastSessionDate === todayIso) {
    currentStreak = Math.max(currentStreak, 1);
  } else if (!stats.lastSessionDate) {
    currentStreak = 1;
  } else if (isYesterday(today, stats.lastSessionDate)) {
    currentStreak += 1;
  } else {
    currentStreak = 1;
  }

  writeLocalSessionStats({
    ...stats,
    completedSessions: stats.completedSessions + 1,
    currentStreak,
    lastSessionDate: todayIso,
    longestStreak: Math.max(stats.longestStreak, currentStreak),
    sessionHistory: [
      ...stats.sessionHistory,
      {
        session: stats.completedSessions + 1,
        totalLearned: stats.totalLearned,
        wordsShown,
      },
    ],
  });
}

export function reinstateLocalLearnedWord(wordId: number) {
  const stats = readLocalSessionStats();

  writeLocalSessionStats({
    ...stats,
    learnedWords: stats.learnedWords.filter((word) => word.id !== wordId),
  });
}
