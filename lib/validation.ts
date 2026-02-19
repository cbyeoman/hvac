import { z } from 'zod';

const money = z.coerce.number().min(0).max(9999999999.99);
const pct = z.coerce.number().min(0).max(0.9999);
const hours = z.coerce.number().min(0).max(9999.99);

export const settingsSchema = z.object({
  annual_overhead: money,
  billable_hours: hours.min(0.01),
  owner_salary: money,
  helper_hourly: z.coerce.number().min(0).max(99999999.99),
  payroll_burden_pct: pct,
  warranty_reserve_pct: pct,
  retail_target_net_margin: pct,
  member_target_net_margin: pct,
  member_install_discount_pct: pct,
  member_service_discount_pct: pct
});

export const quoteSchema = z.object({
  type: z.enum(['install', 'service']),
  customer_name: z.string().max(200).optional().nullable(),
  equipment_cost: money,
  material_cost: money,
  labor_hours: hours,
  permit_cost: money,
  subcontract_cost: money,
  is_member: z.coerce.boolean(),
  override_applied: z.coerce.boolean().default(false),
  override_reason: z.string().max(120).optional().nullable(),
  override_notes: z.string().max(1000).optional().nullable(),
  final_sell_price: money.optional()
});

export const revenueSchema = z.object({
  date: z.string(),
  amount: money,
  type: z.enum(['install', 'service'])
});
