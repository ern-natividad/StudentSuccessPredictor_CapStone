-- Allow grades: 1, 2, 3, INC, 5 (INC stored as text).
alter table if exists public.student_grades
  alter column grade type text using grade::text;
