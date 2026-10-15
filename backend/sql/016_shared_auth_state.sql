-- Shared password-reset challenges and API rate limits for multi-instance deployments.

create table if not exists public.password_reset_challenges (
  email_hash text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  verified_user_id uuid references public.users (id) on delete cascade,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.password_reset_challenges enable row level security;
revoke all on public.password_reset_challenges from public, anon, authenticated;
grant all on public.password_reset_challenges to service_role;

create table if not exists public.shared_api_rate_limits (
  scope text not null,
  key_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  updated_at timestamptz not null default now(),
  primary key (scope, key_hash)
);

create index if not exists shared_api_rate_limits_updated_at_idx
  on public.shared_api_rate_limits (updated_at);

alter table public.shared_api_rate_limits enable row level security;
revoke all on public.shared_api_rate_limits from public, anon, authenticated;
grant all on public.shared_api_rate_limits to service_role;

create or replace function public.verify_password_reset_challenge(
  p_email_hash text,
  p_code_hash text,
  p_user_id uuid,
  p_max_attempts integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_challenge public.password_reset_challenges%rowtype;
begin
  if p_email_hash is null or p_email_hash = ''
     or p_code_hash is null or p_code_hash = ''
     or p_user_id is null
     or p_max_attempts is null or p_max_attempts < 1 then
    raise exception 'Invalid password-reset challenge parameters';
  end if;

  select *
  into v_challenge
  from public.password_reset_challenges
  where email_hash = p_email_hash
  for update;

  if not found then
    return false;
  end if;

  if v_challenge.expires_at <= pg_catalog.clock_timestamp() then
    delete from public.password_reset_challenges
    where email_hash = p_email_hash;
    return false;
  end if;

  if v_challenge.verified_user_id is not null then
    return v_challenge.verified_user_id = p_user_id;
  end if;

  if v_challenge.failed_attempts >= p_max_attempts
     or v_challenge.code_hash <> p_code_hash then
    if v_challenge.failed_attempts + 1 >= p_max_attempts then
      delete from public.password_reset_challenges
      where email_hash = p_email_hash;
    else
      update public.password_reset_challenges
      set failed_attempts = failed_attempts + 1
      where email_hash = p_email_hash;
    end if;
    return false;
  end if;

  update public.password_reset_challenges
  set verified_user_id = p_user_id,
      verified_at = pg_catalog.clock_timestamp()
  where email_hash = p_email_hash;

  return true;
end;
$$;

revoke all on function public.verify_password_reset_challenge(text, text, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.verify_password_reset_challenge(text, text, uuid, integer)
  to service_role;

create or replace function public.consume_password_reset_challenge(
  p_email_hash text,
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.password_reset_challenges
  where email_hash = p_email_hash
    and verified_user_id = p_user_id
    and expires_at > pg_catalog.clock_timestamp();

  if found then
    return true;
  end if;

  delete from public.password_reset_challenges
  where email_hash = p_email_hash
    and expires_at <= pg_catalog.clock_timestamp();
  return false;
end;
$$;

revoke all on function public.consume_password_reset_challenge(text, uuid)
  from public, anon, authenticated;
grant execute on function public.consume_password_reset_challenge(text, uuid)
  to service_role;

create or replace function public.consume_shared_rate_limit(
  p_scope text,
  p_key_hash text,
  p_window_ms integer,
  p_max_requests integer
)
returns table (
  allowed boolean,
  request_count integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_started_at timestamptz;
  v_request_count integer;
begin
  if p_scope is null or p_scope = ''
     or p_key_hash is null or p_key_hash = ''
     or p_window_ms is null or p_window_ms < 1000
     or p_max_requests is null or p_max_requests < 1 then
    raise exception 'Invalid rate-limit parameters';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_scope || ':' || p_key_hash, 0)
  );

  v_window_started_at := pg_catalog.to_timestamp(
    pg_catalog.floor(
      extract(epoch from pg_catalog.clock_timestamp()) * 1000
      / p_window_ms
    ) * p_window_ms / 1000.0
  );

  insert into public.shared_api_rate_limits as rate_limit (
    scope,
    key_hash,
    window_started_at,
    request_count,
    updated_at
  )
  values (
    p_scope,
    p_key_hash,
    v_window_started_at,
    1,
    pg_catalog.clock_timestamp()
  )
  on conflict (scope, key_hash) do update
  set window_started_at = excluded.window_started_at,
      request_count = case
    when rate_limit.window_started_at = excluded.window_started_at
      then rate_limit.request_count + 1
        else 1
      end,
      updated_at = pg_catalog.clock_timestamp()
  returning rate_limit.request_count
  into v_request_count;

  return query
  select
    v_request_count <= p_max_requests,
    v_request_count,
    v_window_started_at + (p_window_ms * interval '1 millisecond');
end;
$$;

revoke all on function public.consume_shared_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_shared_rate_limit(text, text, integer, integer)
  to service_role;
