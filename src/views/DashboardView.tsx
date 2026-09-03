import React, { useState, useEffect } from 'react';
import { ChevronRightIcon, CheckCircleIcon, ExclamationTriangleIcon, ClockIcon, CubeIcon, PlusIcon, UsersIcon, ShoppingBagIcon, DocumentTextIcon, ArrowTrendingUpIcon, WalletIcon, ArrowUpRightIcon, ClipboardDocumentListIcon, PrinterIcon, ArrowPathIcon, MagnifyingGlassIcon, BuildingStorefrontIcon, ShoppingCartIcon, CalculatorIcon, Square3Stack3DIcon, ReceiptPercentIcon, ChartBarIcon, ArchiveBoxIcon, Cog6ToothIcon, InformationCircleIcon, ArrowDownRightIcon, LockClosedIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useLicense } from '../hooks/useLicense';
import { BuildingStorefrontIcon as BuildingStorefrontSolid, ClipboardDocumentListIcon as ClipboardDocumentListSolid, UsersIcon as UsersSolid, CubeIcon as CubeSolid, CalculatorIcon as CalculatorSolid, Square3Stack3DIcon as Square3StackSolid, WalletIcon as WalletSolid, ArrowTrendingUpIcon as ArrowTrendingUpSolid, Cog6ToothIcon as CogSolid, CloudArrowUpIcon as CloudArrowUpSolid } from '@heroicons/react/24/solid';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { api } from '../services/api';
import {
  DashboardStats,
  Order,
  Material,
  ViewType,
  BusinessSettings,
} from '../types';
import { syncWithSupabase } from '../services/syncManager';
import { isSupabaseConfigured } from '../services/supabaseClient';
import {
  formatRupiah,
  formatDate,
  isDeadlineOverdue,
  isDeadlineToday,
  getStatusBadgeClass,
} from '../lib/utils';
import { useToast } from '../components/Toast';

