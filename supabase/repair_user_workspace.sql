-- Repair users created during broken signup/workspace creation.
-- Safe to run multiple times. Does not attach orphan passports automatically.

insert into profiles (id, email, full_name, is_super_admin)
select
  users.id,
  users.email,
  coalesce(users.raw_user_meta_data->>'full_name', split_part(users.email, '@', 1), 'User'),
  false
from auth.users users
left join profiles on profiles.id = users.id
where profiles.id is null;

with users_without_workspace as (
  select users.id, users.email
  from auth.users users
  where not exists (
    select 1
    from workspaces
    where workspaces.owner_id = users.id
  )
),
created_workspaces as (
  insert into workspaces (name, slug, owner_id, plan, subscription_status)
  select
    'My Workspace',
    'my-workspace-' || replace(users_without_workspace.id::text, '-', ''),
    users_without_workspace.id,
    'free',
    'free'
  from users_without_workspace
  on conflict (slug) do nothing
  returning id, owner_id
)
insert into workspace_members (workspace_id, user_id, role)
select created_workspaces.id, created_workspaces.owner_id, 'owner'
from created_workspaces
on conflict (workspace_id, user_id) do nothing;

insert into workspace_members (workspace_id, user_id, role)
select workspaces.id, workspaces.owner_id, 'owner'
from workspaces
left join workspace_members
  on workspace_members.workspace_id = workspaces.id
 and workspace_members.user_id = workspaces.owner_id
where workspaces.owner_id is not null
  and workspace_members.id is null
on conflict (workspace_id, user_id) do nothing;

-- Optional orphan passport attachment.
-- Only run after replacing the UUIDs below with an explicit target user/workspace.
--
-- update passports
-- set user_id = '00000000-0000-0000-0000-000000000000',
--     workspace_id = '00000000-0000-0000-0000-000000000000'
-- where workspace_id is null
--   and user_id is null
--   and slug in ('explicit-passport-slug');
