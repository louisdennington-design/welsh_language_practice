import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/server/supabase-admin';
import { createSupabaseServerClient } from '@/server/supabase-server';

type FeedbackBody = {
  english_1?: string;
  theme?: string;
  word_id?: number;
  welsh_lc?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as FeedbackBody | null;

  if (!body || typeof body.word_id !== 'number' || typeof body.welsh_lc !== 'string' || typeof body.english_1 !== 'string') {
    return NextResponse.json({ error: 'Invalid feedback payload.' }, { status: 400 });
  }

  const supabaseServer = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  const supabaseAdmin = createSupabaseAdminClient();

  const { error } = await supabaseAdmin.from('translation_feedback').insert({
    english_1: body.english_1,
    theme: body.theme ?? null,
    user_id: user?.id ?? null,
    welsh_lc: body.welsh_lc,
    word_id: body.word_id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