interface DashboardViewProps {
  onNavigate?: (view: ViewType, recordId?: string) => void;
  onOpenSearch?: () => void;
  settings: BusinessSettings;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenSearch, settings }) => {
  const { showToast } = useToast();

  const goTo = (view: ViewType, recordId?: string) => {
    if (typeof onNavigate === 'function') {
      onNavigate(view, recordId);
    }
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats & { lowStockItems: Material[] }>({
    todayRevenue: 0,
    todayProfit: 0,
    todayTransactionsCount: 0,
    activeOrdersCount: 0,
    todayExpense: 0,
    thisMonthRevenue: 0,
    thisMonthProfit: 0,
    thisMonthExpense: 0,
    lowStockItemsCount: 0,
    lowStockItems: [],
  });

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [finTransactions, setFinTransactions] = useState<any[]>([]);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);

  const loadData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      // Trigger Cloud Sync if configured and user manually refreshes
      let isSynced = false;
      if (showRefreshing && isSupabaseConfigured()) {
        try {
          const syncRes = await syncWithSupabase();
          if (syncRes.success) {
            isSynced = true;
          }
        } catch (syncErr) {
          console.warn('Background sync on refresh warning:', syncErr);
        }
      }

      const [statsData, ordersData, finData] = await Promise.all([
        api.getStats(),
        api.getOrders(),
        api.getFinancialTransactions().catch(() => []),
      ]);

      setStats(statsData);
      setAllOrders(ordersData);
      setFinTransactions(finData);
      if (showRefreshing) {
        showToast(
          isSynced
            ? 'Data berhasil diperbarui & disinkronkan!'
            : 'Data berhasil diperbarui!',
          'success'
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data dashboard', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleFocus = () => {
      loadData(false);
    };

    // Live Auto-Refresh when local data changes or Supabase Cloud sync finishes
    const handleLiveAutoRefresh = () => {
      loadData(false);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('sukunaru:sync_completed', handleLiveAutoRefresh);
    window.addEventListener('sukunaru:data_mutation', handleLiveAutoRefresh);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('sukunaru:sync_completed', handleLiveAutoRefresh);
      window.removeEventListener('sukunaru:data_mutation', handleLiveAutoRefresh);
    };
  }, []);

  // ─── 7-Day Sales & Expense Traffic Chart Data ─────────────────────────────
  const trafficChartData = React.useMemo(() => {
    const days: { [key: string]: { date: string; label: string; income: number; expense: number } } = {};
    const now = new Date();
    
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      days[dateStr] = {
        date: dateStr,
        label: dayLabel,
        income: 0,
        expense: 0,
      };
    }

    // Populate from financial transactions
    finTransactions.forEach(t => {
      const dateStr = t.date ? t.date.split('T')[0] : '';
      if (days[dateStr]) {
        if (t.type === 'INCOME') {
          days[dateStr].income += Number(t.amount) || 0;
        } else if (t.type === 'EXPENSE') {
          days[dateStr].expense += Number(t.amount) || 0;
        }
      }
    });

    return Object.values(days);
  }, [finTransactions]);

  // ─── Total Net Cash Balance (Saldo Kas Bisnis Kumulatif) ───────────────────
  const liveTotalCashBalance = React.useMemo(() => {
    if (finTransactions && finTransactions.length > 0) {
      const totalIn = finTransactions
        .filter(f => f.type === 'INCOME')
        .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
      const totalOut = finTransactions
        .filter(f => f.type === 'EXPENSE')
        .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
      return totalIn - totalOut;
    }
    if (stats.totalCashBalance !== undefined) return stats.totalCashBalance;
    return (stats.todayRevenue || 0) - (stats.todayExpense || 0);
  }, [finTransactions, stats.totalCashBalance, stats.todayRevenue, stats.todayExpense]);

  // ─── Dynamic Period-Aware KPIs (Omzet, Pengeluaran, Profit) ───────────────
  const { kpiRevenue, kpiExpense, kpiProfit, periodNet } = React.useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const thisMonthPrefix = todayStr.substring(0, 7);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const isInPeriod = (dateStr?: string) => {
      if (!dateStr) return false;
      const clean = dateStr.split('T')[0];
      if (period === 'today') return clean === todayStr;
      if (period === 'month') return clean.startsWith(thisMonthPrefix);
      const d = new Date(dateStr);
      return d >= sevenDaysAgo;
    };

    let income = 0;
    let expense = 0;

    if (finTransactions && finTransactions.length > 0) {
      finTransactions.forEach(f => {
        if (isInPeriod(f.date)) {
          if (f.type === 'INCOME') income += Number(f.amount) || 0;
          else if (f.type === 'EXPENSE') expense += Number(f.amount) || 0;
        }
      });
    } else {
      if (period === 'today') {
        income = stats.todayRevenue || 0;
        expense = stats.todayExpense || 0;
      } else {
        income = stats.thisMonthRevenue || 0;
        expense = stats.thisMonthExpense || 0;
      }
    }

    const profit = Math.max(0, income - expense);
    const periodNet = income - expense;

    return { kpiRevenue: income, kpiExpense: expense, kpiProfit: profit, periodNet };
  }, [finTransactions, period, stats]);

  const kpiTrx = React.useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const thisMonthPrefix = todayStr.substring(0, 7);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    if (finTransactions && finTransactions.length > 0) {
      if (period === 'today') {
        return finTransactions.filter(f => (f.date ? f.date.split('T')[0] : '') === todayStr).length;
      } else if (period === 'month') {
        return finTransactions.filter(f => (f.date ? f.date.split('T')[0] : '').startsWith(thisMonthPrefix)).length;
      } else {
        return finTransactions.filter(f => {
          if (!f.date) return false;
          return new Date(f.date) >= sevenDaysAgo;
        }).length;
      }
    }
    return period === 'today' ? (stats.todayTransactionsCount || 0) : (stats.todayTransactionsCount || 0) * 4;
  }, [finTransactions, period, stats.todayTransactionsCount]);

  // ─── Derived: Order pipeline counts ───────────────────────────────────────
  const activeOrders = allOrders.filter(o => o.status !== 'SELESAI' && o.status !== 'BATAL');
  const newOrders     = allOrders.filter(o => o.status === 'BARU');
  const inProgressOrders = allOrders.filter(o => o.status === 'DIPROSES');
  const readyOrders   = allOrders.filter(o => o.status === 'SIAP DIAMBIL');
  const doneOrders    = allOrders.filter(o => o.status === 'SELESAI');
  const unpaidOrders  = allOrders.filter(o => o.remainingAmount > 0 && o.status !== 'BATAL');

  // Orders currently being worked on (BARU + DIPROSES + SIAP) limited for dashboard
  const workingOrders = activeOrders.slice(0, 3);

  // ─── "Perlu Dikerjakan" todo items ────────────────────────────────────────
  const todoItems = [
    newOrders.length > 0 && {
      key: 'baru',
      count: newOrders.length,
      label: 'Pesanan Masuk',
      desc: 'Menunggu diproses',
      color: 'bg-slate-400',
      dotColor: 'bg-[#FF9B51]',
      textColor: 'text-[#25343F]',
      bgSoft: 'bg-[#EAEFEF] border-[#BFC9D1]/60',
      onClick: () => goTo('orders', 'filter:BARU:table'),
    },
    inProgressOrders.length > 0 && {
      key: 'diproses',
      count: inProgressOrders.length,
      label: 'Sedang Diproses',
      desc: 'Sedang dikerjakan',
      color: 'bg-slate-400',
      dotColor: 'bg-[#0890FE]',
      textColor: 'text-[#25343F]',
      bgSoft: 'bg-[#EAEFEF] border-[#BFC9D1]/60',
      onClick: () => goTo('orders', 'filter:DIPROSES:table'),
    },
    readyOrders.length > 0 && {
      key: 'siap',
      count: readyOrders.length,
      label: 'Siap Diambil / Dikirim',
      desc: 'Sudah selesai diproduksi',
      color: 'bg-slate-400',
      dotColor: 'bg-[#52D5BA]',
      textColor: 'text-[#25343F]',
      bgSoft: 'bg-[#EAEFEF] border-[#BFC9D1]/60',
      onClick: () => goTo('orders', 'filter:SIAP DIAMBIL:table'),
    },
    unpaidOrders.length > 0 && {
      key: 'unpaid',
      count: unpaidOrders.length,
      label: 'Belum Lunas',
      desc: 'Menunggu pembayaran',
      color: 'bg-slate-400',
      dotColor: 'bg-[#FFAF2A]',
      textColor: 'text-[#25343F]',
      bgSoft: 'bg-[#EAEFEF] border-[#BFC9D1]/60',
      onClick: () => goTo('orders', 'filter:SEMUA:table'),
    },
    stats.lowStockItemsCount > 0 && {
      key: 'lowstock',
      count: stats.lowStockItemsCount,
      label: 'Bahan Hampir Habis',
      desc: 'Perlu segera diperiksa',
      color: 'bg-slate-400',
      dotColor: 'bg-[#FF4267]',
      textColor: 'text-[#25343F]',
      bgSoft: 'bg-[#EAEFEF] border-[#BFC9D1]/60',
      onClick: () => goTo('inventory'),
    },
  ].filter(Boolean) as {
    key: string;
    count: number;
    label: string;
    desc: string;
    color: string;
    dotColor: string;
    textColor: string;
    bgSoft: string;
    onClick: () => void;
  }[];

  // ─── Today's date label ────────────────────────────────────────────────────
  const today = new Date();
  const dateLabel = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-[#898989]">
          <div className="w-8 h-8 border-2 border-[#BFC9D1] border-t-slate-600 rounded-full animate-spin" />
          <span className="text-sm font-medium">Memuat dashboard...</span>
        </div>
      </div>
    );
  }

  const { isPro, isTrial, daysRemaining, isTrialExpired } = useLicense();

  const [isProfileBannerDismissed, setIsProfileBannerDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('bisnisurang_dismiss_profile_prompt') === 'true';
    } catch {
      return false;
    }
  });

  const isProfileIncomplete = React.useMemo(() => {
    const name = settings?.businessName?.trim() || '';
    const isDefaultName = !name || name.toLowerCase() === 'nama bisnis anda' || name.toLowerCase() === 'sukunaru studio';
    const hasContact = Boolean(settings?.phone?.trim() || settings?.whatsapp?.trim());
    const hasAddress = Boolean(settings?.address?.trim());
    const hasLogo = Boolean(settings?.logoUrl?.trim());
    return isDefaultName || !hasContact || !hasAddress || !hasLogo;
  }, [settings]);

  return (
    <div id="dashboard-view" className="space-y-3.5 max-w-2xl lg:max-w-7xl mx-auto pb-8">

      {/* ── LIGHT NON-BLOCKING BUSINESS PROFILE PROMPT ────────────────── */}
      {!isProfileBannerDismissed && isProfileIncomplete && (
        <div className="bg-white dark:bg-[#151D2A] p-4 rounded-2xl border border-[#BFC9D1]/30 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 transition-all">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#FF9B51]/15 text-[#FF6A00] dark:bg-[#FF9B51]/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <BuildingStorefrontIcon className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-[#25343F] dark:text-white">
                Lengkapi profil bisnis
              </h3>
              <p className="text-[11px] sm:text-xs text-[#898989] dark:text-slate-400 mt-0.5 leading-relaxed">
                Tambahkan informasi bisnis agar invoice, struk, SPK, dan dokumen lainnya tampil lebih profesional.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto pt-1 sm:pt-0">
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.setItem('bisnisurang_dismiss_profile_prompt', 'true');
                } catch {}
                setIsProfileBannerDismissed(true);
              }}
              className="text-xs text-[#898989] dark:text-slate-400 hover:text-[#25343F] dark:hover:text-white px-3 py-2 rounded-xl transition cursor-pointer"
            >
              Nanti
            </button>
            <button
              type="button"
              onClick={() => goTo('business-profile')}
              className="flex-1 sm:flex-initial px-4 py-2 bg-[#FF6A00] hover:bg-[#e65c00] active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer text-center"
            >
              Lengkapi Profil →
            </button>
          </div>
        </div>
      )}

      {/* ── UNLICENSED / TRIAL NOTICE BANNER ─────────────────────────── */}
      {!isPro && (
        <div className="bg-gradient-to-r from-[#25343F] to-[#1E293B] text-white p-4 rounded-2xl border border-[#FF9B51]/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF9B51]/20 border border-[#FF9B51]/40 flex items-center justify-center shrink-0">
              <LockClosedIcon className="w-5 h-5 text-[#FF9B51]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                {isTrialExpired ? 'Masa Percobaan Trial Berakhir' : 'Mode Terbatas (Belum Aktivasi)'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {isTrialExpired
                  ? 'Aktivasi lisensi Pro untuk melanjutkan akses penuh ke seluruh fitur studio.'
                  : 'Aktifkan Serial Key untuk membuka Pesanan, Kalkulator HPP, Arus Kas, Pengaturan Profil, Cloud Sync & Laporan.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => goTo('activation')}
            className="w-full sm:w-auto px-4 py-2 bg-[#FF9B51] hover:bg-[#e8894a] text-white text-xs font-black rounded-xl shadow transition-all cursor-pointer shrink-0 text-center active:scale-95"
          >
            Aktivasi Sekarang →
          </button>
        </div>
      )}

      {isPro && isTrial && daysRemaining !== null && daysRemaining <= 5 && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 px-4 py-2.5 rounded-xl flex items-center justify-between gap-3 text-xs">
          <span className="font-medium">
            ⏳ Masa Trial Anda tersisa <strong>{daysRemaining} hari</strong> lagi.
          </span>
          <button
            type="button"
            onClick={() => goTo('activation')}
            className="font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer shrink-0"
          >
            Upgrade Pro
          </button>
        </div>
      )}

      {/* ── TOP BAR HEADER: Beranda & Quick Tools ─────────────────────── */}
      <div className="flex items-center justify-between gap-3 py-1 sm:py-2">
        <div className="min-w-0">
          <h1
            id="dashboard-header-title"
            className="dashboard-title-text text-2xl sm:text-3xl font-black tracking-tight leading-tight pb-0.5 truncate text-[#25343F]"
          >
            BisnisUrang
          </h1>
          <p className="text-xs sm:text-[13px] font-semibold text-[#898989] tracking-tight mt-0.5 truncate">
            {dateLabel}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Search trigger (Mobile only - Desktop/Tablet already has it in TopBar) */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex md:hidden items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-white border border-[#BFC9D1]/30 hover:border-[#FF9B51] text-xs text-[#898989] hover:text-[#25343F] shadow-sm transition-all cursor-pointer group active:scale-95"
            title="Cari transaksi, produk, pelanggan... (⌘K)"
          >
            <MagnifyingGlassIcon className="w-4 h-4 text-[#898989] group-hover:text-[#FF9B51] transition-colors" />
            <span className="hidden sm:inline font-medium">Cari cepat...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[#EAEFEF] border border-[#BFC9D1]/40 rounded text-[#898989]">
              ⌘K
            </kbd>
          </button>

          {/* Refresh Data & Cloud Sync */}
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-[#BFC9D1]/30 hover:border-[#FF9B51] text-[#898989] hover:text-[#25343F] flex items-center justify-center shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Muat ulang data & sinkronisasi cloud"
          >
            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#FF9B51]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── SALDO KAS UTAMA (Premium Fintech Animated Card) ───────────────────────── */}
      <div 
        onClick={() => goTo('finance')}
        className="premium-fintech-card p-4 sm:p-5 text-white flex flex-col cursor-pointer select-none group"
      >
        {/* Layer 3: Dot Grid */}
        <div className="fintech-dot-grid" />

        {/* Layer 4: Wave/Mesh Decoration */}
        <div className="absolute right-0 bottom-0 w-64 h-36 opacity-15 pointer-events-none z-10 mix-blend-overlay">
          <svg className="w-full h-full" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80 C 50 50, 100 110, 200 60" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 85 C 60 55, 110 115, 200 65" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M20 90 C 70 60, 120 120, 200 70" stroke="white" strokeWidth="1" strokeLinecap="round" />
            <path d="M-10 75 C 40 45, 90 105, 200 55" stroke="white" strokeWidth="0.8" strokeLinecap="round" />
            <path d="M-20 70 C 30 40, 80 100, 200 50" stroke="white" strokeWidth="0.5" strokeLinecap="round" strokeDasharray="3 3" />
          </svg>
        </div>

        {/* Layer 5: Glow/Light Sweep Effect */}
        <div className="fintech-light-sweep" />

        {/* Layer 6: Content */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          {/* Card Header (SKNR Logo + Period Pill) */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.businessName || 'Logo'}
                  className="w-7 h-7 rounded-lg object-cover bg-white shadow-md border border-white/20 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-white text-[#0B90FE] flex items-center justify-center font-black text-[11px] shadow-md shrink-0 uppercase">
                  {settings.businessName ? settings.businessName.slice(0, 2) : 'SK'}
                </div>
              )}
              <span className="font-extrabold text-sm tracking-wider truncate text-white">
                {settings.businessName || 'Sukunaru Studio'}
              </span>
            </div>
            
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPeriodDropdownOpen(!isPeriodDropdownOpen);
                }}
                className="bg-white/15 backdrop-blur-xs border border-white/20 text-white rounded-full px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1.5 hover:bg-white/20 transition-all cursor-pointer active:scale-95"
              >
                <span>{period === 'today' ? 'Hari Ini' : period === 'week' ? 'Minggu Ini' : 'Bulan Ini'}</span>
                <ChevronRightIcon className="w-3 h-3 rotate-90" />
              </button>

              {isPeriodDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPeriodDropdownOpen(false);
                    }} 
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-28 bg-[#25343F] border border-white/10 rounded-xl shadow-lg p-1.5 z-40 text-[10px] font-bold text-white flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPeriod('today');
                        setIsPeriodDropdownOpen(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-left transition-colors hover:bg-white/10 ${period === 'today' ? 'bg-[#0B90FE] text-white' : 'text-white/80'}`}
                    >
                      Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPeriod('week');
                        setIsPeriodDropdownOpen(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-left transition-colors hover:bg-white/10 ${period === 'week' ? 'bg-[#0B90FE] text-white' : 'text-white/80'}`}
                    >
                      Minggu Ini
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPeriod('month');
                        setIsPeriodDropdownOpen(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-left transition-colors hover:bg-white/10 ${period === 'month' ? 'bg-[#0B90FE] text-white' : 'text-white/80'}`}
                    >
                      Bulan Ini
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Card Middle (Saldo Kas) */}
          <div className="flex items-center justify-between mb-4.5">
            <div>
              <div className="text-[10px] sm:text-[11px] font-bold text-white/80 uppercase tracking-[0.15em] leading-none">
                Saldo Kas Bisnis
              </div>
              <div className="text-[28px] sm:text-3xl font-black text-white font-mono tracking-tight mt-2.5 leading-none">
                {formatRupiah(liveTotalCashBalance)}
              </div>

              {(() => {
                const isPositive = periodNet >= 0;
                const periodLabel = period === 'today' ? 'hari ini' : period === 'week' ? '7 hari terakhir' : 'bulan ini';
                return (
                  <div className="inline-flex items-center gap-1 mt-3.5 px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-bold text-white border border-white/10">
                    <span className={isPositive ? 'text-green-300' : 'text-rose-300'}>
                      {isPositive ? '↑' : '↓'} {periodNet !== 0 ? formatRupiah(Math.abs(periodNet)) : 'Rp0'}
                    </span>
                    <span className="text-white/80">{periodLabel}</span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Card Bottom Translucent Stats Grid */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-2.5 grid grid-cols-3 divide-x divide-white/20 mt-1 relative z-10">
            <div className="px-2">
              <div className="text-[9px] font-bold text-white/70 uppercase tracking-wider truncate">
                Omzet
              </div>
              <div className="text-xs sm:text-sm font-black text-white font-mono mt-0.5 truncate">
                {formatRupiah(kpiRevenue)}
              </div>
            </div>
            <div className="px-2 pl-3">
              <div className="text-[9px] font-bold text-white/70 uppercase tracking-wider truncate">
                Profit
              </div>
              <div className="text-xs sm:text-sm font-black text-white font-mono mt-0.5 truncate">
                {formatRupiah(kpiProfit)}
              </div>
            </div>
            <div className="px-2 pl-3">
              <div className="text-[9px] font-bold text-white/70 uppercase tracking-wider truncate">
                Pengeluaran
              </div>
              <div className="text-xs sm:text-sm font-black text-white font-mono mt-0.5 truncate">
                {formatRupiah(kpiExpense)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── AKSI CEPAT (9 Fitur dalam Grid 4 Kolom) ───────────── */}
      <div className="bg-white rounded-xl border border-[#BFC9D1]/25 py-4 px-2 sm:p-5">
        <div className="grid grid-cols-4 gap-y-5 gap-x-2 sm:gap-6">
          {[
            // Operasional Utama
            {
              icon: <BuildingStorefrontSolid className="w-5 h-5 text-[#10B981]" />,
              label: 'Kasir',
              bgClass: 'bg-[#E6F9F2] hover:bg-[#D1F4E8] shadow-[0_2px_8px_rgba(16,185,129,0.22)]',
              onClick: () => goTo('pos'),
            },
            {
              icon: <ClipboardDocumentListSolid className="w-5 h-5 text-[#FF9B51]" />,
              label: 'Pesanan',
              bgClass: 'bg-[#FFF0E6] hover:bg-[#FFE2CC] shadow-[0_2px_8px_rgba(255,155,81,0.22)]',
              onClick: () => goTo('orders', 'filter:SEMUA:table'),
            },
            {
              icon: <UsersSolid className="w-5 h-5 text-[#8B5CF6]" />,
              label: 'Pelanggan',
              bgClass: 'bg-[#F3E8FF] hover:bg-[#E9D5FF] shadow-[0_2px_8px_rgba(139,92,246,0.22)]',
              onClick: () => goTo('customers'),
            },
            {
              icon: <CubeSolid className="w-5 h-5 text-[#0B90FE]" />,
              label: 'Produk',
              bgClass: 'bg-[#E0F2FE] hover:bg-[#BAE6FD] shadow-[0_2px_8px_rgba(11,144,254,0.22)]',
              onClick: () => goTo('products'),
            },
            {
              icon: <CalculatorSolid className="w-5 h-5 text-[#F59E0B]" />,
              label: 'Hitung HPP',
              bgClass: 'bg-[#FEF3C7] hover:bg-[#FDE68A] shadow-[0_2px_8px_rgba(245,158,11,0.22)]',
              onClick: () => goTo('hpp'),
            },

            // Logistik, Keuangan, Laporan & Pengaturan
            {
              icon: <Square3StackSolid className="w-5 h-5 text-[#6366F1]" />,
              label: 'Bahan Baku',
              bgClass: 'bg-[#EEF2FF] hover:bg-[#E0E7FF] shadow-[0_2px_8px_rgba(99,102,241,0.22)]',
              onClick: () => goTo('inventory'),
            },
            {
              icon: <WalletSolid className="w-5 h-5 text-[#0D9488]" />,
              label: 'Arus Kas',
              bgClass: 'bg-[#CCFBF1] hover:bg-[#99F6E4] shadow-[0_2px_8px_rgba(13,148,136,0.22)]',
              onClick: () => goTo('finance'),
            },
            {
              icon: <ArrowTrendingUpSolid className="w-5 h-5 text-[#F43F5E]" />,
              label: 'Laporan',
              bgClass: 'bg-[#FFE4E6] hover:bg-[#FECDD3] shadow-[0_2px_8px_rgba(244,63,94,0.22)]',
              onClick: () => goTo('sales-report'),
            },
            {
              icon: <CloudArrowUpSolid className="w-5 h-5 text-[#3B82F6]" />,
              label: 'Cadangkan Data',
              bgClass: 'bg-[#EFF6FF] hover:bg-[#DBEAFE] shadow-[0_2px_8px_rgba(59,130,246,0.22)]',
              onClick: () => goTo('backup'),
            },
          ].map(action => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="flex flex-col items-center justify-start gap-2 hover:opacity-75 active:scale-95 transition-all cursor-pointer group relative"
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 relative ring-1 ring-white ${action.bgClass}`}>
                {action.icon}
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-[#25343F] text-center leading-tight max-w-[70px]">
                {action.label}
              </span>
            </button>
          ))}
        </div>

      </div>

      {/* ── PERLU DIKERJAKAN ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#BFC9D1]/25 shadow-md overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-[#BFC9D1]/40 flex items-center justify-between">
          <div>
            <h2 className="text-[11px] font-black text-[#25343F] uppercase tracking-wider">
              Perlu Dikerjakan
            </h2>
            <p className="text-[10px] text-[#898989] font-medium">
              {todoItems.length > 0
                ? `${todoItems.length} hal yang perlu diperhatikan`
                : 'Semua aman — tidak ada tindakan'}
            </p>
          </div>
          {todoItems.length > 0 && (
            <span className="min-w-[18px] h-4.5 px-1.5 rounded-full bg-[#25343F] text-white text-[9px] font-black flex items-center justify-center">
              {todoItems.length}
            </span>
          )}
        </div>

        {todoItems.length === 0 ? (
          <div className="flex items-center gap-2.5 px-3.5 py-3 text-[#25343F]">
            <CheckCircleIcon className="w-4 h-4 text-[#25343F] shrink-0" />
            <div className="text-[11px] font-medium">
              Semua aman ✓ Tidak ada pekerjaan tertunda.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {todoItems.map(item => (
              <button
                key={item.key}
                onClick={item.onClick}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-[#EAEFEF]/50 active:bg-[#EAEFEF] transition-colors cursor-pointer text-left group"
              >
                <div className={`w-7 h-7 rounded-lg ${item.bgSoft} border flex items-center justify-center shrink-0 relative`}>
                  <span className={`text-[11px] font-black ${item.textColor}`}>{item.count}</span>
                  <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${item.dotColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#25343F] leading-snug">{item.label}</div>
                  <div className="text-[10px] text-[#898989]">{item.desc}</div>
                </div>
                <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#898989] transition-colors shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── BAHAN BAKU ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#BFC9D1]/25 shadow-md overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-[#BFC9D1]/40 flex items-center justify-between">
          <div>
            <h2 className="text-[11px] font-black text-[#25343F] uppercase tracking-wider flex items-center gap-1.5">
              Bahan Baku
              {stats.lowStockItemsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#FF9B51]/15 text-[#c45e00] text-[9px] font-black">
                  {stats.lowStockItemsCount} menipis
                </span>
              )}
            </h2>
            <p className="text-[10px] text-[#898989] font-medium">
              {stats.lowStockItemsCount > 0 ? 'Ada bahan perlu diperhatikan' : 'Semua stok dalam kondisi aman'}
            </p>
          </div>
          <button
            onClick={() => goTo('inventory')}
            className="text-[10px] text-[#25343F]/50 hover:text-[#25343F] font-medium flex items-center gap-0.5 cursor-pointer"
          >
            Lihat <ChevronRightIcon className="w-3 h-3" />
          </button>
        </div>

        {stats.lowStockItems.length === 0 ? (
          <div className="flex items-center gap-2.5 px-3.5 py-3 text-[#25343F]">
            <CubeIcon className="w-4 h-4 text-[#FF9B51] shrink-0" />
            <span className="text-xs font-medium">Stok bahan baku aman ✓</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.lowStockItems.slice(0, 4).map(item => (
              <button
                key={item.id}
                onClick={() => goTo('inventory')}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#EAEFEF]/50 active:bg-[#EAEFEF] transition-colors cursor-pointer text-left group"
              >
                <ExclamationTriangleIcon className="w-3.5 h-3.5 text-[#FF9B51] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#25343F] truncate">{item.name}</div>
                  <div className="text-[10px] text-[#898989]">
                    Min: {item.minStock} {item.unit}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#FF9B51]/15 text-[#c45e00] text-[10px] font-black shrink-0">
                  Sisa {item.currentStock} {item.unit}
                </span>
              </button>
            ))}
            {stats.lowStockItems.length > 4 && (
              <button
                onClick={() => goTo('inventory')}
                className="w-full px-3 py-2 text-center text-[11px] font-bold text-[#FF9B51] hover:bg-[#FF9B51]/5 transition-colors cursor-pointer"
              >
                Lihat {stats.lowStockItems.length - 4} bahan lainnya →
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
