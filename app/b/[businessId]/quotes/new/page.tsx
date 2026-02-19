import { requireBusinessMembership } from '@/lib/authz';
import { createQuoteAction } from '../../actions';

export default async function NewQuotePage({ params }: { params: { businessId: string } }) {
  await requireBusinessMembership(params.businessId);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">New Quote</h1>
      <form action={createQuoteAction.bind(null, params.businessId)} className="card grid gap-3 md:grid-cols-2">
        <label className="text-sm">Type
          <select name="type" className="input" defaultValue="service">
            <option value="service">Service</option>
            <option value="install">Install</option>
          </select>
        </label>
        <label className="text-sm">Customer name<input className="input" name="customer_name" /></label>
        {['equipment_cost','material_cost','labor_hours','permit_cost','subcontract_cost'].map((field) => (
          <label key={field} className="text-sm">{field}<input className="input" name={field} type="number" step="0.01" defaultValue="0" required /></label>
        ))}
        <label className="flex items-center gap-2 text-sm"><input name="is_member" type="checkbox" />Membership customer</label>
        <div className="md:col-span-2 rounded border p-3 text-sm">
          <p className="mb-2 font-semibold">Override (requires reason, cannot silently reduce margin)</p>
          <label className="mb-2 flex items-center gap-2"><input name="override_applied" type="checkbox" />Apply override</label>
          <label className="mb-2 block">Final sell price<input className="input" name="final_sell_price" type="number" step="0.01" min="0" /></label>
          <label className="mb-2 block">Override reason<input className="input" name="override_reason" /></label>
          <label className="block">Override notes<textarea className="input" name="override_notes" rows={3} /></label>
        </div>
        <button className="button md:col-span-2" type="submit">Create immutable quote snapshot</button>
      </form>
    </section>
  );
}
