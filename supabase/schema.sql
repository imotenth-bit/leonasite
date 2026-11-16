-- Supabase Schema & Storage Setup for Maibam Leona Personal Website
-- Run this script once in your Supabase Dashboard -> SQL Editor -> New Query.

-- 1. Main site settings & structured sections (profile, about, categories, education, hobbies, achievements)
create table if not exists public.site_settings (
  id text primary key,
  profile jsonb not null,
  about jsonb not null,
  categories jsonb not null default '["Personal","Family","Friends","Travel","Memories"]'::jsonb,
  education jsonb not null,
  hobbies jsonb not null default '[]'::jsonb,
  achievements jsonb not null,
  updated_at timestamptz not null default now()
);

-- 2. Photo gallery items
create table if not exists public.photos (
  id text primary key,
  title text not null,
  description text not null default '',
  category text not null default 'Personal',
  image_url text not null,
  storage_path text,
  date_taken text not null,
  location text,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

-- 3. Contact form messages
create table if not exists public.contact_messages (
  id text primary key,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  email_delivered boolean not null default false,
  created_at timestamptz not null default now()
);

-- 4. Public storage bucket for uploaded photographs
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

-- 5. Enable Row Level Security (RLS)
alter table public.site_settings enable row level security;
alter table public.photos enable row level security;
alter table public.contact_messages enable row level security;

-- Public read access for published website content & gallery photos
drop policy if exists "Public read site_settings" on public.site_settings;
create policy "Public read site_settings"
  on public.site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Public read photos" on public.photos;
create policy "Public read photos"
  on public.photos for select
  to anon, authenticated
  using (true);

-- Server-side writes via publishable key when SUPABASE_SECRET_KEY is not set
-- Note: For strictest production hardening, set SUPABASE_SECRET_KEY on your server
-- and remove the anon write policies below.
drop policy if exists "Server write site_settings" on public.site_settings;
create policy "Server write site_settings"
  on public.site_settings for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Server write photos" on public.photos;
create policy "Server write photos"
  on public.photos for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Insert contact_messages" on public.contact_messages;
create policy "Insert contact_messages"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Read contact_messages" on public.contact_messages;
create policy "Read contact_messages"
  on public.contact_messages for select
  to anon, authenticated
  using (true);

-- Storage bucket policies for 'photos'
drop policy if exists "Public read photos bucket" on storage.objects;
create policy "Public read photos bucket"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'photos');

drop policy if exists "Upload photos bucket" on storage.objects;
create policy "Upload photos bucket"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'photos');

drop policy if exists "Update photos bucket" on storage.objects;
create policy "Update photos bucket"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'photos');

drop policy if exists "Delete photos bucket" on storage.objects;
create policy "Delete photos bucket"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'photos');
