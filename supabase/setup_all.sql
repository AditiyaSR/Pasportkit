-- PassportKit full setup
-- Safe to run multiple times in Supabase SQL Editor.
-- Run before rls_policies.sql and storage.sql.

create extension if not exists pgcrypto;

create table if not exists passports (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  edit_token text unique not null,
  brand_name text not null,
  product_name text not null,
  category text default '',
  product_type text default '',
  sku text default '',
  model text default '',
  batch_number text default '',
  serial_number text default '',
  gtin text default '',
  product_page_url text default '',
  product_image_url text default '',
  product_image_path text,
  target_markets text[] default '{}',
  product_category_module text default 'general',
  materials text default '',
  composition text default '',
  components jsonb default '[]',
  substances_of_concern text default '',
  recycled_content text default '',
  packaging_materials text default '',
  country_of_origin text default '',
  production_country text default '',
  supplier_name text default '',
  manufacturer_name text default '',
  manufacturer_contact text default '',
  importer_contact text default '',
  responsible_person_contact text default '',
  economic_operator_contact text default '',
  care_instructions text default '',
  instructions_for_use text default '',
  safety_warnings text default '',
  age_warning text default '',
  foreseeable_misuse text default '',
  risk_notes text default '',
  repair_info text default '',
  spare_parts_info text default '',
  durability_notes text default '',
  recycling_info text default '',
  end_of_life_info text default '',
  takeback_info text default '',
  resale_info text default '',
  warranty_info text default '',
  support_email text default '',
  support_url text default '',
  gpsr_notes text default '',
  dpp_readiness_notes text default '',
  textile_label_notes text default '',
  reach_svhc_notes text default '',
  packaging_ppwr_notes text default '',
  eudr_watch_notes text default '',
  ce_marking_warning text default '',
  battery_passport_warning text default '',
  visibility text default 'public',
  status text default 'draft',
  data_quality_score int default 0,
  readiness_level text default 'needs_review',
  watermark boolean default true,
  last_updated date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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
alter table passports add column if not exists product_image_path text;

create index if not exists idx_passports_slug on passports(slug);
create index if not exists idx_passports_edit_token on passports(edit_token);
create index if not exists idx_passports_workspace_id on passports(workspace_id);
create index if not exists idx_passports_user_id on passports(user_id);
create index if not exists idx_passports_status_visibility on passports(status, visibility);
create index if not exists idx_workspace_members_user_id on workspace_members(user_id);
create index if not exists idx_workspace_members_workspace_id on workspace_members(workspace_id);
create index if not exists idx_passport_events_workspace_id on passport_events(workspace_id);
create index if not exists idx_passport_events_event_type on passport_events(event_type);
