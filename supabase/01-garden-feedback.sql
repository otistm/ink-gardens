-- Ink Gardens: tester feedback. Paste into Supabase > SQL Editor and press Run (once).
-- Players can send notes; nobody can read them from the game. Read them in Supabase > Table Editor > garden_feedback.
-- It's the same Supabase project as Ink Nine and Ink Burger, and it only adds a new table: nothing of theirs is touched.

create table if not exists public.garden_feedback (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  player_id  uuid default auth.uid(),
  version    text not null default '',
  kind       text not null default '',
  note       text not null check (char_length(note) between 1 and 1000),
  context    jsonb not null default '{}'::jsonb
);

alter table public.garden_feedback enable row level security;

drop policy if exists "players send garden feedback" on public.garden_feedback;
create policy "players send garden feedback"
  on public.garden_feedback for insert with check (auth.uid() = player_id);
