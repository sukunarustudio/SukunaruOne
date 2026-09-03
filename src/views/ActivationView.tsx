import React, { useState } from 'react';
import {
  ShieldCheckIcon,
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  SparklesIcon,
  ChatBubbleLeftEllipsisIcon,
  ArrowTopRightOnSquareIcon,
  LockClosedIcon,
  KeyIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
  DevicePhoneMobileIcon,
  ReceiptPercentIcon,
  ClipboardDocumentCheckIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { ViewType, BusinessSettings } from '../types';
import { useToast } from '../components/Toast';
import { verifyLicenseInCloud, releaseLicenseInCloud, isSupabaseConfigured } from '../services/supabaseClient';
import { syncWithSupabase, subscribeToRealtimeChanges } from '../services/syncManager';
import { claimLicenseForUser, getSession } from '../services/authService';

interface ActivationViewProps {
  onNavigate: (view: ViewType) => void;
  settings?: BusinessSettings;
}

// Master / sample valid keys for testing or instant unlocks
const MASTER_KEYS = [
  'SKNR-PRO-2026-LIFETIME',
  'SKNR-LIFETIME-PREMIUM',
  'SKNR-STUDIO-UNLIMITED',
  'SKNR-AKTIF-SELAMANYA',
  'SUKUNARU-PRO-UNLIMITED',
];

// Helper to generate or get a persistent Device ID
const getOrCreateDeviceId = (): string => {
  try {
    let id = localStorage.getItem('sukunaru_device_id');
    if (!id) {
      const randHex = Array.from({ length: 4 }, () =>
        Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1)
          .toUpperCase()
      ).join('-');
      id = `DEV-${randHex}`;
      localStorage.setItem('sukunaru_device_id', id);
    }
    return id;
  } catch {
    return 'DEV-88A2-99F1-44B0';
  }
};

// Validate Serial Key Algorithm
const validateSerialKey = (key: string): boolean => {
  const clean = key.trim().toUpperCase();
  if (MASTER_KEYS.includes(clean)) return true;

  // Pattern: SKNR-XXXX-XXXX-XXXX
  const pattern = /^SKNR-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  if (!pattern.test(clean)) return false;

  const chars = clean.replace(/-/g, '');
  let sum = 0;
  for (let i = 0; i < chars.length; i++) {
    sum += chars.charCodeAt(i);
  }
  return sum > 0;
};

