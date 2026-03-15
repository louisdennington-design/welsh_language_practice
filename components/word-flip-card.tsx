'use client';

import type { CoreLinguisticTypeOption, FrontLanguage, ThemeOption } from '@/lib/flashcards';

export type WordFlipCardWord = {
  english_1: string | null;
  english_2?: string | null;
  english_3?: string | null;
  linguistic_type: CoreLinguisticTypeOption;
  themes: ThemeOption[];
  welsh_lc: string | null;
};

type WordFlipCardProps = {
  compact?: boolean;
  frontLanguage: FrontLanguage;
  isFlipped: boolean;
  showQueryButton?: boolean;
  showSecondaryTranslations?: boolean;
  word: WordFlipCardWord;
  onOpenFeedback?: () => void;
};

export function formatEnglishForFlashcard(word: WordFlipCardWord, translation: string | null | undefined) {
  const normalizedTranslation = translation?.trim() ?? '';

  if (!normalizedTranslation) {
    return '';
  }

  if (word.linguistic_type !== 'VERB' || normalizedTranslation.toLowerCase().startsWith('to ')) {
    return normalizedTranslation;
  }

  return `to ${normalizedTranslation}`;
}

function getCardFaces(word: WordFlipCardWord, frontLanguage: FrontLanguage) {
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

export function WordFlipCard({
  compact = false,
  frontLanguage,
  isFlipped,
  showQueryButton = false,
  showSecondaryTranslations = true,
  word,
  onOpenFeedback,
}: WordFlipCardProps) {
  const faces = getCardFaces(word, frontLanguage);
  const secondaryTranslations = [word.english_2, word.english_3].filter((translation): translation is string => Boolean(translation?.trim()));
  const englishOnFront = frontLanguage === 'english';
  const cardMeta = `${word.linguistic_type} / ${(word.themes[0] ?? '').replaceAll('_', ' ').toUpperCase()}`;
  const frontFaceClassName = frontLanguage === 'welsh' ? 'flashcard-face flashcard-face-welsh' : 'flashcard-face';
  const backFaceClassName = frontLanguage === 'welsh' ? 'flashcard-face flashcard-face-back' : 'flashcard-face flashcard-face-back flashcard-face-welsh';
  const cardClassName = compact
    ? 'flashcard-card flashcard-card-compact rounded-[1.5rem] border border-white/60 bg-white shadow-[0_24px_40px_rgba(29,78,54,0.16)]'
    : 'flashcard-card rounded-[2rem] border border-white/60 bg-white shadow-[0_40px_70px_rgba(29,78,54,0.16)]';
  const frontFace = `${frontFaceClassName}${compact ? ' flashcard-face-compact' : ''}`;
  const backFace = `${backFaceClassName}${compact ? ' flashcard-face-compact' : ''}`;

  return (
    <div className={cardClassName}>
      <div className="flashcard-inner" style={{ transform: `rotateY(${isFlipped ? 180 : 0}deg)` }}>
        <div className={frontFace}>
          <p className={`absolute left-5 top-5 font-semibold uppercase tracking-[0.16em] text-slate-400 ${compact ? 'text-[0.55rem]' : 'text-[0.65rem]'}`}>
            {cardMeta}
          </p>
          {showQueryButton ? (
            <button
              aria-label="Query this translation"
              className="absolute bottom-5 left-5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-500"
              data-card-control="true"
              onClick={onOpenFeedback}
              type="button"
            >
              ?
            </button>
          ) : null}
          <p className={`text-center font-semibold leading-tight tracking-tight text-slate-900 ${compact ? 'text-2xl' : 'text-4xl'}`}>{faces.frontText}</p>
          {showSecondaryTranslations && englishOnFront && secondaryTranslations.length > 0 ? (
            <div className={`space-y-1 text-center text-slate-400 ${compact ? 'mt-2 text-sm' : 'mt-4 text-lg'}`}>
              {secondaryTranslations.map((translation) => (
                <p key={translation}>{translation}</p>
              ))}
            </div>
          ) : null}
        </div>
        <div className={backFace}>
          <p className={`absolute left-5 top-5 font-semibold uppercase tracking-[0.16em] text-slate-400 ${compact ? 'text-[0.55rem]' : 'text-[0.65rem]'}`}>
            {cardMeta}
          </p>
          {showQueryButton ? (
            <button
              aria-label="Query this translation"
              className="absolute bottom-5 left-5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-500"
              data-card-control="true"
              onClick={onOpenFeedback}
              type="button"
            >
              ?
            </button>
          ) : null}
          <p className={`text-center font-semibold leading-tight tracking-tight text-slate-900 ${compact ? 'text-2xl' : 'text-4xl'}`}>{faces.backText}</p>
          {showSecondaryTranslations && !englishOnFront && secondaryTranslations.length > 0 ? (
            <div className={`space-y-1 text-center text-slate-400 ${compact ? 'mt-2 text-sm' : 'mt-4 text-lg'}`}>
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
