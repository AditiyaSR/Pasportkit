-- PassportKit RLS policies
-- Safe to run multiple times after setup_all.sql.
-- Server-side APIs use the service role key. Client-side reads are scoped by these policies.

alter table passports enable row level security;
alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table workspace_invites enable row level security;
alter table subscriptions enable row level security;
alter table billing_events enable row level security;
alter table passport_events enable row level security;
alter table shopify_connections enable row level security;
alter table shopify_imports enable row level security;
alter table email_logs enable row level security;
alter table ai_logs enable row level security;
alter table email_preferences enable row level security;
alter table shopify_sync_logs enable row level security;

drop policy if exists "public_read_published" on passports;
drop policy if exists "Public can read published passports" on passports;
drop policy if exists "Public passports are viewable by everyone" on passports;
create policy "Public can read published passports"
on passports
for select
using (status = 'published' and visibility = 'public');

drop policy if exists "anon_insert" on passports;
create policy "Guests can create passports"
on passports
for insert
with check (workspace_id is null and user_id is null);

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
  or (auth.uid() = user_id and workspace_id is null)
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
drop policy if exists "update_with_token" on passports;
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

-- Admin access note:
-- Super-admin global reads should be implemented through server-side API routes
-- that check profiles.is_super_admin before using the service role key. Do not
-- expose service role credentials to the browser.
