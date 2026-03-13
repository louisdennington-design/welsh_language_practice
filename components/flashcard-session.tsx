'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  clearActiveFlashcardSession,
  readActiveFlashcardSession,
  writeActiveFlashcardSession,
  type StoredDisplayCard,
} from '@/lib/active-flashcard-session';
import { trackEvent } from '@/lib/analytics';
import { isWordInLocalStack, removeLocalStackWord, upsertLocalStackWord } from '@/lib/card-stack';
import type { CoreLinguisticTypeOption, FrontLanguage, SessionHistoryPoint, ThemeOption } from '@/lib/flashcards';
import { readLocalSessionStats, recordLocalAnswer, recordLocalSessionCompletion } from '@/lib/local-session-stats';
import { getCurrentLevel } from '@/lib/progression';
import { getRotatingFacts } from '@/lib/welsh-facts';
import type { Database } from '@/types/database';

type SessionWord = Pick<
  Database['public']['Tables']['lexicon']['Row'],
  'english_1' | 'english_2' | 'english_3' | 'id' | 'welsh_frequency' | 'welsh_lc'
> & {
  linguistic_type: CoreLinguisticTypeOption;
  themes: ThemeOption[];
};

type DisplayCard =
  | { fact: string; id: string; kind: 'fact'; wordProgress: number }
  | { kind: 'word'; word: SessionWord; wordProgress: number };

type ExitingCard = {
  card: DisplayCard;
  exitOffset: number;
  frontLanguage: FrontLanguage;
  isExiting: boolean;
  isFlipped: boolean;
  key: string;
  offset: number;
};

type FlashcardSessionProps = {
  initialFrontLanguage: FrontLanguage;
  initialUser: Pick<User, 'id'> | null;
  sessionKey: string;
  words: SessionWord[];
};

type ModalState = null | 'learned' | 'more_session' | 'less_session' | 'stack';
type SwipeDirection = 'left' | 'right';

const INTRO_OVERLAY_KEY = 'cymrucards-learning-intro-seen-v6';
const LEARNED_DIALOG_KEY = 'cymrucards-learned-dialog-seen-v6';
const STACK_DIALOG_KEY = 'cymrucards-stack-dialog-seen-v1';
const MORE_SESSION_DIALOG_KEY = 'cymrucards-more-session-dialog-seen-v1';
const LESS_SESSION_DIALOG_KEY = 'cymrucards-less-session-dialog-seen-v1';
const SWIPE_ANIMATION_MS = 320;
const SWIPE_TARGET_MULTIPLIER = 1.25;
const SWIPE_THRESHOLD = 110;
const PHONETIC_GUIDE = [
  'a – /a/ as in “cat” (short) or “father” (long)',
  'b – /b/ as in “boy”',
  'c – /k/ as in “cat” (always hard)',
  'ch – like “ch” in Scottish “loch”',
  'd – /d/ as in “dog”',
  'dd – like “th” in “this”',
  'e – /e/ as in “bed”',
  'f – /v/ as in “van”',
  'ff – /f/ as in “fun”',
  'g – /g/ as in “go” (always hard)',
  'ng – as in “sing”',
  'h – /h/ as in “hat”',
  'i – like “ee” in “machine” or shorter as in “bit”',
  'j – /j/ as in “jam” (mainly in borrowed words)',
  'l – /l/ as in “lamp”',
  'll – place your tongue in an “l” position and blow air out without using your voice',
  'm – /m/ as in “man”',
  'n – /n/ as in “name”',
  'o – as in “pot” (short) or longer as in “more”',
  'p – /p/ as in “pet”',
  'ph – /f/ as in “phone”',
  'r – a rolled or tapped r, made by flicking or lightly trilling the tongue',
  'rh – a rolled r with a strong breath before it, like saying “h” and then rolling the r',
  's – /s/ as in “sun”',
  't – /t/ as in “top”',
  'th – as in “think”',
  'u – in the south often like “i” in “bit” (e.g. “llun” sounds like “hlin” with short i); in the north more like “ee” in “see”',
  'w – like “oo” in “zoo” when used as a vowel',
  'y – varies by position: in final syllables often like “ee” in “happy” (e.g. “mynd”); in middle syllables often like “uh” in “about” (e.g. “cymraeg”)',
];
const PHONETIC_DIPHTHONGS = [
  'ae – like “eye”',
  'ai – like “eye”',
  'au – like “eye” in most words',
  'aw – like “ow” in “cow”',
  'ei – like “ay” in “say”',
  'eu – similar to “ay” in “say” but said with rounded lips',
  'ew – like “eh-oo” said quickly together',
  'iw – like “ee-oo” blended quickly',
  'oe – like “oy” in “boy”',
  'ow – like “oh-oo” blended together',
  'wy – like “oo-ee” said quickly',
  'yw – like a short “uh” followed quickly by “oo”, blended into one sound',
];

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readLocalFlag(key: string) {
  if (!canUseLocalStorage()) {
    return false;
  }

  return window.localStorage.getItem(key) === 'true';
}

function writeLocalFlag(key: string) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(key, 'true');
}

function formatEnglishForFlashcard(word: SessionWord, translation: string | null | undefined) {
  const normalizedTranslation = translation?.trim() ?? '';

  if (!normalizedTranslation) {
    return '';
  }

  if (word.linguistic_type !== 'VERB' || normalizedTranslation.toLowerCase().startsWith('to ')) {
    return normalizedTranslation;
  }

  return `to ${normalizedTranslation}`;
}

function getCardFaces(word: SessionWord, frontLanguage: FrontLanguage) {
  if (frontLanguage === 'english') {
    return {
      backText: word.welsh_lc ?? '',
      frontText: formatEnglishForFlashcard(word, word.english_1),
    };
  }

  return {
    backText: formatEnglishForFlashcard(word, word.english_1),
    frontText: word.welsh_lc ?? '',
  };
}

