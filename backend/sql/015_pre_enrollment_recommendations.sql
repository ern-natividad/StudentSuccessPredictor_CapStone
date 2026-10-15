create table if not exists public.pre_enrollment_recommendations (
  id uuid primary key default gen_random_uuid(),
  applicant_id text not null,
  full_name text not null,
  applicant_data jsonb not null,
  recommendation_summary jsonb not null,
  recommended_program text,
  composite_score numeric(5, 2),
  overall_cet numeric(5, 2) not null,
  status text not null,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create sequence if not exists public.pre_enrollment_applicant_id_seq
  as bigint
  minvalue 1
  start with 1
  increment by 1
  no cycle;

do $$
declare
  max_existing_id bigint;
  sequence_last_value bigint;
  sequence_is_called boolean;
begin
  select max((regexp_match(applicant_id, '^APP-[0-9]{4}-([0-9]+)$'))[1]::bigint)
    into max_existing_id
    from public.pre_enrollment_recommendations;

  select last_value, is_called
    into sequence_last_value, sequence_is_called
    from public.pre_enrollment_applicant_id_seq;

  if max_existing_id is not null and max_existing_id > sequence_last_value then
    perform setval(
      'public.pre_enrollment_applicant_id_seq',
      max_existing_id,
      true
    );
  elsif not sequence_is_called and max_existing_id is not null then
    perform setval(
      'public.pre_enrollment_applicant_id_seq',
      max_existing_id,
      true
    );
  end if;
end;
$$;

create or replace function public.next_pre_enrollment_applicant_id()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return 'APP-' || to_char(current_date, 'YYYY') || '-' ||
    lpad(nextval('public.pre_enrollment_applicant_id_seq')::text, 3, '0');
end;
$$;

revoke all on function public.next_pre_enrollment_applicant_id() from public;
grant execute on function public.next_pre_enrollment_applicant_id() to service_role;

alter table public.pre_enrollment_recommendations
  alter column applicant_id
  set default public.next_pre_enrollment_applicant_id();

alter table public.pre_enrollment_recommendations enable row level security;

create index if not exists pre_enrollment_recommendations_created_at_idx
  on public.pre_enrollment_recommendations (created_at desc);

create index if not exists pre_enrollment_recommendations_applicant_id_idx
  on public.pre_enrollment_recommendations (applicant_id);
