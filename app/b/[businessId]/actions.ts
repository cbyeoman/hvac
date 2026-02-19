'use server';

import { revalidatePath } from 'next/cache';
import { requireBusinessMembership, requireOwner } from '@/lib/authz';
import { computePricing } from '@/lib/pricing';
import { quoteSchema, revenueSchema, settingsSchema } from '@/lib/validation';

function toNumberRecord(values: Record<string, FormDataEntryValue | null>) {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    output[key] = typeof value === 'string' ? value : '';
  }
  return output;
}

export async function saveSettingsAction(businessId: string, formData: FormData) {
  const { supabase } = await requireOwner(businessId);
  const parsed = settingsSchema.parse(
    toNumberRecord({
      annual_overhead: formData.get('annual_overhead'),
      billable_hours: formData.get('billable_hours'),
      owner_salary: formData.get('owner_salary'),
      helper_hourly: formData.get('helper_hourly'),
      payroll_burden_pct: formData.get('payroll_burden_pct'),
      warranty_reserve_pct: formData.get('warranty_reserve_pct'),
      retail_target_net_margin: formData.get('retail_target_net_margin'),
      member_target_net_margin: formData.get('member_target_net_margin'),
      member_install_discount_pct: formData.get('member_install_discount_pct'),
      member_service_discount_pct: formData.get('member_service_discount_pct')
    })
  );

  const { error } = await supabase.from('business_settings').upsert({
    business_id: businessId,
    ...parsed
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/b/${businessId}/settings`);
}

export async function createQuoteAction(businessId: string, formData: FormData) {
  const { supabase } = await requireBusinessMembership(businessId);

  const parsed = quoteSchema.parse({
    ...toNumberRecord({
      type: formData.get('type'),
      customer_name: formData.get('customer_name'),
      equipment_cost: formData.get('equipment_cost'),
      material_cost: formData.get('material_cost'),
      labor_hours: formData.get('labor_hours'),
      permit_cost: formData.get('permit_cost'),
      subcontract_cost: formData.get('subcontract_cost'),
      override_reason: formData.get('override_reason'),
      override_notes: formData.get('override_notes'),
      final_sell_price: formData.get('final_sell_price')
    }),
    is_member: formData.get('is_member') === 'on',
    override_applied: formData.get('override_applied') === 'on'
  });

  const { data: settings, error: settingsError } = await supabase
    .from('business_settings')
    .select('*')
    .eq('business_id', businessId)
    .single();

  if (settingsError || !settings) throw new Error('Business settings not configured.');

  const pricing = computePricing(settings, {
    type: parsed.type,
    equipment_cost: parsed.equipment_cost,
    material_cost: parsed.material_cost,
    labor_hours: parsed.labor_hours,
    permit_cost: parsed.permit_cost,
    subcontract_cost: parsed.subcontract_cost,
    is_member: parsed.is_member,
    overrideApplied: parsed.override_applied,
    finalSellPriceOverride: parsed.final_sell_price
  });

  if (parsed.override_applied && (!parsed.override_reason || !parsed.final_sell_price)) {
    throw new Error('Override reason and final sell price are required.');
  }

  const { error } = await supabase.from('quotes').insert({
    business_id: businessId,
    type: parsed.type,
    customer_name: parsed.customer_name,
    equipment_cost: parsed.equipment_cost,
    material_cost: parsed.material_cost,
    labor_hours: parsed.labor_hours,
    permit_cost: parsed.permit_cost,
    subcontract_cost: parsed.subcontract_cost,
    is_member: parsed.is_member,
    settings_snapshot: settings,
    true_labor_rate: pricing.trueLaborRate.toNumber(),
    true_cost: pricing.trueCost.toNumber(),
    target_multiplier: pricing.targetMultiplier.toNumber(),
    target_sell_price: pricing.targetSellPrice.toNumber(),
    final_sell_price: pricing.finalSellPrice.toNumber(),
    net_margin: pricing.netMargin.toNumber(),
    override_applied: parsed.override_applied,
    override_reason: parsed.override_reason,
    override_notes: parsed.override_notes
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/b/${businessId}/quotes`);
  revalidatePath(`/b/${businessId}/dashboard`);
}

export async function repriceQuoteAction(businessId: string, quoteId: string) {
  const { supabase } = await requireBusinessMembership(businessId);

  const [{ data: quote, error: quoteError }, { data: settings, error: settingsError }] = await Promise.all([
    supabase.from('quotes').select('*').eq('id', quoteId).eq('business_id', businessId).single(),
    supabase.from('business_settings').select('*').eq('business_id', businessId).single()
  ]);

  if (quoteError || !quote) throw new Error('Quote not found');
  if (settingsError || !settings) throw new Error('Business settings not found');

  const pricing = computePricing(settings, {
    type: quote.type,
    equipment_cost: quote.equipment_cost,
    material_cost: quote.material_cost,
    labor_hours: quote.labor_hours,
    permit_cost: quote.permit_cost,
    subcontract_cost: quote.subcontract_cost,
    is_member: quote.is_member
  });

  const { error } = await supabase.from('quotes').insert({
    business_id: businessId,
    replaces_quote_id: quote.id,
    type: quote.type,
    customer_name: quote.customer_name,
    equipment_cost: quote.equipment_cost,
    material_cost: quote.material_cost,
    labor_hours: quote.labor_hours,
    permit_cost: quote.permit_cost,
    subcontract_cost: quote.subcontract_cost,
    is_member: quote.is_member,
    settings_snapshot: settings,
    true_labor_rate: pricing.trueLaborRate.toNumber(),
    true_cost: pricing.trueCost.toNumber(),
    target_multiplier: pricing.targetMultiplier.toNumber(),
    target_sell_price: pricing.targetSellPrice.toNumber(),
    final_sell_price: pricing.targetSellPrice.toNumber(),
    net_margin: pricing.netMargin.toNumber(),
    override_applied: false
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/b/${businessId}/quotes`);
}

export async function createRevenueEntryAction(businessId: string, formData: FormData) {
  const { supabase } = await requireBusinessMembership(businessId);

  const parsed = revenueSchema.parse(toNumberRecord({
    date: formData.get('date'),
    amount: formData.get('amount'),
    type: formData.get('type')
  }));

  const { error } = await supabase.from('revenue_entries').insert({
    business_id: businessId,
    ...parsed
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/b/${businessId}/dashboard`);
}
