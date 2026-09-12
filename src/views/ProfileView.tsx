import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  PencilSquareIcon,
  CameraIcon,
  ArrowPathIcon,
  TvIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ChatBubbleOvalLeftIcon,
  InformationCircleIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/solid';
import { ViewType, BusinessSettings } from '../types';
import { signOut, getSession, lockBusinessSession } from '../services/authService';
import { pauseRealtime } from '../services/syncManager';
import { useToast } from '../components/Toast';
import { useLicense } from '../hooks/useLicense';
import { fetchLatestLicense } from '../services/supabaseClient';
import { api } from '../services/api';
import { localDb } from '../services/localDb';
import { ImageCropperModal } from '../components/ImageCropperModal';

interface ProfileViewProps {
  onNavigate: (view: ViewType) => void;
  settings: BusinessSettings;
  onUpdateSettings?: (newSettings: BusinessSettings) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onNavigate,
  settings,
  onUpdateSettings,
}) => {
  const { showToast } = useToast();
  const { isActivated, isPro, isTrial, isFree, plan, daysRemaining } = useLicense();
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Logo upload & Cropper states
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const [isCropperSaving, setIsCropperSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto sync latest license from cloud on mount
    fetchLatestLicense().catch(() => {});

    // Load auth session
    getSession().then((session) => {
      if (session?.user) {
        setAuthEmail(session.user.email ?? null);
      }
    });
  }, []);

  const getLicenseBadge = () => {
    if (!isActivated) {
      return { text: 'BELUM AKTIF', desc: 'Masukkan Serial Key Lisensi', color: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400', isPro: false };
    }
    if (plan === 'PRO') {
      return { text: 'PRO LIFETIME', desc: 'Lisensi Pro Lifetime Aktif', color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-600', isPro: true };
    }
    if (isTrial) {
      return { text: `TRIAL (${daysRemaining ?? 0} HARI)`, desc: `Masa percobaan sisa ${daysRemaining ?? 0} hari lagi`, color: 'text-orange-600 dark:text-orange-400', dot: 'bg-[#FF6A00]', isPro: true };
    }
    if (isFree) {
      return { text: 'TRIAL BERAKHIR', desc: 'Masa trial telah habis (Mode Free)', color: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-600', isPro: false };
    }
    return { text: 'FREE MODE', desc: 'Fitur dasar aktif', color: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400', isPro: false };
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.', 'error');
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Ukuran foto terlalu besar. Maksimal 10MB.', 'error');
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      if (result) {
        setCropImageSrc(result);
        setIsCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleCropperChangeFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      if (result) {
        setCropImageSrc(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCroppedLogo = async (_croppedDataUrl: string, croppedFile: File) => {
    try {
      setIsCropperSaving(true);
      setIsUploadingLogo(true);
      const res = await api.uploadBusinessLogo(croppedFile);
      if (onUpdateSettings) {
        onUpdateSettings(res.settings);
      }
      setIsCropperOpen(false);
      showToast('Foto profil bisnis berhasil diperbarui!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunggah foto profil bisnis', 'error');
    } finally {
      setIsCropperSaving(false);
      setIsUploadingLogo(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const activeShift = await api.getCurrentShift();
      if (activeShift) {
        alert('Shift kasir masih aktif!\n\nSilakan tutup / hentikan shift (Stop Shift) terlebih dahulu di menu Kasir POS sebelum keluar dari akun.');
        onNavigate('pos');
        return;
      }
    } catch (e) {
      console.warn('Failed to check active shift on sign out:', e);
    }

    if (!window.confirm('Keluar dari akun BisnisUrang? Data akun dan bisnis Anda tersimpan aman di Cloud.')) return;
    setIsSigningOut(true);
    try {
      pauseRealtime();
      lockBusinessSession();
      try {
        await localDb.resetToCleanLoggedOutState();
      } catch {}
      const result = await signOut();
      if (result.success) {
        showToast('Berhasil keluar dari akun.', 'success');
        window.location.reload();
      } else {
        showToast(result.message, 'error');
      }
    } finally {
      setIsSigningOut(false);
    }
  };

  const badge = getLicenseBadge();

  // Menu sections matching exact layout in the mockup
  const sections = [
    {
      title: 'AKUN & APLIKASI',
      items: [
        {
          icon: CheckCircleIcon,
          label: 'Aktivasi Aplikasi',
          desc: badge.desc,
          action: () => onNavigate('activation'),
          iconClass: 'bg-emerald-50 text-emerald-500 border border-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40',
        },
        {
          icon: TvIcon,
          label: 'Tampilan & Tema',
          desc: 'Mode gelap, warna aksen, dan banner',
          action: () => onNavigate('appearance'),
          iconClass: 'bg-sky-50 text-sky-500 border border-sky-100/80 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/40',
        },
        {
          icon: Cog6ToothIcon,
          label: 'Pengaturan',
          desc: 'Format dokumen, notifikasi, dan preferensi',
          action: () => onNavigate('settings'),
          iconClass: 'bg-slate-100 text-slate-600 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60',
        },
        {
          icon: CloudArrowUpIcon,
          label: 'Cadangan Data & Sinkronisasi Cloud',
          desc: 'Penyimpanan cadangan cloud & lokal',
          action: () => onNavigate('backup'),
          iconClass: 'border shadow-2xs',
          customStyle: {
            backgroundColor: 'var(--color-accent-soft)',
            color: 'var(--color-accent)',
            borderColor: 'color-mix(in srgb, var(--color-accent) 25%, transparent)',
          },
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
          iconClass: 'bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60',
        },
        {
          icon: ChatBubbleOvalLeftIcon,
          label: 'Hubungi Kami',
          desc: 'WhatsApp atau email support',
          action: () => onNavigate('contact'),
          iconClass: 'bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60',
        },
      ],
    },
    {
      title: 'APLIKASI',
      items: [
        {
          icon: InformationCircleIcon,
          label: 'Versi Aplikasi',
          desc: 'v2.0 Stable Release',
          badge: 'v2.0',
          action: () => onNavigate('app-info'),
          iconClass: 'bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60',
        },
      ],
    },
  ];

  const displayEmail = settings.email || authEmail || 'Belum ditambahkan';
  const displayPhone = settings.whatsapp || settings.phone || 'Belum ditambahkan';
  const displayAddress = settings.address || 'Belum ditambahkan';

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in pb-28 select-none">
      {/* ── TOP TITLE & SUBTITLE ── */}
      <div className="px-1 pt-1">
        <h1 className="text-2xl font-bold text-[#25343F] dark:text-white tracking-tight">
          Profil
        </h1>
        <p className="text-xs text-[#898989] dark:text-slate-400 mt-0.5">
          Kelola akun, pengaturan aplikasi, dan preferensi Anda.
        </p>
      </div>

      {/* ── 1. MAIN PROFILE HEADER CARD (Dynamic Accent Glow) ── */}
      <div className="bg-white dark:bg-[#151D28] rounded-3xl border border-[#BFC9D1]/25 dark:border-slate-800/80 shadow-xs overflow-hidden relative">
        {/* Hidden File Input for Logo */}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleLogoChange}
        />

        {/* Dynamic Theme Gradient Glow on Top Right */}
        <div
          className="absolute top-0 right-0 w-72 sm:w-80 h-36 pointer-events-none rounded-bl-full blur-2xl opacity-60 dark:opacity-40 transition-all duration-300"
          style={{
            background: 'radial-gradient(circle at top right, var(--color-accent) 0%, var(--color-accent-soft) 45%, transparent 75%)',
          }}
        />

        {/* Top Profile Header Area: Avatar + Details + Edit Profil Button */}
        <div className="p-4 sm:p-5 relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar with Camera Button */}
            <div className="relative shrink-0">
              <div
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-full text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-700 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, var(--hero-start, var(--color-accent)) 0%, var(--hero-end, var(--color-accent-hover)) 100%)',
                }}
              >
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={settings.businessName || 'Logo Bisnis'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="tracking-widest uppercase text-lg sm:text-xl font-black text-white drop-shadow-xs">
                    {settings.businessName ? settings.businessName.slice(0, 2) : 'BU'}
                  </span>
                )}

                {/* Upload Spinner Overlay */}
                {isUploadingLogo && (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white z-10">
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  </div>
                )}
              </div>

              {/* Dynamic Camera Button Overlay */}
              <button
                type="button"
                disabled={isUploadingLogo || isCropperSaving}
                onClick={() => logoInputRef.current?.click()}
                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full text-white border-2 border-white dark:border-[#151D28] shadow-xs flex items-center justify-center cursor-pointer active:scale-90 transition-all z-20 hover:brightness-110"
                style={{ backgroundColor: 'var(--color-accent)' }}
                title="Ganti foto profil bisnis"
                aria-label="Ganti foto profil bisnis"
              >
                <CameraIcon className="w-3 h-3 stroke-[2.2]" />
              </button>
            </div>

            {/* Business Name, Tagline & Status Pill */}
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-[#25343F] dark:text-white tracking-tight truncate">
                {settings.businessName || 'Bisnis Anda'}
              </h2>

              <p className="text-[11px] sm:text-xs text-[#898989] dark:text-slate-400 font-medium mt-0.5 truncate">
                {settings.tagline || 'Solusi Percetakan & Desain'}
              </p>

              {/* Dynamic Accent Status Badge */}
              <div
                className="mt-1.5 inline-flex items-center gap-1.5 border rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors"
                style={{
                  backgroundColor: 'var(--color-accent-soft)',
                  borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
                  color: 'var(--color-accent)',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                />
                <span>{badge.text}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Accent Edit Profil Button */}
          <button
            type="button"
            onClick={() => onNavigate('business-profile')}
            className="h-8 px-3 rounded-full text-xs font-semibold bg-white/95 hover:bg-white dark:bg-slate-800 shadow-xs inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 border hover:shadow-sm"
            style={{
              color: 'var(--color-accent)',
              borderColor: 'color-mix(in srgb, var(--color-accent) 35%, transparent)',
            }}
            title="Edit informasi profil bisnis"
          >
            <PencilSquareIcon className="w-3.5 h-3.5 stroke-[2.2]" style={{ color: 'var(--color-accent)' }} />
            <span>Edit Profil</span>
          </button>
        </div>

        {/* ── Bottom Contact Information Row (3 Columns: Email, Phone, Address) ── */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 px-4 py-2.5 grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/20">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <EnvelopeIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{displayEmail}</span>
          </div>

          <div className="flex items-center gap-1.5 truncate px-2">
            <PhoneIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{displayPhone}</span>
          </div>

          <div className="flex items-center gap-1.5 truncate pl-2">
            <MapPinIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{displayAddress}</span>
          </div>
        </div>
      </div>

      {/* ── 2. MENU SECTIONS LIST ── */}
      <div className="space-y-3.5">
        {sections.map(section => (
          <div key={section.title} className="space-y-1.5">
            <div className="text-[10.5px] font-extrabold text-[#898989] dark:text-slate-400 uppercase tracking-wider px-1">
              {section.title}
            </div>
            <div className="bg-white dark:bg-[#151D28] rounded-2xl border border-[#BFC9D1]/25 dark:border-slate-800/80 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
              {section.items.map(item => {
                const IconComp = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left hover:bg-slate-50/80 active:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${item.iconClass || ''}`}
                      style={(item as any).customStyle}
                    >
                      <IconComp className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-[13px] font-bold text-[#25343F] dark:text-white leading-tight">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-[#898989] dark:text-slate-400 mt-0.5 truncate">
                        {item.desc}
                      </div>
                    </div>
                    {(item as any).badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-600 border border-sky-300 dark:bg-sky-950/60 dark:text-sky-400 dark:border-sky-700 shrink-0">
                        {(item as any).badge}
                      </span>
                    )}
                    <ChevronRightIcon className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#898989] dark:group-hover:text-slate-400 transition-colors shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. LOGOUT CARD (Matches Mockup) ── */}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="w-full bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all active:scale-[0.99] shadow-xs text-left group disabled:opacity-60"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-500 dark:bg-rose-900/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            {isSigningOut ? (
              <ArrowPathIcon className="w-4.5 h-4.5 animate-spin" />
            ) : (
              <ArrowRightOnRectangleIcon className="w-4.5 h-4.5 stroke-[2]" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-[13px] font-bold text-rose-600 dark:text-rose-400 leading-tight">
              Keluar dari Akun
            </div>
            <div className="text-[10.5px] text-[#898989] dark:text-slate-400 mt-0.5 truncate">
              Logout dan kembali ke halaman masuk
            </div>
          </div>
        </div>
        <ChevronRightIcon className="w-4 h-4 text-rose-300 dark:text-rose-700 group-hover:text-rose-500 transition-colors shrink-0" />
      </button>

      {/* Manual 1:1 Image Cropper Modal */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={cropImageSrc}
        title="Sesuaikan Foto Profil Bisnis (1:1)"
        onClose={() => setIsCropperOpen(false)}
        onSave={handleSaveCroppedLogo}
        isSaving={isCropperSaving}
        onChangeImageFile={handleCropperChangeFile}
      />
    </div>
  );
};
export default ProfileView;


