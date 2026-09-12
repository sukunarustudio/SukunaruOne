import React, { useState, useRef } from 'react';
import {
  BuildingStorefrontIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { BusinessSettings } from '../types';
import appLogo from '../assets/app-logo.png';

interface OnboardingViewProps {
  settings?: BusinessSettings;
  onUpdateSettings?: (newSettings: BusinessSettings) => void;
  onComplete: (targetScreen?: 'sign-in' | 'sign-up') => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const TOTAL_SLIDES = 3;

  const handleNext = () => {
    if (currentSlide < TOTAL_SLIDES - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete('sign-up');
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete('sign-in');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Detect horizontal swipe if deltaX exceeds 40px and is primarily horizontal
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0) {
        // Swipe left -> Next slide
        handleNext();
      } else {
        // Swipe right -> Prev slide
        handlePrev();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  return (
    <div
      className="fixed inset-0 w-full h-full bg-[#FAFBFB] dark:bg-[#0B0F17] text-[#25343F] dark:text-white flex flex-col justify-between select-none overflow-hidden transition-colors duration-200"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 18px)',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar Header */}
      <header className="w-full max-w-md mx-auto px-6 pt-2 flex items-center justify-end z-20 shrink-0 min-h-[36px]">
        {currentSlide < 2 && (
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-semibold text-[#8E8E93] hover:text-[#25343F] dark:text-slate-400 dark:hover:text-white px-3 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer active:scale-95"
          >
            Lewati
          </button>
        )}
      </header>

      {/* 3-Slide Seamless Horizontal Carousel Container */}
      <main className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center overflow-hidden my-auto relative">
        <div
          className="flex w-full h-full transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {/* ════════════════════════════════════════════════════════════════
              SLIDE 1: "Kelola Usaha Lebih Mudah"
          ════════════════════════════════════════════════════════════════ */}
          <div className="min-w-full w-full shrink-0 flex flex-col items-center justify-center px-6 text-center">
            {/* Hero Visual Card */}
            <div className="w-full max-w-xs aspect-[4/3] rounded-3xl bg-white dark:bg-[#151D2A] border border-black/[0.06] dark:border-white/[0.08] shadow-sm flex flex-col items-center justify-center p-6 relative overflow-hidden mb-8">
              {/* Subtle ambient glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FF9B51]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#25343F]/5 dark:bg-white/5 rounded-full blur-2xl pointer-events-none" />

              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 p-2 shadow-sm border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center mb-4">
                <img src={appLogo} alt="Bisnis Urang" className="w-full h-full object-contain" />
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Satu Tempat
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#25343F] dark:text-slate-200 text-[11px] font-semibold">
                  Bisnis Teratur
                </span>
              </div>
            </div>

            {/* Typography */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#25343F] dark:text-white tracking-tight leading-tight mb-2.5">
              Kelola Usaha Lebih Mudah
            </h1>
            <p className="text-xs sm:text-sm text-[#8E8E93] dark:text-slate-400 leading-relaxed max-w-xs font-medium">
              Semua aktivitas usaha tercatat dalam satu tempat.
            </p>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              SLIDE 2: "Semua Tercatat"
          ════════════════════════════════════════════════════════════════ */}
          <div className="min-w-full w-full shrink-0 flex flex-col items-center justify-center px-6 text-center">
            {/* Elegant App UI Micro-Module Grid */}
            <div className="w-full max-w-xs rounded-3xl bg-white dark:bg-[#151D2A] border border-black/[0.06] dark:border-white/[0.08] shadow-sm p-4 mb-8 space-y-2.5">
              {/* Module 1: Transaksi */}
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-[#FF9B51] flex items-center justify-center">
                    <BuildingStorefrontIcon className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#25343F] dark:text-white block leading-tight">
                      Transaksi &amp; Kasir
                    </span>
                    <span className="text-[10px] text-[#8E8E93] dark:text-slate-400">
                      Struk &amp; QRIS instan
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  Lunas
                </span>
              </div>

              {/* Module 2: Stok & Inventori */}
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <CubeIcon className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#25343F] dark:text-white block leading-tight">
                      Stok &amp; Bahan Baku
                    </span>
                    <span className="text-[10px] text-[#8E8E93] dark:text-slate-400">
                      Pengurangan otomatis
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#25343F] dark:text-slate-300 bg-black/[0.05] dark:bg-white/[0.08] px-2 py-0.5 rounded-md">
                  Aman
                </span>
              </div>

              {/* Module 3: Pesanan & SPK */}
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <ClipboardDocumentListIcon className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#25343F] dark:text-white block leading-tight">
                      Pesanan &amp; SPK
                    </span>
                    <span className="text-[10px] text-[#8E8E93] dark:text-slate-400">
                      Pantau antrean kerja
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                  Diproses
                </span>
              </div>

              {/* Module 4: Keuangan */}
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <BanknotesIcon className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#25343F] dark:text-white block leading-tight">
                      Laporan Keuangan
                    </span>
                    <span className="text-[10px] text-[#8E8E93] dark:text-slate-400">
                      Laba rugi &amp; arus kas
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  Presisi
                </span>
              </div>
            </div>

            {/* Typography */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#25343F] dark:text-white tracking-tight leading-tight mb-2.5">
              Semua Tercatat
            </h1>
            <p className="text-xs sm:text-sm text-[#8E8E93] dark:text-slate-400 leading-relaxed max-w-xs font-medium">
              Transaksi, stok, pesanan, dan keuangan tersusun rapi.
            </p>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              SLIDE 3: "Siap Mulai?"
          ════════════════════════════════════════════════════════════════ */}
          <div className="min-w-full w-full shrink-0 flex flex-col items-center justify-center px-6 text-center">
            {/* Minimalist Launch Crest */}
            <div className="w-full max-w-xs aspect-[4/3] rounded-3xl bg-white dark:bg-[#151D2A] border border-black/[0.06] dark:border-white/[0.08] shadow-sm flex flex-col items-center justify-center p-6 relative overflow-hidden mb-8">
              <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.03] to-transparent pointer-events-none" />

              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF9B51] to-[#FF8C3A] text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <SparklesIcon className="w-8 h-8 stroke-[2]" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-[#151D2A] shadow-xs">
                  <CheckCircleIcon className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>

              <span className="text-[11px] font-bold text-[#FF9B51] uppercase tracking-wider mb-1">
                Bisnis Urang 2.0
              </span>
              <p className="text-[11px] text-[#8E8E93] dark:text-slate-400 font-medium">
                Siap mendukung pertumbuhan usaha Anda
              </p>
            </div>

            {/* Typography */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#25343F] dark:text-white tracking-tight leading-tight mb-2.5">
              Siap Mulai?
            </h1>
            <p className="text-xs sm:text-sm text-[#8E8E93] dark:text-slate-400 leading-relaxed max-w-xs font-medium">
              Bangun kebiasaan usaha yang lebih tertata.
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Navigation & Pagination Controls */}
      <footer className="w-full max-w-md mx-auto px-6 pb-2 space-y-4 shrink-0 z-20">
        {/* Minimal Apple Pagination Indicator (● ○ ○) */}
        <div className="flex items-center justify-center gap-1.5" aria-label="Indikator Halaman">
          {[0, 1, 2].map(idx => {
            const isActive = idx === currentSlide;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Buka slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'w-6 bg-[#FF9B51]'
                    : 'w-1.5 bg-black/15 dark:bg-white/20 hover:bg-black/30 dark:hover:bg-white/40'
                }`}
              />
            );
          })}
        </div>

        {/* Action Buttons */}
        {currentSlide < 2 ? (
          <div className="flex items-center gap-2.5">
            {currentSlide > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="h-12 px-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.1] text-[#25343F] dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 font-semibold text-xs inline-flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              >
                <ChevronLeftIcon className="w-4 h-4 stroke-[2]" />
                <span>Kembali</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleNext}
              className="flex-1 h-12 px-5 rounded-2xl bg-[#FF9B51] hover:bg-[#ff8c3a] active:scale-[0.98] text-[#25343F] font-bold text-xs sm:text-sm shadow-xs transition inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Lanjut</span>
              <ChevronRightIcon className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handlePrev}
                className="h-12 px-4 rounded-2xl border border-black/[0.08] dark:border-white/[0.1] text-[#25343F] dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 font-semibold text-xs inline-flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              >
                <ChevronLeftIcon className="w-4 h-4 stroke-[2]" />
                <span>Kembali</span>
              </button>

              <button
                type="button"
                id="btn-onboarding-start"
                onClick={() => onComplete('sign-up')}
                className="flex-1 h-12 px-5 rounded-2xl bg-[#FF9B51] hover:bg-[#ff8c3a] active:scale-[0.98] text-[#25343F] font-bold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Mulai Sekarang</span>
                <ArrowRightIcon className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => onComplete('sign-in')}
                className="text-xs text-[#8E8E93] hover:text-[#25343F] dark:text-slate-400 dark:hover:text-white font-medium py-1 transition cursor-pointer"
              >
                Sudah punya akun? <span className="font-semibold text-[#25343F] dark:text-white underline underline-offset-2">Masuk</span>
              </button>
            </div>
          </div>
        )}

        {/* Subtle Slogan Footer */}
        <div className="text-center pt-0.5">
          <span className="text-[10px] text-[#8E8E93]/60 dark:text-slate-600 font-medium">
            Usaha Tercatat, Kelola Jadi Mudah.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default OnboardingView;