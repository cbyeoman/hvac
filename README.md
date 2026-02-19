# Margin Lock

Multi-tenant SaaS web app for HVAC pricing discipline. Built with Next.js 14 App Router, TypeScript, Tailwind, and Supabase.

## Features

- Multi-tenant routing under `/b/[businessId]/...`.
- Server-side only pricing engine with immutable settings snapshot stored on quote creation.
- Owner-only settings updates.
- Quote creation with override reason requirements, reprice action, and CSV export.
- Dashboard metrics (MTD/YTD revenue, quote metrics, override rates).
- Supabase SQL schema with Row Level Security policies.

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Apply SQL schema in Supabase SQL editor:
   - `supabase/schema.sql`
3. Run locally:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`.

## Validation and Calculation Rules

- Monetary columns use `numeric(12,2)` (or `numeric(10,2)` for `helper_hourly` per schema request).
- Percent columns use `numeric(6,4)`.
- Hours use `numeric(6,2)`.
- Calculations are done with `decimal.js` to avoid float precision issues.
- Internal math keeps 4 decimal precision and money is rounded to 2 decimals at storage boundaries.

## Deployment

- Vercel-ready via standard Next.js build/start scripts.
- Configure environment variables in Vercel project settings.
