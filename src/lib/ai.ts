import OpenAI from 'openai';
import { getServiceSupabase } from './supabase';

export function isAiConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function generatePassportSuggestions(inputData: any, workspaceId: string, userId: string) {
  const openai = getOpenAI();
  if (!openai) throw new Error('AI is not configured');

  const systemPrompt = `You are a compliance-aware assistant for generating product passports.
You will be provided with some basic product details. Suggest missing fields for a product passport.
Rules:
- NEVER claim legal compliance.
- Output ONLY valid JSON matching this structure:
{
  "care_instructions": "string",
  "safety_warnings": "string",
  "repair_info": "string",
  "recycling_info": "string",
  "warranty_info": "string",
  "missing_fields": ["string"],
  "confidence_notes": "string",
  "disclaimer": "AI suggestions are drafts and must be reviewed by the brand owner or a qualified professional."
}
Be realistic, safe, and professional based on the product type.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(inputData) }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  });

  const content = response.choices[0]?.message?.content || '{}';
  const output = JSON.parse(content);

  // Log
  const supabase = getServiceSupabase();
  await supabase.from('ai_logs').insert({
    workspace_id: workspaceId,
    user_id: userId,
    action: 'suggest-passport-fields',
    input: inputData,
    output
  });

  return output;
}