function buildDisplayCards(words: SessionWord[]) {
  const cards: DisplayCard[] = [];
  const factSlotCount = words.length >= 10 ? Math.max(1, Math.floor((words.length - 1) / 14)) : 0;
  const selectedFacts = getRotatingFacts(factSlotCount);
  let factIndex = 0;

  words.forEach((word, index) => {
    const wordProgress = index + 1;

    cards.push({
      kind: 'word',
      word,
      wordProgress,
    });

    const shouldInsertFact =
      (wordProgress % 14 === 0 && factIndex < selectedFacts.length) ||
      (factIndex === 0 && selectedFacts.length > 0 && index === words.length - 1);

    if (shouldInsertFact) {
      cards.push({
        fact: selectedFacts[factIndex],
        id: `fact-${wordProgress}`,
        kind: 'fact',
        wordProgress,
      });
      factIndex += 1;
    }
  });

  return cards;
}

function getDisplayCardKey(card: DisplayCard) {
  return card.kind === 'fact' ? card.id : card.word.id;
}

function isInteractiveCardControl(target: EventTarget | null) {
  return target instanceof HTMLElement && target.closest('[data-card-control="true"]') !== null;
}

function stopKeyboardPropagation(event: React.KeyboardEvent<HTMLElement>) {
  event.stopPropagation();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }

  return fallback;
}

