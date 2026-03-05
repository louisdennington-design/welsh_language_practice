'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

type RuntimeClientEnv = {
  supabaseAnonKey?: string;
  supabaseUrl?: string;
};

function getRuntimeClientEnv(): RuntimeClientEnv | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const runtimeEnv = (window as typeof window & { __CYMRUCARDS_RUNTIME_ENV__?: RuntimeClientEnv }).__CYMRUCARDS_RUNTIME_ENV__;
  return runtimeEnv ?? null;
}

function getSupabasePublicKeyForBrowser() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    getRuntimeClientEnv()?.supabaseAnonKey?.trim() ??
    ''
  );
}

function getSupabaseUrlForBrowser() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? getRuntimeClientEnv()?.supabaseUrl?.trim() ?? '';
}

export function createSupabaseBrowserClient() {
  const client = createSupabaseBrowserClientOrNull();

  if (!client) {
    throw new Error('Missing required Supabase public browser configuration.');
  }

  return client;
}

export function createSupabaseBrowserClientOrNull() {
  const url = getSupabaseUrlForBrowser();
  const anonKey = getSupabasePublicKeyForBrowser();

  if (!url || !anonKey) {
    return null;
  }

  return createBrowserClient<Database>(url, anonKey);
}
