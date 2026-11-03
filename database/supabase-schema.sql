-- Run this once in Supabase Dashboard > SQL Editor > New query.
create table if not exists public.teamtrack_users (
  id uuid primary key,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin','teacher')),
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.teamtrack_classroom (
  id text primary key check (id = 'main'),
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.teamtrack_users enable row level security;
alter table public.teamtrack_classroom enable row level security;
revoke all on public.teamtrack_users, public.teamtrack_classroom from anon, authenticated;
grant all on public.teamtrack_users, public.teamtrack_classroom to service_role;
