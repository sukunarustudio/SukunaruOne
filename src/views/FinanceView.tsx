import React, { useState, useEffect } from 'react';
import { WalletIcon, ArrowUpRightIcon, ArrowDownRightIcon, PlusIcon, MagnifyingGlassIcon, FunnelIcon, CalendarIcon, CurrencyDollarIcon, ArrowTrendingUpIcon, DocumentTextIcon, ArrowDownTrayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
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

  // Add Manual Record Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<TransactionType>('INCOME');
  const [category, setCategory] = useState('Penjualan Lainnya');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getTodayDateString());

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getFinancialTransactions();
      setTransactions(data);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat arus kas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('week');

  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // ─── Dynamic Traffic Chart Data (Week / Month / Year) ─────────────────────
  const trafficChartData = React.useMemo(() => {
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
          if (t.type === 'INCOME') slots[dateStr].income += Number(t.amount) || 0;
          else if (t.type === 'EXPENSE') slots[dateStr].expense += Number(t.amount) || 0;
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
            if (t.type === 'INCOME') slots[key].income += Number(t.amount) || 0;
            else if (t.type === 'EXPENSE') slots[key].expense += Number(t.amount) || 0;
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
          if (t.type === 'INCOME') slots[key].income += Number(t.amount) || 0;
          else if (t.type === 'EXPENSE') slots[key].expense += Number(t.amount) || 0;
        }
      });
    }
    return Object.values(slots);
  }, [transactions, chartPeriod]);

  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredTransactions = transactions.filter(t => {
    return filterType === 'ALL' || t.type === filterType;
  });

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showToast('Nominal harus lebih dari 0', 'error');
      return;
    }

    try {
      const created = await api.createFinancialTransaction({
        type: entryType,
        category,
        amount,
        paymentMethod,
        description,
        date,
      });

      setTransactions(prev => [created, ...prev]);
      showToast('Catatan keuangan berhasil ditambahkan', 'success');
      setIsAddModalOpen(false);
      setAmount(0);
      setDescription('');
      setCategory('Penjualan Lainnya');
      setIsCustomCategory(false);
      if (onRefreshDashboard) onRefreshDashboard();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan transaksi keuangan', 'error');
    }
  };

  return (
    <div id="finance-view" className="space-y-3.5 max-w-7xl mx-auto pb-24">
      {/* ── STICKY TOP HEADER: [ ← Judul ] ... [ Aksi ] ── */}
      <div className="sticky -top-3 z-30 bg-[#EAEFEF] py-2.5 -mx-3 px-3 sm:-mx-4 sm:px-4 border-b border-[#BFC9D1]/40 flex items-center justify-between gap-3">
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
              Arus Kas & Keuangan
            </h1>
            <p className="text-xs sm:text-[13px] text-[#898989] font-medium mt-0.5 truncate hidden sm:block">
              Buku kas masuk, keluar & saldo kas studio
            </p>
          </div>
        </div>
      </div>

      {/* ── MOBILE: Compact Balance Summary ── */}
      <div className="md:hidden bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md p-4">
        <div className="text-[10px] font-bold text-[#898989] uppercase tracking-wider mb-1">
          Saldo Kas Bersih
        </div>
        <div className={`text-3xl font-black mb-3 font-mono ${netBalance >= 0 ? 'text-[#25343F]' : 'text-[#c45e00]'}`}>
          {formatRupiah(netBalance)}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[#EAEFEF] rounded-xl p-2.5">
            <div className="text-[10px] font-bold text-[#25343F] uppercase tracking-wider">Masuk</div>
            <div className="text-sm font-black text-[#25343F] mt-0.5 font-mono">{formatRupiah(totalIncome)}</div>
          </div>
          <div className="bg-[#FF9B51]/8 rounded-xl p-2.5">
            <div className="text-[10px] font-bold text-[#c45e00] uppercase tracking-wider">Keluar</div>
            <div className="text-sm font-black text-[#c45e00] mt-0.5 font-mono">{formatRupiah(totalExpense)}</div>
          </div>
        </div>
      </div>

      {/* ── DESKTOP: 3 Main Balance Cards ── */}
      <div className="hidden md:grid grid-cols-3 gap-3.5">
        {/* Total Income */}
        <div className="bg-white p-5 rounded-2xl border border-[#BFC9D1]/25 shadow-md">
          <div className="flex items-center justify-between text-[#898989] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#898989]">Total Pemasukan Kas</span>
            <div className="w-8 h-8 rounded-lg bg-[#EAEFEF] text-[#25343F] flex items-center justify-center">
              <ArrowUpRightIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#25343F] font-mono">{formatRupiah(totalIncome)}</div>
          <p className="text-xs text-[#898989] mt-1">Penjualan kasir, DP & pelunasan order</p>
        </div>
        {/* Total Expense */}
        <div className="bg-white p-5 rounded-2xl border border-[#BFC9D1]/25 shadow-md">
          <div className="flex items-center justify-between text-[#898989] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#898989]">Total Pengeluaran Kas</span>
            <div className="w-8 h-8 rounded-lg bg-[#FF4267]/15 text-[#FF4267] flex items-center justify-center">
              <ArrowDownRightIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#FF4267] font-mono">{formatRupiah(totalExpense)}</div>
          <p className="text-xs text-[#898989] mt-1">Bahan baku, listrik, sewa &amp; operasional</p>
        </div>
        {/* Net Cash Balance */}
        <div className="bg-white p-5 rounded-2xl border border-[#BFC9D1]/25 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#898989] mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#898989]">Saldo Kas Bersih</span>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-2.5 py-1 bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F] rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-md transition-colors cursor-pointer active:scale-95"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Catat Kas</span>
              </button>
            </div>
            <div className={`text-2xl font-black ${netBalance >= 0 ? 'text-[#25343F]' : 'text-[#c45e00]'}`}>
              {formatRupiah(netBalance)}
            </div>
          </div>
          <p className="text-xs text-[#898989] mt-2">Arus kas bersih tercatat saat ini</p>
        </div>
      </div>

      {/* ── GRAFIK TRAFIK: LINE CHART WITH DOTS ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md px-3 pt-3.5 pb-2 overflow-hidden">
        {/* Period Buttons + Legend */}
        <div className="flex items-center justify-between gap-2 mb-2 px-0.5">
          {/* Period Switcher */}
          <div className="flex items-center gap-0.5 bg-[#EAEFEF]/80 p-0.5 rounded-lg">
            {([
              { id: 'week',  label: 'Minggu' },
              { id: 'month', label: 'Bulan' },
              { id: 'year',  label: 'Tahun' },
            ] as const).map(p => (
              <button
                key={p.id}
                onClick={() => setChartPeriod(p.id)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                  chartPeriod === p.id
                    ? 'bg-white text-[#25343F] shadow-sm'
                    : 'text-[#898989] hover:text-[#898989]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-2.5 text-[10px] font-bold">
            <div className="flex items-center gap-1.5 text-[#25343F]">
              <span className="w-2.5 h-[2px] rounded-full bg-[#25343F] inline-block" />
              <span className="w-2 h-2 rounded-full bg-[#25343F] inline-block" />
              <span>Masuk</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#c45e00]">
              <span className="w-2.5 h-[2px] rounded-full bg-[#FF9B51] inline-block" />
              <span className="w-2 h-2 rounded-full bg-[#FF9B51] inline-block" />
              <span>Keluar</span>
            </div>
          </div>
        </div>

        <div className="h-36 sm:h-44 w-full -ml-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trafficChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                tickFormatter={(v) => v.split(' ')[0]}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: '#cbd5e1' }}
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
                    const incomeVal = payload.find(p => p.dataKey === 'income')?.value || 0;
                    const expenseVal = payload.find(p => p.dataKey === 'expense')?.value || 0;
                    return (
                      <div className="bg-white border border-[#BFC9D1]/25 shadow-lg rounded-xl p-2.5 text-[10px]">
                        <div className="font-bold text-[#898989] mb-1.5 border-b border-slate-100 pb-1">{label}</div>
                        <div className="text-[#25343F] font-mono font-bold flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#25343F] inline-block" />
                            Masuk:
                          </span>
                          <span className="font-mono">{formatRupiah(Number(incomeVal))}</span>
                        </div>
                        <div className="text-[#c45e00] font-mono font-bold flex items-center justify-between gap-3 mt-0.5">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9B51] inline-block" />
                            Keluar:
                          </span>
                          <span className="font-mono">{formatRupiah(Number(expenseVal))}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="income"
                name="Masuk"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="Keluar"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1 pb-1">
        {/* FunnelIcon chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 flex-1 min-w-0">
          {[
            { id: 'INCOME', label: '+ Masuk' },
            { id: 'EXPENSE', label: '- Keluar' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(prev => (prev === tab.id ? 'ALL' : tab.id))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                filterType === tab.id
                  ? 'bg-[#25343F] text-white shadow-md'
                  : 'bg-white border border-[#BFC9D1]/25 text-[#898989] hover:bg-[#EAEFEF]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>


      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1,2,3,4].map(n => (
              <div key={n} className="animate-pulse flex gap-3 items-center py-2">
                <div className="w-8 h-8 rounded-full bg-[#EAEFEF] shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-[#EAEFEF] rounded w-3/4" />
                  <div className="h-3 bg-[#EAEFEF] rounded w-1/2" />
                </div>
                <div className="h-4 w-20 bg-[#EAEFEF] rounded" />
              </div>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-16 text-[#898989]">
            <WalletIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#25343F]">Belum ada catatan transaksi kas</p>
            <p className="text-xs text-[#898989] mt-1">
              Transaksi POS dan Pembayaran Pesanan akan otomatis muncul di sini.
            </p>
          </div>
        ) : (
          <>
            {/* ── MOBILE: Compact Transaction List ── */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredTransactions.map(item => {
                const isIncome = item.type === 'INCOME';
                return (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                    {/* Direction indicator */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      isIncome ? 'bg-[#52D5BA]/20' : 'bg-[#FF4267]/15'
                    }`}>
                      {isIncome
                        ? <ArrowUpRightIcon className="w-4 h-4 text-[#0f766e]" />
                        : <ArrowDownRightIcon className="w-4 h-4 text-[#FF4267]" />
                      }
                    </div>
                    {/* Description + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[13px] text-[#25343F] truncate">{item.description}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-[#898989]">{formatDate(item.date)}</span>
                        <span className="text-[10px] text-slate-300">·</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EAEFEF] text-[#898989] font-medium">{item.category}</span>
                      </div>
                    </div>
                    {/* Amount */}
                    <div className={`font-black text-sm shrink-0 font-mono ${isIncome ? 'text-[#0f766e]' : 'text-[#FF4267]'}`}>
                      {isIncome ? `+${formatRupiah(item.amount)}` : `-${formatRupiah(item.amount)}`}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── DESKTOP: Full Table ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#BFC9D1]/40 bg-[#EAEFEF]/80 text-[#898989] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Tanggal & Waktu</th>
                    <th className="py-3.5 px-4">Deskripsi / Transaksi</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4">Metode</th>
                    <th className="py-3.5 px-4 text-center">No. Referensi</th>
                    <th className="py-3.5 px-4 text-right">Nominal Arus Kas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map(item => {
                    const isIncome = item.type === 'INCOME';
                    return (
                      <tr key={item.id} className="hover:bg-[#EAEFEF]/60 transition-colors">
                        <td className="py-3 px-4 text-[#898989] whitespace-nowrap">{formatDateTime(item.createdAt || item.date)}</td>
                        <td className="py-3 px-4 max-w-sm"><div className="font-bold text-[#25343F]">{item.description}</div></td>
                        <td className="py-3 px-4"><span className="font-semibold text-[#25343F] px-2 py-0.5 rounded bg-[#EAEFEF]">{item.category}</span></td>
                        <td className="py-3 px-4"><span className="font-mono text-[#898989] text-[11px]">{item.paymentMethod || 'CASH'}</span></td>
                        <td className="py-3 px-4 text-center">
                          {item.referenceNumber
                            ? <span className="font-mono text-[#25343F] font-semibold">{item.referenceNumber}</span>
                            : <span className="text-[#898989]">-</span>
                          }
                        </td>
                        <td className="py-3 px-4 text-right font-black text-sm font-mono">
                          <span className={isIncome ? 'text-[#0f766e]' : 'text-[#FF4267]'}>
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

      {/* MODAL: Manual Add Cash Record */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#25343F]/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#BFC9D1]/25 max-w-md w-full p-6">
            <h3 className="font-bold text-base text-[#25343F] mb-1">Catat Arus Kas Manual</h3>
            <p className="text-xs text-[#898989] mb-4">Input penerimaan kas atau pengeluaran ekstra</p>

            <form onSubmit={handleSaveEntry} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#25343F] mb-1">Jenis Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEntryType('INCOME');
                      setCategory('Penjualan Lainnya');
                      setIsCustomCategory(false);
                    }}
                    className={`py-2 rounded-xl font-bold border transition-colors cursor-pointer ${
                      entryType === 'INCOME'
                        ? 'bg-[#25343F] text-white border-[#BFC9D1]'
                        : 'bg-white text-[#898989] border-[#BFC9D1]'
                    }`}
                  >
                    + Pemasukan Kas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEntryType('EXPENSE');
                      setCategory('Operasional');
                      setIsCustomCategory(false);
                    }}
                    className={`py-2 rounded-xl font-bold border transition-colors cursor-pointer ${
                      entryType === 'EXPENSE'
                        ? 'bg-[#FF9B51] text-white border-[#FF9B51]/40'
                        : 'bg-white text-[#25343F] border-[#BFC9D1]'
                    }`}
                  >
                    - Pengeluaran Kas
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#25343F] mb-1">Nominal (Rp) *</label>
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
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl text-base font-bold text-[#25343F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#25343F] mb-1.5">Kategori</label>
                  {/* Chip options */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(entryType === 'INCOME'
                      ? ['Penjualan Lainnya', 'Jasa', 'Piutang Masuk', 'Modal', 'Investasi', 'Lainnya']
                      : ['Operasional', 'Bahan Baku', 'Gaji', 'Sewa', 'Listrik & Air', 'Transportasi', 'Marketing', 'Lainnya']
                    ).map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setCategory(opt);
                          setIsCustomCategory(false);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                          !isCustomCategory && category === opt
                            ? 'bg-[#25343F] text-white border-[#25343F]'
                            : 'bg-[#EAEFEF] text-white border-[#BFC9D1] hover:bg-[#BFC9D1]/50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                    {/* Ketik Manual chip */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(true);
                        setCategory('');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                        isCustomCategory
                          ? 'bg-[#FF9B51] text-white border-[#FF9B51]/60'
                          : 'bg-white text-[#898989] border-[#BFC9D1] hover:bg-[#EAEFEF]'
                      }`}
                    >
                      + Ketik...
                    </button>
                  </div>
                  {/* Input manual muncul hanya saat "Ketik..." dipilih */}
                  {isCustomCategory && (
                    <input
                      type="text"
                      autoFocus
                      required
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      placeholder="Tulis kategori kustom..."
                      className="w-full px-3 py-2 bg-white border border-[#FF9B51]/60 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#FF9B51]/40"
                    />
                  )}
                </div>
                <div>
                  <label className="block font-bold text-[#25343F] mb-1">Metode</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
                  >
                    <option value="CASH">CASH (Tunai)</option>
                    <option value="TRANSFER">TRANSFER Bank</option>
                    <option value="QRIS">QRIS</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#25343F] mb-1">Deskripsi / Keterangan *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Contoh: Beli token listrik studio & cetak"
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-[#25343F] mb-1">Tanggal</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#BFC9D1]/25 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-[#BFC9D1]/25 font-semibold text-[#898989]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FF9B51] hover:bg-[#FF9B51] text-[#25343F] font-bold"
                >
                  Simpan Catatan Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Floating Action Button (FAB) Catat Kas ── */}
      <button
        id="btn-add-finance-fab"
        type="button"
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-30 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#FF9B51] hover:bg-[#ff8c38] text-[#25343F] flex items-center justify-center shadow-xl border-2 border-white transition-all cursor-pointer active:scale-90 hover:scale-105"
        title="Catat Kas / Transaksi Keuangan"
        aria-label="Catat Kas / Transaksi Keuangan"
      >
        <PlusIcon className="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  );
};
