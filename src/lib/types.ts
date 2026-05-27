// ============================================================
// PassportKit — Core Types
// ============================================================

export interface PassportRecord {
  id?: string;
  slug: string;
  edit_token?: string;

  // Core identity
  brand_name: string;
  product_name: string;
  category: string;
  product_type: string;
  sku: string;
  model: string;
  batch_number: string;
  serial_number: string;
  gtin: string;
  product_page_url: string;
  product_image_url: string;

  // Market
  target_markets: string[];
  product_category_module: string;

  // Materials
  materials: string;
  composition: string;
  components: ComponentItem[];
  substances_of_concern: string;
  recycled_content: string;
  packaging_materials: string;

  // Origin
  country_of_origin: string;
  production_country: string;
  supplier_name: string;
  manufacturer_name: string;
  manufacturer_contact: string;
  importer_contact: string;
  responsible_person_contact: string;
  economic_operator_contact: string;

  // Care / safety
  care_instructions: string;
  instructions_for_use: string;
  safety_warnings: string;
  age_warning: string;
  foreseeable_misuse: string;
  risk_notes: string;

  // Circularity
  repair_info: string;
  spare_parts_info: string;
  durability_notes: string;
  recycling_info: string;
  end_of_life_info: string;
  takeback_info: string;
  resale_info: string;

  // Warranty
  warranty_info: string;
  support_email: string;
  support_url: string;

  // Regulatory
  gpsr_notes: string;
  dpp_readiness_notes: string;
  textile_label_notes: string;
  reach_svhc_notes: string;
  packaging_ppwr_notes: string;
  eudr_watch_notes: string;
  ce_marking_warning: string;
  battery_passport_warning: string;

  // Status
  visibility: 'public' | 'private';
  status: 'draft' | 'published';
  data_quality_score: number;
  readiness_level: string;
  watermark: boolean;

  // Dates
  last_updated: string;
  created_at?: string;
  updated_at?: string;
}

export interface ComponentItem {
  name: string;
  material: string;
  weight_pct?: string;
}

export type CategoryModule =
  | 'general'
  | 'textile'
  | 'fashion'
  | 'leather_goods'
  | 'furniture'
  | 'homeware'
  | 'packaging'
  | 'electronics_warning_only'
  | 'battery_warning_only'
  | 'wood_eudr_watch';

export interface CreatePassportResponse {
  id: string;
  slug: string;
  publicUrl: string;
  editUrl: string;
  edit_token: string;
}

export interface DataQualityResult {
  score: number;
  level: string;
  missing: string[];
  warnings: string[];
  complete: string[];
}

export const EMPTY_PASSPORT: Omit<PassportRecord, 'slug' | 'edit_token'> = {
  brand_name: '',
  product_name: '',
  category: '',
  product_type: '',
  sku: '',
  model: '',
  batch_number: '',
  serial_number: '',
  gtin: '',
  product_page_url: '',
  product_image_url: '',
  target_markets: [],
  product_category_module: 'general',
  materials: '',
  composition: '',
  components: [],
  substances_of_concern: '',
  recycled_content: '',
  packaging_materials: '',
  country_of_origin: '',
  production_country: '',
  supplier_name: '',
  manufacturer_name: '',
  manufacturer_contact: '',
  importer_contact: '',
  responsible_person_contact: '',
  economic_operator_contact: '',
  care_instructions: '',
  instructions_for_use: '',
  safety_warnings: '',
  age_warning: '',
  foreseeable_misuse: '',
  risk_notes: '',
  repair_info: '',
  spare_parts_info: '',
  durability_notes: '',
  recycling_info: '',
  end_of_life_info: '',
  takeback_info: '',
  resale_info: '',
  warranty_info: '',
  support_email: '',
  support_url: '',
  gpsr_notes: '',
  dpp_readiness_notes: '',
  textile_label_notes: '',
  reach_svhc_notes: '',
  packaging_ppwr_notes: '',
  eudr_watch_notes: '',
  ce_marking_warning: '',
  battery_passport_warning: '',
  visibility: 'public',
  status: 'draft',
  data_quality_score: 0,
  readiness_level: 'needs_review',
  watermark: true,
  last_updated: new Date().toISOString().split('T')[0],
};
