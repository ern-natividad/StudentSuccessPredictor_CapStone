-- Add school_year so grades can be assigned to an academic year (e.g. 2025-2026).
alter table if exists public.student_grades
  add column if not exists school_year text;

-- Optional: backfill legacy rows from created_at (June–May academic year).
update public.student_grades
set school_year = case
  when extract(month from created_at) >= 6 then
    extract(year from created_at)::int::text
    || '-'
    || (extract(year from created_at)::int + 1)::text
  else
    (extract(year from created_at)::int - 1)::text
    || '-'
    || extract(year from created_at)::int::text
end
where school_year is null
  and created_at is not null;
