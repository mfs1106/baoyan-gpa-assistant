-- 保研绩点助手：云端账号、数据快照与私有文件的最小生产 Schema。
-- 在 Supabase Dashboard 的 SQL Editor 中完整执行一次。

create table if not exists public.user_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{"version":1}',
  updated_at timestamptz not null default now()
);

alter table public.user_snapshots enable row level security;
grant select, insert, update, delete on public.user_snapshots to authenticated;

create policy "Users manage only their own snapshot"
on public.user_snapshots
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create table if not exists public.user_files (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null check (category in ('grade-excel', 'timetable-excel', 'ranking-proof')),
  size bigint not null check (size >= 0),
  meta jsonb not null default '{}',
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists user_files_user_id_created_at_idx on public.user_files (user_id, created_at desc);
alter table public.user_files enable row level security;
grant select, insert, update, delete on public.user_files to authenticated;

create policy "Users manage only their own file metadata"
on public.user_files
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- 在 Storage 页面新建一个私有 bucket，名称必须是 user-files；不要勾选 Public。
insert into storage.buckets (id, name, public)
values ('user-files', 'user-files', false)
on conflict (id) do nothing;

create policy "Users upload only to their own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'user-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users read only their own files"
on storage.objects for select to authenticated
using (
  bucket_id = 'user-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users update only their own files"
on storage.objects for update to authenticated
using (
  bucket_id = 'user-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'user-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users delete only their own files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'user-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
