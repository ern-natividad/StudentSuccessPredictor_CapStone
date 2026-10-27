alter table if exists public.student_info
  add column if not exists school_year text;

create table if not exists public.adviser_assignments (
  id uuid primary key default gen_random_uuid(),
  adviser_user_id uuid not null references public.users(id) on delete cascade,
  school_year text not null,
  program text not null,
  year_level text not null,
  section text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint adviser_assignments_school_year_format
    check (
      school_year ~ '^[0-9]{4}-[0-9]{4}$'
      and right(school_year, 4)::integer = left(school_year, 4)::integer + 1
    ),
  constraint adviser_assignments_unique_scope
    unique (adviser_user_id, school_year, program, year_level, section)
);

create index if not exists adviser_assignments_active_scope_idx
  on public.adviser_assignments
    (adviser_user_id, school_year, program, year_level, section)
  where is_active = true;

create index if not exists student_info_school_year_scope_idx
  on public.student_info (school_year, program, year_level, section);

-- Existing adviser_info rows do not contain a school year. Do not copy them
-- into active assignments: administrators must confirm their intended year.
