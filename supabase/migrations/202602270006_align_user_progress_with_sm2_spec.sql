alter table public.user_progress
drop column if exists correct,
drop column if exists last_reviewed_at,
drop column if exists review_interval_days,
drop column if exists next_due_at;

alter table public.user_progress
add column if not exists status progress_status not null default 'new',
add column if not exists easiness_factor numeric(4,2) not null default 2.50,
add column if not exists interval integer not null default 0,
add column if not exists repetitions integer not null default 0,
add column if not exists due_date date,
add column if not exists last_reviewed timestamptz,
add column if not exists review_count integer not null default 0;

alter table public.user_progress
alter column status set default 'new',
alter column easiness_factor set default 2.50,
alter column interval set default 0,
alter column repetitions set default 0,
alter column review_count set default 0;
