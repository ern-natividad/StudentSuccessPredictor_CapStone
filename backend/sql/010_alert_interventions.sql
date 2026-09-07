-- Early alert interventions, progress events, and admin notifications.

create table if not exists public.alert_interventions (
  id uuid primary key default gen_random_uuid(),
  student_user_id uuid not null references public.users (id) on delete cascade,
  student_info_id uuid,
  student_id text,
  student_name text,
  risk_level text not null default 'Low',
  severity text not null default 'low'
    check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'pending_admin'
    check (status in ('pending_admin', 'acknowledged', 'monitoring', 'improving', 'resolved')),
  escalated_by uuid references public.users (id) on delete set null,
  escalated_at timestamptz not null default now(),
  acknowledged_by uuid references public.users (id) on delete set null,
  acknowledged_at timestamptz,
  latest_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alert_interventions_student_user_unique unique (student_user_id)
);

create index if not exists alert_interventions_status_idx
  on public.alert_interventions (status);

create index if not exists alert_interventions_escalated_at_idx
  on public.alert_interventions (escalated_at desc);

create table if not exists public.alert_intervention_events (
  id uuid primary key default gen_random_uuid(),
  intervention_id uuid not null
    references public.alert_interventions (id) on delete cascade,
  actor_user_id uuid references public.users (id) on delete set null,
  event_type text not null
    check (event_type in ('escalated', 'acknowledged', 'progress_update')),
  status text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists alert_intervention_events_intervention_idx
  on public.alert_intervention_events (intervention_id, created_at desc);

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.users (id) on delete cascade,
  intervention_id uuid
    references public.alert_interventions (id) on delete cascade,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists admin_notifications_admin_unread_idx
  on public.admin_notifications (admin_user_id, is_read, created_at desc);
