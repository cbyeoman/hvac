import { requireBusinessMembership } from '@/lib/authz';
import { repriceQuoteAction } from '../actions';
import Decimal from 'decimal.js';
import Link from 'next/link';

export default async function QuotesPage({
  params,
  searchParams
}: {
  params: { businessId: string };
  searchParams: { month?: string; type?: string; member?: string; overrides?: string };
}) {
  const { supabase } = await requireBusinessMembership(params.businessId);

  let query = supabase.from('quotes').select('*').eq('business_id', params.businessId).order('created_at', { ascending: false });

  if (searchParams.type) query = query.eq('type', searchParams.type);
  if (searchParams.member === 'yes') query = query.eq('is_member', true);
  if (searchParams.overrides === 'yes') query = query.eq('override_applied', true);
  if (searchParams.month) {
    const start = `${searchParams.month}-01`;
    query = query.gte('created_at', start).lt('created_at', `${searchParams.month}-31`);
  }

  const { data: quotes } = await query;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Quotes</h1>
        <Link className="button" href={`/b/${params.businessId}/quotes/export.csv`}>Export CSV</Link>
      </div>
      <form className="card grid gap-2 md:grid-cols-5">
        <input className="input" type="month" name="month" defaultValue={searchParams.month} />
        <select className="input" name="type" defaultValue={searchParams.type ?? ''}><option value="">All types</option><option value="install">Install</option><option value="service">Service</option></select>
        <select className="input" name="member" defaultValue={searchParams.member ?? ''}><option value="">All</option><option value="yes">Members</option></select>
        <select className="input" name="overrides" defaultValue={searchParams.overrides ?? ''}><option value="">All</option><option value="yes">Overrides only</option></select>
        <button className="button" type="submit">Filter</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr><th>ID</th><th>Customer</th><th>Type</th><th>Final Sell</th><th>Margin</th><th>Actions</th></tr></thead>
          <tbody>
            {quotes?.map((quote) => (
              <tr key={quote.id} className="border-t">
                <td className="py-2">{quote.id.slice(0, 8)}</td>
                <td>{quote.customer_name}</td>
                <td>{quote.type}</td>
                <td>${quote.final_sell_price}</td>
                <td>{new Decimal(quote.net_margin).mul(100).toFixed(2)}%</td>
                <td>
                  <form action={repriceQuoteAction.bind(null, params.businessId, quote.id)}>
                    <button className="text-blue-600 underline" type="submit">Reprice</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
