import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ArchiveBoxIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  ReceiptPercentIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  CubeIcon,
  Square3Stack3DIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
  BanknotesIcon,
  BuildingStorefrontIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  QrCodeIcon,
  WalletIcon,
  SparklesIcon,
  TableCellsIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api';
import { Transaction, Order, Material, Expense, BusinessSettings } from '../types';
import { formatRupiah, formatDate, formatDateTime } from '../lib/utils';
import { downloadElementAsPdf, printIsolatedElement } from '../lib/pdfHelper';
import {
  downloadSalesReportExcel,
  downloadProfitReportExcel,
  downloadStockReportExcel,
  downloadFullWorkbookExcel,
  downloadReportCsv,
  ReportExportData,
} from '../lib/excelHelper';
import { Capacitor } from '@capacitor/core';
import { useToast } from '../components/Toast';

interface ReportsViewProps {
  initialReportType?: 'sales-report' | 'profit-report' | 'stock-report';
  settings?: BusinessSettings;
  onNavigate?: (view: any) => void;
}

type PeriodType = 'weekly' | 'monthly' | 'yearly' | 'custom' | 'all';
type PaperSize = 'a4' | 'a5' | 'f4';
type PaperOrientation = 'portrait' | 'landscape';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const PAPER_CONFIGS: Record<PaperSize, { name: string; dimension: string; desc: string }> = {
  a4: { name: 'A4', dimension: '210 × 297 mm', desc: 'Standar Dokumen Laporan Bisnis' },
  a5: { name: 'A5', dimension: '148 × 210 mm', desc: 'Ukuran Ringkas / Hemat Kertas' },
  f4: { name: 'F4', dimension: '210 × 330 mm', desc: 'Standar Dokumen Administrasi' },
};

