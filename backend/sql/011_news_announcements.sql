-- News & Announcements / Ads for the public Home page and Admin management.

create table if not exists public.news_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  image_url text,
  action_link text,
  is_active boolean not null default true,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_announcements_active_created_idx
  on public.news_announcements (is_active, created_at desc);

drop trigger if exists trg_news_announcements_updated_at on public.news_announcements;
create trigger trg_news_announcements_updated_at
  before update on public.news_announcements
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.news_announcements enable row level security;

drop policy if exists news_announcements_select_active on public.news_announcements;
create policy news_announcements_select_active
  on public.news_announcements
  for select
  to anon, authenticated
  using (is_active = true);

-- Direct client writes only when the Supabase Auth user maps to an admin in public.users.
-- Express admin CRUD uses the service-role key (bypasses RLS) and requireRole("admin").
drop policy if exists news_announcements_admin_all on public.news_announcements;
create policy news_announcements_admin_all
  on public.news_announcements
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'admin'
    )
  );
