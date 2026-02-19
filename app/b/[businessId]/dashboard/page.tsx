import Decimal from 'decimal.js';
import { requireBusinessMembership } from '@/lib/authz';
import { createRevenueEntryAction } from '../actions';

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function startOfYear() {
  const now = new Date();
  return new Date(now.getFullYear(), 0, 1).toISOString();
}

export default async function DashboardPage({ params }: { params: { businessId: string } }) {
  const { supabase } = await requireBusinessMembership(params.businessId);

  const monthStart = startOfMonth();
  const yearStart = startOfYear();

  const [{ data: revenue }, { data: monthQuotes }] = await Promise.all([
    supabase.from('revenue_entries').select('amount,date').eq('business_id', params.businessId).gte('date', yearStart.slice(0, 10)),
    supabase.from('quotes').select('id,created_at,net_margin,override_applied,final_sell_price').eq('business_id', params.businessId).gte('created_at', monthStart)
  ]);

  const mtdRevenue = (revenue ?? [])
    .filter((r) => r.date >= monthStart.slice(0, 10))
    .reduce((sum, r) => sum.plus(new Decimal(r.amount)), new Decimal(0));
  const ytdRevenue = (revenue ?? []).reduce((sum, r) => sum.plus(new Decimal(r.amount)), new Decimal(0));

  const quoteCount = monthQuotes?.length ?? 0;
  const totalMargin = (monthQuotes ?? []).reduce((sum, q) => sum.plus(new Decimal(q.net_margin)), new Decimal(0));
  const avgMargin = quoteCount ? totalMargin.div(quoteCount) : new Decimal(0);
  const overrideCount = (monthQuotes ?? []).filter((q) => q.override_applied).length;
  const overrideRate = quoteCount ? new Decimal(overrideCount).div(quoteCount).mul(100) : new Decimal(0);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="card">MTD Revenue: ${mtdRevenue.toFixed(2)}</div>
        <div className="card">YTD Revenue: ${ytdRevenue.toFixed(2)}</div>
        <div className="card">Quotes this month: {quoteCount}</div>
        <div className="card">Average margin this month: {avgMargin.mul(100).toFixed(2)}%</div>
        <div className="card">Override count: {overrideCount}</div>
        <div className="card">Override rate: {overrideRate.toFixed(1)}%</div>
      </div>
      <form action={createRevenueEntryAction.bind(null, params.businessId)} className="card grid gap-2 md:grid-cols-4">
        <input className="input" name="date" type="date" required />
        <input className="input" name="amount" type="number" step="0.01" min="0" required placeholder="Amount" />
        <select className="input" name="type"><option value="service">Service</option><option value="install">Install</option></select>
        <button className="button" type="submit">Add revenue entry</button>
      </form>
    </section>
  );
}
