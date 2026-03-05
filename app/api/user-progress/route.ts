import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/server/supabase-server';

type ProgressAction = 'finalize_session' | 'stats_delta';
type ProgressBody = {
  action?: ProgressAction;
  learned_count?: number;
  learned_delta?: number;
  linguistic_type?: 'ADJ' | 'NOUN' | 'VERB';
  reviewed_count?: number;
  reviewed_delta?: number;
};

type SessionHistoryPoint = {
  session: number;
  totalLearned: number;
  wordsShown: number;
};

function createEmptyCategoryProgress() {
  return {
    ADJ: { learned: 0, reviewed: 0 },
    NOUN: { learned: 0, reviewed: 0 },
    VERB: { learned: 0, reviewed: 0 },
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ProgressBody | null;

  if (!body || !body.action) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const supabaseServer = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (body.action === 'stats_delta') {
    if (!body.linguistic_type || !['ADJ', 'NOUN', 'VERB'].includes(body.linguistic_type)) {
      return NextResponse.json({ error: 'Invalid linguistic type' }, { status: 400 });
    }

    const reviewedDelta = Number(body.reviewed_delta ?? 0);
    const learnedDelta = Number(body.learned_delta ?? 0);

    const { data: existingStats, error: lookupError } = await supabaseServer
      .schema('public')
      .from('user_stats')
      .select('category_progress, total_learned, total_reviewed')
      .eq('user_id', user.id)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    const rawProgress = existingStats?.category_progress;
    const categoryProgress =
      rawProgress && typeof rawProgress === 'object' && !Array.isArray(rawProgress)
        ? { ...createEmptyCategoryProgress(), ...rawProgress }
        : createEmptyCategoryProgress();
    const wordProgress = categoryProgress[body.linguistic_type] ?? { learned: 0, reviewed: 0 };

    const { error } = await supabaseServer.schema('public').from('user_stats').upsert(
      {
        category_progress: {
          ...categoryProgress,
          [body.linguistic_type]: {
            learned: wordProgress.learned + learnedDelta,
            reviewed: wordProgress.reviewed + reviewedDelta,
          },
        },
        total_learned: (existingStats?.total_learned ?? 0) + learnedDelta,
        total_reviewed: (existingStats?.total_reviewed ?? 0) + reviewedDelta,
        user_id: user.id,
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  const reviewedCount = Number(body.reviewed_count ?? 0);
  const learnedCount = Number(body.learned_count ?? 0);
  const { data: existingStats, error: statsLookupError } = await supabaseServer
    .schema('public')
    .from('user_stats')
    .select('session_history, total_learned')
    .eq('user_id', user.id)
    .maybeSingle();

  if (statsLookupError) {
    return NextResponse.json({ error: statsLookupError.message }, { status: 500 });
  }

  const previousHistory = Array.isArray(existingStats?.session_history) ? (existingStats.session_history as SessionHistoryPoint[]) : [];
  const nextHistory = [
    ...previousHistory,
    {
      session: previousHistory.length + 1,
      totalLearned: existingStats?.total_learned ?? learnedCount,
      wordsShown: reviewedCount,
    },
  ];
  const lastSessionDate = new Date().toISOString().slice(0, 10);

  const { error } = await supabaseServer.schema('public').from('user_stats').upsert(
    {
      last_session_date: lastSessionDate,
      session_history: nextHistory,
      user_id: user.id,
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, session_history: nextHistory });
}
