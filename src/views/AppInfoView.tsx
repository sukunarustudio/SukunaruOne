import React from 'react';
import { ArrowLeftIcon, InformationCircleIcon, CircleStackIcon, ShieldCheckIcon, ServerIcon, Square3Stack3DIcon, SparklesIcon, PrinterIcon, ComputerDesktopIcon, CodeBracketIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { ViewType } from '../types';

interface AppInfoViewProps {
  onNavigate?: (view: ViewType) => void;
}

export const AppInfoView: React.FC<AppInfoViewProps> = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();

  const features = [
    {
      icon: CircleStackIcon,
      iconBg: 'bg-[#EAEFEF] border-[#BFC9D1] text-[#25343F]',
      title: 'Kasir POS & Manajemen Order',
      desc: 'Transaksi kasir, pesanan kerja (SPK), pelunasan DP, dan cetak faktur langsung dari satu layar.',
    },
    {
      icon: ServerIcon,
      iconBg: 'bg-[#EAEFEF] border-[#BFC9D1] text-[#25343F]',
      title: 'Stok Bahan Baku Otomatis',
      desc: 'Setiap transaksi kasir maupun order memotong stok bahan baku secara otomatis sesuai resep BOM produk.',
    },
    {
      icon: ShieldCheckIcon,
      iconBg: 'bg-[#EAEFEF] border-[#BFC9D1] text-[#25343F]',
      title: '100% Offline & Data Lokal',
      desc: 'Berjalan sepenuhnya tanpa internet. Data tersimpan aman di database SQLite lokal perangkat Anda.',
    },
  ];

  const sysSpecs = [
    { label: 'Versi Aplikasi', value: 'v1.1.0 — Sukunaru ONE', icon: InformationCircleIcon },
    { label: 'Database', value: 'SQLite 3 (better-sqlite3, WAL Mode)', icon: CircleStackIcon },
    { label: 'Framework', value: 'React 19 + TypeScript', icon: CodeBracketIcon },
    { label: 'Tampilan', value: 'Tailwind CSS v4', icon: SparklesIcon },
    { label: 'Mode', value: 'Local-First / Offline', icon: ServerIcon },
    { label: 'Platform', value: 'Web App (Desktop & Android)', icon: ComputerDesktopIcon },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-3.5 animate-fade-in pb-24">
      {/* ── STICKY TOP HEADER: [ ← Judul ] ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate?.('profile')}
            className="h-9 w-9 rounded-xl bg-white hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 shadow-md"
            title="Kembali ke Profil"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-[#25343F] leading-tight tracking-tight truncate">
              Versi Aplikasi
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
              Spesifikasi sistem, build & lisensi Sukunaru Studio
            </p>
          </div>
        </div>
      </div>
      {/* Header Banner */}
      <div className="bg-white border border-[#BFC9D1]/25 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-bl from-zinc-100 to-transparent rounded-full -mr-24 -mt-24 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5">
            {/* App Logo */}
            <div className="w-14 h-14 rounded-2xl bg-zinc-950 text-white font-black text-base flex items-center justify-center shadow-md shrink-0 tracking-widest select-none">
              S1
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-[#25343F] tracking-tight">SUKUNARU ONE</h1>
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-[#FF9B51] text-[#25343F] rounded-full">
                  v1.1
                </span>
              </div>
              <p className="text-xs text-[#898989] font-medium mt-0.5">
                Sistem Manajemen Bisnis Percetakan &amp; POS Kasir
              </p>
              <p className="text-[11px] text-[#898989] mt-0.5 font-mono">
                by Sukunaru Studio
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-4 sm:pt-0 border-zinc-100 shrink-0">
            <span className="text-[10px] font-semibold text-[#898989] uppercase tracking-wider">
              Status Sistem
            </span>
            <span className="text-xs font-bold text-[#25343F] flex items-center gap-1.5 mt-0.5">
              <CheckCircleIcon className="w-4 h-4" />
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
            <div key={i} className="bg-white border border-[#BFC9D1]/25 rounded-xl p-4 shadow-sm flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${f.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#25343F]">{f.title}</h3>
                <p className="text-[11px] text-[#898989] mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Specs + About Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3.5">
        {/* Specs */}
        <div className="lg:col-span-3 bg-white border border-[#BFC9D1]/25 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 mb-4">
            <Square3Stack3DIcon className="w-4 h-4 text-zinc-600" />
            <h2 className="text-sm font-bold text-[#25343F]">Spesifikasi Teknis</h2>
          </div>
          <div className="space-y-3">
            {sysSpecs.map((spec, i) => {
              const Icon = spec.icon;
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="p-1 rounded-md bg-[#EAEFEF] text-[#898989] shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-[#898989] uppercase tracking-wider">
                      {spec.label}
                    </div>
                    <div className="text-xs font-medium text-[#25343F] mt-0.5">{spec.value}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* About Studio */}
        <div className="lg:col-span-2 flex flex-col gap-3.5">
          <div className="bg-zinc-900 text-white rounded-xl p-5 shadow-sm flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <PrinterIcon className="w-4 h-4 text-[#898989]" />
              <h3 className="text-xs font-bold text-zinc-100">Sukunaru Studio</h3>
            </div>
            <p className="text-[11px] text-[#898989] leading-relaxed">
              Studio percetakan, desain grafis, dan pembuatan media promosi.
              <br />
              Nyalindung, Desa Rajapolah, Kec. Rajapolah,
              <br />
              Kab. Tasikmalaya 46155
            </p>
            <p className="text-[11px] text-[#898989] font-mono">WA: 089519203345</p>
            <div className="pt-3 border-t border-zinc-800 text-[10px] text-[#898989] flex items-center justify-between">
              <span>Hak Cipta © {currentYear} Sukunaru Studio</span>
              <span className="font-mono font-bold text-[#898989]">SUKUNARU ONE</span>
            </div>
          </div>

          {/* Version Tag */}
          <div className="bg-white border border-[#BFC9D1]/25 rounded-xl p-4 shadow-sm text-center space-y-1">
            <p className="text-[10px] font-semibold text-[#898989] uppercase tracking-wider">Versi Saat Ini</p>
            <p className="text-lg font-black text-[#25343F] tracking-tight">1.1.0</p>
            <p className="text-[11px] text-[#898989]">Stable Release · Agustus {currentYear}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
