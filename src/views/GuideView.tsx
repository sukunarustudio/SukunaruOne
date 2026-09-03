import React, { useState } from 'react';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  BuildingStorefrontIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  Square3Stack3DIcon,
  CalculatorIcon,
  UsersIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
  CheckCircleIcon,
  QuestionMarkCircleIcon,
  QrCodeIcon,
  CloudArrowUpIcon,
  CubeIcon,
  ShieldCheckIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { ViewType } from '../types';

interface GuideViewProps {
  onNavigate: (view: ViewType) => void;
}

interface GuideSection {
  id: string;
  icon: React.ElementType;
  title: string;
  badge?: string;
  isPro?: boolean;
  steps: string[];
  tips?: string;
  targetView?: ViewType;
  actionText?: string;
}

export const GuideView: React.FC<GuideViewProps> = ({ onNavigate }) => {
  const [openSection, setOpenSection] = useState<string | null>('pos');

  const toggleSection = (id: string) => {
    setOpenSection(prev => (prev === id ? null : id));
  };

  const sections: GuideSection[] = [
    {
      id: 'pos',
      icon: BuildingStorefrontIcon,
      title: '1. Kasir POS & Scan Barcode Produk',
      badge: 'Penjualan',
      steps: [
        'Buka menu Kasir POS dari navigasi bawah atau menu utama.',
        'Pindai barcode produk secara instan menggunakan kamera HP atau scanner barcode fisik USB/Bluetooth.',
        'Atau cari produk manual dengan mengetik nama, SKU, atau kategori pada kolom pencarian.',
        'Atur jumlah (qty), diskon transaksi, serta pilih metode pembayaran (Tunai, Transfer Bank, atau QRIS).',
        'Klik Bayar / Selesaikan Transaksi untuk mencetak struk kasir thermal 58mm/80mm atau faktur PDF otomatis.',
      ],
      tips: 'Scanner barcode USB bekerja otomatis langsung saat layar POS terbuka tanpa perlu klik apa pun.',
      targetView: 'pos',
      actionText: 'Buka Kasir POS',
    },
    {
      id: 'products',
      icon: CubeIcon,
      title: '2. Produk, Resep BOM & Cetak Label Stiker',
      badge: 'Katalog',
      steps: [
        'Daftarkan barang jadi, produk percetakan custom, atau jasa pada menu Produk & Jasa.',
        'Gunakan tombol "Generate Otomatis" untuk membuat barcode unik (SKN-XXXXXXXX) atau ketik barcode pabrik fisik.',
        'Hubungkan bahan baku ke resep Bill of Materials (BOM) agar stok material terpotong otomatis setiap produk terjual di kasir.',
        'Gunakan fitur Cetak Label untuk mencetak stiker barcode ke kertas label standar (50×30 mm, 60×40 mm, atau A4).',
      ],
      tips: 'Tempelkan label barcode hasil cetak pada etalase atau kemasan produk fisik Anda agar kasir tinggal scan.',
      targetView: 'products',
      actionText: 'Kelola Produk & Barcode',
    },
    {
      id: 'orders',
      icon: ShoppingCartIcon,
      title: '3. Manajemen Pesanan & SPK Produksi',
      badge: 'Fitur Pro',
      isPro: true,
      steps: [
        'Gunakan menu Pesanan untuk pekerjaan custom order, cetak spanduk, sablon, merchandise, atau borongan.',
        'Catat data pelanggan, spesifikasi pekerjaan, tanggal tenggat (deadline), dan nominal uang muka (DP).',
        'Perbarui alur status produksi: BARU → DIPROSES → SIAP DIAMBIL → SELESAI.',
        'Saat pesanan diambil oleh pelanggan, catat pelunasan sisa tagihan secara langsung pada rincian pesanan.',
      ],
      tips: 'Pantau kartu pesanan di Beranda agar tidak ada tenggat waktu produksi pelanggan yang terlewat.',
      targetView: 'orders',
      actionText: 'Kelola Pesanan SPK',
    },
    {
      id: 'hpp',
      icon: CalculatorIcon,
      title: '4. Kalkulator HPP & Penetapan Harga Jual',
      badge: 'Unlocked',
      steps: [
        'Buka menu Kalkulator HPP (kini terbuka bebas untuk semua pengguna termasuk Mode Terbatas).',
        'Pilih komponen bahan baku yang digunakan dan masukkan takaran per unit barang jadi.',
        'Tambahkan estimasi biaya tenaga kerja, listrik, utilitas, dan penyusutan mesin untuk mengetahui HPP riil.',
        'Gunakan preset margin (+30%, +50%, +75%, +100%) untuk menentukan harga jual yang menguntungkan.',
        'Klik "Simpan ke Katalog Produk" untuk langsung memperbarui harga jual di sistem kasir.',
      ],
      tips: 'Perhitungan HPP yang akurat melindungi usaha Anda dari risiko kerugian akibat fluktuasi harga bahan mentah.',
      targetView: 'hpp',
      actionText: 'Buka Kalkulator HPP',
    },
    {
      id: 'inventory',
      icon: Square3Stack3DIcon,
      title: '5. Stok Bahan Baku & Notifikasi Menipis',
      badge: 'Gudang',
      steps: [
        'Kelola semua material mentah (kertas, tinta, kain, lem, kemasan, dll) di menu Bahan Baku.',
        'Atur satuan (lembar, roll, meter, kg, pcs) dan tentukan batas minimum stok aman.',
        'Sistem akan otomatis memberikan indikator kuning/merah jika stok mendekati batas minimum.',
        'Catat Restock saat berbelanja material baru agar nilai inventaris toko Anda selalu presisi.',
      ],
      tips: 'Setiap transaksi kasir beresep BOM akan langsung memotong stok bahan baku terkait secara realtime.',
      targetView: 'inventory',
      actionText: 'Kelola Bahan Baku',
    },
    {
      id: 'finance',
      icon: ArrowTrendingUpIcon,
      title: '6. Arus Kas, Pengeluaran & Laporan Laba',
      badge: 'Fitur Pro',
      isPro: true,
      steps: [
        'Pantau mutasi kas masuk dan keluar secara menyeluruh pada menu Arus Kas.',
        'Catat beban operasional toko (gaji karyawan, sewa tempat, listrik, internet, konsumsi, transportasi, dll).',
        'Lihat visualisasi grafik tren omset, laba kotor, dan laba bersih secara berkala.',
        'Unduh dan cetak Laporan Penjualan, Laporan Laba Rugi, dan Laporan Stok dalam format rapi.',
      ],
      tips: 'Rutin mencatat pengeluaran sekecil apa pun memastikan laporan laba bersih akhir bulan Anda benar-benar valid.',
      targetView: 'finance',
      actionText: 'Buka Arus Kas',
    },
    {
      id: 'sync',
      icon: CloudArrowUpIcon,
      title: '7. Sinkronisasi Realtime Cloud & Cadangan Data',
      badge: 'Fitur Pro',
      isPro: true,
      steps: [
        'BisnisUrang menggunakan arsitektur Offline-First (data utama tersimpan lokal di SQLite perangkat Anda).',
        'Pengguna berlisensi Pro yang masuk ke Akun Cloud akan otomatis menyinkronkan data antar-perangkat secara realtime via Supabase.',
        'Buka menu Cadangan Data & Sinkronisasi Cloud untuk mencadangkan database secara lokal maupun online.',
        'Gunakan fitur Riwayat Cadangan Online untuk memulihkan data saat berganti HP atau komputer baru.',
      ],
      tips: 'Semua perubahan data kasir dan pesanan tersinkronisasi mulus ke HP owner saat kedua perangkat online.',
      targetView: 'backup',
      actionText: 'Buka Cadangan & Sinkronisasi',
    },
    {
      id: 'activation',
      icon: ShieldCheckIcon,
      title: '8. Aktivasi Lisensi & Kustomisasi Profil Toko',
      badge: 'Lisensi & Toko',
      steps: [
        'Buka Profil → Aktivasi Aplikasi untuk memasukkan Serial Key permanen resmi (SKNR-XXXX-XXXX-XXXX).',
        'Lisensi Pro Lifetime berlaku seumur hidup tanpa biaya langganan bulanan.',
        'Lengkapi logo toko, alamat, nomor WhatsApp, serta rekening bank pada menu Profil Bisnis Saya.',
        'Atur format header/footer struk kasir dan aktifkan Tema Gelap (Dark Mode) di menu Tampilan & Tema.',
      ],
      tips: 'Lisensi terhubung permanen dengan Akun Cloud Anda sehingga cukup diaktivasi 1 kali.',
      targetView: 'activation',
      actionText: 'Buka Aktivasi Lisensi',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in pb-24 select-none">
      {/* ── STICKY TOP HEADER ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="h-9 w-9 rounded-xl bg-white hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 shadow-sm"
            title="Kembali ke Profil"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-[#25343F] leading-tight tracking-tight truncate">
              Panduan Penggunaan
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
              Petunjuk operasional lengkap sistem BisnisUrang v2.0
            </p>
          </div>
        </div>
      </div>

      {/* Accordion Topics */}
      <div className="space-y-3">
        {sections.map(sec => {
          const Icon = sec.icon;
          const isOpen = openSection === sec.id;

          return (
            <div
              key={sec.id}
              className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => toggleSection(sec.id)}
                className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 text-left hover:bg-[#EAEFEF]/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#25343F] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Icon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-extrabold text-[#25343F] text-xs sm:text-sm">
                        {sec.title}
                      </h2>
                      {sec.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          sec.isPro
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {sec.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isOpen ? (
                    <ChevronUpIcon className="w-4 h-4 text-[#898989]" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-[#898989]" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 space-y-3.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-2 pt-2">
                    <p className="text-[11px] font-extrabold text-[#898989] uppercase tracking-wider">
                      Langkah-Langkah:
                    </p>
                    <ol className="space-y-2 text-xs text-[#25343F] leading-relaxed">
                      {sec.steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#EAEFEF] text-[#25343F] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-[#BFC9D1]/30">
                            {idx + 1}
                          </span>
                          <span className="flex-1 font-medium">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {sec.tips && (
                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
                      <SparklesIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="font-bold">Tips Sukunaru: </strong>
                        <span>{sec.tips}</span>
                      </div>
                    </div>
                  )}

                  {sec.targetView && sec.actionText && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => onNavigate(sec.targetView!)}
                        className="px-4 py-2 bg-[#25343F] hover:bg-[#1b262f] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                      >
                        <CheckCircleIcon className="w-4 h-4 text-[#FF9B51]" />
                        <span>{sec.actionText}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
