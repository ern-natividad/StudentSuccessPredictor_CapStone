-- Prediction fields use public.users in this repository as the student identity table.
alter table if exists public.users
  add column if not exists risk_level text,
  add column if not exists success_rate numeric;

alter table if exists public.students
  add column if not exists risk_level text,
  add column if not exists success_rate numeric;

create unique index if not exists idx_student_grades_prediction_upsert
  on public.student_grades (user_id, subject_code, school_year, semester);

create index if not exists idx_student_grades_user_id
  on public.student_grades (user_id);