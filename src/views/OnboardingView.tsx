import React, { useState } from 'react';
import {
  ShoppingCartIcon,
  CalculatorIcon,
  CloudArrowUpIcon,
  CheckIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { BusinessSettings } from '../types';
import appLogo from '../assets/app-logo.png';

interface OnboardingViewProps {
  settings?: BusinessSettings;
  onUpdateSettings?: (newSettings: BusinessSettings) => void;
  onComplete: (targetScreen?: 'sign-in' | 'sign-up') => void;
}

interface SlideItem {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  isWelcome?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  highlights: string[];
}

const slides: SlideItem[] = [
  {
    id: 'slide-welcome',
    badge: 'SELAMAT DATANG',
    title: 'Selamat Datang di BisnisUrang',
    subtitle: 'Satu ekosistem terpadu untuk mengelola seluruh aktivitas operasional bisnis Anda dengan lebih rapi, terstruktur, dan efisien.',
    isWelcome: true,
    highlights: [
      'Solusi terintegrasi dari kasir hingga pembukuan keuangan',
      'Dirancang untuk UMKM, ritel, percetakan & workshop',
      'Dapat diakses lancar di smartphone, tablet, dan komputer',
    ],
  },
  {
    id: 'slide-pos-orders',
    badge: 'KASIR & PESANAN',
    title: 'Kelola Penjualan & Pesanan',
    subtitle: 'Proses transaksi kasir kilat, cetak struk thermal, dan terbitkan Surat Perintah Kerja (SPK) workshop siap cetak.',
    icon: ShoppingCartIcon,
    highlights: [
      'Kasir POS cepat & integrasi barcode scanner',
      'Penerbitan SPK Workshop dan Invoice resmi',
      'Kirim nota transaksi digital langsung ke WhatsApp',
    ],
  },
  {
    id: 'slide-hpp-inventory',
    badge: 'HPP & INVENTORI',
    title: 'Kalkulator HPP & Stok Bahan',
    subtitle: 'Hitung Harga Pokok Produksi secara akurat dari rincian bahan baku dan pantau sisa stok secara real-time.',
    icon: CalculatorIcon,
    highlights: [
      'Kalkulasi HPP otomatis dan penetapan margin laba',
      'Pengurangan stok bahan baku otomatis saat pesanan dibuat',
      'Peringatan otomatis saat persediaan bahan menipis',
    ],
  },
  {
    id: 'slide-cloud-reports',
    badge: 'CLOUD & KEUANGAN',
    title: 'Cloud Sync & Laporan Keuangan',
    subtitle: 'Data tersinkronisasi otomatis antar perangkat dengan rangkuman omzet, laba rugi, dan arus kas yang presisi.',
    icon: CloudArrowUpIcon,
    highlights: [
      'Realtime Cloud Sync multi-perangkat tanpa jeda',
      'Laporan omzet, laba bersih, dan arus kas otomatis',
      'Ekspor laporan bisnis ke format Excel dan PDF',
    ],
  },
  {
    id: 'slide-trial-pro',
    badge: 'TRIAL PRO 14 HARI GRATIS',
    title: 'Coba Seluruh Fitur Pro Gratis 14 Hari',
    subtitle: 'Daftarkan akun Anda sekarang dan langsung nikmati akses penuh tanpa komitmen untuk mengelola bisnis lebih maksimal sejak hari pertama.',
    icon: SparklesIcon,
    highlights: [
      'Akses tanpa batas ke seluruh modul & fitur Pro',
      'Realtime Cloud Sync untuk kolaborasi antar perangkat',
      'Masa percobaan aktif otomatis tanpa memerlukan kartu kredit',
    ],
  },
];

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
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

  const activeSlide = slides[currentSlide];
  const IconComponent = activeSlide.icon;
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="min-h-screen bg-[#EAEFEF] dark:bg-[#0B0F17] flex flex-col justify-between px-4 py-6 sm:px-6 sm:py-8 transition-colors">
      {/* Top Header */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-xs border border-[#BFC9D1]/40 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center">
            <img src={appLogo} alt="BisnisUrang" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-bold text-sm text-[#25343F] dark:text-white tracking-tight block leading-tight">
              BisnisUrang
            </span>
            <span className="text-[10px] text-[#898989] dark:text-slate-400 font-medium block">
              Sistem Operasional Bisnis
            </span>
          </div>
        </div>

        {!isLastSlide && (
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-semibold text-[#898989] hover:text-[#25343F] dark:text-slate-400 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
          >
            Lewati
          </button>
        )}
      </header>

      {/* Main Slide Card (Clean fade transition, zero carousel jitter) */}
      <main className="w-full max-w-md mx-auto my-auto py-4">
        <div className="bg-white dark:bg-[#151D2A] rounded-3xl border border-[#BFC9D1]/30 dark:border-slate-800 shadow-sm p-6 sm:p-8 relative overflow-hidden transition-all">
          {/* Progress Indicators */}
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentSlide
                    ? 'w-7 bg-[#FF6A00]'
                    : 'w-2 bg-[#BFC9D1]/50 dark:bg-slate-700 hover:bg-[#898989]'
                }`}
                aria-label={`Buka slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Slide Content */}
          <div
            key={activeSlide.id}
            className="animate-in fade-in duration-300 flex flex-col items-center text-center"
          >
            {/* Visual Icon / Logo Container */}
            {activeSlide.isWelcome ? (
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md border border-[#BFC9D1]/40 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 mb-5 flex items-center justify-center">
                <img src={appLogo} alt="BisnisUrang" className="w-full h-full object-cover rounded-xl" />
              </div>
            ) : IconComponent ? (
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xs mb-5 ${
                isLastSlide
                  ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-[#FF6A00] dark:text-[#FF9B51] border border-[#FF6A00]/30 ring-4 ring-orange-500/10'
                  : 'bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/20 text-[#FF6A00] dark:text-[#FF9B51]'
              }`}>
                <IconComponent className="w-8 h-8 stroke-[1.8]" />
              </div>
            ) : null}

            {/* Category Tag */}
            <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md mb-2 ${
              isLastSlide
                ? 'bg-orange-500/15 text-[#FF6A00] dark:text-[#FF9B51] border border-orange-500/30'
                : 'bg-[#25343F]/5 dark:bg-slate-800 text-[#25343F] dark:text-slate-300 border border-[#25343F]/10 dark:border-slate-700/60'
            }`}>
              {activeSlide.badge}
            </span>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-[#25343F] dark:text-white tracking-tight leading-snug">
              {activeSlide.title}
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-[#898989] dark:text-slate-400 mt-2 leading-relaxed max-w-sm">
              {activeSlide.subtitle}
            </p>

            {/* Feature Highlights */}
            <div className="w-full mt-6 space-y-2.5 text-left">
              {activeSlide.highlights.map((highlight, hIdx) => (
                <div
                  key={hIdx}
                  className={`p-3 rounded-xl flex items-start gap-2.5 transition-colors ${
                    isLastSlide
                      ? 'bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40'
                      : 'bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isLastSlide
                      ? 'bg-orange-500/15 text-[#FF6A00] dark:text-[#FF9B51]'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    <CheckIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span className={`text-xs font-medium leading-relaxed ${
                    isLastSlide
                      ? 'text-[#25343F] dark:text-slate-200 font-semibold'
                      : 'text-[#25343F] dark:text-slate-200'
                  }`}>
                    {highlight}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="w-full max-w-md mx-auto space-y-3">
        {!isLastSlide ? (
          <div className="flex items-center gap-2.5">
            {currentSlide > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="h-12 px-4 rounded-xl border border-[#BFC9D1]/60 dark:border-slate-700 text-[#25343F] dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 font-semibold text-xs inline-flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                <span>Kembali</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex-1 h-12 px-5 rounded-xl bg-[#FF6A00] hover:bg-[#e65c00] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-sm transition inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Lanjutkan</span>
              <ChevronRightIcon className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => onComplete('sign-up')}
              className="w-full h-12 px-5 rounded-xl bg-[#FF6A00] hover:bg-[#e65c00] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Daftar Sekarang &amp; Klaim Pro 14 Hari</span>
              <ArrowRightIcon className="w-4 h-4 stroke-[2.2]" />
            </button>

            <button
              type="button"
              onClick={() => onComplete('sign-in')}
              className="w-full h-11 px-5 rounded-xl border border-[#BFC9D1]/60 dark:border-slate-700 text-[#25343F] dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 font-semibold text-xs sm:text-sm transition inline-flex items-center justify-center cursor-pointer"
            >
              Sudah punya akun? Masuk
            </button>
          </div>
        )}

        <div className="text-center pt-1">
          <span className="text-[10px] text-[#CACACA] dark:text-slate-600">
            BisnisUrang Studio OS · Kelola Bisnis Jadi Lebih Mudah
          </span>
        </div>
      </footer>
    </div>
  );
};