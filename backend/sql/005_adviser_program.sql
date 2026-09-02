-- Add program assignment for advisers / staff coverage.
alter table if exists public.adviser_info
  add column if not exists program text;