function renderWordCard(
  word: SessionWord,
  frontLanguage: FrontLanguage,
  isFlipped: boolean,
  onOpenFeedback?: () => void,
) {
  const faces = getCardFaces(word, frontLanguage);
  const secondaryTranslations = [word.english_2, word.english_3].filter((translation): translation is string => Boolean(translation?.trim()));
  const englishOnFront = frontLanguage === 'english';
  const cardMeta = `${word.linguistic_type} / ${(word.themes[0] ?? '').replaceAll('_', ' ').toUpperCase()}`;
  const frontFaceClassName = frontLanguage === 'welsh' ? 'flashcard-face flashcard-face-welsh' : 'flashcard-face';
  const backFaceClassName = frontLanguage === 'welsh' ? 'flashcard-face flashcard-face-back' : 'flashcard-face flashcard-face-back flashcard-face-welsh';

  return (
    <div className="flashcard-card rounded-[2rem] border border-white/60 bg-white shadow-[0_40px_70px_rgba(29,78,54,0.16)]">
      <div className="flashcard-inner" style={{ transform: `rotateY(${isFlipped ? 180 : 0}deg)` }}>
        <div className={frontFaceClassName}>
          <p className="absolute left-5 top-5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">{cardMeta}</p>
          <button
            aria-label="Query this translation"
            className="absolute bottom-5 left-5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-500"
            data-card-control="true"
            onClick={onOpenFeedback}
            type="button"
          >
            ?
          </button>
          <p className="text-center text-4xl font-semibold leading-tight tracking-tight text-slate-900">{faces.frontText}</p>
          {englishOnFront && secondaryTranslations.length > 0 ? (
            <div className="mt-4 space-y-1 text-center text-lg text-slate-400">
              {secondaryTranslations.map((translation) => (
                <p key={translation}>{translation}</p>
              ))}
            </div>
          ) : null}
        </div>
        <div className={backFaceClassName}>
          <p className="absolute left-5 top-5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">{cardMeta}</p>
          <button
            aria-label="Query this translation"
            className="absolute bottom-5 left-5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-500"
            data-card-control="true"
            onClick={onOpenFeedback}
            type="button"
          >
            ?
          </button>
          <p className="text-center text-4xl font-semibold leading-tight tracking-tight text-slate-900">{faces.backText}</p>
          {!englishOnFront && secondaryTranslations.length > 0 ? (
            <div className="mt-4 space-y-1 text-center text-lg text-slate-400">
              {secondaryTranslations.map((translation) => (
                <p key={translation}>{translation}</p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function renderStaticCard(card: DisplayCard, frontLanguage: FrontLanguage, isFlipped = false, onOpenFeedback?: () => void) {
  if (card.kind === 'fact') {
    return (
      <div className="flashcard-card rounded-[2rem] border border-white/60 bg-[#2C5439] p-7 text-white shadow-[0_34px_70px_rgba(16,24,18,0.3)]">
        <div className="fact-card-face flashcard-face">
          <p className="text-xs uppercase tracking-[0.24em] text-[#e8efcd]">Did you know...?</p>
          <p className="mt-6 text-center text-[0.93rem] font-semibold leading-tight hyphens-auto [overflow-wrap:anywhere]">{card.fact}</p>
        </div>
      </div>
    );
  }

  return renderWordCard(card.word, frontLanguage, isFlipped, onOpenFeedback);
}

function getWordCounterProgress(cards: DisplayCard[], currentIndex: number) {
  if (currentIndex >= cards.length) {
    return cards.filter((card) => card.kind === 'word').length;
  }

  return cards.slice(0, currentIndex + 1).filter((card) => card.kind === 'word').length;
}

export function FlashcardSession({
  initialFrontLanguage,
  initialUser,
  sessionKey,
  words,
}: FlashcardSessionProps) {
  const storedSession = typeof window === 'undefined' ? null : readActiveFlashcardSession();
  const [currentIndex, setCurrentIndex] = useState(storedSession?.sessionKey === sessionKey ? storedSession.currentIndex : 0);
  const [displayCards, setDisplayCards] = useState<DisplayCard[]>(
    storedSession?.sessionKey === sessionKey ? (storedSession.displayCards as DisplayCard[]) : buildDisplayCards(words),
  );
  const [dismissedCount, setDismissedCount] = useState(storedSession?.sessionKey === sessionKey ? storedSession.dismissedCount : 0);
  const [dragOffset, setDragOffset] = useState(0);
  const [exitingCard, setExitingCard] = useState<ExitingCard | null>(null);
  const [frontLanguage, setFrontLanguage] = useState<FrontLanguage>(
    storedSession?.sessionKey === sessionKey ? storedSession.frontLanguage : initialFrontLanguage,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [learnedCount, setLearnedCount] = useState(storedSession?.sessionKey === sessionKey ? storedSession.learnedCount : 0);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [repeatCount, setRepeatCount] = useState(storedSession?.sessionKey === sessionKey ? storedSession.keepLearningCount : 0);
  const [repeatTracker, setRepeatTracker] = useState<Record<number, number>>(
    storedSession?.sessionKey === sessionKey ? storedSession.repeatTracker : {},
  );
  const [reviewedCount, setReviewedCount] = useState(storedSession?.sessionKey === sessionKey ? storedSession.reviewedCount : 0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showIntroOverlay, setShowIntroOverlay] = useState(false);
  const [showPhoneticAid, setShowPhoneticAid] = useState(false);
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isInStack, setIsInStack] = useState(false);
  const [completionHistory, setCompletionHistory] = useState<SessionHistoryPoint[]>([]);
  const [user, setUser] = useState<Pick<User, 'id'> | null>(initialUser);
  const [pendingSwipeDirection, setPendingSwipeDirection] = useState<SwipeDirection | null>(null);
  const [unlockedLevel, setUnlockedLevel] = useState<ReturnType<typeof getCurrentLevel> | null>(null);
  const completionTriggeredRef = useRef(false);
  const dragStartX = useRef<number | null>(null);
  const keyboardSwipeHandlerRef = useRef<((event: KeyboardEvent) => void) | null>(null);
  const swipeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const nextStoredSession = readActiveFlashcardSession();

    if (nextStoredSession && nextStoredSession.sessionKey === sessionKey) {
      setCurrentIndex(nextStoredSession.currentIndex);
      setDisplayCards(nextStoredSession.displayCards as DisplayCard[]);
      setFrontLanguage(nextStoredSession.frontLanguage);
      setRepeatCount(nextStoredSession.keepLearningCount);
      setLearnedCount(nextStoredSession.learnedCount);
      setRepeatTracker(nextStoredSession.repeatTracker ?? {});
      setReviewedCount(nextStoredSession.reviewedCount ?? 0);
      return;
    }

    setCurrentIndex(0);
    setDisplayCards(buildDisplayCards(words));
    setFrontLanguage(initialFrontLanguage);
    setRepeatCount(0);
    setDismissedCount(0);
    setLearnedCount(0);
    setRepeatTracker({});
    setReviewedCount(0);
    setDragOffset(0);
    setIsFlipped(false);
    setExitingCard(null);
    setShowPhoneticAid(false);
    setShowFeedbackPrompt(false);
    setFeedbackStatus(null);
    setCompletionHistory([]);
    completionTriggeredRef.current = false;
  }, [initialFrontLanguage, sessionKey, words]);

  const currentCard = displayCards[currentIndex] ?? null;
  const nextCard = displayCards[currentIndex + 1] ?? null;
  const isComplete = currentIndex >= displayCards.length && exitingCard === null;

  useEffect(() => {
    return () => {
      if (swipeTimeoutRef.current !== null) {
        window.clearTimeout(swipeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleWindowKeyDown(event: KeyboardEvent) {
      keyboardSwipeHandlerRef.current?.(event);
    }

    window.addEventListener('keydown', handleWindowKeyDown);

    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown);
    };
  }, []);

  useEffect(() => {
    function handleOverlayKeyDown(event: KeyboardEvent) {
      if (unlockedLevel) {
        if (event.key === 'Escape' || event.key === 'Enter') {
          event.preventDefault();
          setUnlockedLevel(null);
        }
        return;
      }

      if (showIntroOverlay) {
        if (event.key === 'Escape' || event.key === 'Enter') {
          event.preventDefault();
          closeIntroOverlay();
        }
        return;
      }

      if (modalState) {
        if (event.key === 'Escape') {
          event.preventDefault();
          setPendingSwipeDirection(null);
          setModalState(null);
          return;
        }

        if (event.key === 'Enter') {
          event.preventDefault();
          confirmModalAction();
        }
        return;
      }

      if (showFeedbackPrompt) {
        if (event.key === 'Escape') {
          event.preventDefault();
          setShowFeedbackPrompt(false);
          return;
        }

        if (event.key === 'Enter') {
          event.preventDefault();
          void submitTranslationFeedback();
        }
        return;
      }

      if (showPhoneticAid && event.key === 'Escape') {
        event.preventDefault();
        setShowPhoneticAid(false);
      }
    }

    window.addEventListener('keydown', handleOverlayKeyDown);
    return () => {
      window.removeEventListener('keydown', handleOverlayKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalState, showFeedbackPrompt, showIntroOverlay, showPhoneticAid, unlockedLevel]);

  useEffect(() => {
    if (!currentCard || readLocalFlag(INTRO_OVERLAY_KEY)) {
      return;
    }

    setShowIntroOverlay(true);
  }, [currentCard]);

  useEffect(() => {
    if (!feedbackStatus) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedbackStatus(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [feedbackStatus]);

  useEffect(() => {
    if (!currentCard || currentCard.kind !== 'word') {
      setIsInStack(false);
      return;
    }

    if (!user) {
      setIsInStack(isWordInLocalStack(currentCard.word.id));
      return;
    }

    void fetch(`/api/user-card-state?word_id=${currentCard.word.id}`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        return (await response.json()) as { in_stack?: boolean };
      })
      .then((payload) => {
        if (payload && typeof payload.in_stack === 'boolean') {
          setIsInStack(payload.in_stack);
        }
      })
      .catch(() => {
        setIsInStack(isWordInLocalStack(currentCard.word.id));
      });
  }, [currentCard, user]);

  useEffect(() => {
    if (isComplete) {
      clearActiveFlashcardSession();
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    writeActiveFlashcardSession({
      currentIndex,
      displayCards: displayCards as StoredDisplayCard[],
      dismissedCount,
      frontLanguage,
      keepLearningCount: repeatCount,
      learnedCount,
      repeatTracker,
      reviewedCount,
      sessionKey,
      sessionUrl: `${window.location.pathname}${window.location.search}`,
    });
  }, [currentIndex, dismissedCount, displayCards, frontLanguage, isComplete, learnedCount, repeatCount, repeatTracker, reviewedCount, sessionKey]);

  useEffect(() => {
    if (!isComplete || completionTriggeredRef.current) {
      return;
    }

    completionTriggeredRef.current = true;

    async function finalizeSession() {
      const activeUser = await resolveActiveUser();

      if (!activeUser) {
        const previousHistory = readLocalSessionStats().sessionHistory;
        recordLocalSessionCompletion(reviewedCount);
        const nextHistory = readLocalSessionStats().sessionHistory;
        setCompletionHistory(nextHistory);
        maybeOpenLevelModal(previousHistory, nextHistory);
        trackEvent('session_completed', {
          cards_learned: learnedCount,
          cards_seen: reviewedCount,
          cards_seen_again: repeatCount,
          signed_in: false,
        });
        return;
      }

      const response = await fetch('/api/user-progress', {
        body: JSON.stringify({
          action: 'finalize_session',
          learned_count: learnedCount,
          reviewed_count: reviewedCount,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        previous_session_history?: SessionHistoryPoint[];
        session_history?: SessionHistoryPoint[];
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to finalize cloud session.');
      }

      if (Array.isArray(payload?.session_history)) {
        const previousHistory = Array.isArray(payload?.previous_session_history) ? payload.previous_session_history : completionHistory;
        setCompletionHistory(payload.session_history);
        maybeOpenLevelModal(previousHistory, payload.session_history);
      }
      trackEvent('session_completed', {
        cards_learned: learnedCount,
        cards_seen: reviewedCount,
        cards_seen_again: repeatCount,
        signed_in: true,
      });
    }

    void finalizeSession().catch((error) => {
      const message = getErrorMessage(error, 'Unable to save progress.');
      setSaveError(`Cloud sync is unavailable (${message}). Progress will stay on this device.`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, learnedCount, reviewedCount, user]);

  function maybeOpenLevelModal(previousHistory: SessionHistoryPoint[], nextHistory: SessionHistoryPoint[]) {
    const previousLevel = getCurrentLevel(previousHistory);
    const nextLevel = getCurrentLevel(nextHistory);

    if (nextLevel.name !== previousLevel.name) {
      setUnlockedLevel(nextLevel);
      trackEvent('badge_unlocked', { badge_name: nextLevel.name });
    }
  }

  useEffect(() => {
    if (!exitingCard || exitingCard.isExiting) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setExitingCard((currentExitingCard) => {
        if (!currentExitingCard || currentExitingCard.key !== exitingCard.key) {
          return currentExitingCard;
        }

        return {
          ...currentExitingCard,
          isExiting: true,
          offset: currentExitingCard.exitOffset,
        };
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [exitingCard]);

  async function resolveActiveUser() {
    if (user) {
      return user;
    }

    const response = await fetch('/api/auth-user', { cache: 'no-store' }).catch(() => null);

    if (!response || !response.ok) {
      return null;
    }

    const payload = (await response.json().catch(() => null)) as { user?: { id?: string | null } | null } | null;
    const nextUser = payload?.user?.id ? { id: payload.user.id } : null;
    setUser(nextUser);
    return nextUser;
  }

  function createLocalWord(word: SessionWord) {
    return {
      english: word.english_1 ?? '',
      english_2: word.english_2,
      english_3: word.english_3,
      frequencyRank: word.welsh_frequency,
      id: word.id,
      linguisticType: word.linguistic_type,
      welsh: word.welsh_lc ?? '',
    };
  }

  async function persistStatsDelta(word: SessionWord, reviewedDelta: number, learnedDelta: number) {
    const activeUser = await resolveActiveUser();

    if (!activeUser) {
      recordLocalAnswer(createLocalWord(word), learnedDelta > 0);
      setSaveError('Progress is only being saved for this session because you are not signed in.');
      return;
    }

    const response = await fetch('/api/user-progress', {
      body: JSON.stringify({
        action: 'stats_delta',
        learned_delta: learnedDelta,
        linguistic_type: word.linguistic_type,
        reviewed_delta: reviewedDelta,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      throw new Error(payload?.error ?? 'Unable to persist stats.');
    }
  }

  async function persistCardState(word: SessionWord, status: Database['public']['Enums']['card_state_status'], inStack = false) {
    const activeUser = await resolveActiveUser();

    if (!activeUser) {
      if (status === 'removed') {
        removeLocalStackWord(word.id);
      }
      return;
    }

    const response = await fetch('/api/user-card-state', {
      body: JSON.stringify({
        in_stack: inStack,
        status,
        word_id: word.id,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      throw new Error(payload?.error ?? 'Unable to persist card state.');
    }
  }

  function closeIntroOverlay() {
    writeLocalFlag(INTRO_OVERLAY_KEY);
    setShowIntroOverlay(false);
  }

  function openIntroOverlay() {
    setShowIntroOverlay(true);
  }

  function togglePhoneticAid() {
    setShowPhoneticAid((currentValue) => !currentValue);
  }

  function getRepeatLimit() {
    if (words.length <= 10) {
      return 1;
    }

    return Math.max(1, Math.round(words.length / 25));
  }

  function getRepeatInsertionOffset(totalCards: number) {
    const remainingCards = Math.max(1, totalCards - (currentIndex + 1));
    return Math.max(6, Math.floor(remainingCards * 0.7));
  }

  function queueRepeatForWord(word: SessionWord) {
    const nextCount = (repeatTracker[word.id] ?? 0) + 1;

    if (nextCount > getRepeatLimit()) {
      return false;
    }

    setRepeatTracker((currentValue) => ({
      ...currentValue,
      [word.id]: nextCount,
    }));
    setDisplayCards((currentCards) => {
      const nextCards = [...currentCards];
      const insertionIndex = Math.min(currentIndex + getRepeatInsertionOffset(nextCards.length), nextCards.length);

      nextCards.splice(insertionIndex, 0, {
        kind: 'word',
        word,
        wordProgress: word.id,
      });

      return nextCards;
    });

    return true;
  }

  function proceedWithSwipe(direction: SwipeDirection) {
    if (!currentCard || swipeTimeoutRef.current !== null) {
      return;
    }

    if (currentCard.kind === 'fact') {
      trackEvent('fact_card_dismissed');
      startCardExit(direction);
      return;
    }

    if (direction === 'right') {
      const queuedRepeat = queueRepeatForWord(currentCard.word);
      startCardExit(direction, () => {
        setReviewedCount((count) => count + 1);
        if (queuedRepeat) {
          setRepeatCount((count) => count + 1);
        }
        trackEvent('card_swiped_right', {
          card_id: currentCard.word.id,
          card_pos: currentCard.word.linguistic_type,
          card_theme: currentCard.word.themes[0] ?? 'none',
          requeued: queuedRepeat,
        });
        void persistStatsDelta(currentCard.word, 1, 0).catch((error) => {
          const message = getErrorMessage(error, 'Unable to save progress.');
          setSaveError(`Cloud sync is unavailable (${message}). Progress will stay on this device.`);
        });
      });
      return;
    }

    startCardExit(direction, () => {
      setReviewedCount((count) => count + 1);
      setDismissedCount((count) => count + 1);
      trackEvent('card_swiped_left', {
        card_id: currentCard.word.id,
        card_pos: currentCard.word.linguistic_type,
        card_theme: currentCard.word.themes[0] ?? 'none',
      });
      void persistStatsDelta(currentCard.word, 1, 0).catch((error) => {
        const message = getErrorMessage(error, 'Unable to save progress.');
        setSaveError(`Cloud sync is unavailable (${message}). Progress will stay on this device.`);
      });
    });
  }

  function requestMarkLearned() {
    if (!readLocalFlag(LEARNED_DIALOG_KEY)) {
      setModalState('learned');
      return;
    }

    void markCurrentCardAsLearned();
  }

  function startCardExit(direction: SwipeDirection, onComplete?: () => void) {
    if (!currentCard || swipeTimeoutRef.current !== null) {
      return;
    }

    const exitOffset = window.innerWidth * SWIPE_TARGET_MULTIPLIER * (direction === 'left' ? -1 : 1);
    const exitingKey = `${getDisplayCardKey(currentCard)}-${Date.now()}`;

    setExitingCard({
      card: currentCard,
      exitOffset,
      frontLanguage,
      isExiting: false,
      isFlipped,
      key: exitingKey,
      offset: dragOffset,
    });
    setCurrentIndex((index) => index + 1);
    setDragOffset(0);
    setIsDragging(false);
    setIsFlipped(false);

    swipeTimeoutRef.current = window.setTimeout(() => {
      swipeTimeoutRef.current = null;
      setExitingCard((currentExitingCard) => (currentExitingCard?.key === exitingKey ? null : currentExitingCard));
      onComplete?.();
    }, SWIPE_ANIMATION_MS);
  }

  function handleSessionSwipe(direction: SwipeDirection) {
    if (!currentCard || swipeTimeoutRef.current !== null) {
      return;
    }

    if (currentCard.kind === 'fact') {
      proceedWithSwipe(direction);
      return;
    }

    if (direction === 'right') {
      if (!readLocalFlag(MORE_SESSION_DIALOG_KEY)) {
        setPendingSwipeDirection('right');
        setModalState('more_session');
        return;
      }

      proceedWithSwipe(direction);
      return;
    }

    if (!readLocalFlag(LESS_SESSION_DIALOG_KEY)) {
      setPendingSwipeDirection('left');
      setModalState('less_session');
      return;
    }

    proceedWithSwipe(direction);
  }

  async function markCurrentCardAsLearned() {
    if (!currentCard || currentCard.kind !== 'word') {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    setDisplayCards((currentCards) =>
      currentCards.filter((card, index) => index <= currentIndex || card.kind === 'fact' || card.word.id !== currentCard.word.id),
    );

    startCardExit('left', () => {
      setReviewedCount((count) => count + 1);
      setLearnedCount((count) => count + 1);
    });

    try {
      trackEvent('card_marked_learned', {
        card_id: currentCard.word.id,
        card_pos: currentCard.word.linguistic_type,
        card_theme: currentCard.word.themes[0] ?? 'none',
      });
      setIsInStack(false);
      removeLocalStackWord(currentCard.word.id);
      await persistCardState(currentCard.word, 'removed', false);
      await persistStatsDelta(currentCard.word, 1, 1);
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to save progress.');
      setSaveError(`Cloud sync is unavailable (${message}). Progress will stay on this device.`);
    } finally {
      setIsSaving(false);
    }
  }

  function confirmModalAction() {
    if (modalState === 'learned') {
      writeLocalFlag(LEARNED_DIALOG_KEY);
      setModalState(null);
      void markCurrentCardAsLearned();
      return;
    }

    if (modalState === 'stack') {
      writeLocalFlag(STACK_DIALOG_KEY);
      setModalState(null);
      void toggleStackMembership();
      return;
    }

    if (modalState === 'more_session') {
      writeLocalFlag(MORE_SESSION_DIALOG_KEY);
      const nextDirection = pendingSwipeDirection;
      setPendingSwipeDirection(null);
      setModalState(null);
      if (nextDirection) {
        proceedWithSwipe(nextDirection);
      }
      return;
    }

    if (modalState === 'less_session') {
      writeLocalFlag(LESS_SESSION_DIALOG_KEY);
      const nextDirection = pendingSwipeDirection;
      setPendingSwipeDirection(null);
      setModalState(null);
      if (nextDirection) {
        proceedWithSwipe(nextDirection);
      }
    }
  }

  async function toggleStackMembership() {
    if (!currentCard || currentCard.kind !== 'word') {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const nextInStack = !isInStack;

      if (nextInStack) {
        upsertLocalStackWord(createLocalWord(currentCard.word));
      } else {
        removeLocalStackWord(currentCard.word.id);
      }

      await persistCardState(currentCard.word, 'active', nextInStack);
      setIsInStack(nextInStack);
      trackEvent(nextInStack ? 'card_added_to_stack' : 'card_removed_from_stack', {
        card_id: currentCard.word.id,
        card_pos: currentCard.word.linguistic_type,
        card_theme: currentCard.word.themes[0] ?? 'none',
      });
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to update your stack.');
      setSaveError(`Cloud sync is unavailable (${message}). Progress will stay on this device.`);
    } finally {
      setIsSaving(false);
    }
  }

  function requestToggleStack() {
    if (isInStack) {
      void toggleStackMembership();
      return;
    }

    if (!readLocalFlag(STACK_DIALOG_KEY)) {
      setModalState('stack');
      return;
    }

    void toggleStackMembership();
  }

  async function submitTranslationFeedback() {
    if (!currentCard || currentCard.kind !== 'word') {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setFeedbackStatus(null);

    try {
      const response = await fetch('/api/translation-feedback', {
        body: JSON.stringify({
          comment: feedbackText.trim(),
          english_1: currentCard.word.english_1,
          theme: currentCard.word.themes[0] ?? null,
          welsh_lc: currentCard.word.welsh_lc,
          word_id: currentCard.word.id,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to send feedback.');
      }

      trackEvent('translation_feedback_submitted', {
        card_id: currentCard.word.id,
        card_theme: currentCard.word.themes[0] ?? 'none',
      });
      setFeedbackStatus('Translation query sent');
      setFeedbackText('');
      setShowFeedbackPrompt(false);
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to send feedback.');
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCardTap(event?: React.MouseEvent<HTMLDivElement>) {
    if (event && isInteractiveCardControl(event.target)) {
      return;
    }

    if (!currentCard || isSaving || swipeTimeoutRef.current !== null || exitingCard !== null) {
      return;
    }

    if (currentCard.kind === 'word') {
      trackEvent('card_flipped', {
        card_id: currentCard.word.id,
        card_pos: currentCard.word.linguistic_type,
      });
    }
    setIsFlipped((currentValue) => !currentValue);
  }

  function handleCardKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (isInteractiveCardControl(event.target)) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handleSessionSwipe('left');
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleSessionSwipe('right');
      return;
    }

    if (event.key.toLowerCase() === 'a') {
      event.preventDefault();
      requestToggleStack();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardTap();
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (isInteractiveCardControl(event.target)) {
      return;
    }

    if (!currentCard || isSaving || swipeTimeoutRef.current !== null || exitingCard !== null) {
      return;
    }

    dragStartX.current = event.clientX;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (dragStartX.current === null || !currentCard || isSaving || swipeTimeoutRef.current !== null || exitingCard !== null) {
      return;
    }

    setDragOffset(event.clientX - dragStartX.current);
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (dragStartX.current === null) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    const finalOffset = dragOffset;
    dragStartX.current = null;
    setIsDragging(false);

    if (finalOffset <= -SWIPE_THRESHOLD) {
      handleSessionSwipe('left');
      return;
    }

    if (finalOffset >= SWIPE_THRESHOLD) {
      handleSessionSwipe('right');
      return;
    }

    setDragOffset(0);
  }

  if (words.length === 0) {
    return (
      <section className="rounded-[2rem] border border-white/50 bg-white/80 p-6 shadow-[0_28px_80px_rgba(26,67,46,0.16)] backdrop-blur">
        <h2 className="text-xl font-semibold text-slate-900">No cards match that setup</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">Try broadening the linguistic type filters or choosing a different rarity level.</p>
      </section>
    );
  }

  if (isComplete) {
    const completionLevel = getCurrentLevel(completionHistory);

    return (
      <section className="rounded-[2rem] border border-white/50 bg-white/82 p-6 shadow-[0_28px_80px_rgba(26,67,46,0.16)] backdrop-blur">
        <div className="celebration-burst">
          <div className="celebration-icon">
            <div className="relative h-20 w-20">
              <Image alt={completionLevel.name} className="object-contain" fill sizes="80px" src={completionLevel.glyph} />
            </div>
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-semibold text-slate-900">Session complete!</h2>
        <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-2xl bg-[#eef4de] p-4">
            <p className="text-slate-500">Cards seen</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{reviewedCount}</p>
          </div>
          <div className="rounded-2xl bg-[#edf1da] p-4">
            <p className="text-slate-500">Cards re-seen</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{repeatCount}</p>
          </div>
          <div className="rounded-2xl bg-[#f7f1df] p-4">
            <p className="text-slate-500">Removed from stack</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{learnedCount}</p>
          </div>
        </div>
        {saveError ? <p className="mt-4 text-sm text-amber-700">{saveError}</p> : null}
        <div className="mt-5 flex gap-3">
          <Link className="rounded-full px-4 py-2 text-sm font-semibold text-white" href="/flashcards" style={{ backgroundColor: '#2C5439' }}>
            New session
          </Link>
        </div>
      </section>
    );
  }

  const currentTransform = `translate3d(${dragOffset}px, 0, 0) rotate(${dragOffset / 18}deg)`;
  const counterProgress = getWordCounterProgress(displayCards, currentIndex);

  keyboardSwipeHandlerRef.current = (event: KeyboardEvent) => {
    if (showIntroOverlay || showPhoneticAid || modalState || !currentCard || isSaving || swipeTimeoutRef.current !== null || exitingCard !== null) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handleSessionSwipe('left');
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleSessionSwipe('right');
      return;
    }

    if (event.key.toLowerCase() === 'a') {
      event.preventDefault();
      requestToggleStack();
      return;
    }

    if (event.key === ' ') {
      event.preventDefault();
      handleCardTap();
    }
  };

  return (
    <>
      <section className="space-y-4">
        <div className="relative flex items-center justify-between rounded-[1.75rem] border border-white/45 bg-white/66 px-4 py-3 shadow-[0_16px_40px_rgba(26,67,46,0.1)] backdrop-blur">
          <div className="flex items-center gap-2">
            <Link
              aria-label="Back to settings"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#c7d3a7] bg-white/90 shadow-sm"
              href="/flashcards"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                <path d="M15 5 8 12l7 7" stroke="#2C5439" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
              </svg>
            </Link>
            <button
              className="rounded-full border border-[#c7d3a7] bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
              onClick={openIntroOverlay}
              type="button"
            >
              How this works
            </button>
          </div>
          <p className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-center text-sm font-medium text-slate-700">
            {counterProgress} of {words.length}
          </p>
          <div className="ml-auto rounded-full bg-white/90 p-1 shadow-sm">
            <button
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${frontLanguage === 'welsh' ? 'text-white' : 'text-slate-600'}`}
              onClick={() => setFrontLanguage('welsh')}
              style={frontLanguage === 'welsh' ? { backgroundColor: '#2C5439' } : undefined}
              type="button"
            >
              Welsh
            </button>
            <button
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${frontLanguage === 'english' ? 'text-white' : 'text-slate-600'}`}
              onClick={() => setFrontLanguage('english')}
              style={frontLanguage === 'english' ? { backgroundColor: '#2C5439' } : undefined}
              type="button"
            >
              English
            </button>
          </div>
        </div>

        <div className="flashcard-stack">
          {nextCard ? (
            <div className="flashcard-shell flashcard-shell-next" key={getDisplayCardKey(nextCard)}>
              {renderStaticCard(nextCard, frontLanguage)}
            </div>
          ) : null}

          {currentCard ? (
            <div className={`flashcard-shell ${isDragging ? 'flashcard-shell-dragging' : ''}`} key={getDisplayCardKey(currentCard)} style={{ transform: currentTransform }}>
              <div
                className="flashcard-scene"
                onClick={handleCardTap}
                onKeyDown={handleCardKeyDown}
                onPointerCancel={handlePointerEnd}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                role="button"
                tabIndex={0}
              >
                {renderStaticCard(currentCard, frontLanguage, isFlipped, () => setShowFeedbackPrompt(true))}
              </div>
            </div>
          ) : null}

          {exitingCard ? (
            <div
              className={`flashcard-shell ${
                exitingCard.isExiting ? (exitingCard.exitOffset < 0 ? 'flashcard-shell-swipe-left' : 'flashcard-shell-swipe-right') : ''
              }`}
              key={exitingCard.key}
              style={{ transform: `translate3d(${exitingCard.offset}px, 0, 0) rotate(${exitingCard.offset / 18}deg)` }}
            >
              <div className="flashcard-scene" aria-hidden="true">
                {renderStaticCard(exitingCard.card, exitingCard.frontLanguage, exitingCard.isFlipped)}
              </div>
            </div>
          ) : null}
        </div>

        {currentCard?.kind === 'word' ? (
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3">
            <button
              className="rounded-full px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(20,40,22,0.22)]"
              data-card-control="true"
              onClick={requestMarkLearned}
              style={{ backgroundColor: '#2C5439' }}
              type="button"
            >
              Stop seeing this card
            </button>
            <button
              className={`rounded-full border px-4 py-3 text-sm font-semibold shadow-[0_14px_34px_rgba(20,40,22,0.12)] ${
                isInStack ? 'text-white' : 'bg-white/86 text-slate-900'
              }`}
              data-card-control="true"
              onClick={requestToggleStack}
              style={isInStack ? { backgroundColor: '#2C5439', borderColor: '#2C5439' } : { borderColor: '#d5dfbb' }}
              type="button"
            >
              {isInStack ? 'Remove from stack' : 'Add to my stack'}
            </button>
            <button
              aria-label="Show phonetic aid"
              className={`rounded-full border px-4 py-3 text-sm font-semibold shadow-[0_14px_34px_rgba(20,40,22,0.12)] ${
                showPhoneticAid ? 'text-white' : 'bg-white/86 text-slate-900'
              }`}
              data-card-control="true"
              onClick={togglePhoneticAid}
              style={showPhoneticAid ? { backgroundColor: '#2C5439', borderColor: '#2C5439' } : { borderColor: '#d5dfbb' }}
              type="button"
            >
              Aa
            </button>
          </div>
        ) : null}

        {isSaving ? <p className="text-sm text-slate-700">Saving progress…</p> : null}
        {saveError ? <p className="text-sm text-amber-800">{saveError}</p> : null}
        {feedbackStatus ? <p className="text-center text-sm text-slate-900">{feedbackStatus}</p> : null}
      </section>

      {showIntroOverlay ? (
        <div className="modal-backdrop modal-backdrop-strong">
          <div className="w-full max-w-md rounded-[2rem] border border-white/50 bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
            <h2 className="text-xl font-semibold text-slate-900">How this works</h2>
            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <p className="text-sm leading-6 text-slate-700">Tap to flip the card or press space.</p>
                <div className="intro-demo-card">
                  <div className="intro-demo-flip-card">Flip</div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm leading-6 text-slate-700">Swipe left or use the left arrow on the keyboard if you do not want to see the card again in this session.</p>
                <div className="intro-demo-card">
                  <div className="intro-demo-swing-left">Left</div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm leading-6 text-slate-700">Swipe right or press the right arrow on the keyboard if you want another chance to see this card in the same session.</p>
                <div className="intro-demo-card">
                  <div className="intro-demo-swing-right">Right</div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm leading-6 text-slate-700">Press A on the keyboard to add the current card to My stack or remove it from My stack.</p>
              </div>
            </div>
            <button
              className="mt-6 w-full rounded-full px-4 py-3 text-sm font-semibold text-white"
              onClick={closeIntroOverlay}
              style={{ backgroundColor: '#2C5439' }}
              type="button"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      {modalState ? (
        <div className="modal-backdrop">
          <div className="w-full max-w-sm rounded-[2rem] border border-white/50 bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
            <h2 className="text-xl font-semibold text-slate-900">
              {modalState === 'learned'
                ? 'Mark this card as learned?'
                : modalState === 'stack'
                  ? 'Want extra repetitions to help you learn this card?'
                  : modalState === 'more_session'
                    ? 'See this card again in this session?'
                    : 'Hide this card for the rest of this session?'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {modalState === 'learned'
                ? "This removes the card completely from your learning materials. It won't appear again unless you manually reset it from the Stats page."
                : modalState === 'stack'
                  ? 'This adds the card to a special My stack category. You can include that stack from the options page whenever you want focused revision.'
                  : modalState === 'more_session'
                    ? 'Swiping right adds this card back into the current session so you can see it again later.'
                    : 'Swiping left removes this card from the rest of the current session, but it can still appear again in future sessions.'}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 rounded-full border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900"
                onClick={() => {
                  setPendingSwipeDirection(null);
                  setModalState(null);
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-full px-4 py-3 text-sm font-semibold text-white"
                onClick={confirmModalAction}
                style={{ backgroundColor: '#2C5439' }}
                type="button"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showPhoneticAid ? (
        <div className="modal-backdrop" onClick={() => setShowPhoneticAid(false)}>
          <div
            className="max-h-[78vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-white/50 bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
            data-card-control="true"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-slate-900">Welsh alphabet pronounciation</h2>
            <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-[#d5dfbb]">
              <table className="w-full border-collapse text-sm leading-6 text-slate-900">
                <tbody>
                  {PHONETIC_GUIDE.map((line) => {
                    const [letters, explanation] = line.split(' – ');

                    return (
                      <tr className="align-top" key={line}>
                        <td className="w-20 border-b border-[#edf2e0] px-3 py-2 font-semibold lowercase text-slate-900">{letters}</td>
                        <td className="border-b border-[#edf2e0] px-3 py-2 text-slate-800">{explanation}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <h3 className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-slate-900">Welsh diphthongs</h3>
            <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-[#d5dfbb]">
              <table className="w-full border-collapse text-sm leading-6 text-slate-900">
                <tbody>
                  {PHONETIC_DIPHTHONGS.map((line) => {
                    const [letters, explanation] = line.split(' – ');

                    return (
                      <tr className="align-top" key={line}>
                        <td className="w-20 border-b border-[#edf2e0] px-3 py-2 font-semibold lowercase text-slate-900">{letters}</td>
                        <td className="border-b border-[#edf2e0] px-3 py-2 text-slate-800">{explanation}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {showFeedbackPrompt && currentCard?.kind === 'word' ? (
        <div className="modal-backdrop">
          <div
            className="w-full max-w-sm rounded-[2rem] border border-white/50 bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
            onKeyDown={stopKeyboardPropagation}
          >
            <h2 className="text-xl font-semibold text-slate-900">Query this translation...</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              If you think this translation is incorrect, you can flag it to the app&apos;s developer.
            </p>
            <textarea
              className="mt-4 min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
              onChange={(event) => setFeedbackText(event.target.value)}
              onKeyDown={stopKeyboardPropagation}
              placeholder="Add any detail you want to send with this report."
              value={feedbackText}
            />
            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 rounded-full border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900"
                onClick={() => {
                  setFeedbackText('');
                  setShowFeedbackPrompt(false);
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-full px-4 py-3 text-sm font-semibold text-white"
                onClick={() => void submitTranslationFeedback()}
                style={{ backgroundColor: '#2C5439' }}
                type="button"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {unlockedLevel ? (
        <div className="modal-backdrop" onClick={() => setUnlockedLevel(null)}>
          <div
            className="w-full max-w-sm rounded-[2rem] border border-white/50 bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-center text-xl font-semibold text-slate-900">Gwaith gwych! You&apos;ve reached a new level</h2>
            <div className="mt-5 flex justify-center">
              <div className="relative h-24 w-24">
                <Image alt={unlockedLevel.name} className="object-contain" fill sizes="96px" src={unlockedLevel.glyph} />
              </div>
            </div>
            <p className="mt-4 text-center text-sm leading-6 text-slate-700">{unlockedLevel.name}</p>
            <button
              className="mt-6 w-full rounded-full px-4 py-3 text-sm font-semibold text-white"
              onClick={() => setUnlockedLevel(null)}
              style={{ backgroundColor: '#2C5439' }}
              type="button"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
