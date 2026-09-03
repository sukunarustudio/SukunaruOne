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
import { Transaction, Order, Material, Expense, BusinessSettings, ViewType } from '../types';
import { formatRupiah, formatDate, formatDateTime } from '../lib/utils';
import { downloadElementAsPdf, printIsolatedElement } from '../lib/pdfHelper';
import { Capacitor } from '@capacitor/core';
import { useToast } from '../components/Toast';

interface ReportsViewProps {
  initialReportType?: 'sales-report' | 'profit-report' | 'stock-report';
  settings?: BusinessSettings;
  onNavigate?: (view: any) => void;
}

type PeriodType = 'weekly' | 'monthly' | 'yearly' | 'custom' | 'all';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const ReportsView: React.FC<ReportsViewProps> = ({
  initialReportType = 'sales-report',
  settings,
  onNavigate,
}) => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'sales' | 'profit' | 'stock'>('sales');
  const [loading, setLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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
      // 7 days ending on weeklyAnchorDate or Mon-Sun week
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
      const firstDay = new Date(year, month, 1);
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
    return transactions.filter(t => isDateInRange(t.date || t.createdAt));
  }, [transactions, startDateStr, endDateStr]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => isDateInRange(o.createdAt || (o as any).date));
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
      // Fallback if no payment array
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
    return Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, totalExpenses]);

  // ─── Visual Analysis Chart Data (Recharts) ──────────────────────────────────
  const trendChartData = useMemo(() => {
    // If yearly or all time, group by Month
    if (periodType === 'yearly' || periodType === 'all') {
      const monthsData: { [key: string]: { label: string; omzet: number; hpp: number; beban: number; profit: number } } = {};

      // Initialize 12 months if yearly
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

      // Calculate net profit for each month
      Object.values(monthsData).forEach(item => {
        item.profit = item.omzet - item.hpp - item.beban;
      });

      return Object.keys(monthsData).sort().map(k => monthsData[k]);
    }

    // Daily breakdown for Weekly / Monthly / Custom
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

  const handlePrint = () => {
    const title = `${reportTitles[activeTab]}-${periodType}-${startDateStr}`;
    showToast(`Mempersiapkan cetak ${reportTitles[activeTab]} (${periodLabel})...`, 'info');
    printIsolatedElement('printable-report-area', title);
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const filename = `${reportTitles[activeTab]}-${periodType}-${startDateStr}.pdf`;
      const success = await downloadElementAsPdf('printable-report-area', {
        filename: filename,
        format: 'a4',
        orientation: 'portrait',
        marginMm: 8,
        scale: 2,
      });

      if (success) {
        showToast(Capacitor.isNativePlatform() ? 'File berhasil disimpan' : 'Laporan PDF berhasil diunduh!', 'success');
      } else {
        showToast('Gagal mengunduh PDF. Silakan gunakan tombol Cetak / Print to PDF.', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat memproses file PDF', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Weekly navigation helper
  const changeWeek = (deltaWeeks: number) => {
    setWeeklyAnchorDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + deltaWeeks * 7);
      return next;
    });
  };

  return (
    <div id="reports-view" className="space-y-3.5 max-w-7xl mx-auto pb-24 md:pb-12 animate-fade-in">
      {/* ── STICKY TOP HEADER: [ ← Judul ] ... [ Aksi (PDF/Cetak) ] ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40">
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
                Laporan &amp; Analisis Bisnis
              </h1>
              <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
                Rekapitulasi penjualan, laba rugi mingguan, bulanan, tahunan &amp; valuasi stok
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── FILTER PERIODE & REPORT TABS BAR ─────────────────────────────────── */}
      <div className="no-print space-y-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-[#BFC9D1]/25 shadow-md">
        {/* Row 1: Report Type Tabs (Clean Text Only) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center p-1 bg-[#EAEFEF] rounded-xl border border-[#BFC9D1]/25 text-xs overflow-x-auto scrollbar-none w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('sales')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap text-xs text-center ${
                activeTab === 'sales'
                  ? 'bg-white text-[#25343F] shadow-sm'
                  : 'text-[#898989] hover:text-[#25343F]'
              }`}
            >
              Penjualan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profit')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap text-xs text-center ${
                activeTab === 'profit'
                  ? 'bg-white text-[#25343F] shadow-sm'
                  : 'text-[#898989] hover:text-[#25343F]'
              }`}
            >
              Laba Rugi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stock')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap text-xs text-center ${
                activeTab === 'stock'
                  ? 'bg-white text-[#25343F] shadow-sm'
                  : 'text-[#898989] hover:text-[#25343F]'
              }`}
            >
              Nilai Stok
            </button>
          </div>

          {/* Active Period Badge Text */}
          <div className="text-xs font-semibold text-[#898989] flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-[#FF9B51]" />
            <span className="text-[#25343F] font-bold">{periodLabel}</span>
          </div>
        </div>

        {/* Row 2: Period Selector Buttons (Mingguan, Bulanan, Tahunan, Semua, Custom) */}
        {activeTab !== 'stock' && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setPeriodType('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  periodType === 'weekly'
                    ? 'bg-[#25343F] text-white shadow-sm'
                    : 'bg-[#EAEFEF] text-[#898989] hover:text-[#25343F]'
                }`}
              >
                Mingguan
              </button>

              <button
                type="button"
                onClick={() => setPeriodType('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  periodType === 'monthly'
                    ? 'bg-[#25343F] text-white shadow-sm'
                    : 'bg-[#EAEFEF] text-[#898989] hover:text-[#25343F]'
                }`}
              >
                Bulanan
              </button>

              <button
                type="button"
                onClick={() => setPeriodType('yearly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  periodType === 'yearly'
                    ? 'bg-[#25343F] text-white shadow-sm'
                    : 'bg-[#EAEFEF] text-[#898989] hover:text-[#25343F]'
                }`}
              >
                Tahunan
              </button>

              <button
                type="button"
                onClick={() => setPeriodType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  periodType === 'all'
                    ? 'bg-[#25343F] text-white shadow-sm'
                    : 'bg-[#EAEFEF] text-[#898989] hover:text-[#25343F]'
                }`}
              >
                Semua Data
              </button>

              <button
                type="button"
                onClick={() => setPeriodType('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  periodType === 'custom'
                    ? 'bg-[#25343F] text-white shadow-sm'
                    : 'bg-[#EAEFEF] text-[#898989] hover:text-[#25343F]'
                }`}
              >
                Rentang Kustom
              </button>
            </div>

            {/* Sub-controls based on active periodType */}
            <div className="flex items-center gap-2">
              {periodType === 'weekly' && (
                <div className="flex items-center gap-1.5 bg-[#EAEFEF] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => changeWeek(-1)}
                    className="p-1 rounded-lg hover:bg-white text-[#25343F] transition-colors cursor-pointer"
                    title="Minggu Sebelumnya"
                  >
                    <ChevronLeftIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeeklyAnchorDate(new Date())}
                    className="px-2 py-0.5 text-[11px] font-bold text-[#25343F] hover:bg-white rounded-md transition-colors"
                  >
                    Minggu Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => changeWeek(1)}
                    className="p-1 rounded-lg hover:bg-white text-[#25343F] transition-colors cursor-pointer"
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
                    className="px-2.5 py-1.5 bg-[#EAEFEF] border border-[#BFC9D1]/25 rounded-xl text-xs font-bold text-[#25343F] focus:outline-hidden focus:bg-white cursor-pointer"
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
                    className="px-2.5 py-1.5 bg-[#EAEFEF] border border-[#BFC9D1]/25 rounded-xl text-xs font-bold text-[#25343F] focus:outline-hidden focus:bg-white cursor-pointer"
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
                  className="px-3 py-1.5 bg-[#EAEFEF] border border-[#BFC9D1]/25 rounded-xl text-xs font-bold text-[#25343F] focus:outline-hidden focus:bg-white cursor-pointer"
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
                    className="px-2 py-1 bg-[#EAEFEF] border border-[#BFC9D1]/25 rounded-xl text-xs font-medium text-[#25343F] focus:outline-hidden"
                  />
                  <span className="text-[#898989] font-bold">-</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                    className="px-2 py-1 bg-[#EAEFEF] border border-[#BFC9D1]/25 rounded-xl text-xs font-medium text-[#25343F] focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── PRINTABLE / EXPORTABLE REPORT AREA ───────────────────────────────── */}
      <div id="printable-report-area" className="bg-white p-4 sm:p-8 rounded-2xl border border-[#BFC9D1]/25 shadow-md space-y-4">
        {/* Printable Letterhead & Report Title */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
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
              <p className="text-xs text-[#FF9B51] font-bold uppercase tracking-wider">
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
          </div>
        </div>

        {/* ─── TAB 1: SALES REPORT & ANALYTICS ─────────────────────────────────── */}
        {activeTab === 'sales' && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#EAEFEF] p-3.5 rounded-xl border border-[#BFC9D1]/25">
                <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider block">
                  Total Omzet Penjualan
                </span>
                <div className="text-lg sm:text-xl font-black text-[#25343F] mt-1 font-mono">
                  {formatRupiah(totalSalesRevenue)}
                </div>
                <p className="text-[10px] text-[#898989] mt-0.5">{totalTrxCount} Transaksi Selesai</p>
              </div>

              <div className="bg-[#EAEFEF] p-3.5 rounded-xl border border-[#BFC9D1]/25">
                <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider block">
                  Total HPP Bahan Baku
                </span>
                <div className="text-lg sm:text-xl font-black text-[#c45e00] mt-1 font-mono">
                  {formatRupiah(totalHppCost)}
                </div>
                <p className="text-[10px] text-[#898989] mt-0.5">Modal produksi keluar</p>
              </div>

              <div className="bg-[#EAEFEF] p-3.5 rounded-xl border border-[#BFC9D1]/25">
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

              <div className="bg-[#EAEFEF] p-3.5 rounded-xl border border-[#BFC9D1]/25">
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
              <div className="p-4 bg-[#EAEFEF]/50 rounded-xl border border-[#BFC9D1]/25 space-y-2">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <div className="space-y-2.5">
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
              <div className="p-4 bg-[#EAEFEF]/50 rounded-xl border border-[#BFC9D1]/25 space-y-2">
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
            <div className="bg-[#EAEFEF] p-4 sm:p-5 rounded-xl border border-[#BFC9D1]/25 space-y-3.5 text-xs">
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
              <div className={`p-4 rounded-xl border flex justify-between items-center text-xs sm:text-sm font-black shadow-sm ${
                netProfit >= 0
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
              <div className="bg-[#EAEFEF] p-3.5 sm:p-4 rounded-xl border border-[#BFC9D1]/25">
                <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider block">
                  Total Nilai Modal Persediaan Bahan
                </span>
                <div className="text-lg sm:text-xl font-black text-[#25343F] mt-1 font-mono">
                  {formatRupiah(totalStockAsset)}
                </div>
                <p className="text-[11px] text-[#898989] mt-0.5">Total aset bahan fisik di studio</p>
              </div>

              <div className="bg-[#EAEFEF] p-3.5 sm:p-4 rounded-xl border border-[#BFC9D1]/25">
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
            <div className="space-y-2.5">
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
      </div>

      {/* ─── BOTTOM ACTION CONTAINER: UNDUH & CETAK LAPORAN ──────────────────── */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-2xl border border-[#BFC9D1]/25 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h4 className="font-extrabold text-sm text-[#25343F]">
            Cetak atau Simpan Dokumen Laporan
          </h4>
          <p className="text-xs text-[#898989] mt-0.5">
            Pastikan data dan periode laporan di atas sudah sesuai sebelum mengunduh atau mencetak.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            id="btn-download-report-pdf"
            type="button"
            disabled={isExportingPdf}
            onClick={handleDownloadPdf}
            className="flex-1 sm:flex-initial min-h-[42px] px-4 rounded-xl border border-[#BFC9D1]/30 bg-white hover:bg-[#EAEFEF] text-[#25343F] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-sm active:scale-95"
          >
            {isExportingPdf ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin text-[#898989]" />
            ) : (
              <ArrowDownTrayIcon className="w-4 h-4 text-[#25343F]" />
            )}
            <span>{isExportingPdf ? 'Membuat PDF...' : 'Unduh PDF'}</span>
          </button>

          <button
            id="btn-print-report"
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-initial min-h-[42px] px-5 rounded-xl bg-[#FF9B51] hover:bg-[#ff8c38] text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-[#FF9B51]/25 transition-all cursor-pointer active:scale-95"
          >
            <PrinterIcon className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
