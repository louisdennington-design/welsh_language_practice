alter table if exists public.translation_feedback enable row level security;

grant usage on schema public to anon, authenticated;
grant insert on table public.translation_feedback to anon, authenticated;
grant usage, select on sequence public.translation_feedback_id_seq to anon, authenticated;

drop policy if exists "Anyone can submit translation feedback" on public.translation_feedback;

create policy "Anyone can submit translation feedback"
  on public.translation_feedback for insert
  to anon, authenticated
  with check (user_id is null or auth.uid() = user_id);
