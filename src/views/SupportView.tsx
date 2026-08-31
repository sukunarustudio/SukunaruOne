import React, { useState } from 'react';
import { ArrowLeftIcon, HeartIcon, Squares2X2Icon, CreditCardIcon, DocumentDuplicateIcon, CheckIcon, SparklesIcon, ShieldCheckIcon, BeakerIcon, ChatBubbleLeftEllipsisIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { ViewType, BusinessSettings } from '../types';
import qrisImg from '../assets/qris.png';

interface SupportViewProps {
  onNavigate: (view: ViewType) => void;
  settings?: BusinessSettings;
}

export const SupportView: React.FC<SupportViewProps> = ({ onNavigate, settings }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const bankAccounts = [
    {
      key: 'seabank',
      bankName: 'SeaBank',
      accountNumber: '9013 8260 8290',
      rawNumber: '901382608290',
      accountHolder: 'Alwi Abdul Aziz',
      badge: 'Utama',
      color: 'bg-[#EAEFEF] border-[#BFC9D1] text-[#25343F]',
    },
    {
      key: 'jago',
      bankName: 'Bank Jago',
      accountNumber: '5087 6577 5129',
      rawNumber: '508765775129',
      accountHolder: 'Alwi Abdul Aziz',
      badge: 'Alternatif',
      color: 'bg-[#FF9B51]/10 border-[#FF9B51]/40 text-[#c45e00]',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-3.5 animate-fade-in pb-24">
      {/* ── STICKY TOP HEADER: [ ← Judul ] ── */}
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
              Dukung Aplikasi Ini
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
              Donasi & apresiasi pengembangan Sukunaru Studio OS
            </p>
          </div>
        </div>
      </div>

      {/* Warm Banner */}
      <div className="bg-gradient-to-br from-[#FF9B51] via-slate-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF9B51]/20 border border-[#FF9B51]/40 text-rose-300 text-[11px] font-bold">
            <BeakerIcon className="w-3.5 h-3.5" />
            <span>Karya Kreatif Sukunaru Studio</span>
          </div>
          <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
            Dukungan Anda Menyalakan Inovasi Kami
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Sukunaru ONE dikembangkan dengan komitmen untuk mendampingi UMKM dan industri kreatif percetakan berkembang tanpa beban biaya langganan. Donasi sukarela Anda membantu biaya operasional, pembaruan fitur, dan maintenance sistem.
          </p>
        </div>
      </div>

      {/* QRIS Card */}
      <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
              <Squares2X2Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#25343F] flex items-center gap-2">
                <span>QRIS Donasi &amp; Kontribusi</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAEFEF] text-[#25343F]">
                  Semua E-Wallet &amp; Bank
                </span>
              </div>
              <p className="text-xs text-[#898989] mt-0.5">
                Scan menggunakan BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay, SeaBank, dll.
              </p>
            </div>
          </div>
        </div>

        {/* QR Code Display Visual */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 sm:p-6 bg-[#EAEFEF] rounded-2xl border border-slate-100">
          {/* QR Image Frame */}
          <div className="bg-white p-3.5 rounded-2xl shadow-md border border-[#BFC9D1]/25 flex flex-col items-center shrink-0 text-center max-w-[220px]">
            <div className="w-44 h-44 bg-white rounded-xl p-1 flex items-center justify-center relative overflow-hidden border border-zinc-100 shadow-inner">
              <img
                src={qrisImg}
                alt="QRIS Sukunaru Studio"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-2 font-black text-xs text-[#25343F] tracking-wide">
              SUKUNARU STUDIO
            </div>
            <div className="text-[10px] font-bold text-[#898989] mt-0.5">
              QRIS Standar Nasional
            </div>
          </div>

          <div className="space-y-2.5 max-w-sm text-center sm:text-left">
            <div className="text-xs font-bold text-[#25343F] flex items-center justify-center sm:justify-start gap-1.5">
              <SparklesIcon className="w-3.5 h-3.5 text-[#FF9B51]" />
              <span>Cara Scan QRIS:</span>
            </div>
            <ol className="text-xs text-[#898989] space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Buka aplikasi m-Banking atau e-Wallet favorit Anda.</li>
              <li>Pilih menu <strong>Scan QR / QRIS</strong>.</li>
              <li>Arahkan kamera ke kode QR di samping.</li>
              <li>Pastikan nama penerima <strong>Sukunaru Studio</strong>.</li>
              <li>Masukkan nominal dukungan sukarela &amp; konfirmasi.</li>
            </ol>
            <div className="text-[11px] text-[#898989] pt-1">
              * Bebas nominal berapa pun, setiap kontribusi sangat berarti bagi kami.
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Bank Section */}
      <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="w-9 h-9 rounded-xl bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25 flex items-center justify-center shrink-0">
            <BuildingOfficeIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#25343F]">
              Transfer Antar Rekening Bank
            </h3>
            <p className="text-xs text-[#898989] mt-0.5">
              Bisa transfer melalui ATM, Mobile Banking, atau Internet Banking
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {bankAccounts.map(b => {
            const isCopied = copiedKey === b.key;
            return (
              <div
                key={b.key}
                className="p-4 rounded-xl border border-[#BFC9D1]/25 bg-[#EAEFEF]/70 hover:bg-white transition-all space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#25343F]">
                    {b.bankName}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.color}`}>
                    {b.badge}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-[#BFC9D1]/25 shadow-md">
                  <div className="font-mono font-black text-sm text-[#25343F]">
                    {b.accountNumber}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(b.rawNumber, b.key)}
                    className="p-1.5 rounded-md hover:bg-[#EAEFEF] text-[#898989] hover:text-[#25343F] transition-colors cursor-pointer"
                    title="Salin nomor rekening"
                  >
                    {isCopied ? (
                      <span className="flex items-center gap-1 text-[10px] text-[#25343F] font-bold">
                        <CheckIcon className="w-3.5 h-3.5" /> Disalin
                      </span>
                    ) : (
                      <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="text-[11px] text-[#898989] font-medium">
                  Atas Nama: <strong className="text-[#25343F] font-bold">{b.accountHolder}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation & Thank You */}
      <div className="bg-[#EAEFEF] border border-[#BFC9D1]/25 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAEFEF] text-[#25343F] flex items-center justify-center shrink-0">
            <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs text-[#25343F]">Kirim Konfirmasi atau Sapa Pengembang</div>
            <div className="text-[11px] text-[#898989]">
              Sudah mengirim dukungan? Kabari kami via WhatsApp agar kami bisa mengucapkan terima kasih!
            </div>
          </div>
        </div>
        <a
          href="https://wa.me/6289519203345?text=Halo%20Sukunaru%20Studio%2C%20saya%20telah%20mengirimkan%20dukungan%20donasi%20untuk%20pengembangan%20aplikasi%20Sukunaru%20ONE."
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] rounded-xl text-xs font-bold transition-colors cursor-pointer active:scale-95 shrink-0"
        >
          Konfirmasi via WA
        </a>
      </div>
    </div>
  );
};
