import React, { useState, useEffect } from 'react';
import {
  ArrowLeftIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
  InformationCircleIcon,
  KeyIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { ViewType } from '../types';
import { useToast } from '../components/Toast';
import {
  getSupabaseConfig,
  setSupabaseConfig,
  testSupabaseConnection,
  isSupabaseConfigured,
} from '../services/supabaseClient';
import {
  syncWithSupabase,
  getSyncState,
  subscribeSyncState,
  SyncState,
} from '../services/syncManager';

interface CloudSyncViewProps {
  onNavigate: (view: ViewType) => void;
  previousView?: ViewType;
}

const SUPABASE_SCHEMA_SQL = `-- BISNISURANG STUDIO OS - SUPABASE SQL SCHEMA
-- Jalankan di: Supabase Dashboard -> SQL Editor -> New Query

CREATE TABLE IF NOT EXISTS business_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
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

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  last_transaction_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  material_id TEXT REFERENCES materials(id) ON DELETE CASCADE,
  material_name TEXT,
  type TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  previous_stock NUMERIC,
  new_stock NUMERIC,
  reference_type TEXT,
  reference_id TEXT,
  notes TEXT,
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  receipt_number TEXT NOT NULL UNIQUE,
  type TEXT DEFAULT 'POS',
  order_id TEXT,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date TEXT NOT NULL,
  payment_method TEXT DEFAULT 'CASH',
  reference TEXT,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_transactions (
  id TEXT PRIMARY KEY,
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS & Policies
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon all on business_settings" ON business_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on materials" ON materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on inventory_movements" ON inventory_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on financial_transactions" ON financial_transactions FOR ALL USING (true) WITH CHECK (true);
`;

export const CloudSyncView: React.FC<CloudSyncViewProps> = ({
  onNavigate,
  previousView = 'settings',
}) => {
  const { showToast } = useToast();

  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [syncState, setSyncState] = useState<SyncState>(getSyncState());
  const [showSqlModal, setShowSqlModal] = useState(false);

  useEffect(() => {
    const cfg = getSupabaseConfig();
    setUrl(cfg.url);
    setKey(cfg.key);

    const unsubscribe = subscribeSyncState(s => setSyncState(s));
    return () => unsubscribe();
  }, []);

  const handleSaveAndTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTesting(true);
    setTestResult(null);

    const cleanUrl = url.trim();
    const cleanKey = key.trim();

    setSupabaseConfig({ url: cleanUrl, key: cleanKey });

    if (!cleanUrl || !cleanKey) {
      setTesting(false);
      setTestResult({
        success: false,
        message: 'Harap isi URL dan Anon Public Key Supabase.',
      });
      return;
    }

    try {
      const res = await testSupabaseConnection({ url: cleanUrl, key: cleanKey });
      setTestResult(res);
      if (res.success) {
        showToast('Koneksi ke Supabase berhasil terhubung!', 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Gagal terhubung ke server.' });
      showToast('Gagal terhubung ke Supabase', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleManualSync = async () => {
    if (!isSupabaseConfigured()) {
      showToast('Konfigurasi Supabase belum lengkap. Isi URL dan Key terlebih dahulu.', 'error');
      return;
    }

    showToast('Memulai sinkronisasi dua arah...', 'info');
    const res = await syncWithSupabase();
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    showToast('Skrip SQL berhasil disalin ke clipboard!', 'success');
  };

  const formatLastSync = (iso: string | null) => {
    if (!iso) return 'Belum pernah disinkronkan';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in pb-24">
      {/* ── STICKY TOP HEADER ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate(previousView)}
            className="h-9 w-9 rounded-xl bg-white hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 shadow-md"
            title="Kembali"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-[#25343F] leading-tight tracking-tight truncate">
              Sinkronisasi Cloud Supabase
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
              Arsitektur Offline-First (Tetap cepat offline, otomatis sync ke cloud saat online)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualSync}
          disabled={syncState.status === 'SYNCING'}
          className="h-9 px-3.5 bg-[#FF6A00] hover:bg-[#e65c00] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0 active:scale-95 disabled:opacity-60"
        >
          <ArrowPathIcon className={`w-3.5 h-3.5 ${syncState.status === 'SYNCING' ? 'animate-spin' : ''}`} />
          <span>{syncState.status === 'SYNCING' ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
        </button>
      </div>

      {/* ── STATUS CARD ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#BFC9D1]/25 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF0E6] dark:bg-slate-800 text-[#FF6A00] flex items-center justify-center shadow-2xs shrink-0">
              <CloudArrowUpIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#25343F] dark:text-white flex items-center gap-2">
                <span>Status Sinkronisasi</span>
                {syncState.isOnline ? (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                    🟢 Online
                  </span>
                ) : (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                    🟡 Offline (Tersimpan di HP)
                  </span>
                )}
              </div>
              <div className="text-xs text-[#898989] mt-0.5">
                Terakhir sync: <span className="font-semibold text-[#25343F] dark:text-slate-300">{formatLastSync(syncState.lastSyncAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#898989] font-medium">Koneksi Database:</span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                isSupabaseConfigured()
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {isSupabaseConfigured() ? '✓ Terkonfigurasi' : 'Belum Terhubung'}
            </span>
          </div>
        </div>

        {/* Highlight Multi-Tenant & 2 Devices Architecture Banner */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <KeyIcon className="w-4 h-4 text-[#FF6A00]" />
              <span className="text-xs font-bold text-[#25343F] dark:text-white">Akun Lisensi Aktif:</span>
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-[#BFC9D1]/40 dark:border-slate-700 text-[#FF6A00]">
                {syncState.activeLicenseKey || 'SKNR-DEFAULT-OFFLINE'}
              </span>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              👥 1 Lisensi = 2 Perangkat Berbagi Data
            </span>
          </div>

          <div className="text-xs leading-relaxed text-[#898989] dark:text-slate-300 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
            <span className="font-bold text-[#25343F] dark:text-white">Sinkronisasi Multi-Device:</span> Data transaksi, pesanan, dan produk dipartisi sesuai Kunci Lisensi di atas. Masukkan Kunci Lisensi yang sama di HP kedua Anda untuk otomatis berbagi data secara realtime.
          </div>
        </div>
      </div>

      {/* ── CONFIGURATION FORM ── */}
      <form onSubmit={handleSaveAndTest} className="bg-white dark:bg-slate-900 rounded-2xl border border-[#BFC9D1]/25 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-[#25343F] dark:text-white">Pengaturan Kredensial Supabase</h3>
            <p className="text-xs text-[#898989] mt-0.5">
              Dapatkan Project URL &amp; Anon Public Key dari menu <i>Project Settings &rarr; API</i> di Supabase.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            className="text-xs font-bold text-[#FF6A00] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <DocumentDuplicateIcon className="w-4 h-4" />
            <span>Lihat Skrip SQL Tabel</span>
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Project URL */}
          <div>
            <label className="block text-xs font-bold text-[#25343F] dark:text-slate-200 mb-1.5">
              Supabase Project URL
            </label>
            <div className="relative">
              <GlobeAltIcon className="w-4 h-4 text-[#898989] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                required
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-[#BFC9D1]/30 dark:border-slate-700 rounded-xl text-xs font-medium text-[#25343F] dark:text-white placeholder:text-[#898989]/60 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#FF6A00]"
              />
            </div>
          </div>

          {/* Anon Public API Key */}
          <div>
            <label className="block text-xs font-bold text-[#25343F] dark:text-slate-200 mb-1.5">
              Supabase Anon Public API Key
            </label>
            <div className="relative">
              <KeyIcon className="w-4 h-4 text-[#898989] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-[#BFC9D1]/30 dark:border-slate-700 rounded-xl text-xs font-medium text-[#25343F] dark:text-white placeholder:text-[#898989]/60 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#FF6A00]"
              />
            </div>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircleIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{testResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="submit"
            disabled={testing}
            className="px-4 py-2 bg-[#25343F] hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-60"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Menguji Koneksi...' : 'Simpan &amp; Uji Koneksi'}</span>
          </button>
        </div>
      </form>

      {/* ── MODAL SQL SCHEMA GENERATOR ── */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-2xl w-full max-h-[85vh] flex flex-col space-y-4 shadow-2xl border border-[#BFC9D1]/30 dark:border-slate-800 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-base text-[#25343F] dark:text-white">Skrip SQL Tabel Supabase</h3>
                <p className="text-xs text-[#898989]">Salin dan jalankan skrip ini di SQL Editor dashboard Supabase Anda.</p>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1.5 bg-[#FF6A00] hover:bg-[#e65c00] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                <span>Salin SQL</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed border border-slate-800 select-all">
              <pre>{SUPABASE_SCHEMA_SQL}</pre>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#25343F] dark:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
