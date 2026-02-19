create extension if not exists pgcrypto;

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists business_users (
  business_id uuid references businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('owner','staff')) not null,
  created_at timestamptz default now(),
  primary key (business_id, user_id)
);

create table if not exists business_settings (
  business_id uuid primary key references businesses(id) on delete cascade,
  annual_overhead numeric(12,2) not null,
  billable_hours numeric(6,2) not null,
  owner_salary numeric(12,2) not null,
  helper_hourly numeric(10,2) not null,
  payroll_burden_pct numeric(6,4) not null,
  warranty_reserve_pct numeric(6,4) not null,
  retail_target_net_margin numeric(6,4) default 0.22,
  member_target_net_margin numeric(6,4) default 0.18,
  member_install_discount_pct numeric(6,4) default 0.05,
  member_service_discount_pct numeric(6,4) default 0.10,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  replaces_quote_id uuid null references quotes(id),
  type text check (type in ('install','service')) not null,
  customer_name text null,
  equipment_cost numeric(12,2) default 0,
  material_cost numeric(12,2) default 0,
  labor_hours numeric(6,2) default 0,
  permit_cost numeric(12,2) default 0,
  subcontract_cost numeric(12,2) default 0,
  is_member boolean default false,
  settings_snapshot jsonb not null,
  true_labor_rate numeric(12,2) not null,
  true_cost numeric(12,2) not null,
  target_multiplier numeric(6,4) not null,
  target_sell_price numeric(12,2) not null,
  final_sell_price numeric(12,2) not null,
  net_margin numeric(6,4) not null,
  override_applied boolean default false,
  override_reason text null,
  override_notes text null,
  created_at timestamptz default now()
);

create table if not exists revenue_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  date date not null,
  amount numeric(12,2) not null,
  type text check (type in ('install','service')) not null,
  created_at timestamptz default now()
);

alter table business_users enable row level security;
alter table business_settings enable row level security;
alter table quotes enable row level security;
alter table revenue_entries enable row level security;

create policy "tenant business_users read" on business_users
for select using (
  exists (
    select 1 from business_users bu
    where bu.business_id = business_users.business_id
    and bu.user_id = auth.uid()
  )
);

create policy "tenant settings access" on business_settings
for all using (
  exists (
    select 1 from business_users bu
    where bu.business_id = business_settings.business_id
    and bu.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from business_users bu
    where bu.business_id = business_settings.business_id
    and bu.user_id = auth.uid()
    and bu.role = 'owner'
  )
);

create policy "tenant quotes access" on quotes
for all using (
  exists (
    select 1 from business_users bu
    where bu.business_id = quotes.business_id
    and bu.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from business_users bu
    where bu.business_id = quotes.business_id
    and bu.user_id = auth.uid()
  )
);

create policy "tenant revenue access" on revenue_entries
for all using (
  exists (
    select 1 from business_users bu
    where bu.business_id = revenue_entries.business_id
    and bu.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from business_users bu
    where bu.business_id = revenue_entries.business_id
    and bu.user_id = auth.uid()
  )
);
