-- Run once in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('book', 'film')),
  title text not null,
  creator text not null default '',
  cast_members text not null default '',
  release_date date,
  genre text not null default '',
  viewed_at date,
  description text not null default '',
  quote text not null default '',
  reflection text not null default '',
  cover_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scene_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.media_items(id) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now()
);

alter table public.media_items enable row level security;
alter table public.scene_images enable row level security;

create policy "public read media" on public.media_items for select using (true);
create policy "admin insert media" on public.media_items for insert to authenticated with check ((auth.jwt() ->> 'email') = '864164927@qq.com');
create policy "admin update media" on public.media_items for update to authenticated using ((auth.jwt() ->> 'email') = '864164927@qq.com') with check ((auth.jwt() ->> 'email') = '864164927@qq.com');
create policy "admin delete media" on public.media_items for delete to authenticated using ((auth.jwt() ->> 'email') = '864164927@qq.com');
create policy "public read scenes" on public.scene_images for select using (true);
create policy "admin insert scenes" on public.scene_images for insert to authenticated with check ((auth.jwt() ->> 'email') = '864164927@qq.com');
create policy "admin delete scenes" on public.scene_images for delete to authenticated using ((auth.jwt() ->> 'email') = '864164927@qq.com');

insert into storage.buckets (id, name, public) values ('media-assets', 'media-assets', true) on conflict (id) do update set public = true;
create policy "public read media assets" on storage.objects for select using (bucket_id = 'media-assets');
create policy "admin upload media assets" on storage.objects for insert to authenticated with check (bucket_id = 'media-assets' and (auth.jwt() ->> 'email') = '864164927@qq.com');
create policy "admin update media assets" on storage.objects for update to authenticated using (bucket_id = 'media-assets' and (auth.jwt() ->> 'email') = '864164927@qq.com');
create policy "admin delete media assets" on storage.objects for delete to authenticated using (bucket_id = 'media-assets' and (auth.jwt() ->> 'email') = '864164927@qq.com');

grant select on public.media_items, public.scene_images to anon;
grant select, insert, update, delete on public.media_items, public.scene_images to authenticated;
