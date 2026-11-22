-- Run once in the Neon SQL Editor after enabling Neon Auth and the Data API.
-- One row per garden per user; RLS restricts access to the signed-in user's rows.
create table if not exists public.gardens (
  user_id    uuid not null default auth.user_id()::uuid references neon_auth."user" (id) on delete cascade,
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
  using ((select auth.user_id()::uuid) = user_id)
  with check ((select auth.user_id()::uuid) = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.gardens to authenticated;
