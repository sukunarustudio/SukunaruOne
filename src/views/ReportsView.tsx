import React, { useState, useEffect } from 'react';
import { ArrowTrendingUpIcon, ChartBarIcon, ArchiveBoxIcon, CalendarIcon, CurrencyDollarIcon, PrinterIcon, ArrowDownTrayIcon, ReceiptPercentIcon, ArrowUpRightIcon, ArrowDownRightIcon, CubeIcon, Square3Stack3DIcon, ArrowPathIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { Transaction, Order, Material, Expense, FinancialTransaction } from '../types';
import { formatRupiah, formatDate, formatDateTime } from '../lib/utils';
import { downloadElementAsPdf, printIsolatedElement } from '../lib/pdfHelper';
import { Capacitor } from '@capacitor/core';
import { useToast } from '../components/Toast';

interface ReportsViewProps {
  initialReportType?: 'sales-report' | 'profit-report' | 'stock-report';
  onNavigate?: (view: any) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ initialReportType = 'sales-report', onNavigate }) => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'sales' | 'profit' | 'stock'>('sales');
  const [loading, setLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (initialReportType === 'profit-report') setActiveTab('profit');
    else if (initialReportType === 'stock-report') setActiveTab('stock');
    else setActiveTab('sales');
  }, [initialReportType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trx, ord, mat, exp] = await Promise.all([
        api.getTransactions(),
        api.getOrders(),
        api.getMaterials(),
        api.getExpenses(),
      ]);
      setTransactions(trx);
      setOrders(ord);
      setMaterials(mat);
      setExpenses(exp);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat laporan', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculations
  const totalSalesRevenue =
    transactions.reduce((sum, t) => sum + t.totalAmount, 0) +
    orders.reduce((sum, o) => sum + o.paidAmount, 0);

  const totalHppCost =
    transactions.reduce(
      (sum, t) => sum + t.items.reduce((isum, i) => isum + i.costPrice * i.quantity, 0),
      0
    ) +
    orders.reduce(
      (sum, o) => sum + o.items.reduce((isum, i) => isum + i.costPrice * i.quantity, 0),
      0
    );

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const grossProfit = Math.max(0, totalSalesRevenue - totalHppCost);
  const netProfit = grossProfit - totalExpenses;

  // Product popularity
  const productSalesMap: { [name: string]: { qty: number; revenue: number } } = {};
  transactions.forEach(t => {
    t.items.forEach(i => {
      if (!productSalesMap[i.productName]) {
        productSalesMap[i.productName] = { qty: 0, revenue: 0 };
      }
      productSalesMap[i.productName].qty += i.quantity;
      productSalesMap[i.productName].revenue += i.subtotal;
    });
  });
  orders.forEach(o => {
    o.items.forEach(i => {
      if (!productSalesMap[i.productName]) {
        productSalesMap[i.productName] = { qty: 0, revenue: 0 };
      }
      productSalesMap[i.productName].qty += i.quantity;
      productSalesMap[i.productName].revenue += i.subtotal;
    });
  });

  const topProducts = Object.entries(productSalesMap)
    .map(([name, stat]) => ({ name, ...stat }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // Stock calculations
  const totalStockAsset = materials.reduce((sum, m) => sum + m.currentStock * m.unitCost, 0);
  const lowStockMaterials = materials.filter(m => m.currentStock <= m.minStock);

  const reportTitles = {
    sales: 'Laporan-Penjualan-Sukunaru',
    profit: 'Laporan-Laba-Rugi-Sukunaru',
    stock: 'Laporan-Nilai-Stok-Sukunaru',
  };

  const handlePrint = () => {
    showToast(`Mempersiapkan cetak ${reportTitles[activeTab]}...`, 'info');
    printIsolatedElement('printable-report-area', reportTitles[activeTab]);
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const filename = `${reportTitles[activeTab]}-${new Date().toISOString().slice(0, 10)}.pdf`;
      const success = await downloadElementAsPdf('printable-report-area', {
        filename: filename,
        format: 'a4',
        orientation: 'portrait',
        marginMm: 8,
        scale: 2,
      });

      if (success) {
        showToast(Capacitor.isNativePlatform() ? 'File berhasil disimpan' : 'Laporan berhasil diunduh sebagai PDF!', 'success');
      } else {
        showToast('Gagal mengunduh PDF. Silakan coba Cetak / Print to PDF.', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat memproses file PDF', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div id="reports-view" className="space-y-3.5 max-w-7xl mx-auto pb-24 md:pb-12">
      {/* ── STICKY TOP HEADER: [ ← Judul ] ... [ Aksi ] ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40">
        {/* [ ← Judul ] ... [ Aksi (PDF/Cetak) ] */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => onNavigate?.('dashboard')}
              className="h-9 w-9 rounded-xl bg-white hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 shadow-md"
              title="Kembali ke Beranda"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-[#25343F] leading-tight tracking-tight truncate">
                Laporan & Analisis Bisnis
              </h1>
              <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
                Rekapitulasi penjualan, laba rugi & valuasi stok
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="btn-download-report-pdf"
              type="button"
              disabled={isExportingPdf}
              onClick={handleDownloadPdf}
              className="h-8 px-2.5 rounded-lg border border-[#BFC9D1]/25 bg-white hover:bg-[#EAEFEF] text-[#25343F] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-md active:scale-95"
            >
              {isExportingPdf ? (
                <ArrowPathIcon className="w-3 h-3 animate-spin text-[#898989]" />
              ) : (
                <ArrowDownTrayIcon className="w-3 h-3 text-[#898989]" />
              )}
              <span className="hidden sm:inline">{isExportingPdf ? 'Membuat...' : 'Unduh PDF'}</span>
            </button>

            <button
              id="btn-print-report"
              type="button"
              onClick={handlePrint}
              className="h-8 px-3 rounded-lg bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F] text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer active:scale-95"
            >
              <PrinterIcon className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Below Top Bar) */}
      <div className="no-print flex items-center p-0.5 bg-[#EAEFEF] rounded-lg border border-[#BFC9D1]/25 text-xs overflow-x-auto scrollbar-none max-w-fit">
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-3.5 py-1.5 rounded-md font-bold transition-colors cursor-pointer whitespace-nowrap active:scale-95 text-xs ${
            activeTab === 'sales'
              ? 'bg-white text-[#25343F] shadow-md'
              : 'text-[#898989] hover:text-[#25343F]'
          }`}
        >
          Penjualan
        </button>
        <button
          onClick={() => setActiveTab('profit')}
          className={`px-3.5 py-1.5 rounded-md font-bold transition-colors cursor-pointer whitespace-nowrap active:scale-95 text-xs ${
            activeTab === 'profit'
              ? 'bg-white text-[#25343F] shadow-md'
              : 'text-[#898989] hover:text-[#25343F]'
          }`}
        >
          Laba Rugi
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-3.5 py-1.5 rounded-md font-bold transition-colors cursor-pointer whitespace-nowrap active:scale-95 text-xs ${
            activeTab === 'stock'
              ? 'bg-white text-[#25343F] shadow-md'
              : 'text-[#898989] hover:text-[#25343F]'
          }`}
        >
          Nilai Stok
        </button>
      </div>

      {/* Printable Area Container */}
      <div id="printable-report-area" className="bg-white p-4 sm:p-8 rounded-2xl border border-[#BFC9D1]/25 shadow-md space-y-3.5 sm:space-y-4">
        {/* Printable Report Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
          <div>
            <h2 className="text-xl font-black text-[#25343F] uppercase">SUKUNARU STUDIO</h2>
            <p className="text-xs text-[#25343F] font-bold">
              {activeTab === 'sales' && 'LAPORAN REKAPITULASI PENJUALAN & PRODUK TERLARIS'}
              {activeTab === 'profit' && 'LAPORAN LABA / RUGI KOMPREHENSIF PERCETAKAN'}
              {activeTab === 'stock' && 'LAPORAN NILAI ASET PERSEDIAAN BAHAN BAKU'}
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-[#898989]">
            <p>Dicetak pada: <strong className="text-[#25343F]">{formatDateTime(new Date())}</strong></p>
            <p>Periode: <strong className="text-[#25343F]">Semua Data Berjalan</strong></p>
          </div>
        </div>

        {/* REPORT CONTENT 1: SALES REPORT */}
        {activeTab === 'sales' && (
          <div className="space-y-3.5">
            {/* Sales Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
              <div className="bg-[#EAEFEF] p-3.5 rounded-xl border border-[#BFC9D1]/25">
                <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider">
                  Total Omzet Penjualan
                </span>
                <div className="text-lg sm:text-xl font-black text-[#25343F] mt-1 font-mono">{formatRupiah(totalSalesRevenue)}
                </div>
                <p className="text-[11px] text-[#898989] mt-0.5">Gabungan Kasir POS & Pesanan</p>
              </div>

              <div className="bg-[#EAEFEF] p-3.5 rounded-xl border border-[#BFC9D1]/25">
                <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider">
                  Total HPP Terpakai
                </span>
                <div className="text-lg sm:text-xl font-black text-[#c45e00] mt-1 font-mono">{formatRupiah(totalHppCost)}
                </div>
                <p className="text-[11px] text-[#898989] mt-0.5">Modal bahan baku yang keluar</p>
              </div>

              <div className="bg-[#EAEFEF] p-3.5 rounded-xl border border-[#BFC9D1]/25">
                <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider">
                  Estimasi Laba Kotor
                </span>
                <div className="text-lg sm:text-xl font-black text-[#25343F] mt-1 font-mono">{formatRupiah(grossProfit)}
                </div>
                <p className="text-[11px] text-[#898989] mt-0.5">
                  Margin:{' '}
                  <strong>
                    {totalSalesRevenue > 0
                      ? `${Math.round((grossProfit / totalSalesRevenue) * 100)}%`
                      : '0%'}
                  </strong>
                </p>
              </div>
            </div>

            {/* Popular Products */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs sm:text-sm text-[#25343F] uppercase tracking-wider flex items-center gap-1.5">
                <CubeIcon className="w-4 h-4 text-[#25343F]" /> Rekap Penjualan per Produk
              </h4>

              {/* Mobile Card List */}
              <div className="md:hidden divide-y divide-slate-100 bg-[#EAEFEF]/50 rounded-xl border border-[#BFC9D1]/25 overflow-hidden">
                {Object.entries(productSalesMap).length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#898989]">Belum ada data penjualan</div>
                ) : (
                  Object.entries(productSalesMap).map(([name, data], idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-[#25343F] truncate">{name}</div>
                        <div className="text-[10px] text-[#898989] mt-0.5">Terjual {data.qty} pcs</div>
                      </div>
                      <div className="font-black text-xs text-[#25343F] shrink-0 font-mono">{formatRupiah(data.revenue)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border border-[#BFC9D1]/25 border-collapse">
                  <thead>
                    <tr className="border-b border-[#BFC9D1]/40 bg-[#EAEFEF] text-[#25343F] font-bold uppercase">
                      <th className="py-2.5 px-3">Nama Produk / Jasa</th>
                      <th className="py-2.5 px-3 text-center">Qty Terjual</th>
                      <th className="py-2.5 px-3 text-right">Total Pendapatan (Omzet)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {Object.entries(productSalesMap).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-[#898989]">
                          Belum ada transaksi penjualan produk
                        </td>
                      </tr>
                    ) : (
                      Object.entries(productSalesMap).map(([name, data], idx) => (
                        <tr key={idx} className="hover:bg-[#EAEFEF]/60">
                          <td className="py-2 px-3 font-semibold text-[#25343F]">{name}</td>
                          <td className="py-2 px-3 text-center font-bold text-[#25343F]">{data.qty}</td>
                          <td className="py-2 px-3 text-right font-extrabold text-[#25343F] font-mono">{formatRupiah(data.revenue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* REPORT CONTENT 2: PROFIT & LOSS REPORT */}
        {activeTab === 'profit' && (
          <div className="space-y-3.5">
            <h4 className="font-bold text-xs sm:text-sm text-[#25343F] uppercase tracking-wider flex items-center gap-1.5">
              <ChartBarIcon className="w-4 h-4 text-[#25343F]" /> Rincian Laba Rugi Komprehensif
            </h4>

            <div className="bg-[#EAEFEF] p-4 sm:p-5 rounded-xl border border-[#BFC9D1]/25 space-y-3 sm:space-y-3.5 text-xs">
              {/* Pendapatan */}
              <div className="space-y-2">
                <div className="flex justify-between font-bold text-[#25343F] text-xs sm:text-sm">
                  <span>1. PENDAPATAN (OMZET)</span>
                  <span className="text-[#25343F] font-black font-mono">{formatRupiah(totalSalesRevenue)}</span>
                </div>
                <div className="pl-3 sm:pl-4 space-y-1 text-[#898989] text-[11px] sm:text-xs">
                  <div className="flex justify-between">
                    <span>• Penjualan Langsung (Kasir POS):</span>
                    <span className="font-mono">{formatRupiah(transactions.reduce((s, t) => s + t.totalAmount, 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Pembayaran Pesanan & DP:</span>
                    <span className="font-mono">{formatRupiah(orders.reduce((s, o) => s + o.paidAmount, 0))}</span>
                  </div>
                </div>
              </div>

              {/* HPP */}
              <div className="space-y-2 pt-3 border-t border-[#BFC9D1]/40">
                <div className="flex justify-between font-bold text-[#25343F] text-xs sm:text-sm">
                  <span>2. BIAYA POKOK PENJUALAN (HPP BAHAN)</span>
                  <span className="text-[#FF4267] font-black">-{formatRupiah(totalHppCost)}</span>
                </div>
                <div className="pl-3 sm:pl-4 space-y-1 text-[#898989] text-[11px] sm:text-xs">
                  <div className="flex justify-between">
                    <span>• Modal Bahan Baku &amp; Tinta:</span>
                    <span className="font-mono">{formatRupiah(totalHppCost)}</span>
                  </div>
                </div>
              </div>

              {/* Laba Kotor */}
              <div className="p-3 bg-[#EAEFEF] rounded-xl border border-[#BFC9D1]/25 flex justify-between font-extrabold text-xs sm:text-sm text-[#25343F]">
                <span>LABA KOTOR (Gross Profit):</span>
                <span className="text-[#25343F] font-mono">{formatRupiah(grossProfit)}</span>
              </div>

              {/* Beban Operasional */}
              <div className="space-y-2 pt-3 border-t border-[#BFC9D1]/40">
                <div className="flex justify-between font-bold text-[#25343F] text-xs sm:text-sm">
                  <span>3. BEBAN OPERASIONAL &amp; BIAYA UMUM</span>
                  <span className="text-[#FF4267] font-black">-{formatRupiah(totalExpenses)}</span>
                </div>
                <div className="pl-3 sm:pl-4 space-y-1 text-[#898989] text-[11px] sm:text-xs">
                  {expenses.map((e, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>• {e.description} ({e.category}):</span>
                      <span className="font-mono">{formatRupiah(e.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Laba Bersih Final */}
              <div className="p-3.5 sm:p-4 bg-[#EAEFEF] rounded-xl border border-[#BFC9D1]/25 flex justify-between items-center text-xs sm:text-sm font-black">
                <span className="text-[#25343F] text-xs sm:text-base">LABA BERSIH (Net Profit):</span>
                <span className={`text-base sm:text-xl font-black font-mono ${netProfit >= 0 ? 'text-[#0f766e]' : 'text-[#FF4267]'}`}>
                  {formatRupiah(netProfit)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* REPORT CONTENT 3: STOCK & INVENTORY VALUATION */}
        {activeTab === 'stock' && (
          <div className="space-y-3.5">
            {/* Stock Valuation Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
              <div className="bg-[#EAEFEF] p-3.5 sm:p-4 rounded-xl border border-[#BFC9D1]/25">
                <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider">
                  Total Nilai Modal Persediaan Bahan
                </span>
                <div className="text-lg sm:text-xl font-black text-[#25343F] mt-1 font-mono">{formatRupiah(totalStockAsset)}
                </div>
                <p className="text-[11px] text-[#898989] mt-0.5">Total aset bahan fisik di studio</p>
              </div>

              <div className="bg-[#EAEFEF] p-3.5 sm:p-4 rounded-xl border border-[#BFC9D1]/25">
                <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider">
                  Bahan Baku Perlu Restock
                </span>
                <div className="text-lg sm:text-xl font-black text-[#FFAF2A] mt-1">
                  {lowStockMaterials.length} <span className="text-xs font-semibold text-[#898989]">item</span>
                </div>
                <p className="text-[11px] text-[#898989] mt-0.5">Stok di bawah batas minimum</p>
              </div>
            </div>

            {/* Detailed Material Stock List/Table */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs sm:text-sm text-[#25343F] uppercase tracking-wider flex items-center gap-1.5">
                <Square3Stack3DIcon className="w-4 h-4 text-[#25343F]" /> Rincian Nilai Persediaan per Bahan
              </h4>

              {/* ── MOBILE: Compact Stock Valuation Card List (md:hidden) ── */}
              <div className="md:hidden divide-y divide-slate-100 bg-white rounded-xl border border-[#BFC9D1]/25 shadow-md overflow-hidden">
                {materials.map(m => {
                  const itemValuation = m.currentStock * m.unitCost;
                  const isLow = m.currentStock <= m.minStock;
                  const isEmpty = m.currentStock === 0;

                  return (
                    <div key={m.id} className="p-3.5 space-y-1.5 hover:bg-[#EAEFEF]/50 transition-colors">
                      {/* Row 1: Material Name & Total Valuation */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[13px] text-[#25343F] leading-snug">{m.name}</div>
                          <div className="text-[10px] text-[#898989] font-mono mt-0.5">
                            {m.category || 'Umum'} · {formatRupiah(m.unitCost)}/{m.unit}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-black text-sm text-[#25343F] font-mono">
                            {formatRupiah(itemValuation)}
                          </div>
                          <div className="text-[10px] text-[#898989]">Nilai Aset</div>
                        </div>
                      </div>

                      {/* Row 2: Stock status */}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                        <span className="text-[#898989]">
                          Stok: <strong className="text-[#25343F] font-mono">{m.currentStock} {m.unit}</strong>
                        </span>
                        <span className={`text-[10px] font-bold ${
                          isEmpty ? 'text-[#c45e00]' : isLow ? 'text-[#FF9B51]' : 'text-[#25343F]'
                        }`}>
                          {isEmpty ? '🔴 Habis' : isLow ? `🟡 Menipis (Min ${m.minStock})` : '🟢 Aman'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── DESKTOP & PRINT: Detailed Material Stock Table (hidden md:block) ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border border-[#BFC9D1]/25 border-collapse">
                  <thead>
                    <tr className="border-b border-[#BFC9D1]/40 bg-[#EAEFEF] text-[#25343F] font-bold uppercase">
                      <th className="py-2.5 px-3">Nama Bahan</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3 text-center">Stok</th>
                      <th className="py-2.5 px-3 text-right">Harga Beli Satuan</th>
                      <th className="py-2.5 px-3 text-right">Total Nilai Persediaan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {materials.map(m => (
                      <tr key={m.id} className="hover:bg-[#EAEFEF]/60">
                        <td className="py-2.5 px-3 font-bold text-[#25343F]">{m.name}</td>
                        <td className="py-2.5 px-3 text-[#898989]">{m.category}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-[#25343F]">
                          {m.currentStock} {m.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#898989] font-mono">{formatRupiah(m.unitCost)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-[#25343F] font-mono">{formatRupiah(m.currentStock * m.unitCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer Signature */}
        <div className="mt-8 pt-6 border-t border-[#BFC9D1]/40 grid grid-cols-2 text-center text-xs text-[#898989]">
          <div>
            <p>Dibuat oleh,</p>
            <div className="h-12"></div>
            <p className="font-bold text-[#25343F] underline">( Administrasi / Kasir )</p>
          </div>
          <div>
            <p>Disetujui oleh,</p>
            <div className="h-12"></div>
            <p className="font-bold text-[#25343F] underline">( Pemilik / Manajemen )</p>
          </div>
        </div>
      </div>
    </div>
  );
};
