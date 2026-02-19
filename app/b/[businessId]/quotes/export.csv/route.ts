import { requireBusinessMembership } from '@/lib/authz';

export async function GET(_: Request, { params }: { params: { businessId: string } }) {
  const { supabase } = await requireBusinessMembership(params.businessId);

  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('id,created_at,customer_name,type,is_member,true_cost,target_sell_price,final_sell_price,net_margin,override_applied,override_reason')
    .eq('business_id', params.businessId)
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const header = 'id,created_at,customer_name,type,is_member,true_cost,target_sell_price,final_sell_price,net_margin,override_applied,override_reason';
  const rows = (quotes ?? []).map((q) =>
    [q.id, q.created_at, q.customer_name ?? '', q.type, q.is_member, q.true_cost, q.target_sell_price, q.final_sell_price, q.net_margin, q.override_applied, q.override_reason ?? '']
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(',')
  );

  return new Response([header, ...rows].join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="quotes-${params.businessId}.csv"`
    }
  });
}
