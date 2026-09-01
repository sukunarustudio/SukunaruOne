-- ==============================================================================
-- BISNISURANG STUDIO OS - MULTI-TENANT SUPABASE SCHEMA + 115 LICENSE KEYS
-- 25 Single Pro Lifetime + 75 Dual Pro Lifetime + 15 Trial Version 14 Hari
-- ==============================================================================
-- Jalankan skrip ini di Supabase Dashboard -> SQL Editor -> New Query.
-- ==============================================================================

-- 1. TABEL LISENSI USER (LICENSES)
CREATE TABLE IF NOT EXISTS licenses (
  license_key TEXT PRIMARY KEY,
  tier TEXT NOT NULL DEFAULT 'PRO_LIFETIME',
  duration_days INTEGER,
  max_devices INTEGER DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  registered_name TEXT,
  registered_devices JSONB DEFAULT '[]'::jsonb,
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL PENGATURAN BISNIS PER LISENSI (BUSINESS_SETTINGS)
CREATE TABLE IF NOT EXISTS business_settings (
  license_key TEXT PRIMARY KEY REFERENCES licenses(license_key) ON DELETE CASCADE,
  business_name TEXT NOT NULL DEFAULT 'BisnisUrang Studio',
  tagline TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  receipt_header TEXT,
  receipt_footer TEXT,
  bank_account TEXT,
  logo_url TEXT,
  currency TEXT DEFAULT 'IDR',
  invoice_prefix TEXT DEFAULT 'INV-',
  receipt_prefix TEXT DEFAULT 'STR-',
  default_tax_percent NUMERIC DEFAULT 0,
  default_discount_percent NUMERIC DEFAULT 0,
  footer_notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL PELANGGAN (CUSTOMERS) PER LISENSI
CREATE TABLE IF NOT EXISTS customers (
  id TEXT NOT NULL,
  license_key TEXT NOT NULL REFERENCES licenses(license_key) ON DELETE CASCADE,
  name TEXT NOT NULL,
  whatsapp TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  last_transaction_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, license_key)
);
CREATE INDEX IF NOT EXISTS idx_customers_license ON customers(license_key);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(license_key, name);

-- 4. TABEL BAHAN BAKU (MATERIALS) PER LISENSI
CREATE TABLE IF NOT EXISTS materials (
  id TEXT NOT NULL,
  license_key TEXT NOT NULL REFERENCES licenses(license_key) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  category TEXT,
  unit TEXT DEFAULT 'pcs',
  current_stock NUMERIC DEFAULT 0,
  min_stock NUMERIC DEFAULT 0,
  purchase_price NUMERIC DEFAULT 0,
  unit_cost NUMERIC DEFAULT 0,
  supplier TEXT,
  supplier_contact TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, license_key),
  CONSTRAINT uq_material_sku_license UNIQUE (license_key, sku)
);
CREATE INDEX IF NOT EXISTS idx_materials_license ON materials(license_key);

-- 5. TABEL PRODUK & HPP (PRODUCTS) PER LISENSI
CREATE TABLE IF NOT EXISTS products (
  id TEXT NOT NULL,
  license_key TEXT NOT NULL REFERENCES licenses(license_key) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  category TEXT,
  type TEXT DEFAULT 'PHYSICAL',
  selling_price NUMERIC DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  profit NUMERIC DEFAULT 0,
  profit_margin NUMERIC DEFAULT 0,
  margin_percent NUMERIC DEFAULT 0,
  labor_cost NUMERIC DEFAULT 0,
  machine_cost NUMERIC DEFAULT 0,
  other_cost NUMERIC DEFAULT 0,
  track_stock BOOLEAN DEFAULT FALSE,
  min_stock NUMERIC DEFAULT 0,
  current_stock NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  image_path TEXT,
  thumbnail_path TEXT,
  bom_components JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, license_key),
  CONSTRAINT uq_product_sku_license UNIQUE (license_key, sku)
);
CREATE INDEX IF NOT EXISTS idx_products_license ON products(license_key);

