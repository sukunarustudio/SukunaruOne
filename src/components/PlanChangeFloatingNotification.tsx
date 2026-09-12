import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  ClockIcon,
  XMarkIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useLicense, PlanType } from '../hooks/useLicense';
import { ViewType } from '../types';

interface PlanChangeFloatingNotificationProps {
  onNavigate?: (view: ViewType) => void;
}

const STORAGE_LAST_PLAN_KEY = 'sukunaru_last_acknowledged_plan';

export const PlanChangeFloatingNotification: React.FC<PlanChangeFloatingNotificationProps> = ({
  onNavigate,
}) => {
  const { isActivated, plan, isTrial, daysRemaining, licenseKey } = useLicense();

  const [notification, setNotification] = useState<{
    isOpen: boolean;
    plan: PlanType;
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!isActivated || !plan) return;

    const isNewSignupPending =
      localStorage.getItem('sukunaru_new_signup_welcome') === 'true' ||
      sessionStorage.getItem('sukunaru_is_new_signup') === 'true';

    const lastAcknowledged = localStorage.getItem(STORAGE_LAST_PLAN_KEY);

    // If new signup: always trigger congratulations notification!
    if (isNewSignupPending) {
      if (plan === 'TRIAL' || plan === 'FREE') {
        setNotification({
          isOpen: true,
          plan: 'TRIAL',
          title: 'Pendaftaran Berhasil',
          message: `Akun Anda telah aktif dengan akses Trial Fitur Pro selama ${daysRemaining ?? 14} hari. Seluruh fitur Pro dan sinkronisasi cloud siap digunakan.`,
        });
        return;
      } else if (plan === 'PRO') {
        setNotification({
          isOpen: true,
          plan: 'PRO',
          title: 'Lisensi Pro Lifetime Aktif',
          message: `Lisensi Anda (${licenseKey || 'Akun Anda'}) aktif secara permanen dengan Realtime Cloud Sync Multi-Perangkat dan seluruh fitur Pro.`,
        });
        return;
      }
    }

    // If first activation / no acknowledged plan recorded yet
    if (!lastAcknowledged) {
      if (plan === 'TRIAL') {
        setNotification({
          isOpen: true,
          plan: 'TRIAL',
          title: 'Pendaftaran Berhasil',
          message: `Akun Anda telah aktif dengan akses Trial Fitur Pro selama ${daysRemaining ?? 14} hari. Seluruh fitur Pro dan sinkronisasi cloud siap digunakan.`,
        });
        return;
      } else if (plan === 'PRO') {
        setNotification({
          isOpen: true,
          plan: 'PRO',
          title: 'Lisensi Pro Lifetime Aktif',
          message: `Lisensi Anda (${licenseKey || 'Akun Anda'}) aktif secara permanen dengan Realtime Cloud Sync Multi-Perangkat dan seluruh fitur Pro.`,
        });
        return;
      }
      localStorage.setItem(STORAGE_LAST_PLAN_KEY, plan);
      return;
    }

    // When plan actually changes from the last acknowledged plan
    if (lastAcknowledged !== plan) {
      if (plan === 'PRO') {
        setNotification({
          isOpen: true,
          plan: 'PRO',
          title: 'Pembaruan Akun: Pro Lifetime',
          message: `Akun Anda kini telah ditingkatkan ke Pro Lifetime (${licenseKey || 'Akun Anda'}). Seluruh fitur Pro dan sinkronisasi cloud aktif tanpa batas waktu.`,
        });
      } else if (plan === 'TRIAL') {
        setNotification({
          isOpen: true,
          plan: 'TRIAL',
          title: 'Masa Percobaan Pro 14 Hari Aktif',
          message: `Masa percobaan Pro aktif (${daysRemaining ?? 14} hari tersisa). Anda dapat menikmati seluruh fitur Pro dan sinkronisasi cloud.`,
        });
      } else if (plan === 'FREE') {
        setNotification({
          isOpen: true,
          plan: 'FREE',
          title: 'Masa Percobaan Berakhir',
          message: 'Masa percobaan Pro Anda telah selesai dan akun beralih ke Mode Gratis. Tingkatkan ke Pro Lifetime kapan saja untuk membuka kembali fitur Pro.',
        });
      }
    }
  }, [isActivated, plan, isTrial, daysRemaining, licenseKey]);

  const handleDismiss = () => {
    localStorage.removeItem('sukunaru_new_signup_welcome');
    try {
      sessionStorage.removeItem('sukunaru_is_new_signup');
    } catch {}
    if (plan) {
      localStorage.setItem(STORAGE_LAST_PLAN_KEY, plan);
    }
    setNotification(null);
  };

  const handleOpenActivation = () => {
    handleDismiss();
    if (typeof onNavigate === 'function') {
      onNavigate('activation');
    }
  };

  if (!notification || !notification.isOpen) return null;

  const isProPlan = notification.plan === 'PRO';
  const isTrialPlan = notification.plan === 'TRIAL';

  return (
    <div
      id="plan-change-floating-notification"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] w-[94vw] max-w-xl animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto select-none"
      role="alert"
    >
      <div className="relative rounded-2xl p-4 sm:p-5 apple-glass-notification text-[#25343F] dark:text-white transition-all">
        <div className="flex items-start justify-between gap-3.5">
          {/* Refined Icon Container - Clean glass badge */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-100/80 dark:bg-white/10 border border-slate-200/70 dark:border-white/15 shadow-xs">
            {isProPlan ? (
              <ShieldCheckIcon className="w-5 h-5 stroke-[1.8] text-amber-500 dark:text-amber-400" />
            ) : isTrialPlan ? (
              <ClockIcon className="w-5 h-5 stroke-[1.8] text-[#FF9B51]" />
            ) : (
              <ShieldCheckIcon className="w-5 h-5 stroke-[1.8] text-slate-500 dark:text-slate-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase ${
                  isProPlan
                    ? 'bg-amber-400/15 text-amber-600 dark:text-amber-300 border border-amber-400/30'
                    : isTrialPlan
                      ? 'bg-orange-500/15 text-[#FF9B51] border border-orange-500/30'
                      : 'bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                }`}
              >
                {notification.plan === 'PRO' ? 'PRO' : notification.plan === 'TRIAL' ? 'TRIAL 14 HARI' : 'GRATIS'}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Pemberitahuan Lisensi
              </span>
            </div>

            <h3 className="font-semibold text-sm sm:text-base text-[#25343F] dark:text-white tracking-tight leading-snug">
              {notification.title}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {notification.message}
            </p>

            {/* Action Buttons */}
            <div className="mt-3.5 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleOpenActivation}
                className="h-8 px-3.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-[#FF6A00] hover:bg-[#E55F00] text-white transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <span>Lihat Status Lisensi</span>
                <ArrowRightIcon className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="h-8 px-3.5 rounded-lg text-xs font-medium bg-slate-100/90 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 hover:text-[#25343F] dark:text-white/90 dark:hover:text-white border border-slate-200 dark:border-white/15 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>

          {/* Close 'X' Button - explicit dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            className="w-7 h-7 rounded-lg bg-slate-100/80 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-500 hover:text-[#25343F] dark:text-white/70 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-slate-200/70 dark:border-white/15"
            title="Tutup notifikasi"
            aria-label="Tutup notifikasi"
          >
            <XMarkIcon className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      </div>
    </div>
  );
};
