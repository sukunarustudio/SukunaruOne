import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  SparklesIcon,
  ChatBubbleLeftEllipsisIcon,
  ArrowTopRightOnSquareIcon,
  LockClosedIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  ReceiptPercentIcon,
  ClipboardDocumentCheckIcon,
  BoltIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { ViewType, BusinessSettings } from '../types';
import { useToast } from '../components/Toast';
import { useLicense } from '../hooks/useLicense';
import { fetchLatestLicense } from '../services/supabaseClient';

interface ActivationViewProps {
  onNavigate: (view: ViewType) => void;
  settings?: BusinessSettings;
}

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

export const ActivationView: React.FC<ActivationViewProps> = ({ onNavigate, settings }) => {
  const { showToast } = useToast();
  const { isActivated, isPro, isTrial, isFree, plan, daysRemaining, licenseKey, registeredTo, raw } = useLicense();

  const [deviceId] = useState<string>(getOrCreateDeviceId);
  const [copiedDevice, setCopiedDevice] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeKey = licenseKey || raw?.licenseKey || '';
  const activatedAt = raw?.activatedAtLabel || (raw?.activatedAt ? new Date(raw.activatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
  const registeredToLabel = registeredTo || raw?.registeredTo || '';
  const trialDaysRemaining = daysRemaining;

  // Auto-fetch latest cloud license on mount
  useEffect(() => {
    fetchLatestLicense().catch(() => {});
  }, []);

  const handleRefreshLicense = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const res = await fetchLatestLicense();
      if (res.success) {
        showToast('Status lisensi berhasil diperbarui dari Cloud!', 'success');
      } else {
        showToast(res.message || 'Gagal memeriksa status lisensi.', 'info');
      }
    } catch {
      showToast('Koneksi cloud bermasalah.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyDeviceId = () => {
    navigator.clipboard.writeText(deviceId);
    setCopiedDevice(true);
    showToast('Device ID berhasil disalin!', 'success');
    setTimeout(() => setCopiedDevice(false), 2500);
  };

  const handleCopyKey = () => {
    if (!activeKey) return;
    navigator.clipboard.writeText(activeKey);
    setCopiedKey(true);
    showToast('Serial Key berhasil disalin!', 'success');
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const whatsappMessage = encodeURIComponent(
    `Halo Sukunaru Studio, saya ingin upgrade ke Lisensi Resmi BisnisUrang Pro Lifetime.\n\n*Nama Usaha:* ${settings?.businessName || 'Usaha Saya'}\n*ID Perangkat:* ${deviceId}\n*Serial Key Terdaftar:* ${activeKey || 'Belum ada'}`
  );
  const whatsappUrl = `https://wa.me/6289519203345?text=${whatsappMessage}`;

  const isTrialActive = isTrial;
  const isProActive = isPro && plan === 'PRO';
  const isFreeActive = isFree;

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
              Aktivasi &amp; Lisensi
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
              Status akun &amp; manajemen lisensi BisnisUrang
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefreshLicense}
            disabled={isRefreshing}
            className="h-8 px-2.5 rounded-xl bg-white hover:bg-[#EAEFEF] border border-[#BFC9D1]/30 text-[#25343F] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            title="Periksa dan perbarui status lisensi dari Cloud"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 text-[#FF9B51] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Perbarui Status</span>
          </button>

          {isActivated && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shrink-0 ${
              isProActive
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : isTrialActive
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-slate-100 text-slate-700 border border-slate-300'
            }`}>
              <CheckCircleIcon className="w-4 h-4" />
              <span>
                {isProActive ? 'PRO Aktif' : isTrialActive ? `Trial — ${trialDaysRemaining ?? 0} Hari` : 'FREE'}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* ── 1. STATUS & LICENSE DETAIL CARD ── */}
      <div className="bg-white rounded-3xl border border-[#BFC9D1]/25 shadow-md p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                isProActive
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : isTrialActive
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : isFreeActive
                      ? 'bg-slate-50 text-slate-500 border border-slate-200'
                      : 'bg-[#FF9B51]/15 text-[#FF6A00] border border-[#FF9B51]/30'
              }`}
            >
              {isProActive ? <ShieldCheckIcon className="w-6 h-6 stroke-[2]" /> :
               isTrialActive ? <ShieldCheckIcon className="w-6 h-6 stroke-[2]" /> :
               <LockClosedIcon className="w-6 h-6 stroke-[2]" />}
            </div>
            <div>
              <h2 className="font-black text-[#25343F] text-base sm:text-lg">
                {isProActive
                  ? 'Lisensi PRO Lifetime Aktif'
                  : isTrialActive
                    ? `Masa Percobaan Trial (${trialDaysRemaining ?? 0} Hari Tersisa)`
                    : isFreeActive
                      ? 'Masa Percobaan Berakhir (Mode Free)'
                      : 'Belum Terhubung ke Lisensi'}
              </h2>
              <p className="text-xs text-[#898989] mt-0.5">
                {isProActive
                  ? `Lisensi penuh terverifikasi aktif untuk ${registeredToLabel || settings?.businessName || 'bisnis Anda'}. Realtime Cloud Sync aktif.`
                  : isTrialActive
                    ? `Trial aktif sejak ${activatedAt || 'hari ini'}. Anda dapat menikmati seluruh fitur PRO dan Cloud Sync selama masa percobaan.`
                    : isFreeActive
                      ? 'Masa trial telah berakhir. Upgrade ke PRO Lifetime untuk membuka kembali Cloud Sync & fitur PRO.'
                      : 'Akun Anda menggunakan lisensi default BisnisUrang.'}
              </p>
            </div>
          </div>

          <span
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase shrink-0 text-center ${
              isProActive
                ? 'bg-emerald-600 text-white shadow-xs'
                : isTrialActive
                  ? 'bg-amber-500 text-white shadow-xs'
                  : isFreeActive
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}
          >
            {isProActive ? 'PRO' : isTrialActive ? 'TRIAL' : isFreeActive ? 'FREE' : 'BELUM AKTIF'}
          </span>
        </div>

        {/* Info Grid (Device ID & Registered Key) - Read Only */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Device ID Card (Read-Only) */}
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
              title="Salin ID Perangkat"
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

          {/* Registered Key Card (Read-Only, Unmasked) */}
          <div className="bg-[#EAEFEF]/60 rounded-2xl p-3.5 border border-[#BFC9D1]/20 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-[#898989] uppercase tracking-wider">
                Nomor Serial Key Terdaftar
              </div>
              <div className="font-mono text-xs sm:text-sm font-black text-[#25343F] mt-0.5 truncate tracking-wider select-all">
                {activeKey || 'Belum Ada Key'}
              </div>
            </div>
            {activeKey && (
              <button
                type="button"
                onClick={handleCopyKey}
                className="h-8 px-3 rounded-xl bg-white hover:bg-[#EAEFEF] active:bg-[#EAEFEF] border border-[#BFC9D1]/30 text-[#25343F] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
                title="Salin Serial Key"
              >
                {copiedKey ? (
                  <>
                    <CheckIcon className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                    <span className="text-emerald-700">Tersalin</span>
                  </>
                ) : (
                  <>
                    <DocumentDuplicateIcon className="w-3.5 h-3.5 text-[#898989]" />
                    <span>Salin Key</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. UPGRADE KE PRO LIFETIME BANNER (If not yet PRO) ── */}
      {!isProActive && (
        <div className="bg-gradient-to-br from-[#25343F] via-[#1A252C] to-[#0F171C] text-white rounded-3xl p-5 sm:p-6 shadow-lg border border-[#FF9B51]/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF9B51]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF9B51]/20 border border-[#FF9B51]/40 text-[#FF9B51] text-xs font-black tracking-wide uppercase">
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>{isTrialActive ? `Trial Aktif (${trialDaysRemaining ?? 0} Hari Tersisa)` : 'Akses Terbatas'}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Upgrade ke Pro Lifetime
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Dapatkan lisensi resmi <strong>PRO Lifetime</strong> tanpa biaya langganan bulanan. Serial Key Anda (<span className="font-mono font-bold text-[#FF9B51]">{activeKey || 'Akun Anda'}</span>) akan langsung diaktifkan permanen dengan Realtime Cloud Sync Multi-Device, Pesanan SPK, Arus Kas &amp; Backup Cloud.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer text-center"
              >
                <ChatBubbleLeftEllipsisIcon className="w-5 h-5 stroke-[2.5]" />
                <span>Upgrade ke Pro Lifetime via WhatsApp</span>
                <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-0.5 opacity-90" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. CLOUD & PRO BENEFITS GRID ── */}
      <div className="bg-white rounded-3xl border border-[#BFC9D1]/25 shadow-md p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <BoltIcon className="w-5 h-5 text-[#FF9B51] stroke-[2]" />
          <h3 className="text-xs sm:text-sm font-black text-[#25343F] uppercase tracking-wider">
            Fitur Lengkap BisnisUrang Pro
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
                Sinkronisasi otomatis antara komputer kasir toko dan HP Android owner secara realtime antar-perangkat.
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
    </div>
  );
};
