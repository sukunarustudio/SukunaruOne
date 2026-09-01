import React, { useState } from 'react';
import { ArrowLeftIcon, BookOpenIcon, BuildingStorefrontIcon, ShoppingCartIcon, ArrowTrendingUpIcon, Square3Stack3DIcon, CalculatorIcon, UsersIcon, Cog6ToothIcon, ChevronDownIcon, ChevronUpIcon, SparklesIcon, CheckCircleIcon, QuestionMarkCircleIcon, QrCodeIcon, CloudArrowUpIcon, CubeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
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
      title: '1. Kasir POS & Scan Barcode Produk',
      badge: 'Penjualan',
      steps: [
        'Buka menu Kasir POS dari navigasi bawah atau menu utama.',
        'Scan barcode produk menggunakan Kamera HP (klik ikon kamera barcode) atau tembak langsung menggunakan scanner USB/Bluetooth.',
        'Atau cari produk secara manual dengan mengetik nama, SKU, atau kode barcode pada kolom pencarian.',
        'Atur jumlah pesanan (qty), diskon (jika ada), dan pilih metode pembayaran (Tunai, Transfer Bank, atau QRIS).',
        'Klik Bayar / Selesaikan Transaksi untuk mencetak struk thermal 58mm/80mm atau faktur digital otomatis.',
      ],
      tips: 'Bagi pengguna berlisensi, scanner USB bekerja otomatis tanpa perlu klik apa pun di layar saat berada di menu POS.',
      targetView: 'pos',
      actionText: 'Buka Kasir POS',
    },
    {
      id: 'products',
      icon: CubeIcon,
      title: '2. Produk, Barcode & Cetak Label',
      badge: 'Katalog',
      steps: [
        'Buka menu Produk & Jasa untuk mendaftarkan barang jadi, produk custom, atau layanan usaha Anda.',
        'Pada form produk, klik "Generate Otomatis" untuk membuat kode barcode unik (SKN-XXXXXXXX) atau ketik kode barcode fisik pabrik.',
        'Hubungkan bahan baku ke resep BOM produk agar stok material terpotong otomatis saat produk terjual.',
        'Gunakan tombol "Cetak Label" di header produk untuk mencetak stiker barcode ke kertas label (50×30 mm, 60×40 mm, atau A4).',
      ],
      tips: 'Label barcode yang dicetak langsung dapat ditempelkan pada kemasan produk fisik Anda agar kasir tinggal scan saat transaksi.',
      targetView: 'products',
      actionText: 'Kelola Produk & Barcode',
    },
    {
      id: 'orders',
      icon: ShoppingCartIcon,
      title: '3. Manajemen Pesanan & SPK Produksi',
      badge: 'Order Custom',
      steps: [
        'Gunakan menu Pesanan untuk pekerjaan pesanan khusus, custom order, atau proyek borongan.',
        'Input nama pelanggan, spesifikasi pesanan, tanggal tenggat (deadline), dan nominal uang muka (DP).',
        'Pantau dan update status pekerjaan: BARU → DIPROSES → SIAP DIAMBIL → SELESAI.',
        'Saat pesanan diambil oleh pelanggan, catat pelunasan sisa tagihan langsung di modal pesanan.',
      ],
      tips: 'Pantau kartu "Perlu Dikerjakan" di Beranda untuk memastikan semua pesanan selesai tepat waktu.',
      targetView: 'orders',
      actionText: 'Kelola Pesanan',
    },
    {
      id: 'hpp',
      icon: CalculatorIcon,
      title: '4. Kalkulator HPP & Penetapan Harga Jual',
      badge: 'Produksi',
      steps: [
        'Buka menu Kalkulator HPP dari Beranda atau menu Produksi.',
        'Pilih material bahan baku yang digunakan dan masukkan takaran per unit produk.',
        'Tambahkan estimasi biaya tenaga kerja, listrik/utilitas, dan penyusutan alat untuk mengetahui HPP riil.',
        'Gunakan tombol preset margin (+30%, +50%, +75%, +100%) untuk mendapatkan rekomendasi harga jual optimal.',
      ],
      tips: 'Kalkulasi HPP yang tepat menjamin bisnis Anda tidak merugi akibat kenaikan harga material di pasar.',
      targetView: 'hpp',
      actionText: 'Buka Kalkulator HPP',
    },
    {
      id: 'inventory',
      icon: Square3Stack3DIcon,
      title: '5. Stok Bahan Baku & Peringatan Menipis',
      badge: 'Gudang',
      steps: [
        'Daftarkan seluruh stok bahan baku (material utama, bahan penolong, kemasan, komponen, dll) di menu Bahan Baku.',
        'Atur satuan (lembar, roll, ml, pcs) dan batas minimum stok aman.',
        'Sistem akan otomatis memberi peringatan warna kuning/merah jika stok material mendekati habis.',
        'Catat Restock (stok masuk) saat Anda berbelanja material baru agar nilai inventaris selalu akurat.',
      ],
      tips: 'Stok bahan baku otomatis terpotong setiap kali kasir menyimpan transaksi yang memuat produk dengan resep BOM.',
      targetView: 'inventory',
      actionText: 'Lihat Bahan Baku',
    },
    {
      id: 'finance',
      icon: ArrowTrendingUpIcon,
      title: '6. Arus Kas, Pengeluaran & Analitik Profit',
      badge: 'Keuangan',
      steps: [
        'Buka menu Arus Kas untuk memantau pemasukan dan pengeluaran harian, mingguan, dan tahunan.',
        'Klik "+ Catat Kas" untuk mencatat beban operasional (sewa toko, listrik, gaji, transport, konsumsi, dll).',
        'Lihat grafik garis tren keuangan untuk menganalisis performa bisnis Anda dari waktu ke waktu.',
        'Buka menu Laporan untuk mengunduh Laporan Penjualan, Laporan Laba Bersih, dan Laporan Stok.',
      ],
      tips: 'Catat semua pengeluaran kecil harian agar laporan profit bersih akhir bulan mencerminkan keuntungan riil.',
      targetView: 'finance',
      actionText: 'Buka Arus Kas',
    },
    {
      id: 'sync',
      icon: CloudArrowUpIcon,
      title: '7. Sinkronisasi Realtime Cloud & Cadangan Data',
      badge: 'Cloud Sync',
      steps: [
        'Aplikasi menggunakan arsitektur Offline-First (data utama selalu tersimpan aman di SQLite/lokal perangkat Anda).',
        'Buka Cadangan Data & Sinkronisasi Cloud di menu Pengaturan/Profil.',
        'Saat terhubung ke internet dan berlisensi aktif, sistem otomatis menyinkronkan data antar-device (Web & HP Android) secara realtime via Supabase.',
        'Gunakan tombol "Cadangkan Online" untuk membuat arsip cloud instan dan "Pulihkan" saat berganti perangkat.',
      ],
      tips: 'Lakukan cadangkan database secara berkala untuk menjaga keamanan data riwayat transaksi bisnis Anda.',
      targetView: 'backup',
      actionText: 'Buka Cadangan & Cloud Sync',
    },
    {
      id: 'activation',
      icon: ShieldCheckIcon,
      title: '8. Aktivasi Lisensi & Kustomisasi Profil',
      badge: 'Lisensi & Profil',
      steps: [
        'Buka Profil → Aktivasi Aplikasi untuk memasukkan Serial Key permanen resmi (SKNR-XXXX-XXXX-XXXX).',
        'Setelah aktivasi, semua fitur pro (SPK Order, HPP Kalkulator, Barcode Scanner, Cloud Sync Realtime) terbuka penuh.',
        'Buka Pengaturan untuk melengkapi logo bisnis, alamat, rekening bank pembayaran, serta format struk & nota.',
        'Buka Tampilan & Tema untuk memilih tema gelap (Dark Mode) atau warna aksen toko.',
      ],
      tips: 'Satu lisensi dapat digunakan hingga 2 perangkat (misal 1 komputer kasir toko dan 1 HP Android owner).',
      targetView: 'activation',
      actionText: 'Aktivasi Lisensi',
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
              Petunjuk operasional lengkap aplikasi Sukunaru Studio
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