-- 6. TABEL PESANAN KERJA / SPK (ORDERS) PER LISENSI
CREATE TABLE IF NOT EXISTS orders (
  id TEXT NOT NULL,
  license_key TEXT NOT NULL REFERENCES licenses(license_key) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  order_date TEXT NOT NULL,
  deadline_date TEXT,
  status TEXT DEFAULT 'BARU',
  payment_status TEXT DEFAULT 'BELUM_BAYAR',
  subtotal NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  remaining_amount NUMERIC DEFAULT 0,
  notes TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  payments JSONB DEFAULT '[]'::jsonb,
  files JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, license_key),
  CONSTRAINT uq_order_number_license UNIQUE (license_key, order_number)
);
CREATE INDEX IF NOT EXISTS idx_orders_license ON orders(license_key);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(license_key, order_date);

-- 7. TABEL TRANSAKSI KASIR POS (TRANSACTIONS) PER LISENSI
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT NOT NULL,
  license_key TEXT NOT NULL REFERENCES licenses(license_key) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL,
  type TEXT DEFAULT 'POS',
  order_id TEXT,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  date TEXT NOT NULL,
  subtotal NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  profit NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  change_amount NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'CASH',
  cashier_name TEXT DEFAULT 'Owner',
  notes TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, license_key),
  CONSTRAINT uq_receipt_number_license UNIQUE (license_key, receipt_number)
);
CREATE INDEX IF NOT EXISTS idx_transactions_license ON transactions(license_key);

-- 8. TABEL PENGELUARAN (EXPENSES) PER LISENSI
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT NOT NULL,
  license_key TEXT NOT NULL REFERENCES licenses(license_key) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date TEXT NOT NULL,
  payment_method TEXT DEFAULT 'CASH',
  reference TEXT,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, license_key)
);
CREATE INDEX IF NOT EXISTS idx_expenses_license ON expenses(license_key);

-- 9. TABEL ARUS KAS / BUKU KAS (FINANCIAL_TRANSACTIONS) PER LISENSI
CREATE TABLE IF NOT EXISTS financial_transactions (
  id TEXT NOT NULL,
  license_key TEXT NOT NULL REFERENCES licenses(license_key) ON DELETE CASCADE,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  reference_number TEXT,
  reference_type TEXT,
  reference_id TEXT,
  payment_method TEXT DEFAULT 'CASH',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, license_key)
);
CREATE INDEX IF NOT EXISTS idx_fin_transactions_license ON financial_transactions(license_key);

-- 10. ROW LEVEL SECURITY (RLS) & POLICIES
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon all on licenses" ON licenses;
CREATE POLICY "Allow anon all on licenses" ON licenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on business_settings" ON business_settings;
CREATE POLICY "Allow anon all on business_settings" ON business_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on customers" ON customers;
CREATE POLICY "Allow anon all on customers" ON customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on materials" ON materials;
CREATE POLICY "Allow anon all on materials" ON materials FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on products" ON products;
CREATE POLICY "Allow anon all on products" ON products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on orders" ON orders;
CREATE POLICY "Allow anon all on orders" ON orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on transactions" ON transactions;
CREATE POLICY "Allow anon all on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on expenses" ON expenses;
CREATE POLICY "Allow anon all on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on financial_transactions" ON financial_transactions;
CREATE POLICY "Allow anon all on financial_transactions" ON financial_transactions FOR ALL USING (true) WITH CHECK (true);

