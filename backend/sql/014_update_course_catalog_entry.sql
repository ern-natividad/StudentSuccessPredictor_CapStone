create or replace function public.update_course_catalog_entry(
  p_course_id uuid,
  p_course jsonb,
  p_scopes jsonb
)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  current_course_id uuid;
begin
  if jsonb_typeof(p_course) is distinct from 'object' then
    raise exception 'Course details must be an object.' using errcode = '22023';
  end if;

  if jsonb_typeof(p_scopes) is distinct from 'array' then
    raise exception 'Course scopes must be an array.' using errcode = '22023';
  end if;

  if jsonb_array_length(p_scopes) = 0 then
    raise exception 'At least one course scope is required.' using errcode = '22023';
  end if;

  if nullif(btrim(p_course ->> 'title'), '') is null then
    raise exception 'Course title is required.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_scopes) as requested(scope)
    where coalesce(requested.scope ->> 'scope_type', '') not in ('shared', 'department', 'program')
      or (
        requested.scope ->> 'scope_type' = 'shared'
        and (
          nullif(btrim(requested.scope ->> 'department'), '') is not null
          or nullif(requested.scope ->> 'program_id', '') is not null
        )
      )
      or (
        requested.scope ->> 'scope_type' = 'department'
        and (
          nullif(btrim(requested.scope ->> 'department'), '') is null
          or nullif(requested.scope ->> 'program_id', '') is not null
        )
      )
      or (
        requested.scope ->> 'scope_type' = 'program'
        and (
          nullif(requested.scope ->> 'department', '') is not null
          or nullif(requested.scope ->> 'program_id', '') is null
        )
      )
  ) then
    raise exception 'Course scopes are invalid.' using errcode = '22023';
  end if;

  select id
  into current_course_id
  from public.course_catalog
  where id = p_course_id and is_active = true
  for update;

  if current_course_id is null then
    return false;
  end if;

  update public.course_catalog
  set code = coalesce(p_course ->> 'code', ''),
      title = btrim(p_course ->> 'title'),
      units = coalesce(nullif(p_course ->> 'units', ''), '0')::numeric,
      lec = coalesce(nullif(p_course ->> 'lec', ''), '0')::numeric,
      lab = coalesce(nullif(p_course ->> 'lab', ''), '0')::numeric,
      type = coalesce(nullif(btrim(p_course ->> 'type'), ''), 'Professional'),
      prerequisites = coalesce(nullif(btrim(p_course ->> 'prerequisites'), ''), 'None'),
      description = coalesce(p_course ->> 'description', ''),
      updated_at = now()
  where id = p_course_id;

  delete from public.course_catalog_scopes
  where course_id = p_course_id;

  insert into public.course_catalog_scopes (
    course_id,
    scope_type,
    department,
    program_id
  )
  select
    p_course_id,
    requested.scope ->> 'scope_type',
    nullif(btrim(requested.scope ->> 'department'), ''),
    nullif(requested.scope ->> 'program_id', '')::uuid
  from jsonb_array_elements(p_scopes) as requested(scope);

  return true;
end;
$$;

revoke all on function public.update_course_catalog_entry(uuid, jsonb, jsonb) from public;
revoke all on function public.update_course_catalog_entry(uuid, jsonb, jsonb) from anon, authenticated;
grant execute on function public.update_course_catalog_entry(uuid, jsonb, jsonb) to service_role;