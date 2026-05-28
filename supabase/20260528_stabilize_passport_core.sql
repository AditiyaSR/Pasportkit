-- PassportKit core passport flow stabilization
-- Safe to run multiple times.

alter table passports enable row level security;

drop policy if exists "public_read_published" on passports;
drop policy if exists "Public can read published passports" on passports;
drop policy if exists "Public passports are viewable by everyone" on passports;

create policy "Public can read published passports"
on passports
for select
using (
  status = 'published'
  and visibility = 'public'
);

drop policy if exists "Users can read passports in their workspace" on passports;

create policy "Users can read passports in their workspace"
on passports
for select
using (
  exists (
    select 1
    from workspace_members
    where workspace_members.workspace_id = passports.workspace_id
      and workspace_members.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert passports in their workspace" on passports;

create policy "Users can insert passports in their workspace"
on passports
for insert
with check (
  workspace_id is null
  or exists (
    select 1
    from workspace_members
    where workspace_members.workspace_id = passports.workspace_id
      and workspace_members.user_id = auth.uid()
      and workspace_members.role in ('owner', 'admin', 'member')
  )
);

drop policy if exists "Users can update passports in their workspace" on passports;

create policy "Users can update passports in their workspace"
on passports
for update
using (
  exists (
    select 1
    from workspace_members
    where workspace_members.workspace_id = passports.workspace_id
      and workspace_members.user_id = auth.uid()
      and workspace_members.role in ('owner', 'admin', 'member')
  )
)
with check (
  exists (
    select 1
    from workspace_members
    where workspace_members.workspace_id = passports.workspace_id
      and workspace_members.user_id = auth.uid()
      and workspace_members.role in ('owner', 'admin', 'member')
  )
);

alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;

drop policy if exists "Users can read own profile" on profiles;
create policy "Users can read own profile"
on profiles
for select
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
on profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can read own workspace memberships" on workspace_members;
drop policy if exists "Users can read members of their workspaces" on workspace_members;
create policy "Users can read own workspace memberships"
on workspace_members
for select
using (auth.uid() = user_id);

drop policy if exists "Users can read workspaces they belong to" on workspaces;
create policy "Users can read workspaces they belong to"
on workspaces
for select
using (
  exists (
    select 1
    from workspace_members
    where workspace_members.workspace_id = workspaces.id
      and workspace_members.user_id = auth.uid()
  )
);
