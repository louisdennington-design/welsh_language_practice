create type card_state_status as enum ('active', 'removed');

create table if not exists public.user_card_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  status card_state_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, word_id)
);

create table if not exists public.user_queue_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  focus_key text not null,
  queue uuid[] not null default '{}',
  cursor integer not null default 0,
  last_session_seed integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, focus_key)
);

create index if not exists idx_user_card_state_status on public.user_card_state (user_id, status);
create index if not exists idx_user_queue_state_focus on public.user_queue_state (user_id, focus_key);

alter table public.user_card_state enable row level security;
alter table public.user_queue_state enable row level security;

create policy "Users can manage own card state"
  on public.user_card_state for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own queue state"
  on public.user_queue_state for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
