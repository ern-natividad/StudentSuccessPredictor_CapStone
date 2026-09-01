alter table if exists public.users
  add column if not exists profile_picture text;
