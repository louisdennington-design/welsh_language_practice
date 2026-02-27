alter table public.user_progress
add column if not exists correct boolean,
add column if not exists last_reviewed_at timestamptz;
