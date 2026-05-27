import type { PassportRecord, DataQualityResult } from './types';

// ============================================================
// Data Quality Score (0–100)
// ============================================================

interface ScoreGroup {
  label: string;
  maxPoints: number;
  fields: { key: keyof PassportRecord; label: string }[];
}

const SCORE_GROUPS: ScoreGroup[] = [
  {
    label: 'Product identity',
    maxPoints: 15,
    fields: [
      { key: 'brand_name', label: 'Brand name' },
      { key: 'product_name', label: 'Product name' },
      { key: 'category', label: 'Category' },
      { key: 'sku', label: 'SKU' },
      { key: 'model', label: 'Model' },
      { key: 'product_image_url', label: 'Product image' },
    ],
  },
  {
    label: 'Materials & composition',
    maxPoints: 15,
    fields: [
      { key: 'materials', label: 'Materials' },
      { key: 'composition', label: 'Composition' },
      { key: 'recycled_content', label: 'Recycled content' },
    ],
  },
  {
    label: 'Origin & traceability',
    maxPoints: 15,
    fields: [
      { key: 'country_of_origin', label: 'Country of origin' },
      { key: 'production_country', label: 'Production country' },
      { key: 'manufacturer_name', label: 'Manufacturer name' },
    ],
  },
  {
    label: 'Economic operator / contact',
    maxPoints: 10,
    fields: [
      { key: 'manufacturer_contact', label: 'Manufacturer contact' },
      { key: 'responsible_person_contact', label: 'Responsible person contact' },
    ],
  },
  {
    label: 'Care, use & safety',
    maxPoints: 15,
    fields: [
      { key: 'care_instructions', label: 'Care instructions' },
      { key: 'safety_warnings', label: 'Safety warnings' },
      { key: 'instructions_for_use', label: 'Instructions for use' },
    ],
  },
  {
    label: 'Repair, recycle & end-of-life',
    maxPoints: 10,
    fields: [
      { key: 'repair_info', label: 'Repair information' },
      { key: 'recycling_info', label: 'Recycling information' },
      { key: 'end_of_life_info', label: 'End-of-life information' },
    ],
  },
  {
    label: 'Warranty & support',
    maxPoints: 5,
    fields: [
      { key: 'warranty_info', label: 'Warranty information' },
      { key: 'support_email', label: 'Support email' },
    ],
  },
  {
    label: 'Regulatory readiness',
    maxPoints: 10,
    fields: [
      { key: 'gpsr_notes', label: 'GPSR notes' },
      { key: 'dpp_readiness_notes', label: 'DPP readiness notes' },
    ],
  },
  {
    label: 'Meta / freshness',
    maxPoints: 5,
    fields: [
      { key: 'last_updated', label: 'Last updated date' },
      { key: 'product_page_url', label: 'Product page URL' },
    ],
  },
];

function fieldHasValue(record: PassportRecord, key: keyof PassportRecord): boolean {
  const val = record[key];
  if (val === undefined || val === null) return false;
  if (typeof val === 'string') return val.trim().length > 0;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'number') return val > 0;
  if (typeof val === 'boolean') return true;
  return !!val;
}

export function calculateDataQuality(record: PassportRecord): DataQualityResult {
  let totalScore = 0;
  const missing: string[] = [];
  const complete: string[] = [];
  const warnings: string[] = [];

  for (const group of SCORE_GROUPS) {
    const filledCount = group.fields.filter((f) =>
      fieldHasValue(record, f.key)
    ).length;
    const ratio = group.fields.length > 0 ? filledCount / group.fields.length : 0;
    const groupScore = Math.round(ratio * group.maxPoints);
    totalScore += groupScore;

    for (const f of group.fields) {
      if (fieldHasValue(record, f.key)) {
        complete.push(f.label);
      } else {
        missing.push(f.label);
      }
    }
  }

  // Clamp
  totalScore = Math.min(100, Math.max(0, totalScore));

  // Determine level
  let level: string;
  if (totalScore >= 80) level = 'strong';
  else if (totalScore >= 60) level = 'good';
  else if (totalScore >= 40) level = 'basic';
  else level = 'incomplete';

  // Add warnings based on category
  if (!record.brand_name || !record.product_name) {
    warnings.push('Brand name and product name are required.');
  }
  if (!record.manufacturer_contact && !record.responsible_person_contact) {
    warnings.push('No economic operator or manufacturer contact provided. GPSR may require this for covered consumer products sold in the EU.');
  }
  if (!record.care_instructions && record.product_category_module === 'textile') {
    warnings.push('Textile products typically need care instructions.');
  }

  return { score: totalScore, level, missing, warnings, complete };
}

export function getScoreLabel(level: string): string {
  switch (level) {
    case 'strong': return 'Strong transparency page';
    case 'good': return 'Good starter passport';
    case 'basic': return 'Basic draft';
    case 'incomplete': return 'Incomplete';
    default: return 'Needs review';
  }
}

export function getScoreColor(level: string): string {
  switch (level) {
    case 'strong': return '#4F6F52';
    case 'good': return '#6B7D4F';
    case 'basic': return '#B7791F';
    case 'incomplete': return '#B91C1C';
    default: return '#6B665C';
  }
}
