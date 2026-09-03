import React from 'react';
import { LockClosedIcon, ArrowRightOnRectangleIcon, UserPlusIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface LimitedModeViewProps {
  onSignIn: () => void;
  onSignUp: () => void;
  onContinueOffline?: () => void;
}

export const LimitedModeView: React.FC<LimitedModeViewProps> = ({
  onSignIn,
  onSignUp,
  onContinueOffline,
}) => {
  return (
    <div className="min-h-screen bg-[#EAEFEF] dark:bg-[#0B0F17] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#151D2A] rounded-3xl border border-[#BFC9D1]/30 dark:border-slate-800 shadow-2xl p-6 sm:p-8 text-center animate-fade-in relative overflow-hidden">
        {/* Decorative background aura */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#FF9B51]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-[#25343F]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#25343F]/10 dark:bg-[#FF9B51]/15 text-[#25343F] dark:text-[#FF9B51] mx-auto flex items-center justify-center mb-4 border border-[#25343F]/15 dark:border-[#FF9B51]/30">
          <LockClosedIcon className="w-8 h-8 stroke-[2]" />
        </div>

        {/* Title & Subtitle */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold mb-3">
          <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500" />
          Data Aman di Perangkat
        </span>

        <h1 className="text-xl sm:text-2xl font-black text-[#25343F] dark:text-white tracking-tight">
          Mode Terbatas
        </h1>
        <p className="text-xs sm:text-sm text-[#898989] dark:text-slate-400 mt-2 mb-6 leading-relaxed max-w-xs mx-auto">
          Masuk ke akun untuk mengakses data bisnis, pesanan, dan fitur lengkap studio Anda.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={onSignIn}
            className="w-full py-3 px-4 bg-[#FF9B51] hover:bg-[#ff8c38] active:scale-[0.98] text-[#25343F] font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 stroke-[2.2]" />
            <span>Masuk ke Akun</span>
          </button>

          <button
            type="button"
            onClick={onSignUp}
            className="w-full py-3 px-4 bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-[0.98] text-[#25343F] dark:text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlusIcon className="w-5 h-5" />
            <span>Buat Akun Baru</span>
          </button>
        </div>

        {onContinueOffline && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onContinueOffline}
              className="text-xs text-[#898989] dark:text-slate-400 hover:text-[#25343F] dark:hover:text-white underline cursor-pointer transition-colors"
            >
              Lanjutkan Mode Offline Tanpa Akun
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
