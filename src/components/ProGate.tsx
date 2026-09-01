import React from 'react';
import { LockClosedIcon, StarIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { useLicense } from '../hooks/useLicense';
import { ViewType } from '../types';

interface ProGateProps {
  /** Navigates to the activation screen when button is clicked */
  onNavigate: (view: ViewType) => void;
  /** Display name of the feature being locked */
  featureName: string;
  /** Short list of benefits shown on the paywall card (max ~4 items) */
  benefits?: string[];
  children: React.ReactNode;
}

const DEFAULT_BENEFITS = [
  'Manajemen Pesanan & Status Produksi',
  'Kalkulator HPP & Biaya Produksi Akurat',
  'Arus Kas, Laporan Profit & Analitik Bisnis',
  'Scan Barcode Produk Fisik (Kamera & USB)',
  'Sinkronisasi Realtime Cloud Multi-Device',
];

/**
 * ProGate — wraps content behind a license check.
 *
 * - If the device has an active Pro/Trial (non-expired) license → renders children normally.
 * - Otherwise → renders a full-page paywall card with an "Aktivasi Sekarang" CTA.
 */
export const ProGate: React.FC<ProGateProps> = ({
  onNavigate,
  featureName,
  benefits = DEFAULT_BENEFITS,
  children,
}) => {
  const { isPro } = useLicense();

  if (isPro) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-sm mx-auto">
        {/* ── Lock Card ─────────────────────────────────────── */}
        <div className="relative bg-white rounded-2xl border border-[#BFC9D1]/40 shadow-xl overflow-hidden">
          {/* Gradient top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-[#FF9B51] via-[#FFB775] to-[#FF9B51]" />

          {/* Lock icon hero area */}
          <div className="flex flex-col items-center pt-8 pb-4 px-6">
            <div className="w-16 h-16 rounded-2xl bg-[#FF9B51]/10 border border-[#FF9B51]/20 flex items-center justify-center mb-4 shadow-inner">
              <LockClosedIcon className="w-8 h-8 text-[#FF9B51]" />
            </div>
            <h2 className="text-xl font-black text-[#25343F] tracking-tight text-center">
              Fitur Pro
            </h2>
            <p className="text-sm font-semibold text-[#FF9B51] mt-0.5 text-center">
              {featureName}
            </p>
            <p className="text-xs text-[#898989] text-center mt-2 leading-relaxed">
              Fitur ini hanya tersedia untuk pengguna berlisensi aktif. Aktivasi sekarang untuk mengakses semua fitur Sukunaru Studio.
            </p>
          </div>

          {/* Benefits list */}
          <div className="px-6 pb-5">
            <div className="bg-[#EAEFEF]/70 rounded-xl p-4 space-y-2.5">
              <p className="text-[10px] font-bold text-[#898989] uppercase tracking-widest mb-1">
                ✦ Termasuk dalam Lisensi Pro
              </p>
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircleIcon className="w-4 h-4 text-[#52D5BA] shrink-0 mt-0.5" />
                  <span className="text-xs text-[#25343F] font-medium leading-snug">{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="px-6 pb-7">
            <button
              type="button"
              onClick={() => onNavigate('activation')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#FF9B51] hover:bg-[#e8894a] text-white text-sm font-black tracking-tight shadow-md shadow-[#FF9B51]/25 active:scale-95 transition-all cursor-pointer"
            >
              <StarIcon className="w-4 h-4" />
              Aktivasi Lisensi Sekarang
            </button>
          </div>
        </div>

        {/* Subtle footer note */}
        <p className="text-center text-[11px] text-[#898989] mt-4 font-medium">
          Sudah punya Serial Key? Klik <strong>Aktivasi Lisensi Sekarang</strong> dan masukkan kodenya.
        </p>
      </div>
    </div>
  );
};
