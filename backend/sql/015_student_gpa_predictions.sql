create table if not exists public.student_gpa_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  source_school_year text not null,
  source_semester text not null check (source_semester in ('1', '2', 'Summer')),
  target_school_year text not null,
  target_semester text not null check (target_semester in ('1', '2', 'Summer')),
  current_gwa numeric(4, 2) not null check (current_gwa between 1 and 5),
  predicted_gwa numeric(4, 2) not null check (predicted_gwa between 1 and 5),
  model_predictions jsonb not null,
  selected_model text not null,
  model_version text not null,
  evaluation_metrics jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, target_school_year, target_semester, model_version)
);

create index if not exists idx_student_gpa_predictions_user_id
  on public.student_gpa_predictions (user_id, created_at desc);

drop trigger if exists trg_student_gpa_predictions_updated_at
  on public.student_gpa_predictions;
create trigger trg_student_gpa_predictions_updated_at
  before update on public.student_gpa_predictions
  for each row execute function public.set_updated_at();
