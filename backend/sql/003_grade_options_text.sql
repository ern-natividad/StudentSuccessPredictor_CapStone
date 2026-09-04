-- Allow grades: 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, INC, 5 (store as text so INC and decimals are valid).
alter table if exists public.student_grades
  alter column grade type text using grade::text;
