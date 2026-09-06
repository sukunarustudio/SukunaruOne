import React, { useState, useEffect } from 'react';
import {
  SparklesIcon,
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
          title: 'Selamat! Pendaftaran Berhasil 🎉',
          message: `Selamat, Anda telah mendapatkan akses Trial Fitur PRO selama ${daysRemaining ?? 14} hari penuh! Seluruh fitur PRO & Cloud Sync siap digunakan.`,
        });
        return;
      } else if (plan === 'PRO') {
        setNotification({
          isOpen: true,
          plan: 'PRO',
          title: 'Selamat! Akun Pro Lifetime Aktif 🎉',
          message: `Lisensi Anda (${licenseKey || 'Akun Anda'}) aktif permanen seumur hidup dengan Realtime Cloud Sync Multi-Device & seluruh fitur PRO.`,
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
          title: 'Selamat! Pendaftaran Berhasil 🎉',
          message: `Selamat, Anda telah mendapatkan akses Trial Fitur PRO selama ${daysRemaining ?? 14} hari penuh! Seluruh fitur PRO & Cloud Sync siap digunakan.`,
        });
        return;
      } else if (plan === 'PRO') {
        setNotification({
          isOpen: true,
          plan: 'PRO',
          title: 'Selamat! Akun Pro Lifetime Aktif 🎉',
          message: `Lisensi Anda (${licenseKey || 'Akun Anda'}) aktif permanen seumur hidup dengan Realtime Cloud Sync Multi-Device & seluruh fitur PRO.`,
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
          title: 'Selamat! Anda sudah upgrade ke Plan Pro Lifetime 🎉',
          message: `Lisensi Anda (${licenseKey || 'Akun Anda'}) kini aktif permanen seumur hidup dengan Realtime Cloud Sync Multi-Device & seluruh fitur PRO.`,
        });
      } else if (plan === 'TRIAL') {
        setNotification({
          isOpen: true,
          plan: 'TRIAL',
          title: 'Paket Berubah: Mode Trial 14 Hari Aktif ✨',
          message: `Masa percobaan Pro aktif (${daysRemaining ?? 14} hari tersisa). Anda dapat menikmati seluruh fitur PRO & Cloud Sync.`,
        });
      } else if (plan === 'FREE') {
        setNotification({
          isOpen: true,
          plan: 'FREE',
          title: 'Masa Percobaan Trial Telah Berakhir',
          message: 'Akun Anda saat ini beralih ke Mode Free. Upgrade ke Pro Lifetime kapan saja untuk membuka kembali Cloud Sync & fitur PRO.',
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
      <div
        className={`relative rounded-2xl p-4 sm:p-5 shadow-2xl border backdrop-blur-xl transition-all ${
          isProPlan
            ? 'bg-gradient-to-r from-[#1A2E26] via-[#162720] to-[#0F1B16] text-white border-emerald-500/50 shadow-emerald-950/40 ring-1 ring-emerald-500/30'
            : isTrialPlan
              ? 'bg-gradient-to-r from-[#2A2318] via-[#211B13] to-[#17130D] text-white border-amber-500/50 shadow-amber-950/40 ring-1 ring-amber-500/30'
              : 'bg-gradient-to-r from-[#23272F] via-[#1B1E24] to-[#121418] text-white border-slate-600/50 shadow-black/40 ring-1 ring-slate-600/30'
        }`}
      >
        <div className="flex items-start justify-between gap-3.5">
          {/* Left Icon */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
              isProPlan
                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                : isTrialPlan
                  ? 'bg-amber-500 text-white shadow-amber-500/30'
                  : 'bg-slate-700 text-slate-200'
            }`}
          >
            {isProPlan ? (
              <SparklesIcon className="w-5 h-5 stroke-[2.2]" />
            ) : isTrialPlan ? (
              <ClockIcon className="w-5 h-5 stroke-[2.2]" />
            ) : (
              <ShieldCheckIcon className="w-5 h-5 stroke-[2.2]" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                  isProPlan
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : isTrialPlan
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-700 text-slate-300 border border-slate-600'
                }`}
              >
                {notification.plan}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                Pembaruan Status
              </span>
            </div>

            <h3 className="font-extrabold text-sm sm:text-base text-white leading-snug">
              {notification.title}
            </h3>

            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {notification.message}
            </p>

            {/* Action Buttons */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleOpenActivation}
                className={`h-8 px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm ${
                  isProPlan
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : isTrialPlan
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                <span>Lihat Status Lisensi</span>
                <ArrowRightIcon className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="h-8 px-3 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-slate-200 transition-colors cursor-pointer"
              >
                Saya Mengerti
              </button>
            </div>
          </div>

          {/* Close 'X' Button - explicit dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95"
            title="Tutup notifikasi (X)"
            aria-label="Tutup notifikasi"
          >
            <XMarkIcon className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
