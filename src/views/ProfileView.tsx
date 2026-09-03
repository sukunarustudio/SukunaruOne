import React, { useState, useEffect } from 'react';
import {
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import {
  BuildingStorefrontIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ChatBubbleOvalLeftIcon,
  InformationCircleIcon,
  SwatchIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/solid';
import { ViewType, BusinessSettings } from '../types';
import { signOut, getSession, lockBusinessSession } from '../services/authService';
import { pauseRealtime } from '../services/syncManager';
import { useToast } from '../components/Toast';

interface ProfileViewProps {
  onNavigate: (view: ViewType) => void;
  settings: BusinessSettings;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onNavigate,
  settings,
}) => {
  const { showToast } = useToast();
  const [isActivated, setIsActivated] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authDisplayName, setAuthDisplayName] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sukunaru_license_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        setLicenseInfo(parsed);
        setIsActivated(Boolean(parsed.isActivated));
      }
    } catch {}

    // Load auth session
    getSession().then((session) => {
      if (session?.user) {
        setAuthEmail(session.user.email ?? null);
        setAuthDisplayName(
          session.user.user_metadata?.display_name ||
          session.user.email?.split('@')[0] ||
          null
        );
      }
    });
  }, []);

  const getLicenseBadge = () => {
    if (!isActivated) return { text: 'AKTIF', desc: 'Masukkan Serial Key Lisensi', color: 'text-[#25343F]', dot: 'bg-[#25343F]', isPro: false };
    if (licenseInfo?.licenseType === 'TRIAL_14_DAYS' || licenseInfo?.licenseType?.includes('TRIAL')) {
      const activatedDate = licenseInfo.activatedAt ? new Date(licenseInfo.activatedAt) : new Date();
      const elapsed = Math.floor((Date.now() - activatedDate.getTime()) / (1000 * 60 * 60 * 24));
      const remaining = Math.max(0, 14 - (isNaN(elapsed) ? 0 : elapsed));
      if (remaining === 0) {
        return { text: 'TRIAL BERAKHIR', desc: 'Masa trial 14 hari telah habis', color: 'text-rose-600', dot: 'bg-rose-600', isPro: false };
      }
      return { text: `TRIAL (${remaining} HARI)`, desc: `Trial aktif, sisa ${remaining} hari lagi`, color: 'text-amber-600', dot: 'bg-amber-600', isPro: true };
    }
    return { text: 'PRO LIFETIME', desc: 'Lisensi Pro Lifetime Aktif', color: 'text-emerald-600', dot: 'bg-emerald-600', isPro: true };
  };

  const handleSignOut = async () => {
    if (!window.confirm('Keluar dari akun BisnisUrang? Data lokal Anda tetap aman di perangkat ini.')) return;
    setIsSigningOut(true);
    try {
      pauseRealtime();
      lockBusinessSession();
      const result = await signOut();
      if (result.success) {
        showToast('Berhasil keluar dari akun.', 'success');
        localStorage.removeItem('sukunaru_offline_mode');
        window.location.reload();
      } else {
        showToast(result.message, 'error');
      }
    } finally {
      setIsSigningOut(false);
    }
  };

  const badge = getLicenseBadge();

  const sections = [
    {
      title: 'AKUN & LISENSI',
      items: [
        {
          icon: BuildingStorefrontIcon,
          label: 'Profil Bisnis Saya',
          desc: 'Identitas toko & kontak',
          action: () => onNavigate('business-profile'),
          iconClass: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25 shadow-sm',
        },
        {
          icon: ShieldCheckIcon,
          label: 'Aktivasi Aplikasi',
          desc: badge.desc,
          action: () => onNavigate('activation'),
          iconClass: badge.isPro
            ? 'bg-[#E6F9F2] text-[#10B981] border border-emerald-200 shadow-[0_2px_6px_rgba(16,185,129,0.2)]'
            : 'bg-[#FEF3C7] text-[#D97706] border border-amber-200 shadow-[0_2px_6px_rgba(217,119,6,0.2)]',
        },
        {
          icon: SwatchIcon,
          label: 'Tampilan & Tema',
          desc: 'Mode gelap, warna aksen & banner',
          action: () => onNavigate('appearance'),
          iconClass: 'bg-[#EAEFEF] text-[#FF9B51] border border-[#BFC9D1]/25 shadow-sm',
        },
        {
          icon: Cog6ToothIcon,
          label: 'Pengaturan',
          desc: 'Format dokumen & preferensi',
          action: () => onNavigate('settings'),
          iconClass: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25 shadow-sm',
        },
        {
          icon: CloudArrowUpIcon,
          label: 'Cadangan Data & Sinkronisasi Cloud',
          desc: 'Backup cloud Supabase & cadangan lokal',
          action: () => onNavigate('backup'),
          iconClass: 'bg-[#EAEFEF] text-[#FF6A00] border border-[#BFC9D1]/25 shadow-sm',
        },
      ],
    },
    {
      title: 'BANTUAN',
      items: [
        {
          icon: QuestionMarkCircleIcon,
          label: 'Panduan Penggunaan',
          desc: 'Cara pakai fitur aplikasi',
          action: () => onNavigate('guide'),
          iconClass: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25 shadow-sm',
        },
        {
          icon: ChatBubbleOvalLeftIcon,
          label: 'Hubungi Kami',
          desc: 'WhatsApp atau email support',
          action: () => onNavigate('contact'),
          iconClass: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25 shadow-sm',
        },
      ],
    },
    {
      title: 'APLIKASI',
      items: [
        {
          icon: InformationCircleIcon,
          label: 'Versi Aplikasi',
          desc: 'Lihat versi dan info build',
          action: () => onNavigate('app-info'),
          iconClass: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25 shadow-sm',
        },
      ],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-3.5 animate-fade-in pb-24 select-none">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md p-4 sm:p-5 flex items-center justify-between gap-3.5">
        <div className="flex items-center gap-3 min-w-0">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.businessName || 'Logo'}
              className="w-10 h-10 rounded-xl object-cover border border-[#BFC9D1]/25 shrink-0 bg-white shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#25343F] text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0 uppercase tracking-widest">
              {settings.businessName ? settings.businessName.slice(0, 2) : 'SU'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-black text-[#25343F] tracking-tight leading-none truncate">
              {settings.businessName || 'Sukunaru Studio'}
            </h1>
            <p className="text-xs font-bold text-[#898989] tracking-tight mt-0.5 truncate">
              {settings.tagline || 'Solusi Percetakan & Desain'}
            </p>
            <div className="mt-1.5 inline-flex items-center gap-1.5 bg-[#EAEFEF] border border-[#BFC9D1]/25 rounded-full px-2 py-0.5">
              <span className={`w-1 h-1 rounded-full ${badge.dot} animate-pulse`} />
              <span className={`text-[9px] font-bold ${badge.color} uppercase tracking-wider`}>
                {badge.text}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Account Card (show if logged in) */}
      {authEmail && (
        <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md overflow-hidden">
          <div className="text-[10.5px] font-extrabold text-[#898989] uppercase tracking-wider px-4 pt-3 pb-1">
            AKUN CLOUD
          </div>
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
              <UserCircleIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-[#25343F] truncate">
                {authDisplayName || 'Pengguna BisnisUrang'}
              </div>
              <div className="text-[10px] text-[#898989] truncate">{authEmail}</div>
            </div>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-500 text-xs font-semibold hover:bg-rose-50 transition-colors shrink-0 disabled:opacity-60"
            >
              {isSigningOut ? (
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" />
              )}
              Keluar
            </button>
          </div>
        </div>
      )}

      {/* Menu Sections List */}
      <div className="space-y-3.5">
        {sections.map(section => (
          <div key={section.title} className="space-y-1.5">
            <div className="text-[10.5px] font-extrabold text-[#898989] uppercase tracking-wider px-1">
              {section.title}
            </div>
            <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 dark:border-slate-800/80 shadow-md divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
              {section.items.map(item => {
                const IconComp = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 sm:py-4 text-left hover:bg-[#EAEFEF]/80 active:bg-[#EAEFEF] dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-black/5 dark:ring-white/10 group-hover:scale-105 transition-transform ${item.iconClass}`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-[#25343F] leading-tight">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-[#898989] mt-0.5 truncate">
                        {item.desc}
                      </div>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:text-[#898989] transition-colors shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* App Version Footer */}
      <div className="pt-4 text-center text-xs text-[#898989] font-medium">
        BisnisUrang v2.0 · Powered by Sukunaru Studio
      </div>
    </div>
  );
};

