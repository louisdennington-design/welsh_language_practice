create extension if not exists "pgcrypto";

create type progress_status as enum ('new', 'learning', 'learned', 'failed');

create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  welsh text not null,
  english text not null,
  part_of_speech text not null,
  frequency_rank integer,
  legacy_type text not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.word_categories (
  word_id uuid not null references public.words(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (word_id, category_id)
);

create table if not exists public.user_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  status progress_status not null default 'new',
  easiness_factor numeric(4,2) not null default 2.50,
  interval integer not null default 0,
  repetitions integer not null default 0,
  due_date date,
  last_reviewed timestamptz,
  review_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, word_id)
);

create table if not exists public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_session_date date,
  grace_days_used integer not null default 0,
  total_reviewed integer not null default 0,
  total_learned integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_words_frequency_rank on public.words (frequency_rank);
create index if not exists idx_words_part_of_speech on public.words (part_of_speech);
create index if not exists idx_user_progress_due_date on public.user_progress (user_id, due_date);

alter table public.words enable row level security;
alter table public.categories enable row level security;
alter table public.word_categories enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_stats enable row level security;

create policy "Words are readable by authenticated users"
  on public.words for select
  to authenticated
  using (true);

create policy "Categories are readable by authenticated users"
  on public.categories for select
  to authenticated
  using (true);

create policy "Word categories are readable by authenticated users"
  on public.word_categories for select
  to authenticated
  using (true);

create policy "Users can read own progress"
  on public.user_progress for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can upsert own progress"
  on public.user_progress for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read own stats"
  on public.user_stats for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can upsert own stats"
  on public.user_stats for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
