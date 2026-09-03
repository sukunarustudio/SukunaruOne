import React from 'react';
import {
  ArrowLeftIcon,
  InformationCircleIcon,
  CircleStackIcon,
  ShieldCheckIcon,
  ServerIcon,
  Square3Stack3DIcon,
  SparklesIcon,
  PrinterIcon,
  ComputerDesktopIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  QrCodeIcon,
  CloudArrowUpIcon,
  LockClosedIcon,
  DevicePhoneMobileIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { ViewType } from '../types';
import { useLicense } from '../hooks/useLicense';
import appLogo from '../assets/app-logo.png';

interface AppInfoViewProps {
  onNavigate?: (view: ViewType) => void;
}

export const AppInfoView: React.FC<AppInfoViewProps> = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();
  const { isPro, isTrial, daysRemaining } = useLicense();

  const getLicenseStatusText = () => {
    if (isPro && !isTrial) return 'PRO / Lifetime Edition';
    if (isTrial) return `Trial Aktif (${daysRemaining ?? 0} hari tersisa)`;
    return 'Mode Terbatas (Free Mode)';
  };

  const features = [
    {
      icon: QrCodeIcon,
      iconBg: 'bg-[#EAEFEF] border-[#BFC9D1]/30 text-[#25343F]',
      title: 'Kasir POS & Scan Barcode',
      desc: 'Transaksi kasir cepat, pesanan custom (SPK), scan barcode via kamera & USB scanner, serta cetak struk thermal/PDF.',
    },
    {
      icon: ServerIcon,
      iconBg: 'bg-[#EAEFEF] border-[#BFC9D1]/30 text-[#25343F]',
      title: 'Stok Bahan Baku & Resep BOM',
      desc: 'Setiap transaksi kasir beresep BOM otomatis memotong stok bahan baku terkait secara realtime dan presisi.',
    },
    {
      icon: CloudArrowUpIcon,
      iconBg: 'bg-[#EAEFEF] border-[#BFC9D1]/30 text-[#25343F]',
      title: 'Realtime Cloud Sync & Backup',
      desc: 'Sinkronisasi multi-device secara realtime via Supabase serta pencadangan database lokal dan snapshot cloud aman.',
    },
  ];

  const appSpecs = [
    { label: 'Nama Aplikasi', value: 'BisnisUrang', icon: InformationCircleIcon },
    { label: 'Versi Rilis', value: 'v2.0.0 Stable Release', icon: SparklesIcon },
    {
      label: 'Status Lisensi',
      value: getLicenseStatusText(),
      icon: isPro ? ShieldCheckIcon : LockClosedIcon,
    },
    { label: 'Arsitektur Data', value: 'Offline-First (SQLite) + Cloud Sync Supabase', icon: CircleStackIcon },
    { label: 'Pengembang', value: 'Sukunaru Studio', icon: ServerIcon },
    { label: 'Dukungan Perangkat', value: 'Android APK (Mobile) & Web Desktop / Tablet', icon: ComputerDesktopIcon },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in pb-24 select-none">
      {/* ── STICKY TOP HEADER ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate?.('profile')}
            className="h-9 w-9 rounded-xl bg-white hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 shadow-sm"
            title="Kembali ke Profil"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-[#25343F] leading-tight tracking-tight truncate">
              Versi Aplikasi
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
              Informasi sistem, lisensi &amp; versi BisnisUrang v2.0
            </p>
          </div>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-[#BFC9D1]/25 rounded-3xl p-6 sm:p-7 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-bl from-orange-50 to-transparent rounded-full -mr-24 -mt-24 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* App Logo */}
            <div className="w-16 h-16 rounded-2xl bg-white border border-[#BFC9D1]/30 p-2 flex items-center justify-center shadow-md shrink-0 overflow-hidden select-none">
              <img
                src={appLogo}
                alt="BisnisUrang Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-[#25343F] tracking-tight">BisnisUrang</h2>
                <span className="px-3 py-0.5 text-xs font-black bg-[#FF9B51] text-[#25343F] rounded-full shadow-xs">
                  v2.0.0
                </span>
              </div>
              <p className="text-xs font-semibold text-[#898989] mt-0.5">
                Sistem Manajemen Usaha, Kasir POS &amp; Sinkronisasi Cloud
              </p>
              <p className="text-[11px] text-[#898989] mt-0.5 font-mono font-bold">
                by Sukunaru Studio
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-100 shrink-0">
            <span className="text-[10px] font-extrabold text-[#898989] uppercase tracking-wider">
              Status Sistem
            </span>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1.5 mt-1">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
              Aktif &amp; Optimal
            </span>
          </div>
        </div>
      </div>

      {/* 3 Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className="bg-white border border-[#BFC9D1]/25 rounded-2xl p-4.5 shadow-sm flex items-start gap-3.5">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-xs ${f.iconBg}`}>
                <Icon className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-[#25343F]">{f.title}</h3>
                <p className="text-[11px] text-[#898989] mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Specs + About Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3.5">
        {/* Specs */}
        <div className="lg:col-span-3 bg-white border border-[#BFC9D1]/25 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 mb-4">
            <InformationCircleIcon className="w-5 h-5 text-[#FF9B51] stroke-[2]" />
            <h3 className="text-sm font-black text-[#25343F]">Spesifikasi Sistem &amp; Lisensi</h3>
          </div>
          <div className="space-y-3.5">
            {appSpecs.map((spec, i) => {
              const Icon = spec.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="p-1.5 rounded-xl bg-[#EAEFEF] text-[#25343F] shrink-0 mt-0.5 border border-[#BFC9D1]/30">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold text-[#898989] uppercase tracking-wider">
                      {spec.label}
                    </div>
                    <div className="text-xs font-bold text-[#25343F] mt-0.5 truncate">{spec.value}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* About Studio */}
        <div className="lg:col-span-2 flex flex-col gap-3.5">
          <div className="bg-[#25343F] text-white rounded-3xl p-5 sm:p-6 shadow-sm flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <PrinterIcon className="w-5 h-5 text-[#FF9B51] stroke-[2]" />
              <h3 className="text-xs font-black text-white">Sukunaru Studio</h3>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Studio percetakan, desain grafis, dan pengembang sistem Point of Sale (POS) Kasir Terintegrasi.
              <br />
              Nyalindung, Desa Rajapolah, Kec. Rajapolah,
              <br />
              Kab. Tasikmalaya 46155
            </p>
            <p className="text-[11px] text-emerald-300 font-mono font-bold">WA: 089519203345</p>
            <div className="pt-3 border-t border-slate-700 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Hak Cipta © {currentYear} Sukunaru Studio</span>
              <span className="font-mono font-black text-[#FF9B51]">v2.0.0</span>
            </div>
          </div>

          {/* Version Tag */}
          <div className="bg-white border border-[#BFC9D1]/25 rounded-3xl p-4.5 shadow-sm text-center space-y-1">
            <p className="text-[10px] font-extrabold text-[#898989] uppercase tracking-wider">Versi Rilis Saat Ini</p>
            <p className="text-xl font-black text-[#25343F] tracking-tight">v2.0.0</p>
            <p className="text-[11px] text-[#898989] font-medium">Enterprise Cloud Release · {currentYear}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
