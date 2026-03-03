'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  readActiveFlashcardSession,
  readSessionSetupSnapshot,
  writeSessionSetupSnapshot,
  type ActiveFlashcardSession,
} from '@/lib/active-flashcard-session';
import { readLocalStack, type StackedWord } from '@/lib/card-stack';
import {
  DEFAULT_DURATION,
  DEFAULT_FRONT_LANGUAGE,
  DEFAULT_RARITY,
  DEFAULT_THEME_OPTIONS,
  FRONT_LANGUAGE_OPTIONS,
  SESSION_SIZE_OPTIONS,
  STACK_TYPE_OPTION,
  THEME_OPTIONS,
  CORE_TYPE_OPTIONS,
  getRarityLabel,
  getCoreSelectedTypes,
  matchesRarityWindow,
  getSelectedDuration,
  getSelectedRarity,
  getSessionSizeLabel,
  type DurationOption,
  type FrontLanguage,
  type LinguisticTypeOption,
  type RarityOption,
  type ThemeOption,
} from '@/lib/flashcards';

type AvailableCardSummary = {
  frequency: number | null;
  id: number;
  linguistic_type: LinguisticTypeOption;
  themes: ThemeOption[];
};

type SessionSetupFormProps = {
  availableCards: AvailableCardSummary[];
  initialStackWords?: StackedWord[];
  initialDuration?: DurationOption;
  initialFrontLanguage?: FrontLanguage;
  initialRarity?: RarityOption;
  initialThemes?: ThemeOption[];
  initialTypes: LinguisticTypeOption[];
};

function getDurationSliderValue(duration: DurationOption) {
  const index = SESSION_SIZE_OPTIONS.indexOf(duration);
  return Math.max(index, 0) + 1;
}

function getDurationFromSliderValue(value: number): DurationOption {
  return SESSION_SIZE_OPTIONS[Math.max(0, Math.min(SESSION_SIZE_OPTIONS.length - 1, value - 1))] ?? DEFAULT_DURATION;
}

