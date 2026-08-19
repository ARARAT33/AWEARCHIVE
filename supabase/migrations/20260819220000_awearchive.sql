create extension if not exists pgcrypto;
create table if not exists public.admins(user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now());
alter table public.admins enable row level security;
grant select on public.admins to authenticated;
drop policy if exists "admin self read" on public.admins;
create policy "admin self read" on public.admins for select to authenticated using((select auth.uid())=user_id);
create table if not exists public.archive_items (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique,
 title text not null,
 description text not null default '',
 item_type text not null check (item_type in ('file','video','image','webpage','other')),
 source_url text not null,
 proxy_url text,
 download_url text,
 embed_url text,
 thumbnail_url text,
 tags text[] not null default '{}',
 status text not null default 'active' check (status in ('active','archived','hidden')),
 metadata jsonb not null default '{}',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.archive_items enable row level security;
grant select on public.archive_items to anon, authenticated;
grant insert,update,delete on public.archive_items to authenticated;
drop policy if exists "public read active archive" on public.archive_items;
create policy "public read active archive" on public.archive_items for select to anon,authenticated using(status='active');
create or replace function public.is_archive_admin() returns boolean language sql stable security invoker set search_path=public as $$ select exists(select 1 from public.admins where user_id=(select auth.uid())); $$;
create policy "admins write archive" on public.archive_items for insert to authenticated with check(public.is_archive_admin());
create policy "admins update archive" on public.archive_items for update to authenticated using(public.is_archive_admin()) with check(public.is_archive_admin());
create policy "admins delete archive" on public.archive_items for delete to authenticated using(public.is_archive_admin());
create index if not exists archive_items_tags_gin on public.archive_items using gin(tags);
create index if not exists archive_items_type on public.archive_items(item_type);
create index if not exists archive_items_created on public.archive_items(created_at desc);
create or replace function public.touch_archive_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists archive_items_touch on public.archive_items;
create trigger archive_items_touch before update on public.archive_items for each row execute function public.touch_archive_updated_at();