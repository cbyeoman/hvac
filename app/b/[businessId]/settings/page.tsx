import { requireBusinessMembership } from '@/lib/authz';
import { computePricing } from '@/lib/pricing';
import { saveSettingsAction } from '../actions';

const defaults = {
  annual_overhead: 180000,
  billable_hours: 3600,
  owner_salary: 120000,
  helper_hourly: 28,
  payroll_burden_pct: 0.2,
  warranty_reserve_pct: 0.02,
  retail_target_net_margin: 0.22,
  member_target_net_margin: 0.18,
  member_install_discount_pct: 0.05,
  member_service_discount_pct: 0.1
};

export default async function SettingsPage({ params }: { params: { businessId: string } }) {
  const { supabase } = await requireBusinessMembership(params.businessId);

  const { data } = await supabase
    .from('business_settings')
    .select('*')
    .eq('business_id', params.businessId)
    .maybeSingle();

  const values = data ?? defaults;
  const derived = computePricing(values, {
    type: 'service',
    equipment_cost: 0,
    material_cost: 0,
    labor_hours: 1,
    permit_cost: 0,
    subcontract_cost: 0,
    is_member: false
  });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <form action={saveSettingsAction.bind(null, params.businessId)} className="card grid gap-3 md:grid-cols-2">
        {Object.entries(values).filter(([key]) => key !== 'business_id' && !key.endsWith('_at')).map(([key, value]) => (
          <label key={key} className="text-sm">
            <span className="mb-1 block font-medium">{key === 'billable_hours' ? 'Total company billable hours per year (sum across all field staff).' : key}</span>
            <input className="input" name={key} type="number" step="0.0001" defaultValue={String(value)} required />
          </label>
        ))}
        <button className="button md:col-span-2" type="submit">Save settings</button>
      </form>
      <div className="card grid gap-2 text-sm md:grid-cols-2">
        <p>Overhead per hour: ${derived.overheadPerHour.toFixed(2)}</p>
        <p>Owner recovery per hour: ${derived.ownerRecoveryPerHour.toFixed(2)}</p>
        <p>True labor rate: ${derived.trueLaborRate.toFixed(2)}</p>
        <p>Retail multiplier: {derived.retailMultiplier.toFixed(4)}</p>
        <p>Member multiplier: {derived.memberMultiplier.toFixed(4)}</p>
        {derived.ownerRecoveryPerHour.greaterThan(120) && <p className="font-semibold text-red-600">Warning: owner recovery exceeds $120/hr and may be misconfigured.</p>}
      </div>
    </section>
  );
}