export function SessionSetupForm({
  availableCards,
  initialStackWords = [],
  initialDuration = DEFAULT_DURATION,
  initialFrontLanguage = DEFAULT_FRONT_LANGUAGE,
  initialRarity = DEFAULT_RARITY,
  initialThemes = [...DEFAULT_THEME_OPTIONS],
  initialTypes,
}: SessionSetupFormProps) {
  const [duration, setDuration] = useState<DurationOption>(initialDuration);
  const [frontLanguage, setFrontLanguage] = useState<FrontLanguage>(initialFrontLanguage);
  const [rarity, setRarity] = useState<RarityOption>(initialRarity);
  const [themes, setThemes] = useState<ThemeOption[]>(initialThemes);
  const [types, setTypes] = useState<LinguisticTypeOption[]>(initialTypes);
  const [stackWords, setStackWords] = useState<StackedWord[]>(initialStackWords);
  const [activeSession, setActiveSession] = useState<ActiveFlashcardSession | null>(null);
  const router = useRouter();

  useEffect(() => {
    const snapshot = readSessionSetupSnapshot();
    const storedActiveSession = readActiveFlashcardSession();

    if (!snapshot) {
      setActiveSession(storedActiveSession);
      return;
    }

    setDuration(getSelectedDuration(snapshot.duration));
    setFrontLanguage(snapshot.front);
    setRarity(getSelectedRarity(snapshot.rarity));
    const nextStackWords = readLocalStack().length > 0 ? readLocalStack() : initialStackWords;
    const nextTypes = Array.isArray(snapshot.types) && snapshot.types.length > 0 ? snapshot.types : initialTypes;

    setThemes(Array.isArray(snapshot.themes) && snapshot.themes.length > 0 ? snapshot.themes : [...DEFAULT_THEME_OPTIONS]);
    setTypes(nextStackWords.length === 0 ? nextTypes.filter((type) => type !== 'STACK') : nextTypes);
    setActiveSession(storedActiveSession);
    setStackWords(nextStackWords);
  }, [initialStackWords, initialTypes]);

  function toggleType(type: LinguisticTypeOption) {
    setTypes((currentTypes) => {
      if (currentTypes.includes(type)) {
        if (currentTypes.length === 1) {
          return currentTypes;
        }

        return currentTypes.filter((currentType) => currentType !== type);
      }

      return [...currentTypes, type];
    });
  }

  function toggleTheme(theme: ThemeOption) {
    setThemes((currentThemes) => {
      if (currentThemes.includes(theme)) {
        if (currentThemes.length === 1) {
          return currentThemes;
        }

        return currentThemes.filter((currentTheme) => currentTheme !== theme);
      }

      return [...currentThemes, theme];
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams({
      duration,
      front: frontLanguage,
      rarity,
      session: Date.now().toString(),
      themes: themes.join(','),
      types: types.join(','),
    });

    if (stackWords.length > 0) {
      params.set('stackIds', stackWords.map((word) => word.id).join(','));
    }

    writeSessionSetupSnapshot({
      duration,
      front: frontLanguage,
      rarity,
      themes,
      types,
    });

    router.push(`/flashcards?${params.toString()}`);
  }

  function handleResume() {
    if (!activeSession) {
      return;
    }

    router.push(activeSession.sessionUrl);
  }

  const coreTypes = getCoreSelectedTypes(types);
  const filteredWordIds = new Set(
    availableCards
      .filter((card) => {
        if (!coreTypes.includes(card.linguistic_type as Exclude<LinguisticTypeOption, 'STACK'>)) {
          return false;
        }

        if (!card.themes.some((theme) => themes.includes(theme))) {
          return false;
        }

        return matchesRarityWindow(card.linguistic_type as Exclude<LinguisticTypeOption, 'STACK'>, card.frequency, rarity);
      })
      .map((card) => card.id),
  );
  const stackIds = stackWords.map((word) => word.id);

  const availableCardCount = new Set([
    ...filteredWordIds,
    ...(types.includes('STACK') ? stackIds : []),
  ]).size;

  const typeOptions = [...CORE_TYPE_OPTIONS, STACK_TYPE_OPTION];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          className="w-full rounded-full px-4 py-[1.125rem] text-sm font-semibold text-white shadow-[0_14px_34px_rgba(20,40,22,0.28)]"
          form="session-options-form"
          style={{ backgroundColor: '#234812' }}
          type="submit"
        >
          Start new session
        </button>
        <button
          className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-[1.125rem] text-sm font-semibold shadow-sm ${
            activeSession ? 'bg-white text-[#234812]' : 'cursor-not-allowed bg-slate-100 text-slate-400'
          }`}
          disabled={!activeSession}
          onClick={handleResume}
          style={activeSession ? { borderColor: '#c7d3a7' } : { borderColor: '#e2e8f0' }}
          type="button"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" />
          </svg>
          Resume
        </button>
      </div>

      <section className="rounded-[2rem] border border-white/60 bg-white/84 p-5 shadow-[0_24px_60px_rgba(20,40,22,0.18)] backdrop-blur">
        <form className="space-y-5" id="session-options-form" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <p className={`text-center text-lg font-semibold leading-tight ${availableCardCount < 10 ? 'text-red-600' : 'text-slate-800'}`}>
              Total cards available with these criteria:
            </p>
            <div className="mx-auto flex max-w-[12rem] items-center justify-center rounded-[1.5rem] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(20,40,22,0.1)]">
              <span className={`text-3xl font-semibold tracking-tight ${availableCardCount < 10 ? 'text-red-600' : 'text-slate-900'}`}>
                {availableCardCount}
              </span>
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-900">Card front</legend>
            <div className="rounded-full border border-[#d5dfbb] bg-white p-1 shadow-sm">
              <div className="grid grid-cols-2 gap-1">
                {FRONT_LANGUAGE_OPTIONS.map((option) => (
                  <label
                    className={`flex cursor-pointer items-center justify-center rounded-full px-4 py-3 text-sm font-semibold ${
                      frontLanguage === option.value ? 'text-white' : 'text-slate-700'
                    }`}
                    key={option.value}
                    style={frontLanguage === option.value ? { backgroundColor: '#769036' } : undefined}
                  >
                    <input
                      checked={frontLanguage === option.value}
                      className="sr-only"
                      name="frontLanguage"
                      onChange={() => setFrontLanguage(option.value)}
                      type="radio"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <legend className="text-sm font-medium text-slate-900">Number of cards in session</legend>
              <span className="text-sm text-slate-600">{getSessionSizeLabel(duration)}</span>
            </div>
            <input
              className="w-full"
              max={SESSION_SIZE_OPTIONS.length}
              min="1"
              onChange={(event) => setDuration(getDurationFromSliderValue(Number(event.target.value)))}
              step="1"
              style={{ accentColor: '#769036' }}
              type="range"
              value={getDurationSliderValue(duration)}
            />
          </fieldset>

          <fieldset className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <legend className="text-sm font-medium text-slate-900">Word rarity</legend>
              <span className="text-sm text-slate-600">{getRarityLabel(rarity)}</span>
            </div>
            <input
              className="w-full"
              max="100"
              min="10"
              onChange={(event) => setRarity(String(event.target.value) as RarityOption)}
              step="10"
              style={{ accentColor: '#769036' }}
              type="range"
              value={Number(rarity)}
            />
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-900">Linguistic type</legend>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map((option) => {
                const isDisabled = option.value === 'STACK' && stackWords.length === 0;
                const isSelected = types.includes(option.value);

                return (
                  <label
                    className={`flex cursor-pointer items-center justify-center rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm ${
                      isDisabled
                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                        : isSelected
                          ? 'text-white'
                          : 'border-[#d5dfbb] bg-white text-slate-900'
                    }`}
                    key={option.value}
                    style={isSelected && !isDisabled ? { backgroundColor: '#769036', borderColor: '#769036' } : undefined}
                  >
                    <span>{option.label}</span>
                    <input
                      checked={isSelected}
                      className="sr-only"
                      disabled={isDisabled}
                      onChange={() => {
                        if (!isDisabled) {
                          toggleType(option.value);
                        }
                      }}
                      type="checkbox"
                    />
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-900">Theme</legend>
            <div className="grid grid-cols-2 gap-2">
              {THEME_OPTIONS.map((option) => (
                <label
                  className={`flex min-h-[4.75rem] cursor-pointer items-center justify-center rounded-2xl border px-4 py-3 text-center text-sm font-medium leading-tight shadow-sm ${
                    themes.includes(option.value) ? 'text-white' : 'border-[#d5dfbb] bg-white text-slate-900'
                  }`}
                  key={option.value}
                  style={themes.includes(option.value) ? { backgroundColor: '#769036', borderColor: '#769036' } : undefined}
                >
                  <span>{option.label}</span>
                  <input
                    checked={themes.includes(option.value)}
                    className="sr-only"
                    onChange={() => toggleTheme(option.value)}
                    type="checkbox"
                  />
                </label>
              ))}
            </div>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
