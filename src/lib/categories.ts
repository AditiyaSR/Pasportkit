import type { CategoryModule } from './types';

// ============================================================
// Category Detection
// ============================================================

const CATEGORY_KEYWORDS: Record<CategoryModule, string[]> = {
  textile: ['textile', 'fabric', 'clothing', 'apparel', 't-shirt', 'tee', 'dress', 'shirt', 'pants', 'trousers', 'sweater', 'hoodie', 'coat', 'jacket', 'skirt', 'sock', 'underwear', 'lingerie', 'activewear', 'sportswear', 'footwear', 'shoe', 'scarf', 'hat', 'glove', 'linen', 'cotton', 'wool', 'silk', 'polyester', 'home textile', 'pillow', 'cushion', 'bedding', 'towel', 'curtain', 'blanket'],
  fashion: ['fashion', 'womenswear', 'menswear', 'kidswear', 'accessories', 'jewellery', 'jewelry', 'watch', 'sunglasses', 'belt'],
  leather_goods: ['leather', 'bag', 'handbag', 'wallet', 'purse', 'crossbody', 'tote', 'backpack', 'briefcase', 'satchel'],
  furniture: ['furniture', 'chair', 'table', 'desk', 'shelf', 'cabinet', 'sofa', 'couch', 'bed', 'stool', 'bench', 'wardrobe', 'bookcase'],
  homeware: ['homeware', 'ceramic', 'mug', 'plate', 'bowl', 'vase', 'candle', 'kitchenware', 'glassware', 'pottery', 'stoneware', 'porcelain', 'terracotta'],
  wood_eudr_watch: ['wood', 'wooden', 'timber', 'oak', 'pine', 'walnut', 'teak', 'bamboo', 'rubber', 'cocoa', 'coffee', 'palm', 'cattle', 'soy'],
  packaging: ['packaging', 'box', 'container', 'wrapper', 'carton'],
  electronics_warning_only: ['electronic', 'electrical', 'toy', 'ppe', 'medical device', 'machinery', 'CE', 'radio equipment', 'low voltage'],
  battery_warning_only: ['battery', 'e-bike', 'scooter', 'EV', 'power bank', 'lithium', 'cell', 'accumulator'],
  general: [],
};

export function detectCategoryModule(category: string, productType?: string): CategoryModule {
  const text = `${category} ${productType || ''}`.toLowerCase();

  // Check in priority order (most specific first)
  if (CATEGORY_KEYWORDS.battery_warning_only.some(kw => text.includes(kw.toLowerCase()))) {
    return 'battery_warning_only';
  }
  if (CATEGORY_KEYWORDS.electronics_warning_only.some(kw => text.includes(kw.toLowerCase()))) {
    return 'electronics_warning_only';
  }
  if (CATEGORY_KEYWORDS.leather_goods.some(kw => text.includes(kw.toLowerCase()))) {
    return 'leather_goods';
  }
  if (CATEGORY_KEYWORDS.textile.some(kw => text.includes(kw.toLowerCase()))) {
    return 'textile';
  }
  if (CATEGORY_KEYWORDS.fashion.some(kw => text.includes(kw.toLowerCase()))) {
    return 'fashion';
  }
  if (CATEGORY_KEYWORDS.furniture.some(kw => text.includes(kw.toLowerCase()))) {
    return 'furniture';
  }
  if (CATEGORY_KEYWORDS.wood_eudr_watch.some(kw => text.includes(kw.toLowerCase()))) {
    return 'wood_eudr_watch';
  }
  if (CATEGORY_KEYWORDS.homeware.some(kw => text.includes(kw.toLowerCase()))) {
    return 'homeware';
  }
  if (CATEGORY_KEYWORDS.packaging.some(kw => text.includes(kw.toLowerCase()))) {
    return 'packaging';
  }

  return 'general';
}

export interface ModuleChecklist {
  id: string;
  title: string;
  description: string;
  fields: string[];
  warning?: string;
}

