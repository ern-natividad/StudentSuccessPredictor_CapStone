create table if not exists public.course_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text not null,
  units numeric(5, 2) not null default 0 check (units >= 0),
  lec numeric(5, 2) not null default 0 check (lec >= 0),
  lab numeric(5, 2) not null default 0 check (lab >= 0),
  type text not null default 'Professional',
  prerequisites text not null default 'None',
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists course_catalog_code_idx
  on public.course_catalog (upper(regexp_replace(btrim(code), '\s+', ' ', 'g')));

create index if not exists course_catalog_active_idx
  on public.course_catalog (is_active);

create table if not exists public.course_catalog_scopes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.course_catalog(id) on delete cascade,
  scope_type text not null check (scope_type in ('shared', 'department', 'program')),
  department text,
  program_id uuid references public.programs(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint course_catalog_scope_target_check check (
    (scope_type = 'shared' and department is null and program_id is null)
    or (scope_type = 'department' and nullif(btrim(department), '') is not null and program_id is null)
    or (scope_type = 'program' and department is null and program_id is not null)
  )
);

create unique index if not exists course_catalog_scopes_unique_idx
  on public.course_catalog_scopes (
    course_id,
    scope_type,
    coalesce(lower(btrim(department)), ''),
    coalesce(program_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists course_catalog_scopes_department_idx
  on public.course_catalog_scopes (lower(btrim(department)))
  where scope_type = 'department';

create index if not exists course_catalog_scopes_program_idx
  on public.course_catalog_scopes (program_id)
  where scope_type = 'program';

alter table public.course_catalog enable row level security;
alter table public.course_catalog_scopes enable row level security;