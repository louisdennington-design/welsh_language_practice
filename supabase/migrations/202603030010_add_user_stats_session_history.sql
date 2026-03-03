alter table public.user_stats
  add column if not exists session_history jsonb not null default '[]'::jsonb;
