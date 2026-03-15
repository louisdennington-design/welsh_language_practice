'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import type { CoreLinguisticTypeOption, FrontLanguage } from '@/lib/flashcards';
import { WordFlipCard } from '@/components/word-flip-card';

type MixerWord = {
  english_1: string | null;
  english_2: string | null;
  english_3: string | null;
  id: number;
  linguistic_type: CoreLinguisticTypeOption;
  themes: string[];
  welsh_lc: string | null;
};

type MixerPanelProps = {
  words: MixerWord[];
};

type MixerSlot = {
  label: string;
  placeholder: string;
  type: CoreLinguisticTypeOption;
  word: MixerWord | null;
};

const MIXER_ORDER: Array<{ label: string; placeholder: string; type: CoreLinguisticTypeOption }> = [
  { label: 'Noun', placeholder: 'Add nouns to your stack', type: 'NOUN' },
  { label: 'Adjective', placeholder: 'Add adjectives to your stack', type: 'ADJ' },
  { label: 'Verb', placeholder: 'Add verbs to your stack', type: 'VERB' },
];

function getRandomWord(words: MixerWord[]) {
  if (words.length === 0) {
    return null;
  }

  return words[Math.floor(Math.random() * words.length)] ?? null;
}

export function MixerPanel({ words }: MixerPanelProps) {
  const [frontLanguage, setFrontLanguage] = useState<FrontLanguage>('welsh');
  const [flippedState, setFlippedState] = useState<Record<CoreLinguisticTypeOption, boolean>>({
    ADJ: false,
    NOUN: false,
    VERB: false,
  });
  const [slots, setSlots] = useState<MixerSlot[]>([]);
  const [sliderOffset, setSliderOffset] = useState(0);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const sliderStartY = useRef<number | null>(null);

  const groupedWords = useMemo(() => {
    return {
      ADJ: words.filter((word) => word.linguistic_type === 'ADJ'),
      NOUN: words.filter((word) => word.linguistic_type === 'NOUN'),
      VERB: words.filter((word) => word.linguistic_type === 'VERB'),
    };
  }, [words]);

  function reshuffleWords() {
    setSlots(
      MIXER_ORDER.map((slot) => ({
        ...slot,
        word: getRandomWord(groupedWords[slot.type]),
      })),
    );
    setFlippedState({
      ADJ: false,
      NOUN: false,
      VERB: false,
    });
    trackEvent('mixer_shuffled', {
      adjective_available: groupedWords.ADJ.length > 0,
      noun_available: groupedWords.NOUN.length > 0,
      verb_available: groupedWords.VERB.length > 0,
    });
  }

  useEffect(() => {
    reshuffleWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedWords]);

  function toggleCard(type: CoreLinguisticTypeOption, hasWord: boolean) {
    if (!hasWord) {
      return;
    }

    setFlippedState((currentState) => ({
      ...currentState,
      [type]: !currentState[type],
    }));
    trackEvent('mixer_card_flipped', { card_pos: type });
  }

  function releaseSlider(finalOffset: number) {
    setIsDraggingSlider(false);
    sliderStartY.current = null;
    setSliderOffset(0);

    if (finalOffset > 84) {
      reshuffleWords();
    }
  }

  function handleSliderPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    sliderStartY.current = event.clientY;
    setIsDraggingSlider(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleSliderPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (sliderStartY.current === null) {
      return;
    }

    setSliderOffset(Math.max(0, Math.min(196, event.clientY - sliderStartY.current)));
  }

  function handleSliderPointerEnd(event: React.PointerEvent<HTMLButtonElement>) {
    if (sliderStartY.current === null) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    releaseSlider(sliderOffset);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-white/50 bg-white/84 p-5 shadow-[0_22px_50px_rgba(26,67,46,0.12)] backdrop-blur">
        <p className="text-sm leading-6 text-slate-700">
          Practice making a sentence with a combination of three words from your stack. Making sentence patterns with words you are learning will really
          help to bed them into your vocabulary.
        </p>
      </section>

      <section className="rounded-[2rem] border border-white/50 bg-white/84 p-4 shadow-[0_22px_50px_rgba(26,67,46,0.12)] backdrop-blur">
        <div className="mb-4 flex justify-end">
          <div className="rounded-full bg-white/90 p-1 shadow-sm">
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

        <div className="grid grid-cols-[minmax(0,1fr)_2.9rem] gap-3">
          <div className="space-y-3">
            {slots.map((slot) => (
              <div key={slot.type}>
                {slot.word ? (
                  <button className="block w-full text-left" onClick={() => toggleCard(slot.type, true)} type="button">
                    <WordFlipCard compact frontLanguage={frontLanguage} isFlipped={flippedState[slot.type]} word={slot.word} />
                  </button>
                ) : (
                  <div className="flashcard-card flashcard-card-compact rounded-[1.5rem] border border-white/60 bg-white shadow-[0_24px_40px_rgba(29,78,54,0.16)]">
                    <div className="flashcard-face flashcard-face-compact">
                      <p className="absolute left-5 top-5 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-slate-400">{slot.label}</p>
                      <p className="text-center text-lg font-medium leading-tight text-slate-400">{slot.placeholder}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mixer-slider-track rounded-[1.5rem] border border-[#d5dfbb] bg-white/90 p-1 shadow-sm">
            <button
              aria-label="Shuffle mixer cards"
              className={`mixer-slider-knob ${isDraggingSlider ? 'mixer-slider-knob-dragging' : ''}`}
              onPointerCancel={handleSliderPointerEnd}
              onPointerDown={handleSliderPointerDown}
              onPointerMove={handleSliderPointerMove}
              onPointerUp={handleSliderPointerEnd}
              style={{ transform: `translateY(${sliderOffset}px)` }}
              type="button"
            >
              <span className="text-lg leading-none text-white">|||</span>
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/50 bg-white/84 p-5 shadow-[0_22px_50px_rgba(26,67,46,0.12)] backdrop-blur">
        <h2 className="text-base font-semibold text-slate-900">Example sentence structures</h2>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm leading-6 text-slate-700">
          <p>Dw i&apos;n hoffi _______ achos _______.</p>
          <p>I like _______ because _______.</p>
          <p>Dw i ddim yn moyn _______.</p>
          <p>I don&apos;t want _____.</p>
          <p>Mae hi&apos;n / e&apos;n _______.</p>
          <p>She / he is _______.</p>
          <p>Mae _______ gyda fi.</p>
          <p>I have ______.</p>
          <p>Wyt ti&apos;n gallu _______?</p>
          <p>Can you _______?</p>
          <p>Dw i&apos;n mynd i _______.</p>
          <p>I am going to _______.</p>
        </div>
      </section>
    </div>
  );
}
