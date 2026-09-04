-- Allow grades: 1, 2, 3, INC, 5 (store as text so INC is valid).
alter table if exists public.student_grades
  alter column grade type text using grade::text;
