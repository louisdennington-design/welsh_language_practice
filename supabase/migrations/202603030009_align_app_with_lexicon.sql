create table if not exists public.lexicon (
  id bigint primary key,
  welsh text,
  welsh_lc text,
  welsh_frequency bigint,
  welsh_zipf double precision,
  english_1 text,
  spacy_pos_1 text,
  wordnet_pos_tags_1 text,
  wordnet_themes_1 text,
  wordnet_lexnames_1 text,
  english_2 text,
  spacy_pos_2 text,
  wordnet_pos_tags_2 text,
  wordnet_themes_2 text,
  wordnet_lexnames_2 text,
  english_3 text,
  spacy_pos_3 text,
  wordnet_pos_tags_3 text,
  wordnet_themes_3 text,
  wordnet_lexnames_3 text
);

alter table public.lexicon enable row level security;

grant usage on schema public to anon, authenticated;
grant select on table public.lexicon to anon, authenticated;

drop policy if exists "Lexicon is readable by authenticated users" on public.lexicon;
drop policy if exists "Lexicon is readable by everyone" on public.lexicon;

create policy "Lexicon is readable by everyone"
  on public.lexicon for select
  to anon, authenticated
  using (true);

alter table if exists public.user_card_state
  drop constraint if exists user_card_state_word_id_fkey;

alter table if exists public.user_card_state
  alter column word_id type bigint using word_id::bigint;

alter table if exists public.user_card_state
  add constraint user_card_state_word_id_fkey
  foreign key (word_id) references public.lexicon(id) on delete cascade;

alter table if exists public.user_queue_state
  alter column queue type bigint[]
  using coalesce((select array_agg(value::bigint) from unnest(queue) as value), '{}'::bigint[]);
