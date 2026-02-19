import Link from 'next/link';
import { requireBusinessMembership } from '@/lib/authz';

export default async function BusinessLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { businessId: string };
}) {
  await requireBusinessMembership(params.businessId);

  const base = `/b/${params.businessId}`;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-6 flex flex-wrap gap-3">
        <Link className="button" href={`${base}/dashboard`}>Dashboard</Link>
        <Link className="button" href={`${base}/settings`}>Settings</Link>
        <Link className="button" href={`${base}/quotes`}>Quotes</Link>
        <Link className="button" href={`${base}/quotes/new`}>New Quote</Link>
      </header>
      {children}
    </main>
  );
}
