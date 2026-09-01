import React, { useState, useEffect, useMemo } from 'react';
import {
  WalletIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CreditCardIcon,
  QrCodeIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api';
import { FinancialTransaction, TransactionType, PaymentMethod } from '../types';
import { formatRupiah, formatDate, formatDateTime, getTodayDateString } from '../lib/utils';
import { useToast } from '../components/Toast';

interface FinanceViewProps {
  onRefreshDashboard?: () => void;
  onNavigate?: (view: any) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ onRefreshDashboard, onNavigate }) => {
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('week');

  // Add Manual Record Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<TransactionType>('INCOME');
  const [category, setCategory] = useState('Penjualan Lainnya');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getFinancialTransactions();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat arus kas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => {
      api.getFinancialTransactions().then(f => setTransactions(Array.isArray(f) ? f : [])).catch(() => {});
    };
    window.addEventListener('sukunaru:sync_completed', handleRefresh);
    window.addEventListener('sukunaru:data_mutation', handleRefresh);
    return () => {
      window.removeEventListener('sukunaru:sync_completed', handleRefresh);
      window.removeEventListener('sukunaru:data_mutation', handleRefresh);
    };
  }, []);

  // ─── Precise Totals Calculation ──────────────────────────────────────────
  const { totalIncome, totalExpense, netBalance, incomeCount, expenseCount } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let inCount = 0;
    let exCount = 0;

    transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'INCOME') {
        income += amt;
        inCount++;
      } else if (t.type === 'EXPENSE') {
        expense += amt;
        exCount++;
      }
    });

    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense,
      incomeCount: inCount,
      expenseCount: exCount,
    };
  }, [transactions]);

  // ─── Dynamic Traffic Chart Data (Week / Month / Year) ─────────────────────
  const trafficChartData = useMemo(() => {
    const now = new Date();
    const slots: { [key: string]: { date: string; label: string; income: number; expense: number } } = {};

    if (chartPeriod === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
        slots[dateStr] = { date: dateStr, label: dayLabel, income: 0, expense: 0 };
      }
      transactions.forEach(t => {
        const dateStr = t.date ? t.date.split('T')[0] : '';
        if (slots[dateStr]) {
          const val = Number(t.amount) || 0;
          if (t.type === 'INCOME') slots[dateStr].income += val;
          else if (t.type === 'EXPENSE') slots[dateStr].expense += val;
        }
      });

    } else if (chartPeriod === 'month') {
      // Last 30 days, grouped by week (4 weeks)
      for (let w = 3; w >= 0; w--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - w * 7 - 6);
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - w * 7);
        const key = `week-${w}`;
        const label = `${weekStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
        slots[key] = { date: key, label, income: 0, expense: 0 };

        transactions.forEach(t => {
          if (!t.date) return;
          const tDate = new Date(t.date);
          if (tDate >= weekStart && tDate <= weekEnd) {
            const val = Number(t.amount) || 0;
            if (t.type === 'INCOME') slots[key].income += val;
            else if (t.type === 'EXPENSE') slots[key].expense += val;
          }
        });
      }

    } else {
      // Year: last 12 months
      for (let m = 11; m >= 0; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('id-ID', { month: 'short' });
        slots[key] = { date: key, label, income: 0, expense: 0 };
      }
      transactions.forEach(t => {
        if (!t.date) return;
        const tDate = new Date(t.date);
        const key = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
        if (slots[key]) {
          const val = Number(t.amount) || 0;
          if (t.type === 'INCOME') slots[key].income += val;
          else if (t.type === 'EXPENSE') slots[key].expense += val;
        }
      });
    }
    return Object.values(slots);
  }, [transactions, chartPeriod]);

  // Chart totals for current selected period
  const periodChartTotals = useMemo(() => {
    let pIncome = 0;
    let pExpense = 0;
    trafficChartData.forEach(d => {
      pIncome += d.income;
      pExpense += d.expense;
    });
    return {
      periodIncome: pIncome,
      periodExpense: pExpense,
      periodNet: pIncome - pExpense,
    };
  }, [trafficChartData]);

  // Filter & Search transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchType = filterType === 'ALL' || t.type === filterType;
      if (!matchType) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const descMatch = (t.description || '').toLowerCase().includes(q);
      const catMatch = (t.category || '').toLowerCase().includes(q);
      const refMatch = (t.referenceNumber || '').toLowerCase().includes(q);
      const methodMatch = (t.paymentMethod || '').toLowerCase().includes(q);
      return descMatch || catMatch || refMatch || methodMatch;
    });
  }, [transactions, filterType, searchQuery]);

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showToast('Nominal harus lebih dari Rp 0', 'error');
      return;
    }
    if (!description.trim()) {
      showToast('Deskripsi / keterangan wajib diisi', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const created = await api.createFinancialTransaction({
        type: entryType,
        category: category.trim() || (entryType === 'INCOME' ? 'Penjualan Lainnya' : 'Operasional'),
        amount,
        paymentMethod,
        description: description.trim(),
        date,
      });

      setTransactions(prev => [created, ...prev]);
      showToast('Catatan arus kas berhasil disimpan', 'success');
      setIsAddModalOpen(false);
      setAmount(0);
      setDescription('');
      setCategory('Penjualan Lainnya');
      setIsCustomCategory(false);
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan transaksi keuangan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="finance-view" className="space-y-4 max-w-7xl mx-auto pb-24">
      {/* ── STICKY TOP HEADER ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate?.('dashboard')}
            className="h-9 w-9 rounded-xl bg-white hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 shadow-xs"
            title="Kembali ke Beranda"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-[#25343F] leading-tight tracking-tight truncate">
              Arus Kas &amp; Keuangan
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
              Ringkasan saldo, mutasi penerimaan &amp; pengeluaran kas usaha
            </p>
          </div>
        </div>
      </div>

      {/* ── 1. RINGKASAN KEUANGAN UTAMA (CLEAN SaaS KPI CARDS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Saldo Kas Bersih (Net Balance) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#BFC9D1]/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#898989]">
              Saldo Kas Bersih
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#25343F]/8 text-[#25343F] flex items-center justify-center shrink-0">
              <WalletIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
              netBalance >= 0 ? 'text-[#25343F]' : 'text-[#E11D48]'
            }`}>
              {formatRupiah(netBalance)}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
              {netBalance > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#10B981]/10 text-[#059669] font-bold text-[11px]">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  Arus Kas Surplus
                </span>
              ) : netBalance < 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E11D48]/10 text-[#E11D48] font-bold text-[11px]">
                  <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                  Arus Kas Defisit
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#898989]/10 text-[#898989] font-bold text-[11px]">
                  <ScaleIcon className="w-3.5 h-3.5" />
                  Saldo Seimbang
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Total Uang Masuk (Income) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#BFC9D1]/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
              Total Uang Masuk
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#10B981]/10 text-[#059669] flex items-center justify-center shrink-0">
              <ArrowUpRightIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-[#059669] font-mono tracking-tight">
              +{formatRupiah(totalIncome)}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-[#898989]">
              <span className="truncate">Penjualan POS &amp; Order</span>
              <span className="font-bold text-[#25343F] shrink-0 font-mono">{incomeCount} mutasi</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Uang Keluar (Expense) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#BFC9D1]/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E11D48]">
              Total Uang Keluar
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E11D48]/10 text-[#E11D48] flex items-center justify-center shrink-0">
              <ArrowDownRightIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-[#E11D48] font-mono tracking-tight">
              -{formatRupiah(totalExpense)}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-[#898989]">
              <span className="truncate">Bahan &amp; Operasional</span>
              <span className="font-bold text-[#25343F] shrink-0 font-mono">{expenseCount} mutasi</span>
            </div>
          </div>
        </div>

        {/* Card 4: Rasio Arus Kas / Status Likuiditas */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#BFC9D1]/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#898989]">
              Rasio Pemasukan
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FF9B51]/10 text-[#D97706] flex items-center justify-center shrink-0">
              <ScaleIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl sm:text-3xl font-black text-[#25343F] font-mono tracking-tight">
              {totalIncome > 0
                ? `${Math.round(((totalIncome - totalExpense) / totalIncome) * 100)}%`
                : '0%'}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-[#898989]">
              <span className="truncate">Tingkat Retensi Kas</span>
              <span className="font-bold text-[#25343F] shrink-0 font-mono">
                {totalIncome + totalExpense > 0
                  ? `${Math.round((totalIncome / (totalIncome + totalExpense)) * 100)}% In`
                  : '0%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. GRAFIK TREN ARUS KAS (MODERN MINIMALIST SMOOTH AREA CHART) ── */}
      <div className="bg-white rounded-2xl border border-[#BFC9D1]/30 p-4 sm:p-5 shadow-xs">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#BFC9D1]/20">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#25343F] flex items-center gap-2">
              <span>Tren Arus Kas Masuk vs Keluar</span>
            </h2>
            <p className="text-xs text-[#898989] font-medium mt-0.5">
              Periode {chartPeriod === 'week' ? '7 Hari Terakhir' : chartPeriod === 'month' ? '4 Minggu Terakhir' : '12 Bulan Terakhir'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Legend Indicators */}
            <div className="hidden sm:flex items-center gap-3 text-xs font-bold mr-2">
              <div className="flex items-center gap-1.5 text-[#059669]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block" />
                <span>Masuk ({formatRupiah(periodChartTotals.periodIncome)})</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#E11D48]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E] inline-block" />
                <span>Keluar ({formatRupiah(periodChartTotals.periodExpense)})</span>
              </div>
            </div>

            {/* Period Switcher Buttons */}
            <div className="inline-flex p-1 rounded-xl bg-[#EAEFEF] border border-[#BFC9D1]/20">
              {([
                { id: 'week', label: 'Mingguan' },
                { id: 'month', label: 'Bulanan' },
                { id: 'year', label: 'Tahunan' },
              ] as const).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setChartPeriod(p.id)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    chartPeriod === p.id
                      ? 'bg-white text-[#25343F] shadow-xs'
                      : 'text-[#898989] hover:text-[#25343F]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Legend */}
        <div className="flex sm:hidden items-center justify-between text-xs font-bold py-2 border-b border-[#BFC9D1]/15">
          <div className="flex items-center gap-1.5 text-[#059669]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block" />
            <span>Masuk: {formatRupiah(periodChartTotals.periodIncome)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#E11D48]">
            <span className="w-2 h-2 rounded-full bg-[#F43F5E] inline-block" />
            <span>Keluar: {formatRupiah(periodChartTotals.periodExpense)}</span>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-48 sm:h-64 w-full mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trafficChartData} margin={{ top: 12, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="expenseAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#BFC9D1" strokeOpacity={0.25} vertical={false} />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: '#BFC9D1', strokeOpacity: 0.3 }}
                tick={{ fontSize: 11, fill: '#898989', fontWeight: 600 }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#898989', fontWeight: 500 }}
                domain={[0, 'auto']}
                tickFormatter={(v) =>
                  v >= 1000000
                    ? `${(v / 1000000).toFixed(1)}jt`
                    : v >= 1000
                    ? `${(v / 1000).toFixed(0)}k`
                    : `${v}`
                }
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const inc = Number(payload.find(p => p.dataKey === 'income')?.value || 0);
                    const exp = Number(payload.find(p => p.dataKey === 'expense')?.value || 0);
                    const net = inc - exp;
                    return (
                      <div className="bg-white/95 backdrop-blur-xs border border-[#BFC9D1]/40 shadow-lg rounded-xl p-3 text-xs min-w-[170px]">
                        <div className="font-extrabold text-[#25343F] mb-1.5 border-b border-[#BFC9D1]/25 pb-1 flex items-center justify-between">
                          <span>{label}</span>
                          <span className={`text-[10px] font-mono ${net >= 0 ? 'text-[#059669]' : 'text-[#E11D48]'}`}>
                            Net: {formatRupiah(net)}
                          </span>
                        </div>
                        <div className="space-y-1 font-mono">
                          <div className="flex items-center justify-between text-[#059669]">
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                              Masuk:
                            </span>
                            <span className="font-bold">+{formatRupiah(inc)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[#E11D48]">
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E]" />
                              Keluar:
                            </span>
                            <span className="font-bold">-{formatRupiah(exp)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                type="monotone"
                dataKey="income"
                name="Uang Masuk"
                stroke="#10B981"
                strokeWidth={2.5}
                fill="url(#incomeAreaGrad)"
                dot={{ r: 3.5, fill: '#10B981', strokeWidth: 1.5, stroke: '#FFFFFF' }}
                activeDot={{ r: 5, fill: '#10B981', stroke: '#FFFFFF', strokeWidth: 2 }}
              />

              <Area
                type="monotone"
                dataKey="expense"
                name="Uang Keluar"
                stroke="#F43F5E"
                strokeWidth={2.5}
                fill="url(#expenseAreaGrad)"
                dot={{ r: 3.5, fill: '#F43F5E', strokeWidth: 1.5, stroke: '#FFFFFF' }}
                activeDot={{ r: 5, fill: '#F43F5E', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 3. RIWAYAT TRANSAKSI KAS (LEDGER / BUKU KAS) ── */}
      <div className="bg-white rounded-2xl border border-[#BFC9D1]/30 shadow-xs overflow-hidden">
        {/* Controls: Search & Tabs */}
        <div className="p-3.5 sm:p-4 border-b border-[#BFC9D1]/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {[
              { id: 'ALL', label: `Semua (${transactions.length})` },
              { id: 'INCOME', label: `+ Masuk (${incomeCount})` },
              { id: 'EXPENSE', label: `- Keluar (${expenseCount})` },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filterType === tab.id
                    ? tab.id === 'INCOME'
                      ? 'bg-[#10B981] text-white shadow-xs'
                      : tab.id === 'EXPENSE'
                      ? 'bg-[#F43F5E] text-white shadow-xs'
                      : 'bg-[#25343F] text-white shadow-xs'
                    : 'bg-[#F8FAFC] text-[#898989] hover:bg-[#EAEFEF] border border-[#BFC9D1]/25'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[200px] sm:w-64">
            <MagnifyingGlassIcon className="w-4 h-4 text-[#898989] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi / kategori..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-[#BFC9D1]/30 rounded-xl text-xs font-semibold text-[#25343F] placeholder-[#898989] focus:bg-white focus:border-[#FF9B51] focus:ring-1 focus:ring-[#FF9B51] outline-none transition-all"
            />
          </div>
        </div>

        {/* Transaction Content */}
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="animate-pulse flex gap-3.5 items-center py-2">
                <div className="w-10 h-10 rounded-xl bg-[#EAEFEF] shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-[#EAEFEF] rounded w-3/5" />
                  <div className="h-3 bg-[#EAEFEF] rounded w-2/5" />
                </div>
                <div className="h-5 w-24 bg-[#EAEFEF] rounded font-mono" />
              </div>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EAEFEF] text-[#898989] flex items-center justify-center mx-auto mb-3">
              <WalletIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#25343F]">
              {searchQuery ? 'Tidak ada transaksi yang cocok' : 'Belum ada catatan mutasi kas'}
            </h3>
            <p className="text-xs text-[#898989] mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'Coba gunakan kata kunci pencarian lain atau ubah filter.'
                : 'Transaksi penjualan POS, pelunasan order, dan biaya operasional akan otomatis tercatat di sini.'}
            </p>
          </div>
        ) : (
          <>
            {/* ── MOBILE: Clean List View ── */}
            <div className="md:hidden divide-y divide-[#BFC9D1]/15">
              {filteredTransactions.map(item => {
                const isIncome = item.type === 'INCOME';
                return (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#F8FAFC]">
                    {/* Badge Direction Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome ? 'bg-[#10B981]/12 text-[#059669]' : 'bg-[#F43F5E]/12 text-[#E11D48]'
                    }`}>
                      {isIncome ? (
                        <ArrowUpRightIcon className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <ArrowDownRightIcon className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </div>

                    {/* Description & Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-[#25343F] truncate">
                        {item.description || 'Transaksi Keuangan'}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#898989]">
                        <span>{formatDate(item.date)}</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.2 rounded bg-[#EAEFEF] text-[#25343F] font-medium text-[10px]">
                          {item.category}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[10px] uppercase font-bold text-[#898989]">
                          {item.paymentMethod || 'CASH'}
                        </span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className={`font-black text-xs sm:text-sm shrink-0 font-mono text-right ${
                      isIncome ? 'text-[#059669]' : 'text-[#E11D48]'
                    }`}>
                      {isIncome ? `+${formatRupiah(item.amount)}` : `-${formatRupiah(item.amount)}`}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── DESKTOP: Clean Data Table ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#BFC9D1]/30 bg-[#F8FAFC] text-[#898989] font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Tanggal &amp; Waktu</th>
                    <th className="py-3 px-4">Deskripsi / Uraian</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Metode</th>
                    <th className="py-3 px-4 text-center">No. Referensi</th>
                    <th className="py-3 px-4 text-right">Nominal Kas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#BFC9D1]/15">
                  {filteredTransactions.map(item => {
                    const isIncome = item.type === 'INCOME';
                    return (
                      <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3 px-4 text-[#898989] whitespace-nowrap font-medium">
                          {formatDateTime(item.createdAt || item.date)}
                        </td>
                        <td className="py-3 px-4 max-w-sm">
                          <div className="font-bold text-[#25343F] truncate">
                            {item.description || 'Transaksi Keuangan'}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-semibold text-[#25343F] px-2 py-0.5 rounded-md bg-[#EAEFEF] text-[11px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-mono text-[#898989] text-[11px] font-bold">
                            {item.paymentMethod === 'CASH' && <BanknotesIcon className="w-3.5 h-3.5" />}
                            {item.paymentMethod === 'TRANSFER' && <CreditCardIcon className="w-3.5 h-3.5" />}
                            {item.paymentMethod === 'QRIS' && <QrCodeIcon className="w-3.5 h-3.5" />}
                            {item.paymentMethod || 'CASH'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {item.referenceNumber ? (
                            <span className="font-mono text-[#25343F] font-semibold text-[11px] bg-[#EAEFEF]/60 px-1.5 py-0.5 rounded">
                              {item.referenceNumber}
                            </span>
                          ) : (
                            <span className="text-[#898989]">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-sm font-mono whitespace-nowrap">
                          <span className={isIncome ? 'text-[#059669]' : 'text-[#E11D48]'}>
                            {isIncome ? `+${formatRupiah(item.amount)}` : `-${formatRupiah(item.amount)}`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── 4. MODAL: CATAT TRANSAKSI KAS MANUAL ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25343F]/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#BFC9D1]/30 max-w-md w-full p-5 sm:p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#BFC9D1]/20">
              <div>
                <h3 className="font-extrabold text-base text-[#25343F]">Catat Mutasi Kas Manual</h3>
                <p className="text-xs text-[#898989] mt-0.5">Pencatatan uang masuk atau pengeluaran operasional</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg text-[#898989] hover:bg-[#EAEFEF] flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-3.5 text-xs mt-4">
              {/* Jenis Transaksi (Masuk / Keluar) */}
              <div>
                <label className="block font-bold text-[#898989] uppercase tracking-wider text-[10px] mb-1">
                  Jenis Arus Kas *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEntryType('INCOME');
                      setCategory('Penjualan Lainnya');
                      setIsCustomCategory(false);
                    }}
                    className={`py-2 rounded-xl font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      entryType === 'INCOME'
                        ? 'bg-[#10B981] text-white border-[#10B981] shadow-xs'
                        : 'bg-white text-[#898989] border-[#BFC9D1]/40 hover:bg-[#EAEFEF]'
                    }`}
                  >
                    <ArrowUpRightIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>+ Uang Masuk</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEntryType('EXPENSE');
                      setCategory('Operasional');
                      setIsCustomCategory(false);
                    }}
                    className={`py-2 rounded-xl font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      entryType === 'EXPENSE'
                        ? 'bg-[#F43F5E] text-white border-[#F43F5E] shadow-xs'
                        : 'bg-white text-[#898989] border-[#BFC9D1]/40 hover:bg-[#EAEFEF]'
                    }`}
                  >
                    <ArrowDownRightIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>- Uang Keluar</span>
                  </button>
                </div>
              </div>

              {/* Nominal */}
              <div>
                <label className="block font-bold text-[#898989] uppercase tracking-wider text-[10px] mb-1">
                  Nominal (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#898989] text-sm">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={amount ? amount.toLocaleString('id-ID') : ''}
                    onChange={e => {
                      const rawValue = e.target.value.replace(/\D/g, '');
                      setAmount(parseInt(rawValue, 10) || 0);
                    }}
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 bg-[#F8FAFC] border border-[#BFC9D1]/30 rounded-xl text-base font-black text-[#25343F] font-mono focus:bg-white focus:border-[#FF9B51] outline-none"
                  />
                </div>
              </div>

              {/* Kategori & Metode Pembayaran */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#898989] uppercase tracking-wider text-[10px]">
                  Pilih Kategori
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(entryType === 'INCOME'
                    ? ['Penjualan Lainnya', 'Jasa', 'Piutang Masuk', 'Modal Tambahan', 'Pendapatan Lain']
                    : ['Operasional', 'Bahan Baku', 'Gaji & Upah', 'Sewa', 'Listrik & Utilitas', 'Transportasi', 'Konsumsi']
                  ).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setCategory(opt);
                        setIsCustomCategory(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                        !isCustomCategory && category === opt
                          ? 'bg-[#25343F] text-white border-[#25343F]'
                          : 'bg-[#F8FAFC] text-[#25343F] border-[#BFC9D1]/30 hover:bg-[#EAEFEF]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(true);
                      setCategory('');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      isCustomCategory
                        ? 'bg-[#FF9B51] text-[#25343F] border-[#FF9B51]'
                        : 'bg-white text-[#898989] border-[#BFC9D1]/30 hover:bg-[#EAEFEF]'
                    }`}
                  >
                    + Kustom...
                  </button>
                </div>
                {isCustomCategory && (
                  <input
                    type="text"
                    autoFocus
                    required
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="Tulis nama kategori kustom..."
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#FF9B51] rounded-xl text-xs font-semibold text-[#25343F] outline-none mt-1"
                  />
                )}
              </div>

              {/* Metode & Tanggal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#898989] uppercase tracking-wider text-[10px] mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#BFC9D1]/30 rounded-xl text-xs font-semibold text-[#25343F] outline-none"
                  >
                    <option value="CASH">Tunai (Cash)</option>
                    <option value="TRANSFER">Transfer Bank</option>
                    <option value="QRIS">QRIS</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#898989] uppercase tracking-wider text-[10px] mb-1">
                    Tanggal Transaksi
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#BFC9D1]/30 rounded-xl text-xs font-semibold text-[#25343F] outline-none"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block font-bold text-[#898989] uppercase tracking-wider text-[10px] mb-1">
                  Deskripsi / Keterangan *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Contoh: Pembayaran listrik bulanan toko"
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#BFC9D1]/30 rounded-xl text-xs font-semibold text-[#25343F] outline-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[#BFC9D1]/20 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl border border-[#BFC9D1]/30 font-bold text-[#898989] hover:bg-[#EAEFEF] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#25343F] hover:bg-[#1B2730] text-white font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── FLOATING ACTION BUTTON (FAB) ── */}
      <button
        id="btn-add-finance-fab"
        type="button"
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-30 h-11 px-4 sm:px-5 bg-[#25343F] hover:bg-[#1B2730] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xl border border-white/20 transition-all cursor-pointer active:scale-95 hover:scale-105"
        title="Catat Transaksi Kas"
        aria-label="Catat Transaksi Kas"
      >
        <PlusIcon className="w-4 h-4 text-[#FF9B51] stroke-[2.5]" />
        <span>Catat Kas</span>
      </button>
    </div>
  );
};

