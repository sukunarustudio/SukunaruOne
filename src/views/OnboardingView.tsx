import React, { useState, useRef, useEffect } from 'react';
import {
  XMarkIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CloudArrowUpIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
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
    {
      id: 'slide-pos-products',
      headline: 'Kelola Bisnis, Jadi Lebih Mudah.',
      description: 'Kelola produk, pesanan, pelanggan, dan keuangan bisnis dari satu tempat.',
      badge: 'POS & KASIR TERPADU',
      renderPreview: () => (
        <div className="w-full max-w-sm mx-auto bg-white dark:bg-[#151D2A] rounded-2xl border border-[#BFC9D1]/40 dark:border-slate-800 shadow-md p-4 transition-all">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#BFC9D1]/20 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FF9B51]/15 text-[#FF6A00] flex items-center justify-center">
                <ShoppingCartIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#25343F] dark:text-white">Kasir Penjualan</div>
                <div className="text-[9px] text-[#898989] dark:text-slate-400">Order #ORD-2026-001</div>
              </div>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              POS Aktif
            </span>
          </div>

          {/* Product Items Mini List */}
          <div className="py-2.5 space-y-2">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#EAEFEF]/60 dark:bg-slate-900/60 border border-[#BFC9D1]/20 dark:border-slate-800 text-xs">
              <div className="min-w-0">
                <div className="font-semibold text-[#25343F] dark:text-slate-200 truncate text-[11px]">
                  Cetak Banner Spanduk (2x1m)
                </div>
                <div className="text-[9px] text-[#898989] dark:text-slate-400">2 pcs × Rp 45.000</div>
              </div>
              <div className="font-bold text-[#25343F] dark:text-white text-[11px]">Rp 90.000</div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-[#EAEFEF]/60 dark:bg-slate-900/60 border border-[#BFC9D1]/20 dark:border-slate-800 text-xs">
              <div className="min-w-0">
                <div className="font-semibold text-[#25343F] dark:text-slate-200 truncate text-[11px]">
                  Stiker Vinyl Die Cut A3+
                </div>
                <div className="text-[9px] text-[#898989] dark:text-slate-400">5 lembar × Rp 15.000</div>
              </div>
              <div className="font-bold text-[#25343F] dark:text-white text-[11px]">Rp 75.000</div>
            </div>
          </div>

          {/* Cart Summary Bar */}
          <div className="pt-2.5 border-t border-[#BFC9D1]/20 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-medium text-[#898989] dark:text-slate-400">Total Pembayaran</span>
            <span className="text-sm font-black text-[#FF6A00]">Rp 165.000</span>
          </div>
        </div>
      ),
    },
    {
      id: 'slide-data-orders',
      headline: 'Semua Data Bisnis, Lebih Teratur.',
      description: 'Pantau transaksi, stok, pelanggan, pesanan, dan arus kas dengan lebih praktis.',
      badge: 'LAPORAN & ARUS KAS',
      renderPreview: () => (
        <div className="w-full max-w-sm mx-auto bg-white dark:bg-[#151D2A] rounded-2xl border border-[#BFC9D1]/40 dark:border-slate-800 shadow-md p-4 transition-all">
          {/* KPI Mini Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2.5 rounded-xl bg-[#EAEFEF]/70 dark:bg-slate-900/70 border border-[#BFC9D1]/25 dark:border-slate-800">
              <div className="text-[9px] font-semibold text-[#898989] dark:text-slate-400 uppercase tracking-wider">
                Omset Hari Ini
              </div>
              <div className="text-sm font-black text-[#25343F] dark:text-white mt-0.5">
                Rp 2.450.000
              </div>
              <div className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-0.5">
                <span>↑ 18%</span>
                <span className="text-[#898989] dark:text-slate-500 font-normal">dari kemarin</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#EAEFEF]/70 dark:bg-slate-900/70 border border-[#BFC9D1]/25 dark:border-slate-800">
              <div className="text-[9px] font-semibold text-[#898989] dark:text-slate-400 uppercase tracking-wider">
                Laba Bersih
              </div>
              <div className="text-sm font-black text-[#FF6A00] mt-0.5">
                Rp 1.120.000
              </div>
              <div className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                Margin 45.7%
              </div>
            </div>
          </div>

          {/* Mini Status Pipeline */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-semibold text-[#898989] dark:text-slate-400 px-1">
              <span>Status Pesanan</span>
              <span className="text-[#FF6A00]">12 Aktif</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
                <div className="text-xs font-black text-amber-700 dark:text-amber-300">4</div>
                <div className="text-[8px] font-medium text-amber-600 dark:text-amber-400">Baru</div>
              </div>
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60">
                <div className="text-xs font-black text-blue-700 dark:text-blue-300">6</div>
                <div className="text-[8px] font-medium text-blue-600 dark:text-blue-400">Diproses</div>
              </div>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                <div className="text-xs font-black text-emerald-700 dark:text-emerald-300">2</div>
                <div className="text-[8px] font-medium text-emerald-600 dark:text-emerald-400">Siap Ambil</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'slide-devices-cloud',
      headline: 'Gunakan di Lebih dari Satu Perangkat.',
      description: 'Hubungkan perangkatmu dan akses data bisnis yang sama dengan sinkronisasi cloud.',
      badge: 'REALTIME CLOUD SYNC',
      renderPreview: () => (
        <div className="w-full max-w-sm mx-auto bg-white dark:bg-[#151D2A] rounded-2xl border border-[#BFC9D1]/40 dark:border-slate-800 shadow-md p-4 transition-all">
          {/* Cloud Sync Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#BFC9D1]/20 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FF6A00]/10 text-[#FF6A00] flex items-center justify-center">
                <CloudArrowUpIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#25343F] dark:text-white">Cloud Database</div>
                <div className="text-[9px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Terhubung &amp; Sinkron
                </div>
              </div>
            </div>
            <ArrowPathIcon className="w-3.5 h-3.5 text-[#898989] dark:text-slate-400" />
          </div>

          {/* Devices Grid */}
          <div className="py-2.5 space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#EAEFEF]/60 dark:bg-slate-900/60 border border-[#BFC9D1]/20 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-[#BFC9D1]/30 dark:border-slate-700 flex items-center justify-center text-[#25343F] dark:text-white">
                  <ComputerDesktopIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#25343F] dark:text-white">PC Kasir Utama</div>
                  <div className="text-[9px] text-[#898989] dark:text-slate-400">Desktop · Windows</div>
                </div>
              </div>
              <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#EAEFEF]/60 dark:bg-slate-900/60 border border-[#BFC9D1]/20 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-[#BFC9D1]/30 dark:border-slate-700 flex items-center justify-center text-[#25343F] dark:text-white">
                  <DevicePhoneMobileIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#25343F] dark:text-white">HP Owner / Kasir 2</div>
                  <div className="text-[9px] text-[#898989] dark:text-slate-400">Mobile · Android</div>
                </div>
              </div>
              <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
          </div>

          {/* Security footnote */}
          <div className="pt-2 text-center text-[9px] text-[#898989] dark:text-slate-400">
            Enkripsi database multi-perangkat via Supabase Cloud
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

  // Touch handlers for natural horizontal swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    const diffX = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(diffX) > 45) {
      if (diffX > 0) {
        // swipe left -> next
        handleNext();
      } else {
        // swipe right -> prev
        handlePrev();
      }
    }
  };

  // Keyboard arrow listener
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

  return (
    <div className="min-h-screen bg-[#EAEFEF] dark:bg-[#0B0F17] flex flex-col justify-between px-4 py-6 sm:py-8 sm:px-6 select-none transition-colors">
      
      {/* Top Navigation Bar: Brand + Skip & Close */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#BFC9D1]/30 dark:border-slate-800 bg-white dark:bg-slate-800 shrink-0">
            <img src={appLogo} alt="BisnisUrang" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-sm text-[#25343F] dark:text-white tracking-tight">
            BisnisUrang
          </span>
        </div>

        {/* Skip and Close Button */}
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
            aria-label="Tutup onboarding dan langsung masuk Dashboard"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#898989] hover:text-[#25343F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Slide Content (Horizontal Swipe Area) */}
      <div
        className="max-w-md w-full mx-auto my-auto py-4 flex flex-col items-center touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Category Pill Tag */}
        <div className="mb-4">
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FF9B51]/15 text-[#FF6A00] border border-[#FF9B51]/30">
            {activeSlide.badge}
          </span>
        </div>

        {/* Visual / UI Preview */}
        <div className="w-full mb-6 transition-all duration-300 transform">
          {activeSlide.renderPreview()}
        </div>

        {/* Headline & Description */}
        <div className="text-center px-2 space-y-2 max-w-sm">
          <h2 className="text-xl sm:text-2xl font-black text-[#25343F] dark:text-white tracking-tight leading-snug">
            {activeSlide.headline}
          </h2>
          <p className="text-xs sm:text-sm text-[#898989] dark:text-slate-400 leading-relaxed font-medium">
            {activeSlide.description}
          </p>
        </div>
      </div>

      {/* Bottom Controls: Indicators + Action Button */}
      <div className="max-w-md w-full mx-auto space-y-5 pb-2">
        {/* Pagination Dots (● ○ ○) */}
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
          {currentSlide === slides.length - 1 ? (
            <>
              <SparklesIcon className="w-4 h-4" />
              <span>Mulai Sekarang</span>
            </>
          ) : (
            <>
              <span>Lanjut</span>
              <ChevronRightIcon className="w-4 h-4 stroke-[2.5]" />
            </>
          )}
        </button>
      </div>

    </div>
  );
};