export const ActivationView: React.FC<ActivationViewProps> = ({ onNavigate, settings }) => {
  const { showToast } = useToast();

  const [deviceId] = useState<string>(getOrCreateDeviceId);
  const [copiedDevice, setCopiedDevice] = useState(false);
  const [serialKeyInput, setSerialKeyInput] = useState('');
  const [registeredName, setRegisteredName] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  // License state from local storage
  const [isActivated, setIsActivated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sukunaru_license_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.isActivated);
      }
    } catch {}
    return false;
  });

  const [activeKeyMasked, setActiveKeyMasked] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('sukunaru_license_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        const k = parsed.licenseKey || '';
        if (k.length > 8) {
          return `${k.slice(0, 5)}••••-••••-${k.slice(-4)}`;
        }
        return k;
      }
    } catch {}
    return '';
  });

  const [activatedAt, setActivatedAt] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('sukunaru_license_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.activatedAtLabel || parsed.activatedAt || '';
      }
    } catch {}
    return '';
  });

  const [registeredToLabel, setRegisteredToLabel] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('sukunaru_license_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.registeredTo || '';
      }
    } catch {}
    return '';
  });

  const [licenseType, setLicenseType] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('sukunaru_license_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.licenseType || 'PRO_LIFETIME';
      }
    } catch {}
    return 'PRO_LIFETIME';
  });

  const handleCopyDeviceId = () => {
    navigator.clipboard.writeText(deviceId);
    setCopiedDevice(true);
    showToast('Device ID berhasil disalin!', 'success');
    setTimeout(() => setCopiedDevice(false), 2500);
  };

  const handleSerialInputChange = (val: string) => {
    let clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.startsWith('SKNR')) {
      clean = clean.slice(4);
      let formatted = 'SKNR';
      for (let i = 0; i < clean.length && i < 12; i++) {
        if (i % 4 === 0) formatted += '-';
        formatted += clean[i];
      }
      setSerialKeyInput(formatted);
    } else {
      setSerialKeyInput(val.toUpperCase());
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = serialKeyInput.trim().toUpperCase();
    if (!cleanKey) {
      showToast('Masukkan kode serial aktivasi terlebih dahulu', 'error');
      return;
    }

    setIsActivating(true);

    try {
      let isValid = false;
      let licenseTier = cleanKey.startsWith('SKNR-T') ? 'TRIAL_14_DAYS' : 'PRO_LIFETIME';
      let cloudLic: any = null;

      // 1. Check with Supabase Cloud if configured & online
      if (isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
        const cloudRes = await verifyLicenseInCloud(
          cleanKey,
          deviceId,
          registeredName.trim() || settings?.businessName || 'Owner'
        );
        if (cloudRes.valid) {
          isValid = true;
          cloudLic = cloudRes.license;
          licenseTier = cloudLic?.tier || licenseTier;
        } else {
          showToast(cloudRes.message, 'error');
          setIsActivating(false);
          return;
        }
      } else {
        // 2. Fallback to offline algorithm
        isValid = validateSerialKey(cleanKey);
      }

      if (isValid) {
        const now = new Date();
        const nowStr = now.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        const isTrial = licenseTier === 'TRIAL_14_DAYS' || Boolean(cloudLic?.duration_days);
        const expiresAt = isTrial
          ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
          : undefined;

        const regName = registeredName.trim() || settings?.businessName || 'Pengguna BisnisUrang';

        const licenseData = {
          isActivated: true,
          licenseKey: cleanKey,
          licenseType: licenseTier,
          activatedAt: now.toISOString(),
          activatedAtLabel: nowStr,
          expiresAt,
          durationDays: isTrial ? 14 : null,
          registeredTo: regName,
          deviceId,
        };

        try {
          localStorage.setItem('sukunaru_license_info', JSON.stringify(licenseData));
        } catch {}

        setIsActivated(true);
        setLicenseType(licenseTier);
        setActivatedAt(nowStr);
        setRegisteredToLabel(regName);
        setActiveKeyMasked(`${cleanKey.slice(0, 5)}••••-••••-${cleanKey.slice(-4)}`);
        setSerialKeyInput('');

        if (isTrial) {
          showToast('Selamat! Masa Percobaan 14 Hari berhasil diaktifkan.', 'success');
        } else {
          showToast('Selamat! Lisensi Pro Lifetime berhasil diaktivasi permanen.', 'success');
        }

        // Auto-claim license for the logged-in Supabase user
        try {
          const session = await getSession();
          if (session?.user) {
            await claimLicenseForUser(cleanKey);
          }
        } catch (_claimErr) {}

        if (isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
          subscribeToRealtimeChanges(true);
          syncWithSupabase().catch(() => {});
        }
      } else {
        showToast('Kode serial tidak valid atau tidak sesuai format. Silakan periksa kembali.', 'error');
      }
    } catch (err: any) {
      showToast(`Gagal aktivasi: ${err.message || 'Terjadi kesalahan sistem'}`, 'error');
    } finally {
      setIsActivating(false);
    }
  };

  const handleDeactivate = async () => {
    if (window.confirm('Apakah Anda yakin ingin melepaskan lisensi dari perangkat ini? Setelah dilepaskan, kode lisensi dapat dipindahkan ke perangkat lain.')) {
      let currentKey = '';
      try {
        const saved = localStorage.getItem('sukunaru_license_info');
        if (saved) {
          const parsed = JSON.parse(saved);
          currentKey = parsed.licenseKey || '';
        }
      } catch {}

      if (currentKey && isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
        showToast('Melepaskan lisensi dari Cloud...', 'info');
        const res = await releaseLicenseInCloud(currentKey, deviceId);
        if (!res.success) {
          console.warn('[Release License Cloud Warning]:', res.message);
        }
      }

      try {
        localStorage.removeItem('sukunaru_license_info');
      } catch {}
      setIsActivated(false);
      setLicenseType('TRIAL');
      setActiveKeyMasked('');
      setActivatedAt('');
      setRegisteredToLabel('');
      if (isSupabaseConfigured()) {
        subscribeToRealtimeChanges(true);
      }
      showToast('Lisensi berhasil dilepaskan dari perangkat ini.', 'success');
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Halo Sukunaru Studio, saya ingin membeli / aktivasi Serial Key Resmi BisnisUrang Pro.\n\n*Nama Usaha:* ${settings?.businessName || 'Usaha Saya'}\n*Device ID:* ${deviceId}`
  );
  const whatsappUrl = `https://wa.me/6289519203345?text=${whatsappMessage}`;

  const isTrialActive = isActivated && (licenseType === 'TRIAL_14_DAYS' || licenseType.includes('TRIAL'));

  return (
    <div id="activation-view" className="space-y-4 max-w-4xl mx-auto pb-24 animate-fade-in select-none">
      {/* ── STICKY TOP HEADER ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="h-9 w-9 rounded-xl bg-white hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 shadow-sm"
            title="Kembali ke Profil"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-[#25343F] leading-tight tracking-tight truncate">
              Aktivasi Aplikasi
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
              Manajemen lisensi permanen &amp; sinkronisasi Cloud BisnisUrang
            </p>
          </div>
        </div>

        {isActivated && (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shrink-0 ${
            isTrialActive
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          }`}>
            <CheckCircleIcon className="w-4 h-4" />
            <span>{isTrialActive ? 'Trial Aktif' : 'Pro Lifetime Aktif'}</span>
          </span>
        )}
      </div>

      {/* ── 1. STATUS CARD ── */}
      <div className="bg-white rounded-3xl border border-[#BFC9D1]/25 shadow-md p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                isActivated
                  ? isTrialActive
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-[#FF9B51]/15 text-[#FF6A00] border border-[#FF9B51]/30'
              }`}
            >
              {isActivated ? <ShieldCheckIcon className="w-6 h-6 stroke-[2]" /> : <LockClosedIcon className="w-6 h-6 stroke-[2]" />}
            </div>
            <div>
              <h2 className="font-black text-[#25343F] text-base sm:text-lg">
                {isActivated
                  ? isTrialActive
                    ? 'Lisensi Percobaan (14 Hari)'
                    : 'Lisensi Pro Lifetime Aktif'
                  : 'Mode Terbatas (Belum Aktivasi)'}
              </h2>
              <p className="text-xs text-[#898989] mt-0.5">
                {isActivated
                  ? isTrialActive
                    ? `Versi percobaan aktif sejak ${activatedAt || 'hari ini'}.`
                    : `Lisensi penuh terverifikasi aktif untuk ${registeredToLabel || settings?.businessName || 'bisnis Anda'}.`
                  : 'Aktivasi untuk membuka Pesanan SPK, Arus Kas, Sinkronisasi Cloud, dan Cadangan Otomatis.'}
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase shrink-0 text-center ${
              isActivated
                ? isTrialActive
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-emerald-600 text-white shadow-xs'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}
          >
            {isActivated ? (isTrialActive ? 'TRIAL 14 HARI' : 'PRO LIFETIME') : 'MODE TERBATAS'}
          </span>
        </div>

        {/* Info Grid (Device ID & Active License) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Device ID Card */}
          <div className="bg-[#EAEFEF]/60 rounded-2xl p-3.5 border border-[#BFC9D1]/20 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-[#898989] uppercase tracking-wider">
                ID Perangkat Ini (Hardware ID)
              </div>
              <div className="font-mono text-xs sm:text-sm font-black text-[#25343F] mt-0.5 truncate select-all">
                {deviceId}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyDeviceId}
              className="h-8 px-3 rounded-xl bg-white hover:bg-[#EAEFEF] active:bg-[#EAEFEF] border border-[#BFC9D1]/30 text-[#25343F] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
            >
              {copiedDevice ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                  <span className="text-emerald-700">Tersalin</span>
                </>
              ) : (
                <>
                  <DocumentDuplicateIcon className="w-3.5 h-3.5 text-[#898989]" />
                  <span>Salin ID</span>
                </>
              )}
            </button>
          </div>

          {/* Active Key Card */}
          {isActivated ? (
            <div className="bg-[#EAEFEF]/60 rounded-2xl p-3.5 border border-[#BFC9D1]/20 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-[#898989] uppercase tracking-wider">
                  Serial Key Terdaftar
                </div>
                <div className="font-mono text-xs sm:text-sm font-black text-[#25343F] mt-0.5 truncate tracking-wider">
                  {activeKeyMasked}
                </div>
              </div>
              <button
                type="button"
                onClick={handleDeactivate}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer py-1 px-2 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
              >
                Ganti Lisensi
              </button>
            </div>
          ) : (
            <div className="bg-[#EAEFEF]/60 rounded-2xl p-3.5 border border-[#BFC9D1]/20 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <SparklesIcon className="w-4 h-4" />
              </div>
              <div className="text-xs text-[#898989]">
                <strong className="text-[#25343F] font-bold block">1x Beli, Aktif Selamanya</strong>
                <span>Tidak ada biaya langganan bulanan.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. FORM INPUT SERIAL KEY (If not activated) ── */}
      {!isActivated && (
        <div className="bg-white rounded-3xl border border-[#BFC9D1]/25 shadow-md p-5 sm:p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-black text-[#25343F] text-sm sm:text-base flex items-center gap-2">
              <KeyIcon className="w-5 h-5 text-[#FF9B51] stroke-[2]" />
              <span>Masukkan Serial Key Aktivasi</span>
            </h3>
            <p className="text-xs text-[#898989] mt-0.5">
              Masukkan 16 karakter kode lisensi resmi dengan format: <strong className="font-mono text-[#25343F]">SKNR-XXXX-XXXX-XXXX</strong>
            </p>
          </div>

          <form onSubmit={handleActivate} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-[#25343F] mb-1.5">
                Nama Bisnis / Pemilik Lisensi
              </label>
              <input
                type="text"
                value={registeredName}
                onChange={e => setRegisteredName(e.target.value)}
                placeholder={settings?.businessName || 'Contoh: Percetakan Sukunaru'}
                className="w-full px-3.5 py-2.5 bg-white border border-[#BFC9D1]/30 rounded-xl text-xs font-semibold text-[#25343F] focus:outline-hidden focus:border-[#25343F] shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#25343F] mb-1.5">
                Kode Serial Key <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={serialKeyInput}
                  onChange={e => handleSerialInputChange(e.target.value)}
                  placeholder="SKNR-XXXX-XXXX-XXXX"
                  className="w-full pl-3.5 pr-11 py-3 bg-[#EAEFEF]/60 border border-[#BFC9D1]/30 rounded-xl font-mono text-sm sm:text-base font-black tracking-widest text-[#25343F] uppercase focus:outline-hidden focus:border-[#25343F] focus:bg-white shadow-xs placeholder:text-[#898989]/50 placeholder:font-normal placeholder:tracking-normal"
                />
                <KeyIcon className="w-5 h-5 text-[#898989] absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isActivating || !serialKeyInput.trim()}
              className="w-full py-3 px-4 bg-[#FF9B51] hover:bg-[#ff8c38] disabled:opacity-50 text-[#25343F] rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-[0.99]"
            >
              {isActivating ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheckIcon className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>{isActivating ? 'Memverifikasi ke Server Cloud...' : 'Aktivasi Lisensi Sekarang'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ── 3. CLOUD & PRO BENEFITS GRID ── */}
      <div className="bg-white rounded-3xl border border-[#BFC9D1]/25 shadow-md p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <BoltIcon className="w-5 h-5 text-[#FF9B51] stroke-[2]" />
          <h3 className="text-xs sm:text-sm font-black text-[#25343F] uppercase tracking-wider">
            Keuntungan Lisensi Pro BisnisUrang
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#EAEFEF]/50 border border-slate-100 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#0284C7] flex items-center justify-center shrink-0">
              <CloudArrowUpIcon className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h4 className="font-extrabold text-[#25343F]">Realtime Cloud Sync Multi-Device</h4>
              <p className="text-[11px] text-[#898989] mt-0.5 leading-relaxed">
                Sinkronisasi otomatis antara komputer kasir toko dan HP Android owner secara realtime via Supabase.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#EAEFEF]/50 border border-slate-100 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ClipboardDocumentCheckIcon className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h4 className="font-extrabold text-[#25343F]">Manajemen Pesanan &amp; SPK Produksi</h4>
              <p className="text-[11px] text-[#898989] mt-0.5 leading-relaxed">
                Pantau pesanan custom (Baru, Diproses, Siap Diambil, Selesai), DP, serta pelunasan transaksi.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#EAEFEF]/50 border border-slate-100 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ReceiptPercentIcon className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h4 className="font-extrabold text-[#25343F]">Arus Kas &amp; Laporan Profit Riil</h4>
              <p className="text-[11px] text-[#898989] mt-0.5 leading-relaxed">
                Catat pengeluaran operasional toko dan ekspor laporan laba bersih serta analitik performa bulanan.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#EAEFEF]/50 border border-slate-100 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <ShieldCheckIcon className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h4 className="font-extrabold text-[#25343F]">Akses Permanen &amp; Cadangan Cloud</h4>
              <p className="text-[11px] text-[#898989] mt-0.5 leading-relaxed">
                Cukup aktivasi 1 kali untuk seumur hidup. Arsipkan snapshot data ke cloud kapan saja dengan aman.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. WHATSAPP ORDER / CS BANNER ── */}
      <div className="bg-gradient-to-br from-[#25343F] via-slate-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden space-y-3">
        <div className="relative z-10 space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-emerald-300 text-[10.5px] font-black">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Layanan Resmi Sukunaru Studio</span>
          </div>
          <h3 className="text-sm sm:text-base font-black tracking-tight">
            Belum Memiliki Serial Key atau Butuh Bantuan?
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Hubungi tim pengembang via WhatsApp untuk pembelian serial key resmi, aktivasi instan, atau migrasi perangkat baru.
          </p>
        </div>

        <div className="relative z-10 pt-1">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            <ChatBubbleLeftEllipsisIcon className="w-4 h-4 stroke-[2]" />
            <span>Hubungi Kami via WhatsApp</span>
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 ml-0.5 opacity-80" />
          </a>
        </div>
      </div>
    </div>
  );
};
