'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  clearActiveFlashcardSession,
  readActiveFlashcardSession,
  writeActiveFlashcardSession,
  type StoredDisplayCard,
} from '@/lib/active-flashcard-session';
import { isWordInLocalStack, removeLocalStackWord, upsertLocalStackWord } from '@/lib/card-stack';
import type { CoreLinguisticTypeOption, FrontLanguage, SessionHistoryPoint, ThemeOption } from '@/lib/flashcards';
import { recordLocalAnswer, recordLocalSessionCompletion } from '@/lib/local-session-stats';
import { getRotatingFacts } from '@/lib/welsh-facts';
import { createSupabaseBrowserClient } from '@/server/supabase-browser';
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
type UserCardStateInsert = Database['public']['Tables']['user_card_state']['Insert'];

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

function getCardFaces(word: SessionWord, frontLanguage: FrontLanguage) {
  if (frontLanguage === 'english') {
    return {
      backText: word.welsh_lc ?? '',
      frontText: word.english_1 ?? '',
    };
  }

  return {
    backText: word.english_1 ?? '',
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

function renderWordCard(
  word: SessionWord,
  frontLanguage: FrontLanguage,
  isFlipped: boolean,
  onOpenFeedback?: () => void,
) {
  const faces = getCardFaces(word, frontLanguage);
  const secondaryTranslations = [word.english_2, word.english_3].filter((translation): translation is string => Boolean(translation));
  const englishOnFront = frontLanguage === 'english';
  const cardMeta = `${word.linguistic_type} / ${(word.themes[0] ?? '').replaceAll('_', ' ').toUpperCase()}`;
  const frontFaceClassName = frontLanguage === 'welsh' ? 'flashcard-face flashcard-face-welsh' : 'flashcard-face';
  const backFaceClassName = frontLanguage === 'welsh' ? 'flashcard-face flashcard-face-back' : 'flashcard-face flashcard-face-back flashcard-face-welsh';

  return (
    <div
      className="flashcard-card flashcard-inner rounded-[2rem] border border-white/60 bg-white shadow-[0_40px_70px_rgba(29,78,54,0.16)]"
      style={{ transform: `rotateY(${isFlipped ? 180 : 0}deg)` }}
    >
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
  );
}

function renderStaticCard(card: DisplayCard, frontLanguage: FrontLanguage, isFlipped = false, onOpenFeedback?: () => void) {
  if (card.kind === 'fact') {
    return (
      <div className="flashcard-card rounded-[2rem] border border-white/60 bg-[#234812] p-7 text-white shadow-[0_34px_70px_rgba(16,24,18,0.3)]">
        <div className="flashcard-face">
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
  const [isInStack, setIsInStack] = useState(false);
  const [user, setUser] = useState<Pick<User, 'id'> | null>(initialUser);
  const [pendingSwipeDirection, setPendingSwipeDirection] = useState<SwipeDirection | null>(null);
  const completionTriggeredRef = useRef(false);
  const dragStartX = useRef<number | null>(null);
  const keyboardSwipeHandlerRef = useRef<((event: KeyboardEvent) => void) | null>(null);
  const swipeTimeoutRef = useRef<number | null>(null);
  const supabase = createSupabaseBrowserClient();

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
    if (!currentCard || readLocalFlag(INTRO_OVERLAY_KEY)) {
      return;
    }

    setShowIntroOverlay(true);
  }, [currentCard]);

  useEffect(() => {
    if (!currentCard || currentCard.kind !== 'word') {
      setIsInStack(false);
      return;
    }

    if (!user) {
      setIsInStack(isWordInLocalStack(currentCard.word.id));
      return;
    }

    void supabase
      .schema('public')
      .from('user_card_state')
      .select('in_stack')
      .eq('user_id', user.id)
      .eq('word_id', currentCard.word.id)
      .maybeSingle()
      .then(({ data }) => setIsInStack(Boolean(data?.in_stack)));
  }, [currentCard, supabase, user]);

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
      const activeUser =
        user ??
        (await supabase.auth.getUser().then(({ data }) => {
          const nextUser = data.user ? { id: data.user.id } : null;
          setUser(nextUser);
          return nextUser;
        }));

      if (!activeUser) {
        recordLocalSessionCompletion(reviewedCount);
        return;
      }

      const lastSessionDate = new Date().toISOString().slice(0, 10);
      const { data: existingStats, error: statsLookupError } = await supabase
        .schema('public')
        .from('user_stats')
        .select('session_history, total_learned')
        .eq('user_id', activeUser.id)
        .maybeSingle();

      if (statsLookupError) {
        throw statsLookupError;
      }

      const previousHistory = Array.isArray(existingStats?.session_history)
        ? (existingStats.session_history as SessionHistoryPoint[])
        : [];
      const nextHistory = [
        ...previousHistory,
        {
          session: previousHistory.length + 1,
          totalLearned: existingStats?.total_learned ?? learnedCount,
          wordsShown: reviewedCount,
        },
      ];

      const { error } = await supabase.schema('public').from('user_stats').upsert(
        {
          last_session_date: lastSessionDate,
          session_history: nextHistory,
          user_id: activeUser.id,
        },
        { onConflict: 'user_id' },
      );

      if (error) {
        throw error;
      }
    }

    void finalizeSession().catch((error) => {
      const message = error instanceof Error ? error.message : 'Unable to save progress.';
      setSaveError(message);
    });
  }, [isComplete, learnedCount, reviewedCount, supabase, user]);

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

    const { data } = await supabase.auth.getUser();
    const nextUser = data.user ? { id: data.user.id } : null;
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

  function createEmptyCategoryProgress() {
    return {
      ADJ: { learned: 0, reviewed: 0 },
      NOUN: { learned: 0, reviewed: 0 },
      VERB: { learned: 0, reviewed: 0 },
    };
  }

  async function persistStatsDelta(word: SessionWord, reviewedDelta: number, learnedDelta: number) {
    const activeUser = await resolveActiveUser();

    if (!activeUser) {
      recordLocalAnswer(createLocalWord(word), learnedDelta > 0);
      setSaveError('Progress is only being saved for this session because you are not signed in.');
      return;
    }

    const { data: existingStats, error: lookupError } = await supabase
      .schema('public')
      .from('user_stats')
      .select('category_progress, total_learned, total_reviewed')
      .eq('user_id', activeUser.id)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    const rawProgress = existingStats?.category_progress;
    const categoryProgress =
      rawProgress && typeof rawProgress === 'object' && !Array.isArray(rawProgress) ? { ...createEmptyCategoryProgress(), ...rawProgress } : createEmptyCategoryProgress();
    const wordProgress = categoryProgress[word.linguistic_type] ?? { learned: 0, reviewed: 0 };

    const { error } = await supabase.schema('public').from('user_stats').upsert(
      {
        category_progress: {
          ...categoryProgress,
          [word.linguistic_type]: {
            learned: wordProgress.learned + learnedDelta,
            reviewed: wordProgress.reviewed + reviewedDelta,
          },
        },
        total_learned: (existingStats?.total_learned ?? 0) + learnedDelta,
        total_reviewed: (existingStats?.total_reviewed ?? 0) + reviewedDelta,
        user_id: activeUser.id,
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      throw error;
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

    const payload: UserCardStateInsert & { in_stack?: boolean } = {
      in_stack: inStack,
      status,
      user_id: activeUser.id,
      word_id: word.id,
    };
    const { error } = await supabase.schema('public').from('user_card_state').upsert(payload, {
      onConflict: 'user_id,word_id',
    });

    if (error) {
      throw error;
    }
  }

  function closeIntroOverlay() {
    writeLocalFlag(INTRO_OVERLAY_KEY);
    setShowIntroOverlay(false);
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

  function getRepeatInsertionOffset() {
    return Math.max(3, Math.round(words.length / 6));
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
      const insertionIndex = Math.min(currentIndex + getRepeatInsertionOffset(), nextCards.length);

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
        void persistStatsDelta(currentCard.word, 1, 0).catch((error) => {
          const message = error instanceof Error ? error.message : 'Unable to save progress.';
          setSaveError(message);
        });
      });
      return;
    }

    startCardExit(direction, () => {
      setReviewedCount((count) => count + 1);
      setDismissedCount((count) => count + 1);
      void persistStatsDelta(currentCard.word, 1, 0).catch((error) => {
        const message = error instanceof Error ? error.message : 'Unable to save progress.';
        setSaveError(message);
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
      setIsInStack(false);
      removeLocalStackWord(currentCard.word.id);
      await persistCardState(currentCard.word, 'removed', false);
      await persistStatsDelta(currentCard.word, 1, 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save progress.';
      setSaveError(message);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update your stack.';
      setSaveError(message);
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

      setFeedbackStatus('Translation query sent.');
      setShowFeedbackPrompt(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send feedback.';
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
    return (
      <section className="rounded-[2rem] border border-white/50 bg-white/82 p-6 shadow-[0_28px_80px_rgba(26,67,46,0.16)] backdrop-blur">
        <div className="celebration-burst">
          <div className="celebration-icon celebration-icon-dragon">🐉</div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-semibold text-slate-900">Session complete!</h2>
        <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-2xl bg-[#eef4de] p-4">
            <p className="text-slate-500">Learned</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{learnedCount}</p>
          </div>
          <div className="rounded-2xl bg-[#edf1da] p-4">
            <p className="text-slate-500">Seen again</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{repeatCount}</p>
          </div>
          <div className="rounded-2xl bg-[#f7f1df] p-4">
            <p className="text-slate-500">Hidden this session</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{dismissedCount}</p>
          </div>
        </div>
        {saveError ? <p className="mt-4 text-sm text-amber-700">{saveError}</p> : null}
        <div className="mt-5 flex gap-3">
          <Link className="rounded-full px-4 py-2 text-sm font-semibold text-white" href="/flashcards" style={{ backgroundColor: '#234812' }}>
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

    if (event.key === ' ') {
      event.preventDefault();
      handleCardTap();
    }
  };

  return (
    <>
      <section className="space-y-4">
        <div className="relative flex items-center justify-between rounded-[1.75rem] border border-white/45 bg-white/66 px-4 py-3 shadow-[0_16px_40px_rgba(26,67,46,0.1)] backdrop-blur">
          <Link
            aria-label="Back to settings"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#c7d3a7] bg-white/90 shadow-sm"
            href="/flashcards"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path d="M15 5 8 12l7 7" stroke="#234812" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
            </svg>
          </Link>
          <p className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-center text-sm font-medium text-slate-700">
            {counterProgress} of {words.length}
          </p>
          <div className="ml-auto rounded-full bg-white/90 p-1 shadow-sm">
            <button
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${frontLanguage === 'welsh' ? 'text-white' : 'text-slate-600'}`}
              onClick={() => setFrontLanguage('welsh')}
              style={frontLanguage === 'welsh' ? { backgroundColor: '#769036' } : undefined}
              type="button"
            >
              Welsh
            </button>
            <button
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${frontLanguage === 'english' ? 'text-white' : 'text-slate-600'}`}
              onClick={() => setFrontLanguage('english')}
              style={frontLanguage === 'english' ? { backgroundColor: '#769036' } : undefined}
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
              style={{ backgroundColor: '#234812' }}
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
              style={isInStack ? { backgroundColor: '#769036', borderColor: '#769036' } : { borderColor: '#d5dfbb' }}
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
              style={showPhoneticAid ? { backgroundColor: '#769036', borderColor: '#769036' } : { borderColor: '#d5dfbb' }}
              type="button"
            >
              Aa
            </button>
          </div>
        ) : null}

        {isSaving ? <p className="text-sm text-slate-700">Saving progress…</p> : null}
        {saveError ? <p className="text-sm text-amber-800">{saveError}</p> : null}
        {feedbackStatus ? <p className="text-sm text-emerald-700">{feedbackStatus}</p> : null}
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
            </div>
            <button
              className="mt-6 w-full rounded-full px-4 py-3 text-sm font-semibold text-white"
              onClick={closeIntroOverlay}
              style={{ backgroundColor: '#234812' }}
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
                style={{ backgroundColor: '#234812' }}
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
          <div className="w-full max-w-sm rounded-[2rem] border border-white/50 bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
            <h2 className="text-xl font-semibold text-slate-900">Query this translation...</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              If you think this translation is incorrect, you can flag it to the app&apos;s developer.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 rounded-full border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900"
                onClick={() => setShowFeedbackPrompt(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-full px-4 py-3 text-sm font-semibold text-white"
                onClick={() => void submitTranslationFeedback()}
                style={{ backgroundColor: '#234812' }}
                type="button"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
