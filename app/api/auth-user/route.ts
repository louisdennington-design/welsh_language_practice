import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/server/supabase-server';

export async function GET() {
  const supabaseServer = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      email: user.email ?? null,
      id: user.id,
    },
  });
}
