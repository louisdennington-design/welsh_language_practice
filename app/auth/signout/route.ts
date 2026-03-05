import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/server/supabase-server';

async function signOutAndRedirect(request: Request) {
  const supabaseServer = createSupabaseServerClient();
  await supabaseServer.auth.signOut().catch(() => null);
  return NextResponse.redirect(new URL('/flashcards', request.url));
}

export async function GET(request: Request) {
  return signOutAndRedirect(request);
}

export async function POST(request: Request) {
  return signOutAndRedirect(request);
}
