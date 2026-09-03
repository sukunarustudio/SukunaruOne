import React, { useState } from 'react';
import { ShieldCheckIcon, ArrowLeftIcon, DocumentDuplicateIcon, CheckIcon, SparklesIcon, ChatBubbleLeftEllipsisIcon, ArrowTopRightOnSquareIcon, LockClosedIcon, KeyIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { ViewType, BusinessSettings } from '../types';
import { useToast } from '../components/Toast';
import { verifyLicenseInCloud, releaseLicenseInCloud, isSupabaseConfigured } from '../services/supabaseClient';
import { syncWithSupabase, subscribeToRealtimeChanges } from '../services/syncManager';

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

  // Pattern: SKNR-XXXX-XXXX-XXXX (4 segments of 4 alphanumeric chars after prefix)
  const pattern = /^SKNR-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  if (!pattern.test(clean)) return false;

  // Checksum rule
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

  // DocumentDuplicateIcon device ID
  const handleCopyDeviceId = () => {
    navigator.clipboard.writeText(deviceId);
    setCopiedDevice(true);
    showToast('Device ID berhasil disalin ke papan klip!', 'success');
    setTimeout(() => setCopiedDevice(false), 2500);
  };

  // Format serial key automatically with dashes
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

  // Handle Activation
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
        // 2. Fallback to local validation algorithm
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

        const licenseData = {
          isActivated: true,
          licenseKey: cleanKey,
          licenseType: licenseTier,
          activatedAt: now.toISOString(),
          activatedAtLabel: nowStr,
          expiresAt,
          durationDays: isTrial ? 14 : null,
          registeredTo: registeredName.trim() || settings?.businessName || 'Sukunaru Studio User',
          deviceId,
        };

        try {
          localStorage.setItem('sukunaru_license_info', JSON.stringify(licenseData));
        } catch {}

        setIsActivated(true);
        setLicenseType(licenseTier);
        setActivatedAt(nowStr);
        setActiveKeyMasked(`${cleanKey.slice(0, 5)}••••-••••-${cleanKey.slice(-4)}`);
        setSerialKeyInput('');
        
        if (isTrial) {
          showToast('Selamat! Versi Percobaan 14 Hari berhasil diaktifkan.', 'success');
        } else {
          showToast('Selamat! Aplikasi Sukunaru Studio berhasil diaktivasi permanen.', 'success');
        }

        // Automatically trigger sync and realtime subscription if cloud is configured
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

  // Deactivate
  const handleDeactivate = async () => {
    if (window.confirm('Apakah Anda yakin ingin melepaskan lisensi dari perangkat ini? Setelah dilepaskan, kode lisensi dapat digunakan di perangkat lain.')) {
      let currentKey = '';
      try {
        const saved = localStorage.getItem('sukunaru_license_info');
        if (saved) {
          const parsed = JSON.parse(saved);
          currentKey = parsed.licenseKey || '';
        }
      } catch {}

      if (currentKey && isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
        showToast('Melepaskan lisensi dari server Cloud...', 'info');
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
      if (isSupabaseConfigured()) {
        subscribeToRealtimeChanges(true);
      }
      showToast('Lisensi berhasil dilepaskan dari perangkat ini dan siap digunakan di perangkat lain.', 'success');
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Halo Sukunaru Studio, saya ingin membeli / meminta Kode Serial Aktivasi Resmi Sukunaru Studio.\n\n*Nama Usaha:* ${settings?.businessName || 'Usaha Percetakan'}\n*Device ID:* ${deviceId}`
  );
  const whatsappUrl = `https://wa.me/6289519203345?text=${whatsappMessage}`;

  const isTrialActive = isActivated && (licenseType === 'TRIAL_14_DAYS' || licenseType.includes('TRIAL'));

  return (
    <div id="activation-view" className="space-y-3.5 max-w-7xl mx-auto pb-24">
      {/* ── STICKY TOP HEADER: [ ← Judul ] ... [ Aksi/Status ] ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="h-9 w-9 rounded-xl bg-white hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 shadow-md"
            title="Kembali ke Profil"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-[#25343F] leading-tight tracking-tight truncate">
              Aktivasi Aplikasi
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
              Status lisensi & aktivasi serial key Sukunaru Studio
            </p>
          </div>
        </div>

        {isActivated && (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
            isTrialActive
              ? 'bg-amber-50 border border-amber-200 text-amber-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          }`}>
            <CheckCircleIcon className={`w-3.5 h-3.5 ${isTrialActive ? 'text-amber-600' : 'text-emerald-600'}`} />
            <span>{isTrialActive ? 'Trial 14 Hari Aktif' : 'Aktif Permanen'}</span>
          </span>
        )}
      </div>

      {/* ── STATUS HERO CARD ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                isActivated
                  ? isTrialActive
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-[#FF9B51]/10 text-[#c45e00] border border-[#FF9B51]/30'
              }`}
            >
              {isActivated ? <ShieldCheckIcon className="w-6 h-6" /> : <LockClosedIcon className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[#25343F] text-sm sm:text-base">
                  {isActivated
                    ? isTrialActive
                      ? 'Lisensi Uji Coba 14 Hari Terverifikasi'
                      : 'Lisensi Resmi Terverifikasi'
                    : 'Belum Teraktivasi'}
                </h3>
              </div>
              <p className="text-xs text-[#898989] mt-0.5">
                {isActivated
                  ? isTrialActive
                    ? `Lisensi Trial 14 Hari aktif sejak ${activatedAt || 'Hari ini'}.`
                    : `Lisensi Lifetime aktif untuk perangkat ini sejak ${activatedAt || 'Hari ini'}.`
                  : 'Aplikasi belum diaktivasi dengan kode lisensi resmi.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase ${
                isActivated
                  ? isTrialActive
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              {isActivated ? (isTrialActive ? 'TRIAL 14 HARI' : 'LIFETIME PRO') : 'BELUM AKTIF'}
            </span>
          </div>
        </div>

        {/* Device ID Info Row */}
        <div className="bg-[#EAEFEF] rounded-xl p-3 border border-[#BFC9D1]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="text-[10px] font-bold text-[#898989] uppercase tracking-wider">
              ID Perangkat Unik (Hardware ID)
            </div>
            <div className="font-mono text-xs sm:text-sm font-black text-[#25343F] mt-0.5 select-all">
              {deviceId}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyDeviceId}
            className="h-8 px-3 rounded-lg bg-white hover:bg-[#EAEFEF] active:bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-md"
          >
            {copiedDevice ? (
              <>
                <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Tersalin!</span>
              </>
            ) : (
              <>
                <DocumentDuplicateIcon className="w-3.5 h-3.5 text-[#898989]" />
                <span>Salin ID</span>
              </>
            )}
          </button>
        </div>

        {/* If already activated, show active key details */}
        {isActivated && (
          <div className="p-3 bg-[#EAEFEF]/60 rounded-xl border border-[#BFC9D1]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider block">
                Serial Key Terdaftar
              </span>
              <span className="font-mono font-bold text-[#25343F] text-sm tracking-widest">
                {activeKeyMasked}
              </span>
            </div>
            <button
              type="button"
              onClick={handleDeactivate}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer py-1"
            >
              Nonaktifkan / Ganti Lisensi
            </button>
          </div>
        )}
      </div>

      {/* ── FORM INPUT SERIAL KEY (If not activated) ───────────────── */}
      {!isActivated && (
        <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md p-4 sm:p-5 space-y-4">
          <div className="border-b border-slate-100 pb-2.5">
            <h3 className="font-bold text-[#25343F] text-xs sm:text-sm flex items-center gap-1.5">
              <KeyIcon className="w-4 h-4 text-[#25343F]" />
              <span>Masukkan Kode Serial Lisensi</span>
            </h3>
            <p className="text-[11px] text-[#898989] mt-0.5">
              Format: <span className="font-mono font-bold text-[#25343F]">SKNR-XXXX-XXXX-XXXX</span>
            </p>
          </div>

          <form onSubmit={handleActivate} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#25343F] mb-1">
                Nama Pemilik / Usaha (Opsional)
              </label>
              <input
                type="text"
                value={registeredName}
                onChange={e => setRegisteredName(e.target.value)}
                placeholder={settings?.businessName || 'Contoh: Sukunaru Percetakan'}
                className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#25343F] shadow-md"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#25343F] mb-1">
                Kode Serial Key <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={serialKeyInput}
                  onChange={e => handleSerialInputChange(e.target.value)}
                  placeholder="SKNR-XXXX-XXXX-XXXX"
                  className="w-full pl-3 pr-10 py-2.5 bg-[#EAEFEF]/70 border border-[#BFC9D1]/25 rounded-xl font-mono text-sm font-bold tracking-widest text-[#25343F] uppercase focus:outline-hidden focus:border-[#25343F] focus:bg-white shadow-md placeholder:text-[#898989] placeholder:font-normal placeholder:tracking-normal"
                />
                <KeyIcon className="w-4 h-4 text-[#898989] absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isActivating || !serialKeyInput.trim()}
              className="w-full h-10 px-4 bg-[#FF9B51] hover:bg-[#ff8c38] disabled:opacity-50 text-[#25343F] rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer active:scale-95"
            >
              <ShieldCheckIcon className="w-4 h-4" />
              <span>{isActivating ? 'Memverifikasi...' : 'Aktivasi Sekarang'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ── BANTUAN & ORDER SERIAL KEY ──────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#25343F] via-slate-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md relative overflow-hidden space-y-3">
        <div className="relative z-10 space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAEFEF]/10 border border-[#BFC9D1]/25 text-emerald-300 text-[10.5px] font-bold">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Layanan Resmi Sukunaru Studio</span>
          </div>
          <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
            Belum Memiliki Kode Serial Aktivasi?
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Hubungi pengembang resmi via WhatsApp untuk pembelian serial key permanent lifetime atau bantuan aktivasi sistem.
          </p>
        </div>

        <div className="relative z-10 pt-1">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
          >
            <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
            <span>Minta Kode Serial via WhatsApp</span>
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 ml-0.5 opacity-80" />
          </a>
        </div>
      </div>

      {/* ── BENEFIT CHECKLIST ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md p-4 sm:p-5 space-y-3">
        <h4 className="text-xs font-bold text-[#25343F] uppercase tracking-wider">
          Keunggulan Versi Lisensi Resmi
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#898989]">
          <div className="flex items-start gap-2 p-2 rounded-xl bg-[#EAEFEF] border border-slate-100">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#25343F] block">Akses Fitur Lengkap</span>
              <span className="text-[11px] text-[#898989]">Semua modul Pesanan/SPK, Kasir POS, HPP, & Analitik Keuangan aktif seutuhnya.</span>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2 rounded-xl bg-[#EAEFEF] border border-slate-100">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#25343F] block">Scan & Cetak Barcode</span>
              <span className="text-[11px] text-[#898989]">Cetak label barcode PDF & pemindaian via kamera HP / scanner USB kasir.</span>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2 rounded-xl bg-[#EAEFEF] border border-slate-100">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#25343F] block">Cloud Sync Realtime</span>
              <span className="text-[11px] text-[#898989]">Sinkronisasi data otomatis multi-device secara realtime via Supabase.</span>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2 rounded-xl bg-[#EAEFEF] border border-slate-100">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#25343F] block">Database Mandiri & Backup</span>
              <span className="text-[11px] text-[#898989]">Data lokal tersimpan aman di device dengan fitur backup cloud & lokal.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
