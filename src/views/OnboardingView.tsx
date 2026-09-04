import React, { useState, useRef, useEffect } from 'react';
import {
  XMarkIcon,
  ChevronRightIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CloudArrowUpIcon,
  ShoppingCartIcon,
  CubeIcon,
  Square3Stack3DIcon,
  WalletIcon,
  CalculatorIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  ArrowPathIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { BusinessSettings } from '../types';
import appLogo from '../assets/app-logo.png';

interface OnboardingViewProps {
  settings?: BusinessSettings;
  onUpdateSettings?: (newSettings: BusinessSettings) => void;
  onComplete: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  onComplete,
}) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const touchStartXRef = useRef<number>(0);
  const touchEndXRef = useRef<number>(0);

  const slides = [
    // ─── SLIDE 1: POS & Pesanan ──────────────────────────────────────────────
    {
      id: 'slide-pos',
      badge: 'KASIR & PESANAN',
      headline: 'Transaksi Cepat,\nAntrian Teratur.',
      description: 'Buka kasir POS untuk penjualan tunai, atau catat pesanan produksi dengan status pengerjaan real-time.',
      features: ['Kasir POS langsung bayar', 'Manajemen pesanan & status', 'Riwayat transaksi & refund'],
      accentColor: '#FF6A00',
      renderPreview: () => (
        <div className="w-full max-w-sm mx-auto bg-white rounded-2xl border border-[#BFC9D1]/40 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FF9B51]/15 flex items-center justify-center">
                <BuildingStorefrontIcon className="w-4 h-4 text-[#FF6A00]" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#25343F]">Kasir POS</div>
                <div className="text-[9px] text-[#898989]">Sesi: Kamis, 4 Sep</div>
              </div>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              ● Aktif
            </span>
          </div>

          {/* Items */}
          <div className="px-4 py-3 space-y-2">
            {[
              { name: 'Cetak Banner 2×1m', qty: 2, price: 'Rp 45.000', sub: 'Rp 90.000' },
              { name: 'Stiker Vinyl Die-Cut A3', qty: 5, price: 'Rp 15.000', sub: 'Rp 75.000' },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between p-2.5 rounded-xl bg-[#EAEFEF]/60 border border-[#BFC9D1]/20">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold text-[#25343F] truncate">{item.name}</div>
                  <div className="text-[9px] text-[#898989]">{item.qty} × {item.price}</div>
                </div>
                <div className="text-[11px] font-black text-[#25343F] shrink-0">{item.sub}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 pb-3 flex items-center justify-between">
            <span className="text-[10px] text-[#898989] font-medium">Total Pembayaran</span>
            <span className="text-base font-black text-[#FF6A00]">Rp 165.000</span>
          </div>

          {/* Order Pill Strip */}
          <div className="px-4 pb-3 grid grid-cols-3 gap-1.5 text-center">
            {[
              { label: 'Menunggu', count: 4, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
              { label: 'Diproses', count: 6, cls: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: 'Selesai', count: 9, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            ].map((s) => (
              <div key={s.label} className={`p-1.5 rounded-lg border ${s.cls}`}>
                <div className="text-xs font-black">{s.count}</div>
                <div className="text-[8px] font-semibold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    // ─── SLIDE 2: Produk & Bahan Baku ────────────────────────────────────────
    {
      id: 'slide-produksi',
      badge: 'PRODUK & PRODUKSI',
      headline: 'Stok & HPP\nTerpantau Otomatis.',
      description: 'Kelola katalog produk & jasa, hitung HPP yang tepat, dan pantau stok bahan baku agar tidak pernah kehabisan.',
      features: ['Katalog produk & jasa', 'Kalkulator HPP akurat', 'Peringatan stok bahan baku menipis'],
      accentColor: '#25343F',
      renderPreview: () => (
        <div className="w-full max-w-sm mx-auto bg-white rounded-2xl border border-[#BFC9D1]/40 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#25343F]/10 flex items-center justify-center">
                <CubeIcon className="w-4 h-4 text-[#25343F]" />
              </div>
              <div className="text-[11px] font-bold text-[#25343F]">Produk & Jasa</div>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/30">
              24 Produk
            </span>
          </div>

          {/* Product Cards */}
          <div className="px-4 py-3 space-y-2">
            {[
              { name: 'Print A3 Glossy', price: 'Rp 8.000', hpp: 'HPP Rp 4.200', status: 'Aktif', ok: true },
              { name: 'Laminating Doff A3', price: 'Rp 6.500', hpp: 'HPP Rp 3.100', status: 'Aktif', ok: true },
            ].map((p) => (
              <div key={p.name} className="flex items-center justify-between p-2.5 rounded-xl bg-[#EAEFEF]/60 border border-[#BFC9D1]/20">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold text-[#25343F] truncate">{p.name}</div>
                  <div className="text-[9px] text-[#898989]">{p.hpp}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-black text-[#FF6A00]">{p.price}</div>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${p.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Inventory Warning */}
          <div className="mx-4 mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2">
            <Square3Stack3DIcon className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-amber-700">Bahan Baku Menipis</div>
              <div className="text-[8px] text-amber-600">Kertas A3 Glossy · Sisa 12 lbr</div>
            </div>
            <span className="ml-auto text-[9px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full shrink-0">!</span>
          </div>
        </div>
      ),
    },

    // ─── SLIDE 3: Keuangan & Laporan ─────────────────────────────────────────
    {
      id: 'slide-keuangan',
      badge: 'KEUANGAN & LAPORAN',
      headline: 'Laba Rugi & Arus Kas\nLangsung Terlihat.',
      description: 'Pantau pemasukan, pengeluaran, dan laba bersih bisnis dari dashboard. Laporan penjualan, profit, dan stok siap dicetak kapan saja.',
      features: ['Arus kas & catatan pengeluaran', 'Laporan penjualan & profit', 'Laporan stok bahan baku'],
      accentColor: '#1A7F5A',
      renderPreview: () => (
        <div className="w-full max-w-sm mx-auto bg-white rounded-2xl border border-[#BFC9D1]/40 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <WalletIcon className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-[11px] font-bold text-[#25343F]">Arus Kas</div>
            </div>
            <span className="text-[9px] font-medium text-[#898989]">Sep 2026</span>
          </div>

          {/* KPI Grid */}
          <div className="px-4 py-3 grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider">Pemasukan</div>
              <div className="text-sm font-black text-emerald-700 mt-0.5">Rp 8.250.000</div>
              <div className="text-[9px] text-emerald-600 mt-0.5 font-semibold">↑ 22% bulan ini</div>
            </div>
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200">
              <div className="text-[9px] font-semibold text-red-600 uppercase tracking-wider">Pengeluaran</div>
              <div className="text-sm font-black text-red-600 mt-0.5">Rp 3.120.000</div>
              <div className="text-[9px] text-red-500 mt-0.5 font-semibold">↓ 5% dari target</div>
            </div>
          </div>

          {/* Profit Bar */}
          <div className="px-4 pb-3">
            <div className="p-2.5 rounded-xl bg-[#25343F] flex items-center justify-between">
              <div>
                <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Laba Bersih</div>
                <div className="text-sm font-black text-white mt-0.5">Rp 5.130.000</div>
              </div>
              <div className="text-right">
                <ChartBarIcon className="w-5 h-5 text-[#FF9B51] ml-auto mb-0.5" />
                <div className="text-[9px] font-black text-[#FF9B51]">Margin 62.2%</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ─── SLIDE 4: Cloud Sync & Multi-Device ──────────────────────────────────
    {
      id: 'slide-cloud',
      badge: 'BACKUP & CLOUD SYNC',
      headline: 'Data Aman,\nAkses dari Mana Saja.',
      description: 'Cadangkan data bisnis ke cloud dan akses dari HP, tablet, atau PC. Semua perangkat selalu tersinkronisasi secara otomatis.',
      features: ['Backup & restore data otomatis', 'Sinkronisasi multi-perangkat', 'Enkripsi via Supabase Cloud'],
      accentColor: '#2563EB',
      renderPreview: () => (
        <div className="w-full max-w-sm mx-auto bg-white rounded-2xl border border-[#BFC9D1]/40 shadow-lg overflow-hidden">
          {/* Cloud Status Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <CloudArrowUpIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#25343F]">Cloud Sync</div>
                <div className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  Terhubung & Sinkron
                </div>
              </div>
            </div>
            <ArrowPathIcon className="w-3.5 h-3.5 text-[#898989]" />
          </div>

          {/* Devices */}
          <div className="px-4 py-3 space-y-2">
            {[
              { label: 'PC Kasir Utama', sub: 'Desktop · Windows', Icon: ComputerDesktopIcon },
              { label: 'HP Owner', sub: 'Mobile · Android', Icon: DevicePhoneMobileIcon },
            ].map((d) => (
              <div key={d.label} className="flex items-center justify-between p-2.5 rounded-xl bg-[#EAEFEF]/60 border border-[#BFC9D1]/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#BFC9D1]/30 flex items-center justify-center text-[#25343F]">
                    <d.Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#25343F]">{d.label}</div>
                    <div className="text-[9px] text-[#898989]">{d.sub}</div>
                  </div>
                </div>
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
            ))}
          </div>

          {/* Last Sync */}
          <div className="mx-4 mb-3 p-2 rounded-xl bg-blue-50 border border-blue-200 text-center">
            <div className="text-[9px] text-blue-600 font-semibold">
              Terakhir sinkron: Hari ini 13:22 WIB
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleFinish = () => {
    try {
      localStorage.setItem('sukunaru_onboarding_completed', 'true');
    } catch {}
    onComplete();
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    const diffX = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(diffX) > 45) {
      if (diffX > 0) handleNext();
      else handlePrev();
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') handleFinish();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentSlide]);

  const activeSlide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;

  return (
    <div
      className="min-h-screen bg-[#EAEFEF] dark:bg-[#0B0F17] flex flex-col px-4 py-6 sm:py-8 sm:px-6 select-none transition-colors"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Top Navigation Bar ── */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-1 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#BFC9D1]/30 dark:border-slate-800 bg-white dark:bg-slate-800 shrink-0">
            <img src={appLogo} alt="BisnisUrang" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-sm text-[#25343F] dark:text-white tracking-tight">BisnisUrang</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleFinish}
            className="text-xs font-semibold text-[#898989] hover:text-[#25343F] dark:hover:text-white px-2.5 py-1.5 rounded-lg transition cursor-pointer"
          >
            Lewati
          </button>
          <button
            type="button"
            onClick={handleFinish}
            aria-label="Tutup onboarding"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#898989] hover:text-[#25343F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center py-4">
        {/* Badge */}
        <div className="mb-4 text-center">
          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#FF9B51]/15 text-[#FF6A00] border border-[#FF9B51]/30">
            {activeSlide.badge}
          </span>
        </div>

        {/* Preview Card */}
        <div className="w-full mb-5">
          {activeSlide.renderPreview()}
        </div>

        {/* Text Content */}
        <div className="text-center px-2 space-y-2 max-w-sm mx-auto">
          <h2 className="text-xl sm:text-2xl font-black text-[#25343F] dark:text-white tracking-tight leading-snug whitespace-pre-line">
            {activeSlide.headline}
          </h2>
          <p className="text-xs sm:text-sm text-[#898989] dark:text-slate-400 leading-relaxed font-medium">
            {activeSlide.description}
          </p>
        </div>

        {/* Feature Bullets */}
        <div className="mt-4 flex flex-col items-center gap-1.5">
          {activeSlide.features.map((feat) => (
            <div key={feat} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#FF9B51]/20 border border-[#FF9B51]/40 flex items-center justify-center shrink-0">
                <CheckIcon className="w-2.5 h-2.5 text-[#FF6A00] stroke-[3]" />
              </div>
              <span className="text-[11px] font-semibold text-[#25343F] dark:text-slate-300">{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Controls ── */}
      <div className="max-w-md w-full mx-auto space-y-4 pb-2 shrink-0">
        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Pindah ke slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                idx === currentSlide
                  ? 'w-7 h-2 bg-[#FF6A00]'
                  : 'w-2 h-2 bg-[#BFC9D1]/60 dark:bg-slate-700 hover:bg-[#898989]'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleNext}
          className="w-full py-3.5 px-5 rounded-2xl bg-[#FF6A00] hover:bg-[#e65c00] active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLast ? (
            <>
              <SparklesIcon className="w-4 h-4" />
              <span>Mulai Gunakan BisnisUrang</span>
            </>
          ) : (
            <>
              <span>Lanjut</span>
              <ChevronRightIcon className="w-4 h-4 stroke-[2.5]" />
            </>
          )}
        </button>

        {/* Slide count hint */}
        <p className="text-center text-[10px] text-[#BFC9D1] dark:text-slate-600 font-medium">
          {currentSlide + 1} / {slides.length}
        </p>
      </div>
    </div>
  );
};
