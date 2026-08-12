create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.curricula (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  academic_year text not null, -- e.g. '2025-2026'
  department text not null default 'Engineering',
  program text not null, -- e.g. 'BS Computer Science'
  status text not null default 'Draft' check (status in ('Draft', 'Pending Approval', 'Published')),
  courses jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  versions jsonb not null default '[]'::jsonb,
  approved_by uuid references public.users(id) on delete set null, -- Links to admin user id
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_curricula_status on public.curricula (status);

drop trigger if exists trg_curricula_updated_at on public.curricula;
create trigger trg_curricula_updated_at
  before update on public.curricula
  for each row execute function public.set_updated_at();
