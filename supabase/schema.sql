-- ============================================================
-- PassportKit — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create passports table
CREATE TABLE IF NOT EXISTS passports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  edit_token text UNIQUE NOT NULL,

  -- Core identity
  brand_name text NOT NULL,
  product_name text NOT NULL,
  category text DEFAULT '',
  product_type text DEFAULT '',
  sku text DEFAULT '',
  model text DEFAULT '',
  batch_number text DEFAULT '',
  serial_number text DEFAULT '',
  gtin text DEFAULT '',
  product_page_url text DEFAULT '',
  product_image_url text DEFAULT '',

  -- Market / scope
  target_markets text[] DEFAULT '{}',
  product_category_module text DEFAULT 'general',

  -- Materials
  materials text DEFAULT '',
  composition text DEFAULT '',
  components jsonb DEFAULT '[]',
  substances_of_concern text DEFAULT '',
  recycled_content text DEFAULT '',
  packaging_materials text DEFAULT '',

  -- Origin / traceability
  country_of_origin text DEFAULT '',
  production_country text DEFAULT '',
  supplier_name text DEFAULT '',
  manufacturer_name text DEFAULT '',
  manufacturer_contact text DEFAULT '',
  importer_contact text DEFAULT '',
  responsible_person_contact text DEFAULT '',
  economic_operator_contact text DEFAULT '',

  -- Care / use / safety
  care_instructions text DEFAULT '',
  instructions_for_use text DEFAULT '',
  safety_warnings text DEFAULT '',
  age_warning text DEFAULT '',
  foreseeable_misuse text DEFAULT '',
  risk_notes text DEFAULT '',

  -- Circularity
  repair_info text DEFAULT '',
  spare_parts_info text DEFAULT '',
  durability_notes text DEFAULT '',
  recycling_info text DEFAULT '',
  end_of_life_info text DEFAULT '',
  takeback_info text DEFAULT '',
  resale_info text DEFAULT '',

  -- Warranty / support
  warranty_info text DEFAULT '',
  support_email text DEFAULT '',
  support_url text DEFAULT '',

  -- Regulatory readiness
  gpsr_notes text DEFAULT '',
  dpp_readiness_notes text DEFAULT '',
  textile_label_notes text DEFAULT '',
  reach_svhc_notes text DEFAULT '',
  packaging_ppwr_notes text DEFAULT '',
  eudr_watch_notes text DEFAULT '',
  ce_marking_warning text DEFAULT '',
  battery_passport_warning text DEFAULT '',

  -- Status
  visibility text DEFAULT 'public',
  status text DEFAULT 'draft',
  data_quality_score int DEFAULT 0,
  readiness_level text DEFAULT 'needs_review',
  watermark boolean DEFAULT true,

  -- Dates
  last_updated date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_passports_slug ON passports (slug);
CREATE INDEX IF NOT EXISTS idx_passports_edit_token ON passports (edit_token);
CREATE INDEX IF NOT EXISTS idx_passports_category_module ON passports (product_category_module);
CREATE INDEX IF NOT EXISTS idx_passports_created_at ON passports (created_at);

-- Enable Row Level Security
ALTER TABLE passports ENABLE ROW LEVEL SECURITY;

-- Public SELECT: only published + public rows
CREATE POLICY "public_read_published" ON passports
  FOR SELECT
  USING (visibility = 'public' AND status = 'published');

-- Anon INSERT: allow creating new passports
CREATE POLICY "anon_insert" ON passports
  FOR INSERT
  WITH CHECK (true);

-- Server-side UPDATE via API route (service role or matching edit_token)
-- For MVP, allow update with edit_token match
CREATE POLICY "update_with_token" ON passports
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Note: In production, restrict UPDATE to service_role only
-- and use API routes as gatekeepers with edit_token verification.

alter table passports enable row level security;

drop policy if exists "Public can read published passports" on passports;

create policy "Public can read published passports"
on passports
for select
using (
  status = 'published'
  and visibility = 'public'
);
