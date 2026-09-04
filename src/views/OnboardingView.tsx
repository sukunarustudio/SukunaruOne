import React, { useState, useRef, useEffect } from 'react';
import {
  XMarkIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CloudArrowUpIcon,
  ShoppingCartIcon,
  CubeIcon,
  Square3Stack3DIcon,
  WalletIcon,
  CalculatorIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  ArrowPathIcon,
  CheckIcon,
  PrinterIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShieldCheckIcon,
  ClockIcon,
  ShareIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { BusinessSettings } from '../types';
import appLogo from '../assets/app-logo.png';

interface OnboardingViewProps {
  settings?: BusinessSettings;
  onUpdateSettings?: (newSettings: BusinessSettings) => void;
  onComplete: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  settings,
  onUpdateSettings,
  onComplete,
}) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [businessNameInput, setBusinessNameInput] = useState<string>(settings?.businessName || '');
  const touchStartXRef = useRef<number>(0);
  const touchEndXRef = useRef<number>(0);

  const slides = [
    // ─── SLIDE 1: Order Custom & SPK Workshop ─────────────────────────────────
    {
      id: 'slide-spk-workshop',
      stepLabel: 'SPK & Workshop',
      badge: 'SPK & WORKSHOP PRODUKSI',
      headline: 'Order Custom & SPK Workshop,\nPresisi Tanpa Salah Cetak.',
      description: 'Catat pesanan percetakan & sablon dengan spesifikasi dimensi (cm), material, finishing, dan instruksi khusus. Terbitkan SPK resmi untuk operator workshop.',
      features: [
        'Kalkulasi otomatis dimensi custom (P × L cm / meter)',
        'Cetak Surat Perintah Kerja (SPK) A5 untuk operator',
        'Faktur Tagihan A5 & kirim nota otomatis ke WhatsApp',
      ],
      accentColor: '#FF6A00',
      renderPreview: () => (
        <div className="w-full max-w-sm mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-[#BFC9D1]/40 dark:border-slate-800 shadow-xl overflow-hidden transition-all text-slate-800 dark:text-slate-200">
          {/* Header Card */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#EAEFEF] dark:bg-slate-800/80 border-b border-[#BFC9D1]/30 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#25343F] text-white flex items-center justify-center">
                <WrenchScrewdriverIcon className="w-4 h-4 text-[#FF9B51]" />
              </div>
              <div>
                <div className="text-[11px] font-black text-[#25343F] dark:text-white uppercase tracking-tight">
                  SPK Produksi #SPK-1082
                </div>
                <div className="text-[9px] text-[#898989] font-mono">Pelanggan: Sukunaru Creative</div>
              </div>
            </div>
            <span className="text-[8.5px] font-black px-2 py-0.5 rounded-md bg-blue-500 text-white uppercase tracking-wider shadow-2xs">
              Diproses
            </span>
          </div>

          {/* Job Item Specs */}
          <div className="p-3 space-y-2 text-[10px]">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
              <div className="flex justify-between items-start">
                <div className="font-black text-[#25343F] dark:text-white text-[11px]">
                  1. Spanduk Flexi Korea 280g
                </div>
                <span className="font-mono font-black text-[9px] px-1.5 py-0.5 bg-[#25343F] text-white rounded">
                  2 pcs (3.0 × 1.0 m)
                </span>
              </div>

              {/* Technical chips */}
              <div className="grid grid-cols-2 gap-1 text-[9px]">
                <div className="bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                  <span className="text-[#898989] block text-[8px]">Bahan:</span>
                  <strong className="text-[#25343F] dark:text-slate-200">Flexi High-Res</strong>
                </div>
                <div className="bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                  <span className="text-[#898989] block text-[8px]">Finishing:</span>
                  <strong className="text-[#25343F] dark:text-slate-200">Mata Ayam 4 Sudut</strong>
                </div>
              </div>

              <div className="text-[8.5px] text-slate-600 dark:text-slate-400 italic bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded border border-amber-200 dark:border-amber-800/40">
                Catatan: Warna tajam, lipat keling rapi keliling.
              </div>
            </div>

            {/* Action buttons preview */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-center flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700">
                <PrinterIcon className="w-3.5 h-3.5 text-[#25343F] dark:text-white mb-0.5" />
                <span className="text-[8px] font-bold text-[#25343F] dark:text-white">Cetak SPK A5</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-center flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700">
                <DocumentTextIcon className="w-3.5 h-3.5 text-[#25343F] dark:text-white mb-0.5" />
                <span className="text-[8px] font-bold text-[#25343F] dark:text-white">Faktur Invoice A5</span>
              </div>
              <div className="p-1.5 rounded-lg bg-[#FF9B51]/15 text-center flex flex-col items-center justify-center border border-[#FF9B51]/30">
                <ShareIcon className="w-3.5 h-3.5 text-[#FF6A00] mb-0.5" />
                <span className="text-[8px] font-bold text-[#FF6A00]">Kirim WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ─── SLIDE 2: Kasir POS Kilat & Antrean ───────────────────────────────────
    {
      id: 'slide-kasir-pos',
      stepLabel: 'Kasir POS',
      badge: 'KASIR POS & TRACKING ANTREAN',
      headline: 'Kasir POS Kilat,\nStatus Pesanan Terorganisir.',
      description: 'Lakukan transaksi penjualan retail super cepat dengan dukungan scan barcode, diskon, uang muka (DP), dan pelunasan bertahap.',
      features: [
        'Kasir cepat untuk penjualan retail, jasa & custom print',
        'Kelola Uang Muka (DP) & pelunasan sisa tagihan',
        'Tracking 4 tahap pengerjaan: Menunggu → Proses → Siap → Selesai',
      ],
      accentColor: '#FF6A00',
      renderPreview: () => (
        <div className="w-full max-w-sm mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-[#BFC9D1]/40 dark:border-slate-800 shadow-xl overflow-hidden text-slate-800 dark:text-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#EAEFEF] dark:bg-slate-800/80 border-b border-[#BFC9D1]/30 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FF9B51]/20 flex items-center justify-center">
                <ShoppingCartIcon className="w-4 h-4 text-[#FF6A00]" />
              </div>
              <div>
                <div className="text-[11px] font-black text-[#25343F] dark:text-white">Kasir POS Retail & Pesanan</div>
                <div className="text-[9px] text-[#898989]">Sesi Kasir: Aktif</div>
              </div>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              ● QRIS / Tunai
            </span>
          </div>

          {/* Cart items */}
          <div className="p-3 space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="min-w-0">
                <div className="font-bold text-[#25343F] dark:text-white truncate">Stiker Vinyl Die-Cut A3+</div>
                <div className="text-[9px] text-[#898989]">5 lembar × Rp 15.000</div>
              </div>
              <div className="font-mono font-black text-[#25343F] dark:text-white shrink-0">Rp 75.000</div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="min-w-0">
                <div className="font-bold text-[#25343F] dark:text-white truncate">Jasa Desain Kemasan Produk</div>
                <div className="text-[9px] text-[#898989]">1 paket desain revisi 3x</div>
              </div>
              <div className="font-mono font-black text-[#25343F] dark:text-white shrink-0">Rp 100.000</div>
            </div>

            {/* Payment breakdown */}
            <div className="p-2 bg-[#25343F] text-white rounded-xl space-y-1">
              <div className="flex justify-between text-[9.5px]">
                <span className="text-slate-300">Total Tagihan:</span>
                <span className="font-mono font-bold">Rp 175.000</span>
              </div>
              <div className="flex justify-between text-[9.5px]">
                <span className="text-slate-300">Uang Muka (DP Masuk):</span>
                <span className="font-mono font-bold text-[#FF9B51]">-Rp 100.000</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-700 text-[10.5px]">
                <span className="font-black text-[#FF9B51]">SISA TAGIHAN:</span>
                <span className="font-mono font-black">Rp 75.000</span>
              </div>
            </div>

            {/* Pipeline Stage Badges */}
            <div className="grid grid-cols-4 gap-1 text-center pt-0.5">
              <div className="p-1 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40">
                <div className="text-[10px] font-black text-amber-700 dark:text-amber-300">2</div>
                <div className="text-[7.5px] font-bold text-amber-600 dark:text-amber-400">Menunggu</div>
              </div>
              <div className="p-1 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40">
                <div className="text-[10px] font-black text-blue-700 dark:text-blue-300">5</div>
                <div className="text-[7.5px] font-bold text-blue-600 dark:text-blue-400">Diproses</div>
              </div>
              <div className="p-1 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40">
                <div className="text-[10px] font-black text-indigo-700 dark:text-indigo-300">3</div>
                <div className="text-[7.5px] font-bold text-indigo-600 dark:text-indigo-400">Siap Ambil</div>
              </div>
              <div className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                <div className="text-[10px] font-black text-emerald-700 dark:text-emerald-300">18</div>
                <div className="text-[7.5px] font-bold text-emerald-600 dark:text-emerald-400">Selesai</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ─── SLIDE 3: HPP Akurat & Stok Bahan (BOM) ──────────────────────────────
    {
      id: 'slide-hpp-stok',
      stepLabel: 'HPP & Stok',
      badge: 'HPP & INVENTORI OTOMATIS',
      headline: 'Kalkulator HPP Presisi,\nStok Bahan Terpotong Otomatis.',
      description: 'Hitung modal riil per produk berdasarkan bahan baku, tinta, mesin, dan tenaga kerja. Stok bahan di gudang otomatis berkurang saat pesanan selesai.',
      features: [
        'Kalkulator HPP multi-komponen (BOM / Bill of Materials)',
        'Rekomendasi harga jual ideal & kalkulasi margin laba',
        'Notifikasi otomatis saat stok bahan baku mendekati batas minimum',
      ],
      accentColor: '#25343F',
      renderPreview: () => (
        <div className="w-full max-w-sm mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-[#BFC9D1]/40 dark:border-slate-800 shadow-xl overflow-hidden text-slate-800 dark:text-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#EAEFEF] dark:bg-slate-800/80 border-b border-[#BFC9D1]/30 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#25343F] text-white flex items-center justify-center">
                <CalculatorIcon className="w-4 h-4 text-[#FF9B51]" />
              </div>
              <div>
                <div className="text-[11px] font-black text-[#25343F] dark:text-white">Kalkulator HPP &amp; BOM</div>
                <div className="text-[9px] text-[#898989]">Produk: Kaos Sablon DTF A3</div>
              </div>
            </div>
            <span className="text-[8.5px] font-black px-2 py-0.5 rounded bg-[#FF9B51] text-[#25343F]">
              Margin 41.2%
            </span>
          </div>

          {/* BOM Breakdown */}
          <div className="p-3 space-y-2 text-[10px]">
            <div className="space-y-1 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <div className="flex justify-between text-[9px] text-slate-600 dark:text-slate-400">
                <span>• Kaos Polos Cotton Combed 30s</span>
                <span className="font-mono font-bold text-[#25343F] dark:text-white">Rp 32.000</span>
              </div>
              <div className="flex justify-between text-[9px] text-slate-600 dark:text-slate-400">
                <span>• Film DTF Print + Lem Powder</span>
                <span className="font-mono font-bold text-[#25343F] dark:text-white">Rp 12.000</span>
              </div>
              <div className="flex justify-between text-[9px] text-slate-600 dark:text-slate-400">
                <span>• Biaya Press &amp; Tenaga Kerja</span>
                <span className="font-mono font-bold text-[#25343F] dark:text-white">Rp 6.000</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700 font-bold">
                <span className="text-[#25343F] dark:text-white">Total HPP Riil:</span>
                <span className="font-mono font-black text-rose-600 dark:text-rose-400">Rp 50.000</span>
              </div>
            </div>

            {/* Selling Price & Profit Card */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                <span className="text-[8.5px] font-bold text-emerald-700 dark:text-emerald-300 block">HARGA JUAL</span>
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-200 font-mono">Rp 85.000</span>
              </div>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40">
                <span className="text-[8.5px] font-bold text-blue-700 dark:text-blue-300 block">LABA BERSIH/PCS</span>
                <span className="text-xs font-black text-blue-800 dark:text-blue-200 font-mono">+Rp 35.000</span>
              </div>
            </div>

            {/* Inventory Low Stock Alert */}
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex items-center gap-2">
              <Square3Stack3DIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="min-w-0 text-[9px]">
                <strong className="text-amber-800 dark:text-amber-300 block">Stok Bahan Menipis</strong>
                <span className="text-amber-700 dark:text-amber-400">Kertas Stiker Cromo sisa 12 lbr</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ─── SLIDE 4: Arus Kas & Laporan Keuangan ────────────────────────────────
    {
      id: 'slide-arus-kas',
      stepLabel: 'Arus Kas',
      badge: 'ARUS KAS & LAPORAN LABA RUGI',
      headline: 'Pembukuan Rapi,\nLaba Bersih Terhitung Otomatis.',
      description: 'Catat pemasukan kas harian dan seluruh biaya operasional (gaji, listrik, sewa, maintenance mesin). Pantau kesehatan finansial bisnis tanpa repot manual.',
      features: [
        'Pencatatan kas masuk, pengeluaran & biaya operasional',
        'Laporan Laba Rugi riil, omzet & margin keuntungan',
        'Ekspor laporan lengkap ke format PDF & CSV/Excel',
      ],
      accentColor: '#1A7F5A',
      renderPreview: () => (
        <div className="w-full max-w-sm mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-[#BFC9D1]/40 dark:border-slate-800 shadow-xl overflow-hidden text-slate-800 dark:text-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#EAEFEF] dark:bg-slate-800/80 border-b border-[#BFC9D1]/30 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
                <WalletIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-[11px] font-black text-[#25343F] dark:text-white">Laporan Keuangan Bisnis</div>
                <div className="text-[9px] text-[#898989]">Periode: Bulan Berjalan</div>
              </div>
            </div>
            <span className="text-[9px] font-bold text-[#898989]">Realtime</span>
          </div>

          {/* Income & Expense Grid */}
          <div className="p-3 space-y-2 text-[10px]">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-[8.5px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Omzet Masuk</span>
                  <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-200 font-mono mt-0.5">
                  Rp 18.450.000
                </div>
                <div className="text-[8px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  ↑ 24% dari target
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-[8.5px] font-bold text-rose-700 dark:text-rose-300 uppercase">Pengeluaran</span>
                  <ArrowTrendingDownIcon className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <div className="text-xs sm:text-sm font-black text-rose-800 dark:text-rose-200 font-mono mt-0.5">
                  Rp 6.200.000
                </div>
                <div className="text-[8px] text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                  Bahan + Operasional
                </div>
              </div>
            </div>

            {/* Net Profit Card */}
            <div className="p-2.5 rounded-xl bg-[#25343F] text-white flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">
                  LABA BERSIH (PROFIT RIIL)
                </span>
                <span className="text-sm font-black text-white font-mono">Rp 12.250.000</span>
              </div>
              <div className="text-right">
                <ChartBarIcon className="w-4 h-4 text-[#FF9B51] ml-auto" />
                <span className="text-[9px] font-black text-[#FF9B51]">Margin 66.4%</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ─── SLIDE 5: 100% Offline & Cloud Sync ──────────────────────────────────
    {
      id: 'slide-cloud-sync',
      stepLabel: 'Offline & Cloud',
      badge: 'OFFLINE-FIRST & SINKRONISASI CLOUD',
      headline: 'Tetap Nyala Tanpa Internet,\nSinkron Otomatis Saat Online.',
      description: 'Aplikasi bekerja super cepat menggunakan database lokal SQLite tanpa ketergantungan sinyal. Saat tersambung internet, data otomatis tersinkronisasi antar perangkat.',
      features: [
        'Database SQLite lokal offline-first: 100% tetap bisa transaksi',
        'Sinkronisasi otomatis multi-perangkat (HP Kasir ↔ PC Workshop)',
        'Cadangkan & pulihkan database dengan 1 kali klik',
      ],
      accentColor: '#2563EB',
      renderPreview: () => (
        <div className="w-full max-w-sm mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-[#BFC9D1]/40 dark:border-slate-800 shadow-xl overflow-hidden text-slate-800 dark:text-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#EAEFEF] dark:bg-slate-800/80 border-b border-[#BFC9D1]/30 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
                <CloudArrowUpIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-[11px] font-black text-[#25343F] dark:text-white">Sinkronisasi Cloud &amp; Multi-Perangkat</div>
                <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Database SQLite Aktif
                </div>
              </div>
            </div>
            <ArrowPathIcon className="w-3.5 h-3.5 text-[#898989]" />
          </div>

          {/* Connected devices */}
          <div className="p-3 space-y-2 text-[10px]">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <ComputerDesktopIcon className="w-4 h-4 text-[#25343F] dark:text-white" />
                </div>
                <div>
                  <div className="font-bold text-[#25343F] dark:text-white text-[10.5px]">PC Kasir &amp; Operator Workshop</div>
                  <div className="text-[8.5px] text-[#898989]">Windows Desktop · Database Lokal SQLite</div>
                </div>
              </div>
              <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <DevicePhoneMobileIcon className="w-4 h-4 text-[#25343F] dark:text-white" />
                </div>
                <div>
                  <div className="font-bold text-[#25343F] dark:text-white text-[10.5px]">HP Smartphone Owner</div>
                  <div className="text-[8.5px] text-[#898989]">Android Mobile · Monitoring Laporan</div>
                </div>
              </div>
              <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>

            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-center">
              <span className="text-[9px] font-bold text-blue-700 dark:text-blue-300">
                🔒 Terenkripsi Aman &amp; Realtime Sync via Cloud Supabase
              </span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleFinish = () => {
    if (businessNameInput.trim() && onUpdateSettings && settings) {
      onUpdateSettings({
        ...settings,
        businessName: businessNameInput.trim(),
      });
    }
    try {
      localStorage.setItem('sukunaru_onboarding_completed', 'true');
    } catch {}
    onComplete();
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    const diffX = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(diffX) > 45) {
      if (diffX > 0) handleNext();
      else handlePrev();
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') handleFinish();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentSlide]);

  const activeSlide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;

  return (
    <div
      className="min-h-screen bg-[#EAEFEF] dark:bg-[#0B0F17] flex flex-col px-3 py-4 sm:py-6 sm:px-6 select-none transition-colors justify-between"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Top Navigation Bar ── */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-1 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#BFC9D1]/30 dark:border-slate-800 bg-white dark:bg-slate-800 shrink-0 shadow-xs">
            <img src={appLogo} alt="BisnisUrang" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-black text-sm text-[#25343F] dark:text-white tracking-tight block leading-tight">
              BisnisUrang
            </span>
            <span className="text-[9.5px] text-[#898989] font-semibold block leading-tight">
              Sistem Percetakan &amp; Usaha Kreatif
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleFinish}
            className="text-xs font-bold text-[#898989] hover:text-[#25343F] dark:hover:text-white px-2.5 py-1.5 rounded-lg transition cursor-pointer"
          >
            Lewati
          </button>
          <button
            type="button"
            onClick={handleFinish}
            aria-label="Tutup onboarding"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#898989] hover:text-[#25343F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Step Progress Indicator Chips ── */}
      <div className="max-w-md w-full mx-auto my-2 overflow-x-auto scrollbar-none py-1">
        <div className="flex items-center justify-between gap-1 min-w-full">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`flex-1 py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
                idx === currentSlide
                  ? 'bg-[#25343F] text-white font-extrabold shadow-sm'
                  : idx < currentSlide
                  ? 'bg-[#FF9B51]/20 text-[#FF6A00] font-bold'
                  : 'bg-white/70 dark:bg-slate-800/70 text-[#898989] font-medium'
              }`}
            >
              <div className="text-[9px] leading-tight truncate">{s.stepLabel}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center py-2">
        {/* Badge */}
        <div className="mb-2 text-center">
          <span className="text-[9.5px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#FF9B51]/20 text-[#FF6A00] border border-[#FF9B51]/40">
            {activeSlide.badge}
          </span>
        </div>

        {/* Live Interactive Preview Card */}
        <div className="w-full mb-3">
          {activeSlide.renderPreview()}
        </div>

        {/* Headline & Description */}
        <div className="text-center px-1 space-y-1.5 max-w-sm mx-auto">
          <h2 className="text-lg sm:text-xl font-black text-[#25343F] dark:text-white tracking-tight leading-snug whitespace-pre-line">
            {activeSlide.headline}
          </h2>
          <p className="text-xs text-[#898989] dark:text-slate-400 leading-relaxed font-medium">
            {activeSlide.description}
          </p>
        </div>

        {/* Feature Checkpoints */}
        <div className="mt-3 flex flex-col items-start max-w-sm mx-auto gap-1.5 px-2">
          {activeSlide.features.map((feat) => (
            <div key={feat} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#FF9B51]/20 border border-[#FF9B51]/40 flex items-center justify-center shrink-0">
                <CheckIcon className="w-2.5 h-2.5 text-[#FF6A00] stroke-[3]" />
              </div>
              <span className="text-[10.5px] font-semibold text-[#25343F] dark:text-slate-300 leading-tight">
                {feat}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Controls ── */}
      <div className="max-w-md w-full mx-auto space-y-3 pt-2 pb-1 shrink-0">
        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Pindah ke slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                idx === currentSlide
                  ? 'w-7 h-2 bg-[#FF6A00]'
                  : 'w-2 h-2 bg-[#BFC9D1]/60 dark:bg-slate-700 hover:bg-[#898989]'
              }`}
            />
          ))}
        </div>

        {/* Action Buttons: Prev & Next/Finish */}
        <div className="flex items-center gap-2">
          {currentSlide > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="h-12 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-[#BFC9D1]/40 dark:border-slate-700 text-[#25343F] dark:text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm hover:bg-[#EAEFEF] cursor-pointer transition-all"
            >
              <ChevronLeftIcon className="w-4 h-4 stroke-[2.5]" />
              <span>Sebelumnya</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className={`flex-1 h-12 px-5 rounded-2xl font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
              isLast
                ? 'bg-[#25343F] hover:bg-slate-900 text-white'
                : 'bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F]'
            }`}
          >
            {isLast ? (
              <>
                <SparklesIcon className="w-4 h-4 text-[#FF9B51]" />
                <span>Mulai Gunakan BisnisUrang</span>
              </>
            ) : (
              <>
                <span>Lanjut</span>
                <ChevronRightIcon className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>

        {/* Slide Counter */}
        <p className="text-center text-[10px] text-[#898989] dark:text-slate-600 font-medium">
          Langkah {currentSlide + 1} dari {slides.length}
        </p>
      </div>
    </div>
  );
};

