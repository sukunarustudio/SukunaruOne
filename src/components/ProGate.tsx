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
  'Manajemen Pesanan & Alur SPK Produksi',
  'Arus Kas, Laporan Profit & Analitik Penjualan',
  'Sinkronisasi Realtime Cloud Multi-Device',
  'Pencadangan Database Online & Pemulihan Instan',
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
    <div className="flex items-center justify-center min-h-[70vh] px-4 select-none">
      <div className="w-full max-w-sm mx-auto">
        {/* ── Lock Card ─────────────────────────────────────── */}
        <div className="relative bg-white dark:bg-[#151D2A] rounded-3xl border border-[#BFC9D1]/30 dark:border-slate-800 shadow-2xl overflow-hidden">
          {/* Gradient top bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9B51] via-[#FFB775] to-[#FF6A00]" />

          {/* Lock icon hero area */}
          <div className="flex flex-col items-center pt-8 pb-4 px-6">
            <div className="w-16 h-16 rounded-2xl bg-[#FF9B51]/15 border border-[#FF9B51]/30 flex items-center justify-center mb-4 shadow-sm text-[#FF6A00]">
              <LockClosedIcon className="w-8 h-8 stroke-[2]" />
            </div>
            <h2 className="text-xl font-black text-[#25343F] dark:text-white tracking-tight text-center">
              Fitur Pro BisnisUrang
            </h2>
            <p className="text-xs font-bold text-[#FF6A00] mt-0.5 text-center">
              {featureName}
            </p>
            <p className="text-xs text-[#898989] dark:text-slate-400 text-center mt-2 leading-relaxed">
              Fitur ini eksklusif untuk akun berlisensi aktif. Aktivasi lisensi permanen untuk membuka seluruh modul bisnis tanpa batas.
            </p>
          </div>

          {/* Benefits list */}
          <div className="px-6 pb-5">
            <div className="bg-[#EAEFEF]/60 dark:bg-slate-800/60 rounded-2xl p-4 space-y-2.5 border border-[#BFC9D1]/20">
              <p className="text-[10px] font-extrabold text-[#898989] uppercase tracking-wider mb-1">
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
