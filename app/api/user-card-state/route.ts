import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/server/supabase-server';
import type { Database } from '@/types/database';

type CardStateBody = {
  in_stack?: boolean;
  status?: Database['public']['Enums']['card_state_status'];
  word_id?: number;
};

export async function GET(request: Request) {
  const wordId = Number(new URL(request.url).searchParams.get('word_id'));

  if (!Number.isInteger(wordId) || wordId <= 0) {
    return NextResponse.json({ error: 'Invalid word_id' }, { status: 400 });
  }

  const supabaseServer = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseServer
    .schema('public')
    .from('user_card_state')
    .select('in_stack')
    .eq('user_id', user.id)
    .eq('word_id', wordId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ in_stack: Boolean(data?.in_stack) });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as CardStateBody | null;
  const wordId = Number(body?.word_id);

  if (!body || !Number.isInteger(wordId) || wordId <= 0) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const status = body.status ?? 'active';
  const inStack = body.in_stack ?? false;
  const supabaseServer = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabaseServer.schema('public').from('user_card_state').upsert(
    {
      in_stack: inStack,
      status,
      user_id: user.id,
      word_id: wordId,
    },
    {
      onConflict: 'user_id,word_id',
    },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
