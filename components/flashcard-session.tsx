'use client';

import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/server/supabase-browser';
import type { Database } from '@/types/database';

type SessionWord = Pick<Database['public']['Tables']['words']['Row'], 'english' | 'id' | 'welsh'>;

type FlashcardSessionProps = {
  initialUser: Pick<User, 'id'> | null;
  words: SessionWord[];
};

type UserProgressInsert = Database['public']['Tables']['user_progress']['Insert'];

export function FlashcardSession({ initialUser, words }: FlashcardSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<Pick<User, 'id'> | null>(initialUser);
  const supabase = createSupabaseBrowserClient();

  const currentWord = words[currentIndex];
  const isComplete = currentIndex >= words.length;

  async function saveProgress(wordId: string, isCorrect: boolean) {
    const activeUser =
      user ??
      (await supabase.auth.getUser().then(({ data }) => {
        const nextUser = data.user ? { id: data.user.id } : null;
        setUser(nextUser);
        return nextUser;
      }));

    if (!activeUser) {
      setSaveError('Progress is only saved for signed-in users. Session results are local for now.');
      return;
    }

    const now = new Date().toISOString();
    const payload: UserProgressInsert = {
      user_id: activeUser.id,
      word_id: wordId,
      correct: isCorrect,
      last_reviewed_at: now,
      last_reviewed: now,
    };
    const { error } = await supabase.schema('public').from('user_progress').upsert(payload, {
      onConflict: 'user_id,word_id',
    });

    if (error) {
      throw error;
    }
  }

  async function handleAnswer(isCorrect: boolean) {
    if (!currentWord) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await saveProgress(currentWord.id, isCorrect);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save progress.';
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }

    if (isCorrect) {
      setCorrectCount((count) => count + 1);
    } else {
      setIncorrectCount((count) => count + 1);
    }

    setCurrentIndex((index) => index + 1);
    setIsAnswerVisible(false);
  }

  if (words.length === 0) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold">No flashcards available</h2>
        <p className="mt-2 text-sm text-slate-600">The words table did not return any entries yet.</p>
      </section>
    );
  }

  if (isComplete) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-xl font-semibold">Session complete</h2>
        <p className="mt-4 text-sm text-slate-600">Correct: {correctCount}</p>
        <p className="mt-1 text-sm text-slate-600">Incorrect: {incorrectCount}</p>
        {saveError ? <p className="mt-4 text-sm text-amber-700">{saveError}</p> : null}
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-600">
        Card {currentIndex + 1} of {words.length}
      </p>
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-2xl font-semibold">{currentWord.welsh}</p>
        {isAnswerVisible ? <p className="mt-4 text-base text-slate-700">{currentWord.english}</p> : null}
      </div>

      {!isAnswerVisible ? (
        <button
          className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          onClick={() => setIsAnswerVisible(true)}
          type="button"
        >
          Show answer
        </button>
      ) : (
        <div className="mt-4 flex gap-3">
          <button
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={isSaving}
            onClick={() => void handleAnswer(true)}
            type="button"
          >
            Correct
          </button>
          <button
            className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={isSaving}
            onClick={() => void handleAnswer(false)}
            type="button"
          >
            Incorrect
          </button>
        </div>
      )}

      {isSaving ? <p className="mt-3 text-sm text-slate-600">Saving progress…</p> : null}
      {saveError ? <p className="mt-3 text-sm text-amber-700">{saveError}</p> : null}
      {!user ? (
        <p className="mt-3 text-sm text-slate-500">Not signed in. Session still works, but progress will not persist.</p>
      ) : null}
    </section>
  );
}
