-- Add subject_code to student grade records.
alter table if exists public.student_grades
  add column if not exists subject_code text;
