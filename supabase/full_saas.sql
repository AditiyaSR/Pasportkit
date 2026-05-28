-- full_saas.sql

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  is_super_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  owner_id uuid references auth.users(id) on delete cascade,
  plan text default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default 'free',
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'member',
  created_at timestamptz default now(),
  unique(workspace_id, user_id)
);

create table if not exists workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  email text not null,
  role text default 'member',
  token text unique not null,
  accepted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  plan text,
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists billing_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  stripe_event_id text unique,
  event_type text,
  data jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists passport_events (
  id uuid primary key default gen_random_uuid(),
  passport_id uuid references passports(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists shopify_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  shop_domain text not null,
  access_token text,
  scope text,
  status text default 'connected',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(workspace_id, shop_domain)
);

create table if not exists shopify_imports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  shop_domain text,
  shopify_product_id text,
  title text,
  handle text,
  product_type text,
  vendor text,
  image_url text,
  raw jsonb default '{}',
  passport_id uuid references passports(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists email_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  to_email text,
  template text,
  status text,
  provider_id text,
  error text,
  created_at timestamptz default now()
);

create table if not exists ai_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  action text,
  input jsonb default '{}',
  output jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists email_preferences (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  send_team_invite_email boolean default true,
  send_passport_published_email boolean default true,
  send_billing_issue_email boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists shopify_sync_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  shop_domain text,
  shopify_product_id text,
  passport_id uuid references passports(id) on delete set null,
  action text,
  status text,
  message text,
  created_at timestamptz default now()
);

alter table passports add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table passports add column if not exists workspace_id uuid references workspaces(id) on delete set null;
alter table passports add column if not exists shopify_product_id text;
alter table passports add column if not exists source text default 'manual';
alter table passports add column if not exists plan_snapshot text default 'free';

-- Basic RLS setup for new tables
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

-- We rely primarily on server-side logic for RLS boundaries where possible, 
-- but allow basic authenticated reads for safety:

-- Profiles
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Workspaces
create policy "Users can read workspaces they belong to" on workspaces for select using (
  exists (select 1 from workspace_members where workspace_members.workspace_id = workspaces.id and workspace_members.user_id = auth.uid())
);

-- Workspace members
create policy "Users can read members of their workspaces" on workspace_members for select using (
  exists (select 1 from workspace_members wm where wm.workspace_id = workspace_members.workspace_id and wm.user_id = auth.uid())
);

-- Passports read (existing public policy + workspace policy)
create policy "Users can read passports in their workspace" on passports for select using (
  exists (select 1 from workspace_members where workspace_members.workspace_id = passports.workspace_id and workspace_members.user_id = auth.uid())
);

create policy "Users can update passports in their workspace" on passports for update using (
  exists (select 1 from workspace_members where workspace_members.workspace_id = passports.workspace_id and workspace_members.user_id = auth.uid())
);

create policy "Users can insert passports in their workspace" on passports for insert with check (
  exists (select 1 from workspace_members where workspace_members.workspace_id = passports.workspace_id and workspace_members.user_id = auth.uid())
);

-- Public passports policy already exists or can be ensured here:
-- drop policy if exists "Public passports are viewable by everyone" on passports;
create policy "Public passports are viewable by everyone" on passports
  for select using (status = 'published' AND visibility = 'public');
