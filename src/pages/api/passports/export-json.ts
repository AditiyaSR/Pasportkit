import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase is not configured.' });
  }

  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Missing slug' });
  }

  try {
    const { data, error } = await supabase
      .from('passports')
      .select('*')
      .eq('slug', slug)
      .eq('visibility', 'public')
      .eq('status', 'published')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Passport not found' });
    }

    // Remove internal fields
    const { edit_token, id, ...exportData } = data;

    // Group into sections
    const grouped = {
      product_identity: {
        brand_name: exportData.brand_name,
        product_name: exportData.product_name,
        category: exportData.category,
        product_type: exportData.product_type,
        sku: exportData.sku,
        model: exportData.model,
        batch_number: exportData.batch_number,
        serial_number: exportData.serial_number,
        gtin: exportData.gtin,
        product_page_url: exportData.product_page_url,
        product_image_url: exportData.product_image_url,
        target_markets: exportData.target_markets,
      },
      materials: {
        materials: exportData.materials,
        composition: exportData.composition,
        components: exportData.components,
        recycled_content: exportData.recycled_content,
        substances_of_concern: exportData.substances_of_concern,
        packaging_materials: exportData.packaging_materials,
      },
      origin: {
        country_of_origin: exportData.country_of_origin,
        production_country: exportData.production_country,
        supplier_name: exportData.supplier_name,
        manufacturer_name: exportData.manufacturer_name,
        manufacturer_contact: exportData.manufacturer_contact,
        importer_contact: exportData.importer_contact,
        responsible_person_contact: exportData.responsible_person_contact,
        economic_operator_contact: exportData.economic_operator_contact,
      },
      care_and_safety: {
        care_instructions: exportData.care_instructions,
        instructions_for_use: exportData.instructions_for_use,
        safety_warnings: exportData.safety_warnings,
        age_warning: exportData.age_warning,
        foreseeable_misuse: exportData.foreseeable_misuse,
        risk_notes: exportData.risk_notes,
      },
      circularity: {
        repair_info: exportData.repair_info,
        spare_parts_info: exportData.spare_parts_info,
        durability_notes: exportData.durability_notes,
        recycling_info: exportData.recycling_info,
        end_of_life_info: exportData.end_of_life_info,
        takeback_info: exportData.takeback_info,
        resale_info: exportData.resale_info,
      },
      warranty_support: {
        warranty_info: exportData.warranty_info,
        support_email: exportData.support_email,
        support_url: exportData.support_url,
      },
      regulatory_readiness: {
        gpsr_notes: exportData.gpsr_notes,
        dpp_readiness_notes: exportData.dpp_readiness_notes,
        textile_label_notes: exportData.textile_label_notes,
        reach_svhc_notes: exportData.reach_svhc_notes,
        packaging_ppwr_notes: exportData.packaging_ppwr_notes,
        eudr_watch_notes: exportData.eudr_watch_notes,
        ce_marking_warning: exportData.ce_marking_warning,
        battery_passport_warning: exportData.battery_passport_warning,
      },
      meta: {
        slug: exportData.slug,
        data_quality_score: exportData.data_quality_score,
        readiness_level: exportData.readiness_level,
        last_updated: exportData.last_updated,
        created_at: exportData.created_at,
        updated_at: exportData.updated_at,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${slug}-passport.json"`);
    return res.status(200).json(grouped);
  } catch (err) {
    console.error('Export JSON error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
