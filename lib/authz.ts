import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function requireBusinessMembership(businessId: string) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: membership } = await supabase
    .from('business_users')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) redirect('/');

  return { supabase, user, role: membership.role as 'owner' | 'staff' };
}

export async function requireOwner(businessId: string) {
  const membership = await requireBusinessMembership(businessId);
  if (membership.role !== 'owner') {
    throw new Error('Owner role required.');
  }
  return membership;
}
