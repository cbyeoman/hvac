import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-xl p-8">
        <h1 className="mb-4 text-2xl font-bold">Margin Lock</h1>
        <p className="mb-6">Sign in with Supabase Auth to begin.</p>
      </main>
    );
  }

  const { data: memberships } = await supabase
    .from('business_users')
    .select('business_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (memberships?.business_id) {
    return <Link href={`/b/${memberships.business_id}/dashboard`} className="p-8">Go to your business dashboard</Link>;
  }

  return <main className="mx-auto max-w-xl p-8">No businesses found for your account.</main>;
}
