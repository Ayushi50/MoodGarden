-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- One row per garden per user. Row Level Security means a signed-in user can only ever see their own rows.
create table if not exists public.gardens (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id         text not null,                 -- cloud id of the garden (stable across devices)
  name       text not null default '',
  data       jsonb,                         -- the whole garden state
  deleted    boolean not null default false, -- tombstone so deletes sync too
  updated_at timestamptz not null,
  primary key (user_id, id)
);

alter table public.gardens enable row level security;

drop policy if exists "own gardens" on public.gardens;
create policy "own gardens" on public.gardens
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
