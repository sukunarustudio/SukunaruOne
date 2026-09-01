import React, { useState } from 'react';
import { ArrowLeftIcon, ChatBubbleLeftEllipsisIcon, EnvelopeIcon, CameraIcon, DocumentDuplicateIcon, CheckIcon, ArrowTopRightOnSquareIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { ViewType, BusinessSettings } from '../types';

interface ContactViewProps {
  onNavigate: (view: ViewType) => void;
  settings?: BusinessSettings;
}

export const ContactView: React.FC<ContactViewProps> = ({ onNavigate }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const contactList = [
    {
      key: 'wa',
      title: 'WhatsApp Official',
      value: '0895-1920-3345',
      rawValue: '089519203345',
      desc: 'Chat langsung via WhatsApp untuk pertanyaan cepat, konsultasi, atau kendala teknis.',
      icon: ChatBubbleLeftEllipsisIcon,
      iconBg: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25',
      actionUrl: 'https://wa.me/6289519203345?text=Halo%20Sukunaru%20Studio%2C%20saya%20ingin%20bertanya%20seputar%20aplikasi%20Sukunaru%20Studio',
      actionLabel: 'Buka WhatsApp',
      badge: 'Respons Cepat',
      badgeClass: 'bg-[#EAEFEF] text-[#25343F]',
    },
    {
      key: 'email',
      title: 'Email Support',
      value: 'sukunarustudio@gmail.com',
      rawValue: 'sukunarustudio@gmail.com',
      desc: 'Kirimkan pesan kerja sama, laporan bug, atau pertanyaan mendalam via surel.',
      icon: EnvelopeIcon,
      iconBg: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25',
      actionUrl: 'mailto:sukunarustudio@gmail.com?subject=Tanya%20Aplikasi%20Sukunaru%20Studio',
      actionLabel: 'Kirim Email',
      badge: 'Resmi',
      badgeClass: 'bg-[#EAEFEF] text-[#25343F]',
    },
  ];

  const socialLinks = [
    {
      name: 'Instagram',
      handle: '@sukunarustudio',
      url: 'https://instagram.com/sukunarustudio',
      icon: CameraIcon,
      color: 'hover:text-pink-600 hover:border-pink-300',
      tag: 'Update & Portofolio',
    },
    {
      name: 'TikTok',
      handle: '@sukunarustudio',
      url: 'https://www.tiktok.com/@sukunarustudio',
      icon: ArrowTopRightOnSquareIcon,
      color: 'hover:text-[#25343F] hover:border-[#BFC9D1]',
      tag: 'Tips & Video Kreatif',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-3.5 animate-fade-in pb-24">
      {/* ── STICKY TOP HEADER: [ ← Judul ] ... [ Aksi ] ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="h-9 w-9 rounded-xl bg-white hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 shadow-md"
            title="Kembali ke Profil"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-[#25343F] leading-tight tracking-tight truncate">
              Hubungi Kami
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
              Layanan bantuan & kanal komunikasi resmi Sukunaru Studio
            </p>
          </div>
        </div>

      </div>


      {/* Greeting Banner */}
      <div className="bg-gradient-to-br from-[#25343F] via-slate-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#25343F]/20 border border-[#BFC9D1]/25 text-emerald-300 text-[11px] font-bold">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Siap Melayani &amp; Mendengarkan Anda</span>
          </div>
          <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
            Punya Kendala atau Usulan Fitur Baru?
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Kami selalu terbuka untuk kritik, saran, maupun pertanyaan seputar implementasi aplikasi Sukunaru Studio untuk usaha Anda.
          </p>
        </div>
      </div>

      {/* Primary Contact Cards (WA & Email) */}
      <div className="space-y-3">
        {contactList.map(c => {
          const Icon = c.icon;
          const isCopied = copiedKey === c.key;

          return (
            <div
              key={c.key}
              className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${c.iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-[#25343F]">
                      {c.title}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badgeClass}`}>
                      {c.badge}
                    </span>
                  </div>
                  <div className="text-sm font-mono font-bold text-[#25343F] mt-1 flex items-center gap-2">
                    <span>{c.value}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(c.rawValue, c.key)}
                      className="p-1 text-[#898989] hover:text-[#25343F] transition-colors rounded-md hover:bg-[#EAEFEF] cursor-pointer"
                      title="Salin ke clipboard"
                    >
                      {isCopied ? (
                        <span className="flex items-center gap-1 text-[10px] text-[#25343F] font-sans font-bold">
                          <CheckIcon className="w-3.5 h-3.5" /> Disalin!
                        </span>
                      ) : (
                        <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[#898989] mt-1 leading-relaxed">
                    {c.desc}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <a
                  href={c.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2 bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 shadow-md"
                >
                  <span>{c.actionLabel}</span>
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Social Media Section */}
      <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-[#898989] uppercase tracking-wider">
              Sosial Media Resmi
            </h3>
            <p className="text-xs text-[#898989] font-medium mt-0.5">
              Ikuti Sukunaru Studio untuk tutorial, update promo, dan tips bisnis
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {socialLinks.map(s => {
            const Icon = s.icon;
            return (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3.5 rounded-xl border border-[#BFC9D1]/25 bg-[#EAEFEF]/70 flex items-center justify-between gap-3 transition-all cursor-pointer group hover:bg-white hover:shadow-sm ${s.color}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#BFC9D1]/25 flex items-center justify-center text-[#25343F] group-hover:scale-105 transition-transform shadow-md">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[#25343F] group-hover:text-inherit">
                      {s.name}
                    </div>
                    <div className="text-[11px] font-mono text-[#898989]">
                      {s.handle}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-[#898989] group-hover:text-[#25343F]">
                  <span className="hidden xs:inline">{s.tag}</span>
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#FF9B51]/8 text-[#FF9B51] border border-[#FF9B51]/40 flex items-center justify-center shrink-0">
          <ClockIcon className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-xs text-[#25343F]">Jam Layanan Bantuan</div>
          <div className="text-xs text-[#898989] mt-0.5 font-medium">Senin - Sabtu: 08.00 - 21.00 WIB</div>
          <div className="text-[10px] text-[#898989] mt-0.5">Minggu &amp; Hari Libur: Slow Response</div>
        </div>
      </div>
    </div>
  );
};

