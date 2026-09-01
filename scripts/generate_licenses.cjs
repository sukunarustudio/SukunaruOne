const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'supabase');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const keys = [];
const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function getRandomSegment() {
  let seg = '';
  for (let j = 0; j < 4; j++) {
    seg += letters[Math.floor(Math.random() * letters.length)];
  }
  return seg;
}

// 1. Generate 25 Single Pro Lifetime Keys (1 Device)
for (let i = 1; i <= 25; i++) {
  const numPad = String(i).padStart(3, '0');
  const seg1 = `S${numPad}`;
  const seg2 = getRandomSegment();
  const seg3 = getRandomSegment();
  const key = `SKNR-${seg1}-${seg2}-${seg3}`;

  keys.push({
    index: i,
    licenseKey: key,
    tier: 'PRO_SINGLE_1_DEV',
    durationDays: null,
    maxDevices: 1,
    status: 'ACTIVE',
    registeredName: null,
    registeredAt: null,
    notes: `Lisensi Single User #${i} (Pro Lifetime - Max 1 Perangkat)`,
  });
}

// 2. Generate 75 Dual Pro Lifetime Keys (2 Devices)
for (let i = 26; i <= 100; i++) {
  const numPad = String(i).padStart(3, '0');
  const seg1 = `D${numPad}`;
  const seg2 = getRandomSegment();
  const seg3 = getRandomSegment();
  const key = `SKNR-${seg1}-${seg2}-${seg3}`;

  keys.push({
    index: i,
    licenseKey: key,
    tier: 'PRO_DUAL_2_DEV',
    durationDays: null,
    maxDevices: 2,
    status: 'ACTIVE',
    registeredName: null,
    registeredAt: null,
    notes: `Lisensi Dual User #${i} (Pro Lifetime - Max 2 Perangkat Berbagi Data)`,
  });
}

// 3. Generate 15 Trial 14-Day Keys (1 Device)
for (let i = 1; i <= 15; i++) {
  const numPad = String(i).padStart(3, '0');
  const seg1 = `T${numPad}`;
  const seg2 = getRandomSegment();
  const seg3 = getRandomSegment();
  const key = `SKNR-${seg1}-${seg2}-${seg3}`;

  keys.push({
    index: 100 + i,
    licenseKey: key,
    tier: 'TRIAL_14_DAYS',
    durationDays: 14,
    maxDevices: 1,
    status: 'ACTIVE',
    registeredName: null,
    registeredAt: null,
    notes: `Lisensi Trial 14 Hari #${i} (Versi Uji Coba 14 Hari - Max 1 Perangkat)`,
  });
}

// 1. Write JSON file
fs.writeFileSync(path.join(dir, 'daftar_100_lisensi.json'), JSON.stringify(keys, null, 2), 'utf-8');

// 2. Write Text List formatted cleanly
let txt = `================================================================================\n`;
txt += `DAFTAR KUNCI LISENSI BISNISURANG STUDIO OS (SUPABASE CLOUD)\n`;
txt += `Total: 115 Kunci Lisensi (25 Single Lifetime + 75 Dual Lifetime + 15 Trial 14 Hari)\n`;
txt += `================================================================================\n\n`;

txt += `--- 📱 KELOMPOK 1: 25 KUNCI LISENSI PRO LIFETIME (1 PERANGKAT) ---\n`;
keys.filter(k => k.tier === 'PRO_SINGLE_1_DEV').forEach(k => {
  txt += `${String(k.index).padStart(2, ' ')}. ${k.licenseKey} | Tipe: Pro Lifetime | Max: 1 Perangkat | Status: ${k.status}\n`;
});

txt += `\n--- 👥 KELOMPOK 2: 75 KUNCI LISENSI PRO LIFETIME (2 PERANGKAT BERBAGI DATA) ---\n`;
keys.filter(k => k.tier === 'PRO_DUAL_2_DEV').forEach(k => {
  txt += `${String(k.index).padStart(3, ' ')}. ${k.licenseKey} | Tipe: Pro Lifetime | Max: 2 Perangkat | Status: ${k.status}\n`;
});

txt += `\n--- ⏳ KELOMPOK 3: 15 KUNCI LISENSI TRIAL VERSION (14 HARI) ---\n`;
keys.filter(k => k.tier === 'TRIAL_14_DAYS').forEach((k, idx) => {
  txt += `${String(idx + 1).padStart(2, ' ')}. ${k.licenseKey} | Tipe: Trial 14 Hari | Max: 1 Perangkat | Status: ${k.status}\n`;
});

fs.writeFileSync(path.join(dir, 'daftar_100_lisensi.txt'), txt, 'utf-8');

// 3. Write SQL Schema & Seed
let sql = `-- ==============================================================================
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
`;

const values = keys.map(k => `  ('${k.licenseKey}', '${k.tier}', ${k.durationDays === null ? 'NULL' : k.durationDays}, ${k.maxDevices}, '${k.status}', '${k.notes}')`).join(',\n');
sql += values + `\nON CONFLICT (license_key) DO UPDATE SET tier = EXCLUDED.tier, duration_days = EXCLUDED.duration_days, max_devices = EXCLUDED.max_devices, notes = EXCLUDED.notes;\n`;

fs.writeFileSync(path.join(dir, 'schema_multi_tenant.sql'), sql, 'utf-8');
console.log('Successfully created 25 single + 75 dual + 15 trial (total 115) license keys in supabase/ folder!');