export const ReportsView: React.FC<ReportsViewProps> = ({
  initialReportType = 'sales-report',
  settings,
  onNavigate,
}) => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'sales' | 'profit' | 'stock'>('sales');
  const [loading, setLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [showExcelDropdown, setShowExcelDropdown] = useState(false);
  const [showPaperSettings, setShowPaperSettings] = useState(false);

  // ─── Paper Settings State ───────────────────────────────────────────────────
  const [paperSize, setPaperSize] = useState<PaperSize>('a4');
  const [paperOrientation, setPaperOrientation] = useState<PaperOrientation>('portrait');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // ─── Period Filter States ───────────────────────────────────────────────────
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');

  // For monthly
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  // For weekly (anchor date)
  const [weeklyAnchorDate, setWeeklyAnchorDate] = useState<Date>(new Date());

  // For custom range (YYYY-MM-DD)
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (showExcelDropdown && !(e.target as Element)?.closest('#excel-dropdown-container')) {
        setShowExcelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showExcelDropdown]);

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
    const handleRefresh = () => {
      api.getTransactions().then(t => setTransactions(t)).catch(() => {});
      api.getOrders().then(o => setOrders(o)).catch(() => {});
      api.getMaterials().then(m => setMaterials(m)).catch(() => {});
      api.getExpenses().then(e => setExpenses(e)).catch(() => {});
    };
    window.addEventListener('sukunaru:sync_completed', handleRefresh);
    window.addEventListener('sukunaru:data_mutation', handleRefresh);
    return () => {
      window.removeEventListener('sukunaru:sync_completed', handleRefresh);
      window.removeEventListener('sukunaru:data_mutation', handleRefresh);
    };
  }, []);

  // ─── Calculate Start and End Date Boundaries ────────────────────────────────
  const { startDateStr, endDateStr, periodLabel } = useMemo(() => {
    if (periodType === 'all') {
      return {
        startDateStr: '2000-01-01',
        endDateStr: '2099-12-31',
        periodLabel: 'Semua Data Berjalan (All Time)',
      };
    }

    if (periodType === 'weekly') {
      const end = new Date(weeklyAnchorDate);
      end.setHours(23, 59, 59, 999);
      const start = new Date(weeklyAnchorDate);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      const startIso = start.toISOString().slice(0, 10);
      const endIso = end.toISOString().slice(0, 10);
      const startFmt = formatDate(startIso);
      const endFmt = formatDate(endIso);

      return {
        startDateStr: startIso,
        endDateStr: endIso,
        periodLabel: `Mingguan (${startFmt} - ${endFmt})`,
      };
    }

    if (periodType === 'monthly') {
      const year = selectedYear;
      const month = selectedMonth;
      const lastDay = new Date(year, month + 1, 0);

      const startIso = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

      return {
        startDateStr: startIso,
        endDateStr: endIso,
        periodLabel: `Bulan ${MONTH_NAMES[month]} ${year}`,
      };
    }

    if (periodType === 'yearly') {
      const year = selectedYear;
      const startIso = `${year}-01-01`;
      const endIso = `${year}-12-31`;

      return {
        startDateStr: startIso,
        endDateStr: endIso,
        periodLabel: `Tahun ${year}`,
      };
    }

    // Custom
    const startIso = customStartDate || '2000-01-01';
    const endIso = customEndDate || '2099-12-31';
    return {
      startDateStr: startIso,
      endDateStr: endIso,
      periodLabel: `Rentang ${formatDate(startIso)} s/d ${formatDate(endIso)}`,
    };
  }, [periodType, selectedMonth, selectedYear, weeklyAnchorDate, customStartDate, customEndDate]);

  // ─── Filter Data by Date Range ──────────────────────────────────────────────
  const isDateInRange = (dateInput?: string) => {
    if (!dateInput) return false;
    const cleanDate = dateInput.slice(0, 10);
    return cleanDate >= startDateStr && cleanDate <= endDateStr;
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(
      t => isDateInRange(t.date || t.createdAt) && t.status !== 'REFUNDED' && t.status !== 'CANCELLED'
    );
  }, [transactions, startDateStr, endDateStr]);

  const filteredOrders = useMemo(() => {
    return orders.filter(
      o => isDateInRange(o.createdAt || (o as any).date) && o.status !== 'BATAL'
    );
  }, [orders, startDateStr, endDateStr]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => isDateInRange(e.date || e.createdAt));
  }, [expenses, startDateStr, endDateStr]);

  // ─── Financial Calculations ────────────────────────────────────────────────
  const posRevenue = filteredTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const ordersRevenue = filteredOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  const totalSalesRevenue = posRevenue + ordersRevenue;

  const posHppCost = filteredTransactions.reduce(
    (sum, t) => sum + (t.items || []).reduce((isum, i) => isum + (Number(i.costPrice) || 0) * (Number(i.quantity) || 0), 0),
    0
  );
  const ordersHppCost = filteredOrders.reduce(
    (sum, o) => sum + (o.items || []).reduce((isum, i) => isum + (Number(i.costPrice) || 0) * (Number(i.quantity) || 0), 0),
    0
  );
  const totalHppCost = posHppCost + ordersHppCost;

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const grossProfit = Math.max(0, totalSalesRevenue - totalHppCost);
  const netProfit = grossProfit - totalExpenses;

  const grossMarginPercent = totalSalesRevenue > 0 ? Math.round((grossProfit / totalSalesRevenue) * 100) : 0;
  const netMarginPercent = totalSalesRevenue > 0 ? Math.round((netProfit / totalSalesRevenue) * 100) : 0;

  const totalTrxCount = filteredTransactions.length + filteredOrders.length;
  const averageOrderValue = totalTrxCount > 0 ? Math.round(totalSalesRevenue / totalTrxCount) : 0;

  // ─── Payment Methods Breakdown ──────────────────────────────────────────────
  const paymentMethodStats = useMemo(() => {
    const counts: { [method: string]: { count: number; total: number } } = {
      CASH: { count: 0, total: 0 },
      TRANSFER: { count: 0, total: 0 },
      QRIS: { count: 0, total: 0 },
    };

    filteredTransactions.forEach(t => {
      const method = t.paymentMethod || 'CASH';
      if (!counts[method]) counts[method] = { count: 0, total: 0 };
      counts[method].count += 1;
      counts[method].total += t.totalAmount || 0;
    });

    filteredOrders.forEach(o => {
      (o.payments || []).forEach(p => {
        const method = p.paymentMethod || (p as any).method || 'CASH';
        if (!counts[method]) counts[method] = { count: 0, total: 0 };
        counts[method].count += 1;
        counts[method].total += p.amount || 0;
      });
      if ((!o.payments || o.payments.length === 0) && o.paidAmount > 0) {
        counts.CASH.count += 1;
        counts.CASH.total += o.paidAmount;
      }
    });

    return counts;
  }, [filteredTransactions, filteredOrders]);

  // ─── Product Sales Breakdown ────────────────────────────────────────────────
  const productSalesMap = useMemo(() => {
    const map: { [name: string]: { qty: number; revenue: number; hpp: number } } = {};

    filteredTransactions.forEach(t => {
      (t.items || []).forEach(i => {
        const name = i.productName || 'Produk';
        if (!map[name]) map[name] = { qty: 0, revenue: 0, hpp: 0 };
        map[name].qty += Number(i.quantity) || 0;
        map[name].revenue += Number(i.subtotal) || 0;
        map[name].hpp += (Number(i.costPrice) || 0) * (Number(i.quantity) || 0);
      });
    });

    filteredOrders.forEach(o => {
      (o.items || []).forEach(i => {
        const name = i.productName || 'Produk Custom';
        if (!map[name]) map[name] = { qty: 0, revenue: 0, hpp: 0 };
        map[name].qty += Number(i.quantity) || 0;
        map[name].revenue += Number(i.subtotal) || 0;
        map[name].hpp += (Number(i.costPrice) || 0) * (Number(i.quantity) || 0);
      });
    });

    return map;
  }, [filteredTransactions, filteredOrders]);

  const topProducts = useMemo(() => {
    return Object.entries(productSalesMap)
      .map(([name, stat]) => ({
        name,
        qty: stat.qty,
        revenue: stat.revenue,
        hpp: stat.hpp,
        profit: Math.max(0, stat.revenue - stat.hpp),
        contribution: totalSalesRevenue > 0 ? Math.round((stat.revenue / totalSalesRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [productSalesMap, totalSalesRevenue]);

  // ─── Expense Categories Breakdown ───────────────────────────────────────────
  const expensesByCategory = useMemo(() => {
    const map: { [cat: string]: number } = {};
    filteredExpenses.forEach(e => {
      const cat = e.category || 'Operasional Lainnya';
      map[cat] = (map[cat] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(map)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, totalExpenses]);

  // ─── Visual Analysis Chart Data (Recharts) ──────────────────────────────────
  const trendChartData = useMemo(() => {
    if (periodType === 'yearly' || periodType === 'all') {
      const monthsData: { [key: string]: { label: string; omzet: number; hpp: number; beban: number; profit: number } } = {};

      if (periodType === 'yearly') {
        for (let m = 0; m < 12; m++) {
          const key = `${selectedYear}-${String(m + 1).padStart(2, '0')}`;
          monthsData[key] = {
            label: MONTH_NAMES[m].slice(0, 3),
            omzet: 0,
            hpp: 0,
            beban: 0,
            profit: 0,
          };
        }
      }

      filteredTransactions.forEach(t => {
        const d = (t.date || t.createdAt || '').slice(0, 7);
        if (!monthsData[d]) {
          monthsData[d] = { label: d, omzet: 0, hpp: 0, beban: 0, profit: 0 };
        }
        monthsData[d].omzet += t.totalAmount || 0;
        const hpp = (t.items || []).reduce((sum, i) => sum + (Number(i.costPrice) || 0) * (Number(i.quantity) || 0), 0);
        monthsData[d].hpp += hpp;
      });

      filteredOrders.forEach(o => {
        const d = (o.createdAt || (o as any).date || '').slice(0, 7);
        if (!monthsData[d]) {
          monthsData[d] = { label: d, omzet: 0, hpp: 0, beban: 0, profit: 0 };
        }
        monthsData[d].omzet += o.paidAmount || 0;
        const hpp = (o.items || []).reduce((sum, i) => sum + (Number(i.costPrice) || 0) * (Number(i.quantity) || 0), 0);
        monthsData[d].hpp += hpp;
      });

      filteredExpenses.forEach(e => {
        const d = (e.date || e.createdAt || '').slice(0, 7);
        if (!monthsData[d]) {
          monthsData[d] = { label: d, omzet: 0, hpp: 0, beban: 0, profit: 0 };
        }
        monthsData[d].beban += e.amount || 0;
      });

      Object.values(monthsData).forEach(item => {
        item.profit = item.omzet - item.hpp - item.beban;
      });

      return Object.keys(monthsData).sort().map(k => monthsData[k]);
    }

    const daysData: { [date: string]: { label: string; omzet: number; hpp: number; beban: number; profit: number } } = {};

    filteredTransactions.forEach(t => {
      const d = (t.date || t.createdAt || '').slice(0, 10);
      if (!daysData[d]) {
        const dateObj = new Date(d);
        const dayLabel = isNaN(dateObj.getTime()) ? d : `${dateObj.getDate()} ${MONTH_NAMES[dateObj.getMonth()]?.slice(0, 3) || ''}`;
        daysData[d] = { label: dayLabel, omzet: 0, hpp: 0, beban: 0, profit: 0 };
      }
      daysData[d].omzet += t.totalAmount || 0;
      const hpp = (t.items || []).reduce((sum, i) => sum + (Number(i.costPrice) || 0) * (Number(i.quantity) || 0), 0);
      daysData[d].hpp += hpp;
    });

    filteredOrders.forEach(o => {
      const d = (o.createdAt || (o as any).date || '').slice(0, 10);
      if (!daysData[d]) {
        const dateObj = new Date(d);
        const dayLabel = isNaN(dateObj.getTime()) ? d : `${dateObj.getDate()} ${MONTH_NAMES[dateObj.getMonth()]?.slice(0, 3) || ''}`;
        daysData[d] = { label: dayLabel, omzet: 0, hpp: 0, beban: 0, profit: 0 };
      }
      daysData[d].omzet += o.paidAmount || 0;
      const hpp = (o.items || []).reduce((sum, i) => sum + (Number(i.costPrice) || 0) * (Number(i.quantity) || 0), 0);
      daysData[d].hpp += hpp;
    });

    filteredExpenses.forEach(e => {
      const d = (e.date || e.createdAt || '').slice(0, 10);
      if (!daysData[d]) {
        const dateObj = new Date(d);
        const dayLabel = isNaN(dateObj.getTime()) ? d : `${dateObj.getDate()} ${MONTH_NAMES[dateObj.getMonth()]?.slice(0, 3) || ''}`;
        daysData[d] = { label: dayLabel, omzet: 0, hpp: 0, beban: 0, profit: 0 };
      }
      daysData[d].beban += e.amount || 0;
    });

    Object.values(daysData).forEach(item => {
      item.profit = item.omzet - item.hpp - item.beban;
    });

    return Object.keys(daysData).sort().map(k => daysData[k]);
  }, [filteredTransactions, filteredOrders, filteredExpenses, periodType, selectedYear]);

  // Stock calculations
  const totalStockAsset = materials.reduce((sum, m) => sum + (m.currentStock || 0) * (m.unitCost || 0), 0);
  const lowStockMaterials = materials.filter(m => (m.currentStock || 0) <= (m.minStock || 0));

  const reportTitles = {
    sales: 'Laporan-Penjualan',
    profit: 'Laporan-Laba-Rugi',
    stock: 'Laporan-Nilai-Stok',
  };

  // ─── Export Payloads ────────────────────────────────────────────────────────
  const getExportDataPayload = (): ReportExportData => ({
    businessSettings: settings,
    periodLabel,
    startDateStr,
    endDateStr,
    transactions: filteredTransactions,
    orders: filteredOrders,
    materials: materials,
    expenses: filteredExpenses,
    topProducts,
    paymentMethodStats,
    expensesByCategory,
    financials: {
      totalSalesRevenue,
      totalHppCost,
      grossProfit,
      totalExpenses,
      netProfit,
      grossMarginPercent,
      netMarginPercent,
      totalTrxCount,
      averageOrderValue,
      posRevenue,
      ordersRevenue,
      posHppCost,
      ordersHppCost,
    },
  });

  // ─── Handlers: Print, PDF, Excel ───────────────────────────────────────────
  const handlePrint = () => {
    const title = `${reportTitles[activeTab]}-${periodType}-${paperSize.toUpperCase()}-${paperOrientation}`;
    showToast(
      `Mempersiapkan cetak ${reportTitles[activeTab]} (${PAPER_CONFIGS[paperSize].name} ${paperOrientation === 'landscape' ? 'Landscape' : 'Portrait'})...`,
      'info'
    );
    printIsolatedElement('printable-report-area', title, paperSize, paperOrientation);
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const filename = `${reportTitles[activeTab]}-${periodType}-${startDateStr}-${paperSize.toUpperCase()}-${paperOrientation}.pdf`;
      const success = await downloadElementAsPdf('printable-report-area', {
        filename: filename,
        format: paperSize,
        orientation: paperOrientation,
        marginMm: paperSize === 'a5' ? 4 : 6,
        scale: 2.5,
      });

      if (success) {
        showToast(
          Capacitor.isNativePlatform()
            ? 'File PDF berhasil disimpan'
            : `Dokumen PDF (${PAPER_CONFIGS[paperSize].name} ${paperOrientation === 'landscape' ? 'Landscape' : 'Portrait'}) berhasil diunduh!`,
          'success'
        );
      } else {
        showToast('Gagal mengunduh PDF. Silakan gunakan tombol Cetak / Print to PDF.', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat memproses file PDF', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadExcel = async (mode: 'active' | 'full' | 'csv' = 'active') => {
    try {
      setIsExportingExcel(true);
      setShowExcelDropdown(false);
      const payload = getExportDataPayload();

      if (mode === 'full') {
        showToast('Mempersiapkan file Excel Buku Besar Lengkap (Multi-Sheet)...', 'info');
        const res = await downloadFullWorkbookExcel(payload);
        if (res.success) {
          showToast(
            Capacitor.isNativePlatform()
              ? 'File Excel Buku Besar berhasil disimpan di Dokumen'
              : 'File Excel Buku Besar Multi-Sheet berhasil diunduh!',
            'success'
          );
        } else {
          showToast(res.error || 'Gagal membuat file Excel Buku Besar', 'error');
        }
        return;
      }

      if (mode === 'csv') {
        showToast('Mempersiapkan spreadsheet CSV...', 'info');
        if (activeTab === 'sales') {
          await downloadReportCsv(
            `Laporan-Penjualan-${startDateStr}`,
            ['Nama Produk/Jasa', 'Qty Terjual', 'Total HPP (Rp)', 'Omzet Penjualan (Rp)', 'Laba Kotor (Rp)', 'Kontribusi (%)'],
            topProducts.map(p => [p.name, p.qty, p.hpp, p.revenue, p.profit, `${p.contribution}%`]),
            `Laporan-Penjualan-${startDateStr}_${endDateStr}.csv`
          );
        } else if (activeTab === 'profit') {
          await downloadReportCsv(
            `Laporan-Laba-Rugi-${startDateStr}`,
            ['Kategori Beban', 'Nominal (Rp)', 'Porsi (%)'],
            expensesByCategory.map(e => [e.category, e.amount, `${e.percentage}%`]),
            `Laporan-Laba-Rugi-${startDateStr}_${endDateStr}.csv`
          );
        } else {
          await downloadReportCsv(
            `Laporan-Nilai-Stok-${startDateStr}`,
            ['Nama Bahan Baku', 'Kategori', 'Stok Saat Ini', 'Satuan', 'Harga Beli Satuan (Rp)', 'Total Nilai Aset (Rp)'],
            materials.map(m => [
              m.name,
              m.category || '',
              m.currentStock || 0,
              m.unit || '',
              m.unitCost || 0,
              (m.currentStock || 0) * (m.unitCost || 0),
            ]),
            `Laporan-Nilai-Stok-${startDateStr}.csv`
          );
        }
        showToast('File spreadsheet CSV berhasil diunduh!', 'success');
        return;
      }

      // Default: active tab Excel
      showToast(`Mempersiapkan file Excel ${reportTitles[activeTab]}...`, 'info');
      let res;
      if (activeTab === 'sales') {
        res = await downloadSalesReportExcel(payload);
      } else if (activeTab === 'profit') {
        res = await downloadProfitReportExcel(payload);
      } else {
        res = await downloadStockReportExcel(payload);
      }

      if (res?.success) {
        showToast(
          Capacitor.isNativePlatform()
            ? 'File Excel berhasil disimpan di Dokumen'
            : `File Excel ${reportTitles[activeTab]} berhasil diunduh!`,
          'success'
        );
      } else {
        showToast(res?.error || 'Gagal mengunduh file Excel', 'error');
      }
    } catch (err: any) {
      showToast('Terjadi kesalahan saat memproses file Excel: ' + (err.message || ''), 'error');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const changeWeek = (deltaWeeks: number) => {
    setWeeklyAnchorDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + deltaWeeks * 7);
      return next;
    });
  };

  return (
    <div id="reports-view" className="space-y-3.5 max-w-7xl mx-auto pb-28 md:pb-16 animate-fade-in text-slate-800 dark:text-slate-200">
      {/* ── STICKY TOP HEADER: [ ← Judul ] ... [ Aksi Cepat (Excel/PDF/Cetak) ] ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] dark:bg-slate-900 py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => onNavigate?.('dashboard')}
              className="h-9 w-9 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#EAEFEF] dark:hover:bg-slate-700 border border-[#BFC9D1]/25 dark:border-slate-700 text-[#25343F] dark:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 shadow-sm"
              title="Kembali ke Beranda"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black text-[#25343F] dark:text-white leading-tight tracking-tight truncate">
                Laporan &amp; Analisis Bisnis
              </h1>
              <p className="text-[11px] sm:text-xs text-[#898989] dark:text-slate-400 font-medium mt-0.5 truncate hidden sm:block">
                Rekapitulasi penjualan, laba rugi, valuasi stok, ekspor Excel &amp; cetak dokumen
              </p>
            </div>
          </div>

          {/* Quick Action Group on Top */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Excel Download Dropdown Button */}
            <div id="excel-dropdown-container" className="relative">
              <button
                type="button"
                disabled={isExportingExcel}
                onClick={() => setShowExcelDropdown(prev => !prev)}
                className="min-h-[38px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isExportingExcel ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <TableCellsIcon className="w-4 h-4 stroke-[2.5]" />
                )}
                <span className="hidden sm:inline">Unduh Excel</span>
                <span className="sm:hidden">Excel</span>
                <ChevronDownIcon className="w-3 h-3 stroke-[3] opacity-80" />
              </button>

              {showExcelDropdown && (
                <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-[#BFC9D1]/40 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-slate-800 dark:text-slate-200">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#898989] block">
                      Opsi Ekspor Spreadsheet
                    </span>
                    <span className="text-[11px] font-bold text-[#25343F] dark:text-white">
                      Microsoft Excel (.xls / CSV)
                    </span>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => handleDownloadExcel('active')}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[#25343F] dark:text-slate-200 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <TableCellsIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-extrabold text-[11.5px]">Excel Tab Ini ({reportTitles[activeTab].replace('Laporan-', '')})</div>
                        <div className="text-[9.5px] text-[#898989] font-normal">Format .xls dengan formula &amp; rincian</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadExcel('full')}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[#25343F] dark:text-slate-200 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-extrabold text-[11.5px] text-emerald-700 dark:text-emerald-400">
                          Buku Besar Lengkap (Multi-Sheet)
                        </div>
                        <div className="text-[9.5px] text-[#898989] font-normal">Kompilasi 5 Sheet: Penjualan, Laba, Stok, Trx</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadExcel('csv')}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-[#25343F] dark:text-slate-200 flex items-center gap-2.5 transition cursor-pointer border-t border-slate-100 dark:border-slate-800/80 mt-1 pt-2"
                    >
                      <DocumentTextIcon className="w-4 h-4 text-[#898989] shrink-0" />
                      <div>
                        <div className="font-bold text-[11px]">Spreadsheet CSV (.csv)</div>
                        <div className="text-[9.5px] text-[#898989] font-normal">Format teks universal standar UTF-8 BOM</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="min-h-[38px] px-3.5 rounded-xl bg-[#25343F] dark:bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <PrinterIcon className="w-4 h-4 text-[#FF9B51]" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── FILTER PERIODE & REPORT TABS BAR ─────────────────────────────────── */}
      <div className="no-print space-y-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-[#BFC9D1]/25 dark:border-slate-800 shadow-md">
        {/* Row 1: Report Type Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center p-1 bg-[#EAEFEF] dark:bg-slate-800 rounded-xl border border-[#BFC9D1]/25 dark:border-slate-700 text-xs overflow-x-auto scrollbar-none w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('sales')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap text-xs text-center ${
                activeTab === 'sales'
                  ? 'bg-white dark:bg-slate-900 text-[#25343F] dark:text-white shadow-sm'
                  : 'text-[#898989] hover:text-[#25343F] dark:hover:text-white'
              }`}
            >
              Penjualan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profit')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap text-xs text-center ${
                activeTab === 'profit'
                  ? 'bg-white dark:bg-slate-900 text-[#25343F] dark:text-white shadow-sm'
                  : 'text-[#898989] hover:text-[#25343F] dark:hover:text-white'
              }`}
            >
              Laba Rugi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stock')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap text-xs text-center ${
                activeTab === 'stock'
                  ? 'bg-white dark:bg-slate-900 text-[#25343F] dark:text-white shadow-sm'
                  : 'text-[#898989] hover:text-[#25343F] dark:hover:text-white'
              }`}
            >
              Nilai Stok
            </button>
          </div>

          {/* Active Period Badge Text */}
          <div className="text-xs font-semibold text-[#898989] dark:text-slate-400 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-[#FF9B51]" />
            <span className="text-[#25343F] dark:text-slate-200 font-bold">{periodLabel}</span>
          </div>
        </div>

        {/* Row 2: Period Selector Buttons */}
        {activeTab !== 'stock' && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setPeriodType('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  periodType === 'weekly'
                    ? 'bg-[#25343F] dark:bg-slate-700 text-white shadow-sm'
                    : 'bg-[#EAEFEF] dark:bg-slate-800 text-[#898989] hover:text-[#25343F] dark:hover:text-white'
                }`}
              >
                Mingguan
              </button>

              <button
                type="button"
                onClick={() => setPeriodType('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  periodType === 'monthly'
                    ? 'bg-[#25343F] dark:bg-slate-700 text-white shadow-sm'
                    : 'bg-[#EAEFEF] dark:bg-slate-800 text-[#898989] hover:text-[#25343F] dark:hover:text-white'
                }`}
              >
                Bulanan
              </button>

              <button
                type="button"
                onClick={() => setPeriodType('yearly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  periodType === 'yearly'
                    ? 'bg-[#25343F] dark:bg-slate-700 text-white shadow-sm'
                    : 'bg-[#EAEFEF] dark:bg-slate-800 text-[#898989] hover:text-[#25343F] dark:hover:text-white'
                }`}
              >
                Tahunan
              </button>

              <button
                type="button"
                onClick={() => setPeriodType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  periodType === 'all'
                    ? 'bg-[#25343F] dark:bg-slate-700 text-white shadow-sm'
                    : 'bg-[#EAEFEF] dark:bg-slate-800 text-[#898989] hover:text-[#25343F] dark:hover:text-white'
                }`}
              >
                Semua Data
              </button>

              <button
                type="button"
                onClick={() => setPeriodType('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  periodType === 'custom'
                    ? 'bg-[#25343F] dark:bg-slate-700 text-white shadow-sm'
                    : 'bg-[#EAEFEF] dark:bg-slate-800 text-[#898989] hover:text-[#25343F] dark:hover:text-white'
                }`}
              >
                Rentang Kustom
              </button>
            </div>

            {/* Sub-controls based on active periodType */}
            <div className="flex items-center gap-2">
              {periodType === 'weekly' && (
                <div className="flex items-center gap-1.5 bg-[#EAEFEF] dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => changeWeek(-1)}
                    className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-[#25343F] dark:text-white transition-colors cursor-pointer"
                    title="Minggu Sebelumnya"
                  >
                    <ChevronLeftIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeeklyAnchorDate(new Date())}
                    className="px-2 py-0.5 text-[11px] font-bold text-[#25343F] dark:text-white hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors"
                  >
                    Minggu Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => changeWeek(1)}
                    className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-[#25343F] dark:text-white transition-colors cursor-pointer"
                    title="Minggu Berikutnya"
                  >
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {periodType === 'monthly' && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(Number(e.target.value))}
                    className="px-2.5 py-1.5 bg-[#EAEFEF] dark:bg-slate-800 border border-[#BFC9D1]/25 dark:border-slate-700 rounded-xl text-xs font-bold text-[#25343F] dark:text-white focus:outline-hidden focus:bg-white dark:focus:bg-slate-700 cursor-pointer"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={idx} value={idx}>
                        {name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="px-2.5 py-1.5 bg-[#EAEFEF] dark:bg-slate-800 border border-[#BFC9D1]/25 dark:border-slate-700 rounded-xl text-xs font-bold text-[#25343F] dark:text-white focus:outline-hidden focus:bg-white dark:focus:bg-slate-700 cursor-pointer"
                  >
                    {[2024, 2025, 2026, 2027, 2028].map(yr => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {periodType === 'yearly' && (
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1.5 bg-[#EAEFEF] dark:bg-slate-800 border border-[#BFC9D1]/25 dark:border-slate-700 rounded-xl text-xs font-bold text-[#25343F] dark:text-white focus:outline-hidden focus:bg-white dark:focus:bg-slate-700 cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027, 2028].map(yr => (
                    <option key={yr} value={yr}>
                      Tahun {yr}
                    </option>
                  ))}
                </select>
              )}

              {periodType === 'custom' && (
                <div className="flex items-center gap-1.5 text-xs">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                    className="px-2 py-1 bg-[#EAEFEF] dark:bg-slate-800 border border-[#BFC9D1]/25 dark:border-slate-700 rounded-xl text-xs font-medium text-[#25343F] dark:text-white focus:outline-hidden"
                  />
                  <span className="text-[#898989] font-bold">-</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                    className="px-2 py-1 bg-[#EAEFEF] dark:bg-slate-800 border border-[#BFC9D1]/25 dark:border-slate-700 rounded-xl text-xs font-medium text-[#25343F] dark:text-white focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── DOKUMEN & FORMAT CETAK SELECTOR BAR (A4, A5, F4 & Orientation) ── */}
      <div className="no-print bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-[#BFC9D1]/25 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#25343F] text-white flex items-center justify-center shrink-0">
            <AdjustmentsHorizontalIcon className="w-4 h-4 text-[#FF9B51]" />
          </div>
          <div>
            <div className="font-extrabold text-[#25343F] dark:text-white flex items-center gap-1.5">
              <span>Pengaturan Format Kertas Dokumen</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#FF9B51]/20 text-[#FF6A00]">
                {PAPER_CONFIGS[paperSize].name} · {paperOrientation === 'landscape' ? 'Mendatar (Landscape)' : 'Tegak (Portrait)'}
              </span>
            </div>
            <div className="text-[10.5px] text-[#898989] dark:text-slate-400">
              {PAPER_CONFIGS[paperSize].desc} ({PAPER_CONFIGS[paperSize].dimension})
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Paper Size selector */}
          <div className="flex items-center p-1 bg-[#EAEFEF] dark:bg-slate-800 rounded-xl border border-[#BFC9D1]/25 dark:border-slate-700">
            {(['a4', 'a5', 'f4'] as PaperSize[]).map(ps => (
              <button
                key={ps}
                type="button"
                onClick={() => setPaperSize(ps)}
                className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                  paperSize === ps
                    ? 'bg-white dark:bg-slate-900 text-[#25343F] dark:text-white shadow-xs'
                    : 'text-[#898989] hover:text-[#25343F] dark:hover:text-white'
                }`}
                title={`${PAPER_CONFIGS[ps].name} (${PAPER_CONFIGS[ps].dimension})`}
              >
                {PAPER_CONFIGS[ps].name}
              </button>
            ))}
          </div>

          {/* Orientation selector */}
          <div className="flex items-center p-1 bg-[#EAEFEF] dark:bg-slate-800 rounded-xl border border-[#BFC9D1]/25 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setPaperOrientation('portrait')}
              className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                paperOrientation === 'portrait'
                  ? 'bg-white dark:bg-slate-900 text-[#25343F] dark:text-white shadow-xs'
                  : 'text-[#898989] hover:text-[#25343F] dark:hover:text-white'
              }`}
            >
              Portrait
            </button>
            <button
              type="button"
              onClick={() => setPaperOrientation('landscape')}
              className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                paperOrientation === 'landscape'
                  ? 'bg-white dark:bg-slate-900 text-[#25343F] dark:text-white shadow-xs'
                  : 'text-[#898989] hover:text-[#25343F] dark:hover:text-white'
              }`}
            >
              Landscape
            </button>
          </div>
        </div>
      </div>

      {/* ── PRINTABLE / EXPORTABLE REPORT AREA ───────────────────────────────── */}
      <div
        id="printable-report-area"
        className={`bg-white text-slate-800 p-4 sm:p-8 rounded-2xl border border-[#BFC9D1]/30 shadow-md space-y-4 mx-auto transition-all ${
          paperOrientation === 'landscape' ? 'max-w-6xl' : paperSize === 'a5' ? 'max-w-2xl' : 'max-w-4xl'
        }`}
      >
        {/* Printable Letterhead & Report Title */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 avoid-page-break">
          <div className="flex items-center gap-3">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="w-12 h-12 rounded-xl object-cover border border-[#BFC9D1]/30 bg-white p-1"
              />
            ) : null}
            <div>
              <h2 className="text-xl font-black text-[#25343F] uppercase tracking-tight">
                {settings?.businessName || 'SUKUNARU STUDIO'}
              </h2>
              <p className="text-xs text-[#FF6A00] font-black uppercase tracking-wider">
                {activeTab === 'sales' && `LAPORAN PENJUALAN & REKAP TRANSAKSI (${periodLabel.toUpperCase()})`}
                {activeTab === 'profit' && `LAPORAN LABA / RUGI KOMPREHENSIF (${periodLabel.toUpperCase()})`}
                {activeTab === 'stock' && 'LAPORAN NILAI ASET PERSEDIAAN BAHAN BAKU'}
              </p>
              {settings?.address && (
                <p className="text-[10.5px] text-[#898989] mt-0.5">{settings.address}</p>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-[#898989] shrink-0">
            <p>
              Dicetak pada: <strong className="text-[#25343F] font-mono">{formatDateTime(new Date())}</strong>
            </p>
            <p>
              Periode: <strong className="text-[#25343F]">{periodLabel}</strong>
            </p>
            <p className="text-[10px] text-[#898989]">
              Format Kertas: <strong className="text-[#25343F] uppercase">{PAPER_CONFIGS[paperSize].name} ({paperOrientation})</strong>
            </p>
          </div>
        </div>

        {/* ─── TAB 1: SALES REPORT & ANALYTICS ─────────────────────────────────── */}
        {activeTab === 'sales' && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 avoid-page-break">
              <div className="bg-[#EAEFEF] p-3.5 rounded-xl border border-[#BFC9D1]/25 kpi-card">
                <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider block">
                  Total Omzet Penjualan
                </span>
                <div className="text-lg sm:text-xl font-black text-[#25343F] mt-1 font-mono">
                  {formatRupiah(totalSalesRevenue)}
                </div>
                <p className="text-[10px] text-[#898989] mt-0.5">{totalTrxCount} Transaksi Selesai</p>
              </div>

              <div className="bg-[#EAEFEF] p-3.5 rounded-xl border border-[#BFC9D1]/25 kpi-card">
                <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider block">
                  Total HPP Bahan Baku
                </span>
                <div className="text-lg sm:text-xl font-black text-[#c45e00] mt-1 font-mono">
                  {formatRupiah(totalHppCost)}
                </div>
                <p className="text-[10px] text-[#898989] mt-0.5">Modal produksi keluar</p>
              </div>

              <div className="bg-[#EAEFEF] p-3.5 rounded-xl border border-[#BFC9D1]/25 kpi-card">
                <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider block">
                  Estimasi Laba Kotor
                </span>
                <div className="text-lg sm:text-xl font-black text-emerald-700 mt-1 font-mono">
                  {formatRupiah(grossProfit)}
                </div>
                <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
                  Margin Kotor: {grossMarginPercent}%
                </p>
              </div>

              <div className="bg-[#EAEFEF] p-3.5 rounded-xl border border-[#BFC9D1]/25 kpi-card">
                <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider block">
                  Rata-rata Order (AOV)
                </span>
                <div className="text-lg sm:text-xl font-black text-[#25343F] mt-1 font-mono">
                  {formatRupiah(averageOrderValue)}
                </div>
                <p className="text-[10px] text-[#898989] mt-0.5">Nilai per transaksi</p>
              </div>
            </div>

            {/* Visual Analytics Chart (Recharts) */}
            {trendChartData.length > 0 && (
              <div className="p-4 bg-[#EAEFEF]/50 rounded-xl border border-[#BFC9D1]/25 space-y-2 avoid-page-break">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-[#25343F] uppercase tracking-wider flex items-center gap-1.5">
                    <SparklesIcon className="w-4 h-4 text-[#FF9B51]" />
                    <span>Grafik Tren Penjualan &amp; HPP ({periodLabel})</span>
                  </h4>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#25343F" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#25343F" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="hppGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF9B51" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#FF9B51" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#BFC9D1" opacity={0.3} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#898989' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#898989' }} tickFormatter={v => `${v / 1000}k`} />
                      <Tooltip
                        formatter={(val: any) => formatRupiah(Number(val))}
                        contentStyle={{ backgroundColor: '#25343F', borderColor: '#475569', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                      />
                      <Area type="monotone" dataKey="omzet" name="Omzet Penjualan" stroke="#25343F" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                      <Area type="monotone" dataKey="hpp" name="HPP Modal" stroke="#FF9B51" strokeWidth={2} fillOpacity={1} fill="url(#hppGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Payment Method Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 avoid-page-break">
              <div className="p-3 bg-white border border-[#BFC9D1]/25 rounded-xl shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <BanknotesIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#898989] uppercase">Tunai (Cash)</div>
                    <div className="text-xs font-black text-[#25343F] font-mono">{formatRupiah(paymentMethodStats.CASH.total)}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#898989] bg-[#EAEFEF] px-2 py-0.5 rounded-full">
                  {paymentMethodStats.CASH.count} trx
                </span>
              </div>

              <div className="p-3 bg-white border border-[#BFC9D1]/25 rounded-xl shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <CreditCardIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#898989] uppercase">Transfer Bank</div>
                    <div className="text-xs font-black text-[#25343F] font-mono">{formatRupiah(paymentMethodStats.TRANSFER.total)}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#898989] bg-[#EAEFEF] px-2 py-0.5 rounded-full">
                  {paymentMethodStats.TRANSFER.count} trx
                </span>
              </div>

              <div className="p-3 bg-white border border-[#BFC9D1]/25 rounded-xl shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <QrCodeIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#898989] uppercase">QRIS / E-Wallet</div>
                    <div className="text-xs font-black text-[#25343F] font-mono">{formatRupiah(paymentMethodStats.QRIS.total)}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#898989] bg-[#EAEFEF] px-2 py-0.5 rounded-full">
                  {paymentMethodStats.QRIS.count} trx
                </span>
              </div>
            </div>

            {/* Popular Products Breakdown Table */}
            <div className="space-y-2.5 report-section">
              <h4 className="font-bold text-xs sm:text-sm text-[#25343F] uppercase tracking-wider flex items-center gap-1.5">
                <CubeIcon className="w-4 h-4 text-[#25343F]" />
                <span>Rekapitulasi Penjualan per Produk / Jasa</span>
              </h4>

              <div className="overflow-x-auto rounded-xl border border-[#BFC9D1]/25">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#BFC9D1]/40 bg-[#EAEFEF] text-[#25343F] font-bold uppercase">
                      <th className="py-2.5 px-3">Nama Produk / Jasa</th>
                      <th className="py-2.5 px-3 text-center">Qty Terjual</th>
                      <th className="py-2.5 px-3 text-right">Total HPP</th>
                      <th className="py-2.5 px-3 text-right">Omzet Penjualan</th>
                      <th className="py-2.5 px-3 text-right">Laba Kotor</th>
                      <th className="py-2.5 px-3 text-center">Kontribusi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-[#898989]">
                          Belum ada data penjualan pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      topProducts.map((p, idx) => (
                        <tr key={idx} className="hover:bg-[#EAEFEF]/40">
                          <td className="py-2 px-3 font-bold text-[#25343F]">{p.name}</td>
                          <td className="py-2 px-3 text-center font-bold text-[#25343F]">{p.qty} pcs</td>
                          <td className="py-2 px-3 text-right text-[#898989] font-mono">{formatRupiah(p.hpp)}</td>
                          <td className="py-2 px-3 text-right font-extrabold text-[#25343F] font-mono">{formatRupiah(p.revenue)}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-700 font-mono">{formatRupiah(p.profit)}</td>
                          <td className="py-2 px-3 text-center font-semibold text-[#898989]">{p.contribution}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: COMPREHENSIVE PROFIT & LOSS STATEMENT ───────────────────── */}
        {activeTab === 'profit' && (
          <div className="space-y-4">
            {/* Visual Net Profit & Expense Trend */}
            {trendChartData.length > 0 && (
              <div className="p-4 bg-[#EAEFEF]/50 rounded-xl border border-[#BFC9D1]/25 space-y-2 avoid-page-break">
                <h4 className="font-bold text-xs text-[#25343F] uppercase tracking-wider flex items-center gap-1.5">
                  <ChartBarIcon className="w-4 h-4 text-[#FF9B51]" />
                  <span>Grafik Analisis Laba Bersih &amp; Beban Operasional ({periodLabel})</span>
                </h4>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#BFC9D1" opacity={0.3} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#898989' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#898989' }} tickFormatter={v => `${v / 1000}k`} />
                      <Tooltip
                        formatter={(val: any) => formatRupiah(Number(val))}
                        contentStyle={{ backgroundColor: '#25343F', borderColor: '#475569', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }} />
                      <Bar dataKey="omzet" name="Omzet" fill="#25343F" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="hpp" name="HPP Bahan" fill="#FF9B51" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="beban" name="Beban Operasional" fill="#FF4267" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" name="Laba Bersih" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Income Statement Detailed Table */}
            <div className="bg-[#EAEFEF] p-4 sm:p-5 rounded-xl border border-[#BFC9D1]/25 space-y-3.5 text-xs report-section">
              {/* 1. Pendapatan */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-extrabold text-[#25343F] text-xs sm:text-sm">
                  <span>1. PENDAPATAN USAHA (OMZET)</span>
                  <span className="font-mono text-[#25343F] font-black">{formatRupiah(totalSalesRevenue)}</span>
                </div>
                <div className="pl-3 sm:pl-4 space-y-1 text-[#898989] text-[11px] sm:text-xs">
                  <div className="flex justify-between">
                    <span>• Penjualan Kasir POS:</span>
                    <span className="font-mono font-medium text-[#25343F]">{formatRupiah(posRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Pembayaran Pesanan &amp; SPK Order:</span>
                    <span className="font-mono font-medium text-[#25343F]">{formatRupiah(ordersRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* 2. HPP */}
              <div className="space-y-1.5 pt-3 border-t border-[#BFC9D1]/40">
                <div className="flex justify-between font-extrabold text-[#25343F] text-xs sm:text-sm">
                  <span>2. BIAYA POKOK PRODUKSI (HPP BAHAN BAKU)</span>
                  <span className="text-rose-600 font-mono font-black">-{formatRupiah(totalHppCost)}</span>
                </div>
                <div className="pl-3 sm:pl-4 space-y-1 text-[#898989] text-[11px] sm:text-xs">
                  <div className="flex justify-between">
                    <span>• Pemakaian Bahan Baku Produk Kasir:</span>
                    <span className="font-mono font-medium text-[#25343F]">{formatRupiah(posHppCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Pemakaian Material Pesanan SPK:</span>
                    <span className="font-mono font-medium text-[#25343F]">{formatRupiah(ordersHppCost)}</span>
                  </div>
                </div>
              </div>

              {/* 3. Laba Kotor Highlight */}
              <div className="p-3 bg-white rounded-xl border border-[#BFC9D1]/25 flex justify-between items-center font-black text-xs sm:text-sm text-[#25343F] shadow-xs">
                <span>LABA KOTOR (GROSS PROFIT):</span>
                <div className="text-right">
                  <span className="font-mono text-emerald-700 text-sm sm:text-base font-black">{formatRupiah(grossProfit)}</span>
                  <span className="text-[10px] text-[#898989] font-semibold block">Margin: {grossMarginPercent}%</span>
                </div>
              </div>

              {/* 4. Beban Operasional */}
              <div className="space-y-1.5 pt-3 border-t border-[#BFC9D1]/40">
                <div className="flex justify-between font-extrabold text-[#25343F] text-xs sm:text-sm">
                  <span>3. BEBAN OPERASIONAL &amp; UMUM</span>
                  <span className="text-rose-600 font-mono font-black">-{formatRupiah(totalExpenses)}</span>
                </div>
                <div className="pl-3 sm:pl-4 space-y-1 text-[#898989] text-[11px] sm:text-xs">
                  {expensesByCategory.length === 0 ? (
                    <div className="text-[11px] text-[#898989] italic">Tidak ada beban operasional tercatat pada periode ini.</div>
                  ) : (
                    expensesByCategory.map((cat, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>• {cat.category} ({cat.percentage}%):</span>
                        <span className="font-mono font-medium text-[#25343F]">{formatRupiah(cat.amount)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 5. Laba Bersih Final Highlight Card */}
              <div
                className={`p-4 rounded-xl border flex justify-between items-center text-xs sm:text-sm font-black shadow-sm ${
                  netProfit >= 0
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div>
                  <span className="text-xs sm:text-base block">LABA BERSIH (NET PROFIT):</span>
                  <span className="text-[10px] font-semibold text-[#898989]">
                    Setelah dikurangi seluruh HPP &amp; beban operasional
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-base sm:text-2xl font-black font-mono block ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {formatRupiah(netProfit)}
                  </span>
                  <span className="text-[10px] font-bold text-[#898989]">
                    Net Margin: {netMarginPercent}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: STOCK VALUATION ─────────────────────────────────────────── */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 avoid-page-break">
              <div className="bg-[#EAEFEF] p-3.5 sm:p-4 rounded-xl border border-[#BFC9D1]/25 kpi-card">
                <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider block">
                  Total Nilai Modal Persediaan Bahan
                </span>
                <div className="text-lg sm:text-xl font-black text-[#25343F] mt-1 font-mono">
                  {formatRupiah(totalStockAsset)}
                </div>
                <p className="text-[11px] text-[#898989] mt-0.5">Total aset bahan fisik di studio</p>
              </div>

              <div className="bg-[#EAEFEF] p-3.5 sm:p-4 rounded-xl border border-[#BFC9D1]/25 kpi-card">
                <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider block">
                  Bahan Baku Perlu Restock
                </span>
                <div className="text-lg sm:text-xl font-black text-[#FFAF2A] mt-1">
                  {lowStockMaterials.length} <span className="text-xs font-semibold text-[#898989]">item</span>
                </div>
                <p className="text-[11px] text-[#898989] mt-0.5">Stok di bawah batas minimum</p>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="space-y-2.5 report-section">
              <h4 className="font-bold text-xs sm:text-sm text-[#25343F] uppercase tracking-wider flex items-center gap-1.5">
                <Square3Stack3DIcon className="w-4 h-4 text-[#25343F]" />
                <span>Rincian Nilai Persediaan per Bahan Baku</span>
              </h4>

              <div className="overflow-x-auto rounded-xl border border-[#BFC9D1]/25">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#BFC9D1]/40 bg-[#EAEFEF] text-[#25343F] font-bold uppercase">
                      <th className="py-2.5 px-3">Nama Bahan</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3 text-center">Stok</th>
                      <th className="py-2.5 px-3 text-right">Harga Beli Satuan</th>
                      <th className="py-2.5 px-3 text-right">Total Nilai Persediaan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {materials.map(m => (
                      <tr key={m.id} className="hover:bg-[#EAEFEF]/60">
                        <td className="py-2.5 px-3 font-bold text-[#25343F]">{m.name}</td>
                        <td className="py-2.5 px-3 text-[#898989]">{m.category}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-[#25343F]">
                          {m.currentStock} {m.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#898989] font-mono">{formatRupiah(m.unitCost)}</td>
                        <td className="py-2.5 px-3 text-right font-black text-[#25343F] font-mono">
                          {formatRupiah((m.currentStock || 0) * (m.unitCost || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Official Signature & Endorsement Box ── */}
        <div className="pt-6 border-t border-slate-200 mt-6 grid grid-cols-2 gap-8 text-center text-xs avoid-page-break">
          <div className="space-y-12">
            <p className="text-[#898989] font-medium">Dibuat / Disiapkan Oleh:</p>
            <div>
              <div className="w-36 border-b border-slate-400 mx-auto" />
              <p className="font-bold text-[#25343F] mt-1">Bagian Administrasi / Kasir</p>
            </div>
          </div>
          <div className="space-y-12">
            <p className="text-[#898989] font-medium">Diperiksa &amp; Disetujui Oleh:</p>
            <div>
              <div className="w-36 border-b border-slate-400 mx-auto" />
              <p className="font-bold text-[#25343F] mt-1">{settings?.businessName || 'Owner / Pimpinan Usaha'}</p>
            </div>
          </div>
        </div>

        {/* Footer info note */}
        <div className="pt-2 text-center text-[9.5px] text-[#898989] avoid-page-break">
          Dokumen ini dibuat otomatis melalui sistem <strong>BisnisUrang OS</strong> · Sah untuk keperluan pelaporan internal &amp; pembukuan resmi.
        </div>
      </div>

      {/* ─── BOTTOM ACTION CONTAINER: UNDUH & CETAK LAPORAN ──────────────────── */}
      <div className="no-print bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-[#BFC9D1]/25 dark:border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-slate-800 dark:text-slate-200">
        <div>
          <h4 className="font-extrabold text-sm text-[#25343F] dark:text-white flex items-center gap-2">
            <span>Cetak atau Ekspor Dokumen Laporan</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#FF9B51]/20 text-[#FF6A00]">
              {PAPER_CONFIGS[paperSize].name} ({paperOrientation})
            </span>
          </h4>
          <p className="text-xs text-[#898989] dark:text-slate-400 mt-0.5">
            Pilih format dokumen: Excel (.xls), CSV (.csv), Dokumen PDF, atau Cetak langsung ke printer fisik.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* Excel Export Button */}
          <button
            id="btn-download-excel-bottom"
            type="button"
            disabled={isExportingExcel}
            onClick={() => handleDownloadExcel('active')}
            className="flex-1 sm:flex-initial min-h-[42px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isExportingExcel ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin text-white" />
            ) : (
              <TableCellsIcon className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>{isExportingExcel ? 'Memproses...' : 'Unduh Excel (.xls)'}</span>
          </button>

          {/* PDF Download Button */}
          <button
            id="btn-download-report-pdf"
            type="button"
            disabled={isExportingPdf}
            onClick={handleDownloadPdf}
            className="flex-1 sm:flex-initial min-h-[42px] px-4 rounded-xl border border-[#BFC9D1]/30 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#EAEFEF] dark:hover:bg-slate-700 text-[#25343F] dark:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-sm active:scale-95"
          >
            {isExportingPdf ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin text-[#898989]" />
            ) : (
              <ArrowDownTrayIcon className="w-4 h-4 text-[#25343F] dark:text-white" />
            )}
            <span>{isExportingPdf ? 'Membuat PDF...' : `Unduh PDF (${PAPER_CONFIGS[paperSize].name})`}</span>
          </button>

          {/* Print Button */}
          <button
            id="btn-print-report"
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-initial min-h-[42px] px-5 rounded-xl bg-[#FF9B51] hover:bg-[#ff8c38] text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-[#FF9B51]/25 transition-all cursor-pointer active:scale-95"
          >
            <PrinterIcon className="w-4 h-4" />
            <span>Cetak ({PAPER_CONFIGS[paperSize].name})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