export function getModuleChecklists(module: CategoryModule): ModuleChecklist[] {
  const checklists: ModuleChecklist[] = [];

  // Always show DPP-readiness
  checklists.push({
    id: 'dpp',
    title: 'DPP-readiness / ESPR-style data',
    description: 'Fields relevant to digital product passport readiness under developing EU ESPR requirements.',
    fields: [
      'Unique product identifier (SKU/GTIN)',
      'Materials / composition',
      'Origin / traceability',
      'Manufacturer / economic operator contact',
      'Repairability information',
      'Recycling / end-of-life information',
      'Durability information',
      'Product documentation link',
      'Last updated date',
    ],
  });

  // Always show GPSR-style
  checklists.push({
    id: 'gpsr',
    title: 'GPSR-style online product information',
    description: 'Fields relevant for online product safety information for covered consumer products.',
    fields: [
      'Product identification',
      'Product image',
      'Manufacturer name and contact',
      'EU responsible person / importer / economic operator (if relevant)',
      'Warnings and safety information',
      'Instructions for use',
      'Language / localization note',
      'Online offer information completeness',
    ],
  });

  // Category-specific modules
  if (['textile', 'fashion'].includes(module)) {
    checklists.push({
      id: 'textile',
      title: 'Textile labelling readiness',
      description: 'Fields related to textile composition and labelling.',
      fields: [
        'Fibre composition',
        'Care instructions',
        'Country of manufacturing',
        'Material claims',
        'Recycled content claim note',
        'Repair / recycle notes',
        'Chemical / substances note',
      ],
    });
  }

  if (['leather_goods'].includes(module)) {
    checklists.push({
      id: 'leather',
      title: 'Leather goods readiness',
      description: 'Fields for leather product transparency.',
      fields: [
        'Material / origin information',
        'Care instructions',
        'Repair information',
        'Chemical / substances note',
      ],
    });
    checklists.push({
      id: 'eudr_watch',
      title: 'EUDR watch',
      description: 'Monitor regulatory changes for leather/cattle-related products. Do not assume coverage.',
      fields: [
        'Material source country',
        'Supplier traceability note',
      ],
      warning: 'This is a watchlist prompt, not EUDR due diligence.',
    });
  }

  if (['furniture', 'wood_eudr_watch'].includes(module)) {
    checklists.push({
      id: 'eudr_watch',
      title: 'EUDR watch for wood/timber products',
      description: 'Wood-related products may be monitored under EU Deforestation Regulation.',
      fields: [
        'Wood species / source material',
        'Source country',
        'Supplier traceability note',
        'Geolocation / due diligence note',
      ],
      warning: 'This is a watchlist prompt, not EUDR due diligence.',
    });
  }

  // REACH/SVHC
  checklists.push({
    id: 'reach',
    title: 'REACH / SVHC readiness',
    description: 'Information about substances of concern. PassportKit does not claim REACH compliance.',
    fields: [
      'Substances of concern note',
      'Supplier declaration availability',
      'Material safety note',
      'Chemical restriction awareness',
    ],
  });

  // Packaging / PPWR
  checklists.push({
    id: 'ppwr',
    title: 'Packaging / PPWR readiness',
    description: 'Packaging information. PassportKit does not certify PPWR compliance.',
    fields: [
      'Packaging material',
      'Packaging weight / volume note',
      'Recyclability note',
      'Reusable / compostable / recycled content note',
      'Packaging producer / importer contact note',
    ],
  });

  // Warning modules
  if (module === 'electronics_warning_only') {
    checklists.push({
      id: 'ce_warning',
      title: 'CE-marked product warning',
      description: '',
      fields: ['Product may require CE marking', 'Applicable sector unknown'],
      warning: 'This MVP does not certify CE-marked, electrical, toy, PPE, or medical products. Use this only as a transparency data organizer and consult a qualified compliance professional.',
    });
  }

  if (module === 'battery_warning_only') {
    checklists.push({
      id: 'battery_warning',
      title: 'Battery passport warning',
      description: '',
      fields: ['Battery included', 'Battery type', 'Battery capacity'],
      warning: 'Battery passports have specific EU requirements for certain battery categories. This MVP does not generate certified battery passports.',
    });
  }

  return checklists;
}