-- 11. INSERT 115 USER LICENSE KEYS SEED DATA (25 Single + 75 Dual + 15 Trial 14-Days)
INSERT INTO licenses (license_key, tier, duration_days, max_devices, status, notes)
VALUES
  ('SKNR-S001-4SXN-Q4CE', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #1 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S002-L8PG-BZRE', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #2 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S003-NTHT-6D9G', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #3 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S004-MM6C-PSEL', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #4 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S005-5SU7-2JN6', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #5 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S006-XDPB-E8HR', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #6 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S007-XNDP-6DJD', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #7 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S008-E2MN-N482', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #8 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S009-AVN6-789B', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #9 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S010-6M87-W7TX', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #10 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S011-UWRH-P9CC', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #11 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S012-R49Q-8T7S', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #12 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S013-ZGCH-U6RH', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #13 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S014-TZU7-6WKT', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #14 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S015-5ZWG-F6AS', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #15 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S016-FAEN-EM6D', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #16 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S017-7YRL-WLHT', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #17 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S018-Y84J-BZG5', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #18 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S019-VKHP-2W2M', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #19 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S020-YKD6-7TLB', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #20 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S021-6JTQ-9TZ6', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #21 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S022-KKMU-RNCZ', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #22 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S023-9PVU-3AEX', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #23 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S024-XZRJ-XT37', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #24 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-S025-58E5-BCZB', 'PRO_SINGLE_1_DEV', NULL, 1, 'ACTIVE', 'Lisensi Single User #25 (Pro Lifetime - Max 1 Perangkat)'),
  ('SKNR-D026-EQWS-BDKL', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #26 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D027-GFJK-Q6SX', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #27 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D028-CVPW-V486', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #28 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D029-P3AV-XHSW', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #29 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D030-Z87X-7VPV', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #30 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D031-2JC8-UBCK', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #31 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D032-6X3V-CUST', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #32 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D033-8RN5-A94T', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #33 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D034-BZFF-TT4T', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #34 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D035-N837-QM3Z', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #35 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D036-K5VY-2CFG', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #36 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D037-S5VT-3W5J', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #37 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D038-38VY-SRXW', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #38 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D039-5W9D-J5LL', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #39 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D040-LBT2-HD3Q', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #40 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D041-KPY5-UCJW', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #41 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D042-KTB8-S8AT', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #42 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D043-LG7A-2GUF', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #43 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D044-RHQW-ULRB', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #44 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D045-CMHJ-TTJY', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #45 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D046-SQCM-ZVBV', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #46 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D047-3LPW-WMRA', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #47 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D048-C7S6-36V8', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #48 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D049-AR7C-BJ2G', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #49 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D050-4U65-A3FS', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #50 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D051-5LCA-BDX3', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #51 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D052-KEYA-LZ43', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #52 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D053-8BV2-49UB', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #53 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D054-DDHW-PDLN', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #54 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D055-ZHLQ-ZNJ8', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #55 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D056-CHE8-4HMY', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #56 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D057-QGGR-R8J3', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #57 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D058-TXMB-MV7G', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #58 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D059-RB97-UXTT', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #59 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D060-3ZX3-J5SJ', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #60 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D061-CALE-Q4D6', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #61 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D062-S8M2-VHSM', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #62 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D063-6658-T5HC', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #63 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D064-HB8C-7FHT', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #64 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D065-APWG-VJ2E', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #65 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D066-EP9B-DR5T', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #66 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D067-VK26-RABZ', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #67 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D068-B4PK-2UKK', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #68 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D069-JQKZ-PDW3', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #69 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D070-HSLP-CDQB', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #70 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D071-83LX-3D9S', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #71 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D072-XZZG-JSML', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #72 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D073-U68V-AT5P', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #73 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D074-2NXY-ESQM', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #74 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D075-SVGS-XL6X', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #75 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D076-UXY2-2RYJ', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #76 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D077-96KY-T5AJ', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #77 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D078-JLUG-KR4Z', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #78 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D079-QU2K-YCLA', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #79 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D080-LP86-B89N', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #80 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D081-44HG-L4NV', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #81 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D082-TB3M-TDKL', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #82 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D083-S5TR-GFQY', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #83 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D084-R785-JRBP', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #84 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D085-YA5B-AWZ7', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #85 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D086-2XQ4-FQ5K', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #86 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D087-NWA6-FBGL', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #87 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D088-TPEW-YCCE', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #88 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D089-79QD-ADJ6', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #89 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D090-ZRNK-ZZ9G', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #90 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D091-MGCL-JC3V', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #91 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D092-4JG9-YF48', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #92 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D093-G2MB-WKJT', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #93 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D094-2DLQ-UMSQ', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #94 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D095-P2RF-ECFZ', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #95 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D096-WDFN-6L75', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #96 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D097-MB5Q-79FZ', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #97 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D098-L3KU-A4LR', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #98 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D099-FKV7-SWLQ', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #99 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-D100-DKU2-W8GX', 'PRO_DUAL_2_DEV', NULL, 2, 'ACTIVE', 'Lisensi Dual User #100 (Pro Lifetime - Max 2 Perangkat Berbagi Data)'),
  ('SKNR-T001-SNFN-332A', 'TRIAL_14_DAYS', 14, 1, 'ACTIVE', 'Lisensi Trial 14 Hari #1 (Versi Uji Coba 14 Hari - Max 1 Perangkat)'),
  ('SKNR-T002-AG7L-AWCL', 'TRIAL_14_DAYS', 14, 1, 'ACTIVE', 'Lisensi Trial 14 Hari #2 (Versi Uji Coba 14 Hari - Max 1 Perangkat)'),
  ('SKNR-T003-FSQV-BCRR', 'TRIAL_14_DAYS', 14, 1, 'ACTIVE', 'Lisensi Trial 14 Hari #3 (Versi Uji Coba 14 Hari - Max 1 Perangkat)'),
  ('SKNR-T004-9NCR-TJSQ', 'TRIAL_14_DAYS', 14, 1, 'ACTIVE', 'Lisensi Trial 14 Hari #4 (Versi Uji Coba 14 Hari - Max 1 Perangkat)'),
  ('SKNR-T005-AWCA-PHD7', 'TRIAL_14_DAYS', 14, 1, 'ACTIVE', 'Lisensi Trial 14 Hari #5 (Versi Uji Coba 14 Hari - Max 1 Perangkat)'),
  ('SKNR-T006-TNDA-HFA8', 'TRIAL_14_DAYS', 14, 1, 'ACTIVE', 'Lisensi Trial 14 Hari #6 (Versi Uji Coba 14 Hari - Max 1 Perangkat)'),
  ('SKNR-T007-S32Y-2QMG', 'TRIAL_14_DAYS', 14, 1, 'ACTIVE', 'Lisensi Trial 14 Hari #7 (Versi Uji Coba 14 Hari - Max 1 Perangkat)'),
  ('SKNR-T008-CV9G-HRB7', 'TRIAL_14_DAYS', 14, 1, 'ACTIVE', 'Lisensi Trial 14 Hari #8 (Versi Uji Coba 14 Hari - Max 1 Perangkat)'),
  ('SKNR-T009-ZHG9-GDA9', 'TRIAL_14_DAYS', 14, 1, 'ACTIVE', 'Lisensi Trial 14 Hari #9 (Versi Uji Coba 14 Hari - Max 1 Perangkat)'),
  ('SKNR-T010-37UV-P8VA', 'TRIAL_14_DAYS', 14, 1, 'ACTIVE', 'Lisensi Trial 14 Hari #10 (Versi Uji Coba 14 Hari - Max 1 Perangkat)'),
  ('SKNR-T011-V27B-4TXL', 'TRIAL_14_DAYS', 14, 1, 'ACTIVE', 'Lisensi Trial 14 Hari #11 (Versi Uji Coba 14 Hari - Max 1 Perangkat)'),
  ('SKNR-T012-YXNC-6JTD', 'TRIAL_14_DAYS', 14, 1, 'ACTIVE', 'Lisensi Trial 14 Hari #12 (Versi Uji Coba 14 Hari - Max 1 Perangkat)'),
  ('SKNR-T013-45M3-2ULP', 'TRIAL_14_DAYS', 14, 1, 'ACTIVE', 'Lisensi Trial 14 Hari #13 (Versi Uji Coba 14 Hari - Max 1 Perangkat)'),
  ('SKNR-T014-ZSHG-D3F4', 'TRIAL_14_DAYS', 14, 1, 'ACTIVE', 'Lisensi Trial 14 Hari #14 (Versi Uji Coba 14 Hari - Max 1 Perangkat)'),
  ('SKNR-T015-V97J-3W8X', 'TRIAL_14_DAYS', 14, 1, 'ACTIVE', 'Lisensi Trial 14 Hari #15 (Versi Uji Coba 14 Hari - Max 1 Perangkat)')
ON CONFLICT (license_key) DO UPDATE SET tier = EXCLUDED.tier, duration_days = EXCLUDED.duration_days, max_devices = EXCLUDED.max_devices, notes = EXCLUDED.notes;
