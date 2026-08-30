import React, { useState, useEffect } from 'react';
import {
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  BuildingStorefrontIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  CircleStackIcon,
  QuestionMarkCircleIcon,
  ChatBubbleOvalLeftIcon,
  InformationCircleIcon,
  HeartIcon,
} from '@heroicons/react/24/solid';
import { ViewType, BusinessSettings } from '../types';

interface ProfileViewProps {
  onNavigate: (view: ViewType) => void;
  settings: BusinessSettings;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onNavigate,
  settings,
}) => {
  const [isActivated, setIsActivated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sukunaru_license_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        setIsActivated(Boolean(parsed.isActivated));
      }
    } catch {}
  }, []);

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
          desc: isActivated ? 'Lisensi Lifetime Aktif' : 'Masukkan Serial Key Lisensi',
          action: () => onNavigate('activation'),
          iconClass: isActivated
            ? 'bg-[#E6F9F2] text-[#10B981] border border-emerald-200 shadow-[0_2px_6px_rgba(16,185,129,0.2)]'
            : 'bg-[#FEF3C7] text-[#D97706] border border-amber-200 shadow-[0_2px_6px_rgba(217,119,6,0.2)]',
        },
        {
          icon: Cog6ToothIcon,
          label: 'Pengaturan',
          desc: 'Format dokumen & preferensi',
          action: () => onNavigate('settings'),
          iconClass: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25 shadow-sm',
        },
        {
          icon: CircleStackIcon,
          label: 'Cadangan & Pemulihan Data',
          desc: 'Backup JSON & restore database lokal',
          action: () => onNavigate('backup'),
          iconClass: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25 shadow-sm',
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
        {
          icon: HeartIcon,
          label: 'Dukung Aplikasi Ini',
          desc: 'Donasi via QRIS & Transfer Bank',
          action: () => onNavigate('support'),
          iconClass: 'bg-[#FFE4E6] text-[#F43F5E] border border-rose-200/80 shadow-[0_2px_6px_rgba(244,63,94,0.2)]',
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
              <span className={`w-1 h-1 rounded-full ${isActivated ? 'bg-emerald-600' : 'bg-[#25343F]'} animate-pulse`} />
              <span className="text-[9px] font-bold text-[#25343F] uppercase tracking-wider">
                {isActivated ? 'PRO LIFETIME' : 'AKTIF'}
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* Menu Sections List */}
      <div className="space-y-3.5">
        {sections.map(section => (
          <div key={section.title} className="space-y-1.5">
            <div className="text-[10.5px] font-extrabold text-[#898989] uppercase tracking-wider px-1">
              {section.title}
            </div>
            <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md divide-y divide-slate-100 overflow-hidden">
              {section.items.map(item => {
                const IconComp = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 sm:py-4 text-left hover:bg-[#EAEFEF]/80 active:bg-[#EAEFEF] transition-colors cursor-pointer group"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-white/60 group-hover:scale-105 transition-transform ${item.iconClass}`}
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
        BisnisUrang v1.0.0
      </div>
    </div>
  );
};
