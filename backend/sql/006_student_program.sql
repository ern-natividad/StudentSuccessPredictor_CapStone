-- Add program assignment for students (which engineering program they belong to).
alter table if exists public.student_info
  add column if not exists program text;
