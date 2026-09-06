import React, { useState, useMemo } from 'react';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  BuildingStorefrontIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  Square3Stack3DIcon,
  CalculatorIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  CubeIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PaintBrushIcon,
  ChatBubbleLeftEllipsisIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { ViewType } from '../types';

interface GuideViewProps {
  onNavigate: (view: ViewType) => void;
}

type GuideCategory = 'all' | 'pos-catalog' | 'order-hpp' | 'finance-report' | 'cloud-license' | 'settings';

interface GuideSection {
  id: string;
  category: GuideCategory;
  icon: React.ElementType;
  title: string;
  badge?: string;
  isPro?: boolean;
  steps: string[];
  tips?: string;
  targetView?: ViewType;
  actionText?: string;
  keywords: string[];
}

export const GuideView: React.FC<GuideViewProps> = ({ onNavigate }) => {
  const [openSection, setOpenSection] = useState<string | null>('pos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GuideCategory>('all');

  const categories = [
    { id: 'all' as GuideCategory, label: 'Semua Panduan' },
    { id: 'pos-catalog' as GuideCategory, label: 'Kasir & Produk' },
    { id: 'order-hpp' as GuideCategory, label: 'Pesanan & HPP' },
    { id: 'finance-report' as GuideCategory, label: 'Keuangan & Laporan' },
    { id: 'cloud-license' as GuideCategory, label: 'Cloud & Lisensi' },
    { id: 'settings' as GuideCategory, label: 'Profil & Tampilan' },
  ];

  const sections: GuideSection[] = [
    {
      id: 'pos',
      category: 'pos-catalog',
      icon: BuildingStorefrontIcon,
      title: '1. Kasir POS, Scan Barcode & Cetak Struk',
      badge: 'Kasir',
      keywords: ['kasir', 'pos', 'barcode', 'scan', 'struk', 'thermal', 'printer', 'qris', 'tunai', 'faktur', 'nota'],
      steps: [
        'Buka menu Kasir POS dari navigasi bawah atau menu samping.',
        'Pindai barcode produk secara instan menggunakan kamera HP atau barcode scanner fisik USB / Bluetooth.',
        'Atau cari produk cepat dengan mengetik nama, SKU, atau kategori pada kolom pencarian.',
        'Atur jumlah (qty), diskon transaksi, serta pilih metode pembayaran (Tunai, Transfer Bank, atau QRIS).',
        'Klik Selesaikan Transaksi untuk mencetak struk thermal 58mm/80mm atau membuat faktur PDF otomatis.',
      ],
      tips: 'Barcode scanner USB bekerja otomatis langsung saat layar POS terbuka tanpa perlu klik kolom input.',
      targetView: 'pos',
      actionText: 'Buka Kasir POS',
    },
    {
      id: 'products',
      category: 'pos-catalog',
      icon: CubeIcon,
      title: '2. Katalog Produk, Resep BOM & Cetak Label',
      badge: 'Katalog',
      keywords: ['produk', 'jasa', 'bom', 'resep', 'stiker', 'label', 'barcode generator', 'sku'],
      steps: [
        'Daftarkan barang jadi, jasa custom, atau produk percetakan pada menu Produk & Jasa.',
        'Gunakan tombol "Generate Otomatis" untuk membuat kode barcode unik (SKN-XXXXXXXX) atau scan barcode kemasan fisik.',
        'Hubungkan bahan baku ke resep Bill of Materials (BOM) agar stok material terpotong otomatis setiap produk terjual di kasir.',
        'Gunakan fitur Cetak Label Barcode untuk mencetak stiker produk ke kertas label standar (50×30 mm, 60×40 mm, atau A4).',
      ],
      tips: 'Menghubungkan resep BOM ke produk membebaskan Anda dari hitung manual sisa stok bahan baku toko.',
      targetView: 'products',
      actionText: 'Kelola Produk & Resep',
    },
    {
      id: 'orders',
      category: 'order-hpp',
      icon: ShoppingCartIcon,
      title: '3. Pesanan Custom, Surat Perintah Kerja (SPK) & Deadline',
      badge: 'Fitur Pro',
      isPro: true,
      keywords: ['pesanan', 'order', 'spk', 'surat perintah kerja', 'custom', 'dp', 'uang muka', 'deadline', 'cetak spk'],
      steps: [
        'Gunakan menu Pesanan untuk pekerjaan custom order, cetak spanduk, sablon, jahit, merchandise, atau borongan.',
        'Catat nama pelanggan, rincian pekerjaan, estimasi tanggal tenggat (deadline), dan nominal uang muka (DP).',
        'Cetak Surat Perintah Kerja (SPK) untuk bagian produksi serta Nota Pesanan Pelanggan dalam ukuran kertas A4, A5, atau F4.',
        'Perbarui alur status produksi secara berkala: BARU → DIPROSES → SIAP DIAMBIL → SELESAI.',
        'Saat pesanan diserahkan ke pelanggan, catat pelunasan sisa tagihan secara langsung pada rincian pesanan.',
      ],
      tips: 'Pantau kartu pesanan di Beranda untuk memastikan tidak ada tenggat waktu produksi pelanggan yang terlewat.',
      targetView: 'orders',
      actionText: 'Kelola Pesanan SPK',
    },
    {
      id: 'hpp',
      category: 'order-hpp',
      icon: CalculatorIcon,
      title: '4. Kalkulator HPP Otomatis & Margin Keuntungan',
      badge: 'Harga',
      keywords: ['hpp', 'kalkulator', 'harga pokok', 'margin', 'laba', 'harga jual', 'tenaga kerja', 'overhead'],
      steps: [
        'Buka menu Kalkulator HPP untuk menghitung harga pokok produksi secara presisi dan objektif.',
        'Pilih komponen bahan baku yang digunakan dan masukkan takaran per unit barang jadi.',
        'Tambahkan estimasi biaya tenaga kerja, listrik, utilitas, dan penyusutan mesin untuk mendapatkan HPP riil.',
        'Pilih preset margin keuntungan (+30%, +50%, +75%, +100%) untuk menentukan harga jual ideal.',
        'Klik "Simpan ke Katalog Produk" untuk langsung memperbarui harga jual di sistem kasir.',
      ],
      tips: 'Perhitungan HPP yang teliti melindungi usaha Anda dari risiko kerugian akibat kenaikan harga bahan mentah.',
      targetView: 'hpp',
      actionText: 'Buka Kalkulator HPP',
    },
    {
      id: 'inventory',
      category: 'pos-catalog',
      icon: Square3Stack3DIcon,
      title: '5. Inventaris Bahan Baku, Batas Minimum & Restock',
      badge: 'Gudang',
      keywords: ['bahan baku', 'material', 'stok', 'gudang', 'restock', 'minimum stok', 'inventaris'],
      steps: [
        'Kelola semua material mentah (kertas, tinta, kain, lem, kemasan, dll) di menu Bahan Baku.',
        'Atur satuan yang sesuai (lembar, roll, meter, kg, pcs) dan tentukan batas minimum stok aman.',
        'Sistem akan otomatis memberikan indikator kuning/merah saat stok mendekati batas minimum.',
        'Catat Restock saat berbelanja material baru agar nilai inventaris toko Anda selalu akurat.',
      ],
      tips: 'Setiap transaksi kasir beresep BOM akan langsung memotong stok bahan baku terkait secara realtime.',
      targetView: 'inventory',
      actionText: 'Kelola Bahan Baku',
    },
    {
      id: 'finance',
      category: 'finance-report',
      icon: ArrowTrendingUpIcon,
      title: '6. Arus Kas, Pengeluaran & Laporan Download Excel',
      badge: 'Fitur Pro',
      isPro: true,
      keywords: ['keuangan', 'arus kas', 'pengeluaran', 'laba rugi', 'laporan', 'excel', 'download', 'omset'],
      steps: [
        'Catat seluruh beban operasional toko (gaji karyawan, sewa tempat, listrik, internet, transportasi) di menu Arus Kas.',
        'Pantau visualisasi grafik tren omset, laba kotor, dan laba bersih secara berkala di menu Laporan & Analisis.',
        'Gunakan tombol "Download Excel (.xlsx)" untuk mengunduh laporan penjualan dan keuangan lengkap ke komputer/HP.',
        'Cetak laporan dokumen dalam format rapi yang mendukung semua ukuran kertas (A4, A5, F4/Folio).',
      ],
      tips: 'Mencatat pengeluaran kecil harian secara konsisten memastikan laporan laba bersih akhir bulan Anda benar-benar valid.',
      targetView: 'finance',
      actionText: 'Buka Arus Kas & Laporan',
    },
    {
      id: 'sync',
      category: 'cloud-license',
      icon: CloudArrowUpIcon,
      title: '7. Sinkronisasi Realtime Cloud Multi-Perangkat',
      badge: 'Fitur Pro',
      isPro: true,
      keywords: ['cloud', 'sync', 'sinkronisasi', 'multi device', 'backup', 'cadangan', 'restore', 'online'],
      steps: [
        'BisnisUrang mengusung arsitektur Offline-First: data utama tersimpan cepat di perangkat lokal Anda.',
        'Saat terhubung ke internet, data transaksi kasir dan pesanan otomatis tersinkronisasi realtime antar-perangkat (PC kasir toko & HP Android owner).',
        'Buka menu Cadangan Data & Sinkronisasi Cloud untuk mencadangkan database online dan membuat file backup lokal.',
        'Gunakan fitur Pemulihan Cadangan Cloud saat berganti HP atau komputer baru tanpa takut kehilangan data riwayat.',
      ],
      tips: 'Tarik ke bawah (pull-to-refresh) pada layar Beranda untuk memicu sinkronisasi instan kapan saja.',
      targetView: 'backup',
      actionText: 'Buka Cadangan & Sinkronisasi',
    },
    {
      id: 'activation',
      category: 'cloud-license',
      icon: ShieldCheckIcon,
      title: '8. Akun Baru, Masa Trial 14 Hari & Upgrade Pro Lifetime',
      badge: 'Lisensi',
      keywords: ['akun', 'trial', 'free', 'pro', 'lisensi', 'serial key', 'upgrade', 'whatsapp', 'aktivasi'],
      steps: [
        'Setiap pendaftaran akun baru otomatis mendapatkan lisensi Trial 14 Hari dengan seluruh fitur PRO aktif.',
        'Saat masa trial 14 hari berakhir, akun otomatis beralih ke Mode Free (data lokal Anda tetap aman dan tidak ada yang terhapus).',
        'Buka Profil → Aktivasi Aplikasi untuk melihat nomor Serial Key terdaftar Anda.',
        'Klik tombol "Upgrade ke Pro Lifetime via WhatsApp" untuk mengaktifkan lisensi resmi permanen seumur hidup tanpa biaya langganan bulanan.',
      ],
      tips: 'Serial Key Anda tetap sama dari masa Trial hingga Pro Lifetime; aktivasi dilakukan langsung tanpa perlu ketik ulang.',
      targetView: 'activation',
      actionText: 'Buka Menu Aktivasi',
    },
    {
      id: 'settings',
      category: 'settings',
      icon: Cog6ToothIcon,
      title: '9. Profil Bisnis, Ukuran Kertas & Kustomisasi Tema',
      badge: 'Pengaturan',
      keywords: ['profil', 'pengaturan', 'logo', 'kertas', 'a4', 'a5', 'f4', 'folio', 'tema', 'dark mode', 'warna'],
      steps: [
        'Lengkapi logo toko, nama usaha, alamat, nomor WhatsApp, dan rekening bank pada menu Profil Bisnis Saya.',
        'Pada menu Pengaturan, tentukan ukuran kertas dokumen utama (A4, A5, atau F4) untuk cetak faktur & SPK.',
        'Buka menu Tampilan & Tema untuk memilih Tema Terang, Tema Gelap (Dark Mode), atau menyesuaikan warna aksen tombol.',
      ],
      tips: 'Logo dan informasi kontak yang lengkap akan langsung tertera di header struk thermal dan dokumen faktur PDF.',
      targetView: 'settings',
      actionText: 'Buka Pengaturan',
    },
  ];

  const filteredSections = useMemo(() => {
    return sections.filter(sec => {
      const matchesCategory = selectedCategory === 'all' || sec.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchesTitle = sec.title.toLowerCase().includes(q);
      const matchesSteps = sec.steps.some(s => s.toLowerCase().includes(q));
      const matchesTips = sec.tips?.toLowerCase().includes(q);
      const matchesKeywords = sec.keywords.some(k => k.toLowerCase().includes(q));

      return matchesTitle || matchesSteps || matchesTips || matchesKeywords;
    });
  }, [sections, selectedCategory, searchQuery]);

  const toggleSection = (id: string) => {
    setOpenSection(prev => (prev === id ? null : id));
  };

  const handleExpandAll = () => {
    setOpenSection('all');
  };

  const handleCollapseAll = () => {
    setOpenSection(null);
  };

  const whatsappSupportUrl = `https://wa.me/6289519203345?text=${encodeURIComponent(
    'Halo Sukunaru Studio, saya ingin bertanya seputar panduan penggunaan fitur aplikasi BisnisUrang.'
  )}`;

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
              Panduan lengkap operasional fitur BisnisUrang v2.0
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={openSection === 'all' ? handleCollapseAll : handleExpandAll}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#EAEFEF] border border-[#BFC9D1]/30 text-[#25343F] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {openSection === 'all' ? 'Tutup Semua' : 'Buka Semua'}
          </button>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="relative">
        <MagnifyingGlassIcon className="w-5 h-5 text-[#898989] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cari panduan fitur (contoh: SPK, Excel, Barcode, HPP, Cloud, Trial)..."
          className="w-full pl-11 pr-10 py-3 bg-white rounded-2xl border border-[#BFC9D1]/30 text-xs sm:text-sm font-semibold text-[#25343F] placeholder-[#898989]/60 shadow-sm focus:outline-none focus:border-[#FF9B51] focus:ring-2 focus:ring-[#FF9B51]/20 transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#898989] hover:text-[#25343F] rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── CATEGORY FILTER TABS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map(cat => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#25343F] text-white shadow-sm'
                  : 'bg-white hover:bg-[#EAEFEF] text-[#898989] hover:text-[#25343F] border border-[#BFC9D1]/25'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── ACCORDION TOPICS ── */}
      {filteredSections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 p-8 text-center space-y-2">
          <BookOpenIcon className="w-10 h-10 text-[#898989] mx-auto opacity-40" />
          <h3 className="font-extrabold text-sm text-[#25343F]">Topik Panduan Tidak Ditemukan</h3>
          <p className="text-xs text-[#898989]">
            Coba gunakan kata kunci pencarian yang lain atau pilih kategori Semua Panduan.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSections.map(sec => {
            const Icon = sec.icon;
            const isOpen = openSection === 'all' || openSection === sec.id;

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
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              sec.isPro
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
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
                        Langkah Penggunaan:
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
                          <strong className="font-bold">Tips Bisnis: </strong>
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
      )}

      {/* ── QUICK SUPPORT BANNER ── */}
      <div className="bg-gradient-to-br from-[#25343F] via-[#1A252C] to-[#0F171C] text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-[#FF9B51] text-[10.5px] font-black">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Pusat Bantuan Resmi</span>
          </div>
          <h3 className="text-sm sm:text-base font-black tracking-tight">
            Punya Pertanyaan Teknis Lainnya?
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Tim Sukunaru Studio siap membantu konsultasi alur operasional toko, setup printer barcode &amp; aktivasi lisensi.
          </p>
        </div>

        <div className="shrink-0">
          <a
            href={whatsappSupportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <ChatBubbleLeftEllipsisIcon className="w-4 h-4 stroke-[2.5]" />
            <span>Tanya via WhatsApp</span>
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 ml-0.5 opacity-80" />
          </a>
        </div>
      </div>
    </div>
  );
};
