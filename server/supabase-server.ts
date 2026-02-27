import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SetAllCookies } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/server/supabase-env';

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server components cannot write cookies during render.
        }
      },
    },
  });
}
