import React, { useState } from 'react';
import { ArrowLeftIcon, BookOpenIcon, BuildingStorefrontIcon, ShoppingCartIcon, ArrowTrendingUpIcon, Square3Stack3DIcon, CalculatorIcon, UsersIcon, Cog6ToothIcon, ChevronDownIcon, ChevronUpIcon, SparklesIcon, CheckCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { ViewType } from '../types';

interface GuideViewProps {
  onNavigate: (view: ViewType) => void;
}

interface GuideSection {
  id: string;
  icon: React.ElementType;
  title: string;
  badge?: string;
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
      title: '1. Kasir POS & Transaksi Langsung',
      badge: 'Penjualan',
      steps: [
        'Buka menu Kasir dari navigasi bawah atau Aksi Cepat di Beranda.',
        'Pilih produk atau jasa yang dibeli pelanggan dari katalog atau ketik nama pada kolom pencarian.',
        'Atur jumlah (qty), diskon (jika ada), dan pilih metode pembayaran (Tunai, Transfer, atau QRIS).',
        'Klik Bayar / Selesaikan Transaksi untuk mencetak struk atau nota digital secara otomatis.',
      ],
      tips: 'Stok bahan baku akan otomatis terpotong saat transaksi POS berhasil disimpan sesuai takaran resep produk.',
      targetView: 'pos',
      actionText: 'Buka Kasir POS',
    },
    {
      id: 'orders',
      icon: ShoppingCartIcon,
      title: '2. Manajemen Pesanan & SPK Kerja',
      badge: 'Order Custom',
      steps: [
        'Gunakan menu Pesanan untuk pekerjaan custom seperti cetak stiker, spanduk, undangan, atau desain.',
        'Input nama pelanggan, detail spesifikasi, tanggal tenggat (deadline), dan nilai uang muka (DP).',
        'Update status pesanan secara bertahap: BARU → DIPROSES → SIAP DIAMBIL → SELESAI.',
        'Saat pesanan diambil, catat pelunasan sisa pembayaran langsung di modal pesanan.',
      ],
      tips: 'Pantau kartu "Perlu Dikerjakan" di Beranda untuk melihat pesanan yang sedang mendekati deadline.',
      targetView: 'orders',
      actionText: 'Kelola Pesanan',
    },
    {
      id: 'finance',
      icon: ArrowTrendingUpIcon,
      title: '3. Arus Kas, Pengeluaran & Grafik Trafik',
      badge: 'Keuangan',
      steps: [
        'Buka menu Arus Kas untuk memantau pemasukan dan pengeluaran harian, mingguan, dan tahunan.',
        'Gunakan tombol "Minggu / Bulan / Tahun" pada grafik garis untuk melihat tren transaksi bisnis secara dinamis.',
        'Klik "+ Catat Kas" untuk mencatat pengeluaran operasional (sewa, listrik, makan, transport, dll) atau pemasukan non-kasir.',
        'Saldo Kas Bisnis di Beranda akan selalu update otomatis berdasarkan total transaksi kas aktif.',
      ],
      tips: 'Pisahkan selalu uang pribadi dengan kas bisnis agar pembukuan Anda tetap sehat dan akurat.',
      targetView: 'finance',
      actionText: 'Buka Arus Kas',
    },
    {
      id: 'inventory',
      icon: Square3Stack3DIcon,
      title: '4. Bahan Baku & Peringatan Stok Menipis',
      badge: 'Gudang',
      steps: [
        'Daftarkan semua material operasional Anda (kertas art paper, tinta, lem, MDF, plastik, dll) di menu Bahan Baku.',
        'Tentukan satuan ukuran (lembar, roll, ml, pcs) dan batas minimum stok aman.',
        'Jika stok di bawah batas aman, indikator peringatan warna kuning/merah akan muncul di Beranda.',
        'Catat Restock (stok masuk) saat Anda belanja material baru agar nilai inventaris selalu sinkron.',
      ],
      tips: 'Hubungkan bahan baku ke produk di menu Produk/HPP agar sistem bisa memotong stok secara otomatis.',
      targetView: 'inventory',
      actionText: 'Lihat Bahan Baku',
    },
    {
      id: 'hpp',
      icon: CalculatorIcon,
      title: '5. Kalkulator HPP & Penetapan Harga Jual',
      badge: 'Produksi',
      steps: [
        'Buka fitur Hitung HPP di Aksi Cepat Beranda.',
        'Pilih material yang digunakan dan masukkan kuantitas per pcs produk.',
        'Tambahkan biaya operasional dan upah tenaga kerja untuk mendapatkan HPP riil per produk.',
        'Tentukan target margin profit (misal 40%) untuk menghitung rekomendasi harga jual optimal.',
      ],
      tips: 'Mengetahui HPP yang tepat menghindarkan Anda dari menjual produk di bawah modal produksi.',
      targetView: 'hpp',
      actionText: 'Buka Kalkulator HPP',
    },
    {
      id: 'customers',
      icon: UsersIcon,
      title: '6. Database Pelanggan & Riwayat Order',
      badge: 'Pelanggan',
      steps: [
        'Simpan nomor WhatsApp dan info pelanggan saat membuat order baru.',
        'Gunakan fitur Pelanggan untuk melihat riwayat transaksi, total belanja (LTV), dan status langganan.',
        'Hubungi pelanggan langsung via link WhatsApp sekali klik untuk konfirmasi order atau promo.',
      ],
      tips: 'Pelanggan setia yang sering order bisa diberikan diskon khusus atau penawaran repeat order.',
      targetView: 'customers',
      actionText: 'Daftar Pelanggan',
    },
    {
      id: 'settings',
      icon: Cog6ToothIcon,
      title: '7. Kustomisasi Profil, Struk & Pengaturan',
      badge: 'Konfigurasi',
      steps: [
        'Buka Profil → Pengaturan untuk mengisi nama bisnis, logo, nomor telepon, dan alamat.',
        'Sesuaikan Header Struk dan Footer Struk untuk ditampilkan pada cetakan nota fisik atau PDF.',
        'Input nomor rekening bank dan instruksi transfer untuk memudahkan pelanggan membayar.',
      ],
      tips: 'Logo dan nama bisnis yang rapi pada struk meningkatkan kredibilitas dan profesionalisme toko Anda.',
      targetView: 'settings',
      actionText: 'Buka Pengaturan',
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
              Panduan Penggunaan
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
              Petunjuk operasional lengkap aplikasi Studio OS
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
              className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md overflow-hidden transition-all duration-200"
            >
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => toggleSection(sec.id)}
                className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#EAEFEF]/80 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isOpen ? 'bg-[#25343F] text-white' : 'bg-[#EAEFEF] text-white'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#25343F] leading-snug">
                        {sec.title}
                      </span>
                      {sec.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAEFEF] text-[#898989]">
                          {sec.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-1 text-[#898989]">
                  {isOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                </div>
              </button>

              {/* Accordion Body */}
              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3">
                  <div className="space-y-2 mt-2">
                    {sec.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-[#898989] leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-[#EAEFEF] text-[#25343F] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>

                  {sec.tips && (
                    <div className="p-3 bg-[#FF9B51]/8 border border-[#FF9B51]/40 rounded-xl flex items-start gap-2.5 text-[11.5px] text-[#c45e00]">
                      <CheckCircleIcon className="w-4 h-4 text-[#FF9B51] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Tips Pro: </span>
                        {sec.tips}
                      </div>
                    </div>
                  )}

                  {sec.targetView && sec.actionText && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onNavigate(sec.targetView!)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] text-xs font-bold transition-colors cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-md"
                      >
                        <span>{sec.actionText}</span>
                        <span>→</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Need more help footer */}
      <div className="bg-[#EAEFEF] border border-[#BFC9D1]/25 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAEFEF] text-[#25343F] flex items-center justify-center shrink-0">
            <QuestionMarkCircleIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs text-[#25343F]">Masih butuh bantuan langsung?</div>
            <div className="text-[11px] text-[#898989]">Tim kami siap menjawab pertanyaan Anda via WhatsApp atau Email.</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('contact')}
          className="px-4 py-2 bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] rounded-xl text-xs font-bold transition-colors cursor-pointer active:scale-95 shrink-0"
        >
          Hubungi Kami
        </button>
      </div>
    </div>
  );
};
