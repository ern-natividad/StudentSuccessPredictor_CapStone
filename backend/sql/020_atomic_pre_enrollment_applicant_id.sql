create table if not exists public.pre_enrollment_applicant_id_state (
  singleton boolean primary key default true check (singleton),
  last_issued bigint not null check (last_issued >= 0)
);

insert into public.pre_enrollment_applicant_id_state (singleton, last_issued)
select
  true,
  coalesce(
    max((regexp_match(applicant_id, '^APP-[0-9]{4}-([0-9]+)$'))[1]::bigint),
    0
  )
from public.pre_enrollment_recommendations
on conflict (singleton) do nothing;

alter table public.pre_enrollment_recommendations
  alter column applicant_id drop default;

create or replace function public.preview_pre_enrollment_applicant_id()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  next_id bigint;
begin
  select last_issued + 1
    into next_id
    from public.pre_enrollment_applicant_id_state
    where singleton = true;

  if next_id is null then
    raise exception 'Applicant ID state is not initialized.';
  end if;

  return 'APP-' || to_char(current_date, 'YYYY') || '-' ||
    lpad(next_id::text, 3, '0');
end;
$$;

create or replace function public.next_pre_enrollment_applicant_id()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return public.preview_pre_enrollment_applicant_id();
end;
$$;

drop function if exists public.create_pre_enrollment_recommendation(jsonb);
drop function if exists public.create_pre_enrollment_recommendation(jsonb, jsonb, uuid);
drop function if exists public.create_pre_enrollment_recommendation(jsonb, uuid, jsonb);

create or replace function public.create_pre_enrollment_recommendation(
  p_applicant jsonb,
  p_created_by uuid,
  p_recommendation jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  issued_id bigint;
  applicant_id text;
  saved_record public.pre_enrollment_recommendations;
begin
  update public.pre_enrollment_applicant_id_state
    set last_issued = last_issued + 1
    where singleton = true
    returning last_issued into issued_id;

  if issued_id is null then
    raise exception 'Applicant ID state is not initialized.';
  end if;

  applicant_id := 'APP-' || to_char(current_date, 'YYYY') || '-' ||
    lpad(issued_id::text, 3, '0');

  insert into public.pre_enrollment_recommendations (
    applicant_id,
    full_name,
    applicant_data,
    recommendation_summary,
    recommended_program,
    composite_score,
    overall_cet,
    status,
    created_by
  )
  values (
    applicant_id,
    p_applicant->>'fullName',
    jsonb_set(coalesce(p_applicant, '{}'::jsonb), '{applicantId}', to_jsonb(applicant_id), true),
    jsonb_set(coalesce(p_recommendation, '{}'::jsonb), '{applicantId}', to_jsonb(applicant_id), true),
    p_recommendation->>'recommendedProgram',
    nullif(p_recommendation->'programs'->0->>'compositeScore', '')::numeric,
    nullif(p_recommendation->>'overallCET', '')::numeric,
    p_recommendation->>'recommendationStatus',
    p_created_by
  )
  returning * into saved_record;

  return jsonb_build_object(
    'id', saved_record.id,
    'applicant_id', saved_record.applicant_id,
    'full_name', saved_record.full_name,
    'recommended_program', saved_record.recommended_program,
    'composite_score', saved_record.composite_score,
    'overall_cet', saved_record.overall_cet,
    'status', saved_record.status,
    'created_at', saved_record.created_at
  );
end;
$$;

revoke all on function public.preview_pre_enrollment_applicant_id() from public;
revoke all on function public.next_pre_enrollment_applicant_id() from public;
revoke all on function public.create_pre_enrollment_recommendation(jsonb, uuid, jsonb) from public;
grant execute on function public.preview_pre_enrollment_applicant_id() to service_role;
grant execute on function public.next_pre_enrollment_applicant_id() to service_role;
grant execute on function public.create_pre_enrollment_recommendation(jsonb, uuid, jsonb) to service_role;

notify pgrst, 'reload schema';
