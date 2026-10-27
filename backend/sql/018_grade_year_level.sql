alter table if exists public.student_grades
  add column if not exists year_level text;
