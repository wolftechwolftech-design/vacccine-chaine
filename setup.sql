-- ═══════════════════════════════════════
-- VaccineChain Pro — Supabase Setup SQL
-- Run this in Supabase → SQL Editor
-- ═══════════════════════════════════════

-- USERS TABLE
create table if not exists public.users (
  id uuid default gen_random_uuid() primary key,
  nom text not null,
  email text unique not null,
  password text not null,
  role text default 'user' check (role in ('admin','user')),
  created_at timestamptz default now()
);

-- VACCINS TABLE
create table if not exists public.vaccins (
  id uuid default gen_random_uuid() primary key,
  nom text not null,
  lot text,
  quantite integer default 0,
  seuil_min integer default 5,
  peremption date,
  temp text default '+2/+8°C',
  statut text default 'ok',
  created_at timestamptz default now()
);

-- RELEVES TABLE
create table if not exists public.releves (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  heure text not null,
  temp numeric(4,1) not null,
  nom text,
  obs text,
  created_at timestamptz default now()
);

-- DISABLE RLS (simple mode, no auth complexity)
alter table public.users    disable row level security;
alter table public.vaccins  disable row level security;
alter table public.releves  disable row level security;

-- DEFAULT ADMIN USER
insert into public.users (nom, email, password, role) values
  ('Admin Principal',  'admin@issig.tn',  'admin123', 'admin'),
  ('Infirmier Karim',  'karim@issig.tn',  'user123',  'user'),
  ('Infirmier Sonia',  'sonia@issig.tn',  'user123',  'user')
on conflict (email) do nothing;

-- DEFAULT VACCINS
insert into public.vaccins (nom, lot, quantite, seuil_min, peremption, temp, statut) values
  ('BCG',         'BCG-2024-001', 45, 10, '2025-11-15', '+2/+8°C',   'ok'),
  ('ROR',         'ROR-2024-007',  8, 10, '2025-08-20', '+2/+8°C',   'faible'),
  ('DTP-Hib',     'DTP-2024-012', 30, 15, '2026-03-10', '+2/+8°C',   'ok'),
  ('VPO',         'VPO-2024-003',  6, 10, '2025-07-05', '-15/-25°C', 'faible'),
  ('Hépatite B',  'HBV-2024-009', 22, 10, '2026-06-18', '+2/+8°C',   'ok'),
  ('Méningite A', 'MEN-2024-002', 14,  5, '2025-12-01', '+2/+8°C',   'ok')
on conflict do nothing;

-- DEFAULT RELEVES
insert into public.releves (date, heure, temp, nom, obs) values
  ('2025-06-20', '08:00', 4.2, 'Infirmier Karim', 'Normal'),
  ('2025-06-20', '14:00', 4.8, 'Infirmier Sonia', ''),
  ('2025-06-19', '08:00', 7.9, 'Infirmier Karim', 'Légère hausse')
on conflict do nothing;

select 'Setup terminé ✅' as status;
