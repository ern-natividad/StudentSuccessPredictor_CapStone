-- Canonical engineering programs catalog (shared by profiles, curriculum, advisers, students).
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint programs_name_unique unique (name)
);

create index if not exists programs_is_active_idx on public.programs (is_active);

-- Profile program for all user roles.
alter table if exists public.users
  add column if not exists program text;

-- Seed WMSU College of Engineering programs (skip if name already exists).
insert into public.programs (name, code)
values
  ('BS Civil Engineering', 'BSCE'),
  ('BS Electrical Engineering', 'BSEE'),
  ('BS Industrial Engineering', 'BSIE'),
  ('BS Computer Engineering', 'BSCpE'),
  ('BS Mechanical Engineering', 'BSME'),
  ('BS Geodetic Engineering', 'BSGE'),
  ('BS Agricultural and Biosystems Engineering', 'BSABE'),
  ('BS Electronics Engineering', 'ECE'),
  ('BS Environmental Engineering', 'BSEnvE'),
  ('BS Sanitary Engineering', 'BSSE')
on conflict (name) do nothing;
