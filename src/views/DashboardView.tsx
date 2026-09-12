import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CubeIcon,
  PlusIcon,
  UsersIcon,
  ShoppingBagIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  WalletIcon,
  ArrowUpRightIcon,
  ClipboardDocumentListIcon,
  PrinterIcon,
  MagnifyingGlassIcon,
  BuildingStorefrontIcon,
  ShoppingCartIcon,
  CalculatorIcon,
  Square3Stack3DIcon,
  ReceiptPercentIcon,
  ChartBarIcon,
  ArchiveBoxIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  ArrowDownRightIcon,
  LockClosedIcon,
  SparklesIcon,
  XMarkIcon,
  QrCodeIcon,
  CloudArrowUpIcon,
  ArrowRightIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { useLicense } from '../hooks/useLicense';
import {
  BuildingStorefrontIcon as BuildingStorefrontSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListSolid,
  UsersIcon as UsersSolid,
  CubeIcon as CubeSolid,
  CalculatorIcon as CalculatorSolid,
  Square3Stack3DIcon as Square3StackSolid,
  WalletIcon as WalletSolid,
  ArrowTrendingUpIcon as ArrowTrendingUpSolid,
  CloudArrowUpIcon as CloudArrowUpSolid,
  SparklesIcon as SparklesSolid,
} from '@heroicons/react/24/solid';
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
  getStatusBadgeClass,
} from '../lib/utils';
import { useToast } from '../components/Toast';
import { PullToRefresh } from '../components/PullToRefresh';

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
  const [materials, setMaterials] = useState<any[]>([]);

  const { isPro, isTrial, daysRemaining } = useLicense();

  const [isProfileBannerDismissed, setIsProfileBannerDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('bisnisurang_dismiss_profile_prompt') === 'true';
    } catch {
      return false;
    }
  });

  const [isProductBannerDismissed, setIsProductBannerDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('bisnisurang_dismiss_product_prompt') === 'true';
    } catch {
      return false;
    }
  });

  const [productCount, setProductCount] = useState<number>(1);

  const isProfileIncomplete = useMemo(() => {
    const name = settings?.businessName?.trim() || '';
    const isDefaultName = !name || name.toLowerCase() === 'nama bisnis anda' || name.toLowerCase() === 'sukunaru studio';
    const hasContact = Boolean(settings?.phone?.trim() || settings?.whatsapp?.trim());
    const hasAddress = Boolean(settings?.address?.trim());
    const hasLogo = Boolean(settings?.logoUrl?.trim());
    return isDefaultName || !hasContact || !hasAddress || !hasLogo;
  }, [settings]);

  // Contextual greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }, []);

  const loadData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      let isSynced = false;
      if (showRefreshing && isSupabaseConfigured()) {
        try {
          const syncRes = await syncWithSupabase();
          if (syncRes.success) {
            isSynced = true;
          }
        } catch (syncErr) {
          console.warn('Sync failed during refresh:', syncErr);
        }
      }

      const [
        statsData,
        ordersData,
        materialsData,
        finTransData,
        productsData,
      ] = await Promise.all([
        api.getStats(),
        api.getOrders(),
        api.getMaterials(),
        api.getFinancialTransactions(),
        api.getProducts(),
      ]);

      setStats(statsData);
      setAllOrders(ordersData);
      setMaterials(materialsData);
      setFinTransactions(finTransData);
      setProductCount(productsData?.length ?? 1);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    if (isSupabaseConfigured()) {
      syncWithSupabase()
        .then((res) => {
          if (res.success) {
            loadData(false);
          }
        })
        .catch(() => {});
    }

    const handleFocus = () => loadData(false);
    const handleLiveAutoRefresh = () => loadData(false);
    const handleManualShortcutRefresh = () => {
      const scrollEl = document.getElementById('main-content-scrollable');
      if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      loadData(true);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('sukunaru:sync_completed', handleLiveAutoRefresh);
    window.addEventListener('sukunaru:data_mutation', handleLiveAutoRefresh);
    window.addEventListener('sukunaru:refresh_dashboard_manual', handleManualShortcutRefresh);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('sukunaru:sync_completed', handleLiveAutoRefresh);
      window.removeEventListener('sukunaru:data_mutation', handleLiveAutoRefresh);
      window.removeEventListener('sukunaru:refresh_dashboard_manual', handleManualShortcutRefresh);
    };
  }, []);

  // ─── Total Net Cash Balance (Saldo Kas Bisnis Kumulatif) ───────────────────
  const liveTotalCashBalance = useMemo(() => {
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
  const { kpiRevenue, kpiExpense, kpiProfit } = useMemo(() => {
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

    return { kpiRevenue: income, kpiExpense: expense, kpiProfit: profit };
  }, [finTransactions, period, stats]);

  // ─── Order pipeline counts ───────────────────────────────────────
  const activeOrders = allOrders.filter(o => o.status !== 'SELESAI' && o.status !== 'BATAL');
  const newOrders = allOrders.filter(o => o.status === 'BARU');
  const inProgressOrders = allOrders.filter(o => o.status === 'DIPROSES');
  const readyOrders = allOrders.filter(o => o.status === 'SIAP DIAMBIL');
  const unpaidOrders = allOrders.filter(o => o.remainingAmount > 0 && o.status !== 'BATAL');

  // ─── Todo Items (Perlu Dikerjakan) ──────────────────────────────
  const todoItems = [
    newOrders.length > 0 && {
      key: 'baru',
      count: newOrders.length,
      label: 'Pesanan Masuk',
      desc: 'Perlu konfirmasi & proses',
      dotColor: 'bg-[#FF6A00]',
      badgeBg: 'bg-[#FF9B51]/15 text-[#FF6A00] dark:text-[#FF9B51]',
      onClick: () => goTo('orders', 'filter:BARU:table'),
    },
    inProgressOrders.length > 0 && {
      key: 'diproses',
      count: inProgressOrders.length,
      label: 'Sedang Diproses',
      desc: 'Tahap produksi & pengerjaan',
      dotColor: 'bg-[#0890FE]',
      badgeBg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
      onClick: () => goTo('orders', 'filter:DIPROSES:table'),
    },
    readyOrders.length > 0 && {
      key: 'siap',
      count: readyOrders.length,
      label: 'Siap Diambil / Kirim',
      desc: 'Produksi selesai, siap serah terima',
      dotColor: 'bg-[#10B981]',
      badgeBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      onClick: () => goTo('orders', 'filter:SIAP DIAMBIL:table'),
    },
    unpaidOrders.length > 0 && {
      key: 'unpaid',
      count: unpaidOrders.length,
      label: 'Tagihan Belum Lunas',
      desc: 'Piutang menunggu pelunasan',
      dotColor: 'bg-[#F59E0B]',
      badgeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      onClick: () => goTo('orders', 'filter:SEMUA:table'),
    },
    stats.lowStockItemsCount > 0 && {
      key: 'lowstock',
      count: stats.lowStockItemsCount,
      label: 'Stok Menipis',
      desc: 'Bahan/barang di bawah batas aman',
      dotColor: 'bg-[#FF4267]',
      badgeBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
      onClick: () => goTo('inventory'),
    },
  ].filter(Boolean) as {
    key: string;
    count: number;
    label: string;
    desc: string;
    dotColor: string;
    badgeBg: string;
    onClick: () => void;
  }[];

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
          <div className="w-9 h-9 border-2.5 border-[#BFC9D1]/40 border-t-[#FF6A00] rounded-full animate-spin" />
          <span className="text-xs font-bold tracking-tight">Memuat dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── FLOATING PROFILE PROMPT ── */}
      {!isProfileBannerDismissed && isProfileIncomplete && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-40 max-w-[92vw] sm:max-w-md apple-glass-toast p-2 sm:p-2.5 rounded-full flex items-center justify-between gap-3 transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto"
          style={{ bottom: 'calc(78px + env(safe-area-inset-bottom, 8px))' }}
        >
          <div className="flex items-center gap-2.5 min-w-0 pl-1">
            <div className="w-7 h-7 rounded-full bg-[#FF9B51]/20 text-[#FF6A00] flex items-center justify-center shrink-0">
              <BuildingStorefrontIcon className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#25343F] dark:text-white truncate">
                Lengkapi profil bisnis
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 pr-0.5">
            <button
              type="button"
              onClick={() => goTo('business-profile')}
              className="px-3 py-1.5 bg-[#FF6A00] hover:bg-[#e65c00] active:scale-95 text-white text-xs font-bold rounded-full shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              Lengkapi →
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.setItem('bisnisurang_dismiss_profile_prompt', 'true');
                } catch {}
                setIsProfileBannerDismissed(true);
              }}
              className="p-1 text-[#898989] hover:text-[#25343F] dark:hover:text-white transition-colors cursor-pointer rounded-full hover:bg-black/5"
              title="Tutup"
              aria-label="Tutup"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── FLOATING PRODUCT PROMPT ── */}
      {!isProductBannerDismissed && productCount === 0 && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-40 max-w-[92vw] sm:max-w-md apple-glass-toast p-2 sm:p-2.5 rounded-full flex items-center justify-between gap-3 transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto"
          style={{
            bottom: (!isProfileBannerDismissed && isProfileIncomplete)
              ? 'calc(78px + env(safe-area-inset-bottom, 8px) + 52px)'
              : 'calc(78px + env(safe-area-inset-bottom, 8px))',
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0 pl-1">
            <div className="w-7 h-7 rounded-full bg-[#25343F]/10 text-[#25343F] dark:text-white flex items-center justify-center shrink-0">
              <CubeIcon className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#25343F] dark:text-white truncate">
                Tambahkan produk pertama
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 pr-0.5">
            <button
              type="button"
              onClick={() => goTo('products')}
              className="px-3 py-1.5 bg-[#25343F] hover:bg-[#1a2630] active:scale-95 text-white text-xs font-bold rounded-full shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              Tambah →
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.setItem('bisnisurang_dismiss_product_prompt', 'true');
                } catch {}
                setIsProductBannerDismissed(true);
              }}
              className="p-1 text-[#898989] hover:text-[#25343F] dark:hover:text-white transition-colors cursor-pointer rounded-full hover:bg-black/5"
              title="Tutup"
              aria-label="Tutup"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <PullToRefresh onRefresh={() => loadData(true)} isRefreshing={refreshing}>
        <div id="dashboard-view" className="space-y-4 max-w-2xl lg:max-w-7xl mx-auto pb-12 px-0.5">

          {isPro && isTrial && daysRemaining !== null && daysRemaining <= 5 && (
            <div className="bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 px-4 py-2.5 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-2xs">
              <span className="font-semibold">
                ⏳ Masa Trial Anda tersisa <strong>{daysRemaining} hari</strong> lagi.
              </span>
              <button
                type="button"
                onClick={() => goTo('activation')}
                className="font-extrabold text-[#FF6A00] dark:text-amber-300 hover:underline cursor-pointer shrink-0"
              >
                Upgrade Pro →
              </button>
            </div>
          )}

          {/* ── TOP HEADER (BisnisUrang Brand & Clean Date Layout) ── */}
          <div className="flex items-center justify-between gap-3 pt-1 pb-1">
            <div className="min-w-0">
              <h1
                id="dashboard-header-title"
                className="dashboard-title-text text-2xl sm:text-3xl font-black tracking-tight leading-tight truncate text-[#25343F] dark:text-white"
              >
                BisnisUrang
              </h1>
              <p className="text-xs sm:text-[13px] font-medium text-[#898989] dark:text-slate-400 tracking-tight mt-0.5 truncate">
                {dateLabel}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Quick Search trigger (Mobile) */}
              <button
                type="button"
                onClick={onOpenSearch}
                className="flex md:hidden items-center gap-2 px-3 py-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-black/[0.06] dark:border-white/[0.08] text-xs text-[#898989] hover:text-[#25343F] shadow-xs transition-all cursor-pointer active:scale-95"
                title="Cari transaksi, produk, pelanggan..."
              >
                <MagnifyingGlassIcon className="w-4 h-4 text-zinc-500" />
                <span className="font-semibold text-[11px]">Cari</span>
              </button>
            </div>
          </div>

          {/* ── SALDO KAS UTAMA (Apple Wallet / FinTech Card) ── */}
          <div className="premium-fintech-card p-4.5 sm:p-6 text-white flex flex-col select-none relative overflow-hidden rounded-3xl">
            {/* Dot Grid Layer */}
            <div className="fintech-dot-grid" />

            {/* Wave Mesh Decoration */}
            <div className="absolute right-0 bottom-0 w-64 h-36 opacity-15 pointer-events-none z-10 mix-blend-overlay">
              <svg className="w-full h-full" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 80 C 50 50, 100 110, 200 60" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M10 85 C 60 55, 110 115, 200 65" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M20 90 C 70 60, 120 120, 200 70" stroke="white" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </div>

            {/* Light sweep effect */}
            <div className="fintech-light-sweep" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
              {/* Card Header: Brand + Period Switcher */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt={settings.businessName || 'Logo'}
                      className="w-8 h-8 rounded-xl object-cover bg-white shadow-md border border-white/30 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-white/90 text-[#FF6A00] flex items-center justify-center font-black text-xs shadow-md shrink-0 uppercase">
                      {settings.businessName ? settings.businessName.slice(0, 2) : 'SK'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="font-extrabold text-sm tracking-tight truncate block text-white">
                      {settings.businessName || 'Sukunaru Studio'}
                    </span>
                    <span className="text-[10px] text-white/75 font-semibold uppercase tracking-wider block">
                      Kas Bisnis
                    </span>
                  </div>
                </div>
                
                {/* Period Switcher Pill */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPeriodDropdownOpen(!isPeriodDropdownOpen);
                    }}
                    className="bg-white/20 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white rounded-full px-3 py-1 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <span>{period === 'today' ? 'Hari Ini' : period === 'week' ? '7 Hari' : 'Bulan Ini'}</span>
                    <ChevronRightIcon className="w-3 h-3 rotate-90 stroke-[2.5]" />
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
                      <div className="absolute right-0 top-full mt-2 w-32 bg-[#1E293B]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-1.5 z-40 text-xs font-bold text-white flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPeriod('today');
                            setIsPeriodDropdownOpen(false);
                          }}
                          className={`px-3 py-2 rounded-xl text-left transition-colors hover:bg-white/10 ${period === 'today' ? 'bg-[#FF6A00] text-white font-extrabold' : 'text-white/80'}`}
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
                          className={`px-3 py-2 rounded-xl text-left transition-colors hover:bg-white/10 ${period === 'week' ? 'bg-[#FF6A00] text-white font-extrabold' : 'text-white/80'}`}
                        >
                          7 Hari Terakhir
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPeriod('month');
                            setIsPeriodDropdownOpen(false);
                          }}
                          className={`px-3 py-2 rounded-xl text-left transition-colors hover:bg-white/10 ${period === 'month' ? 'bg-[#FF6A00] text-white font-extrabold' : 'text-white/80'}`}
                        >
                          Bulan Ini
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Main Balance */}
              <div className="py-1">
                <div className="text-[10.5px] font-bold text-white/80 uppercase tracking-wider">
                  Saldo Kas
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight mt-1 tabular-nums leading-none">
                  {formatRupiah(liveTotalCashBalance)}
                </div>
              </div>

              {/* Frosted KPI Subgrid */}
              <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3 grid grid-cols-3 divide-x divide-white/20 shadow-xs">
                <div className="px-2">
                  <div className="text-[10px] font-bold text-white/85 uppercase tracking-wider truncate">
                    Omzet
                  </div>
                  <div className="text-xs sm:text-sm font-black text-white font-mono mt-0.5 tabular-nums truncate">
                    {formatRupiah(kpiRevenue)}
                  </div>
                </div>
                <div className="px-2 pl-3">
                  <div className="text-[10px] font-bold text-white/85 uppercase tracking-wider truncate">
                    Profit
                  </div>
                  <div className="text-xs sm:text-sm font-black text-emerald-100 font-mono mt-0.5 tabular-nums truncate">
                    {formatRupiah(kpiProfit)}
                  </div>
                </div>
                <div className="px-2 pl-3">
                  <div className="text-[10px] font-bold text-white/85 uppercase tracking-wider truncate">
                    Pengeluaran
                  </div>
                  <div className="text-xs sm:text-sm font-black text-rose-100 font-mono mt-0.5 tabular-nums truncate">
                    {formatRupiah(kpiExpense)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── PUSAT AKSI CEPAT / SHORTCUT MENU (Apple Control Center & Bento Style) ── */}
          <div className="space-y-2.5">

            {/* Bento Grid: 4 Primary Hero Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {/* 1. Kasir POS */}
              <button
                type="button"
                onClick={() => goTo('pos')}
                className="apple-card p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent hover:from-emerald-500/15 hover:via-emerald-500/10 border border-emerald-500/25 dark:border-emerald-500/30 text-left cursor-pointer flex flex-col justify-between group shadow-2xs min-h-[92px]"
              >
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                  <BuildingStorefrontSolid className="w-5 h-5" />
                </div>
                <div className="mt-2.5">
                  <h3 className="text-sm font-extrabold text-[#25343F] dark:text-white tracking-tight">
                    Kasir POS
                  </h3>
                </div>
              </button>

              {/* 2. Pesanan */}
              <button
                type="button"
                onClick={() => goTo('orders', 'filter:SEMUA:table')}
                className="apple-card p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#FF6A00]/10 via-[#FF6A00]/5 to-transparent hover:from-[#FF6A00]/15 hover:via-[#FF6A00]/10 border border-[#FF6A00]/25 dark:border-[#FF6A00]/30 text-left cursor-pointer flex flex-col justify-between group shadow-2xs min-h-[92px]"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-[#FF6A00] text-white flex items-center justify-center shadow-md shadow-[#FF6A00]/25 group-hover:scale-105 transition-transform">
                    <ClipboardDocumentListSolid className="w-5 h-5" />
                  </div>
                  {activeOrders.length > 0 && (
                    <span className="text-[10px] font-extrabold text-[#FF6A00] dark:text-[#FF9B51] bg-[#FF9B51]/20 px-2 py-0.5 rounded-full animate-pulse">
                      {activeOrders.length} Aktif
                    </span>
                  )}
                </div>
                <div className="mt-2.5">
                  <h3 className="text-sm font-extrabold text-[#25343F] dark:text-white tracking-tight">
                    Pesanan & SPK
                  </h3>
                </div>
              </button>

              {/* 3. Stok Barang */}
              <button
                type="button"
                onClick={() => goTo('inventory')}
                className="apple-card p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent hover:from-indigo-500/15 hover:via-indigo-500/10 border border-indigo-500/25 dark:border-indigo-500/30 text-left cursor-pointer flex flex-col justify-between group shadow-2xs min-h-[92px]"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                    <Square3StackSolid className="w-5 h-5" />
                  </div>
                  {stats.lowStockItemsCount > 0 && (
                    <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full">
                      {stats.lowStockItemsCount} Menipis
                    </span>
                  )}
                </div>
                <div className="mt-2.5">
                  <h3 className="text-sm font-extrabold text-[#25343F] dark:text-white tracking-tight">
                    Stok Barang
                  </h3>
                </div>
              </button>

              {/* 4. Arus Kas & Biaya */}
              <button
                type="button"
                onClick={() => goTo('finance')}
                className="apple-card p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent hover:from-teal-500/15 hover:via-teal-500/10 border border-teal-500/25 dark:border-teal-500/30 text-left cursor-pointer flex flex-col justify-between group shadow-2xs min-h-[92px]"
              >
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/25 group-hover:scale-105 transition-transform">
                  <WalletSolid className="w-5 h-5" />
                </div>
                <div className="mt-2.5">
                  <h3 className="text-sm font-extrabold text-[#25343F] dark:text-white tracking-tight">
                    Buku Kas
                  </h3>
                </div>
              </button>
            </div>

            {/* Secondary Tools Grid (Apple Control Center 5-tile pill buttons) */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 pt-1">
              {[
                {
                  label: 'Hitung HPP',
                  icon: <CalculatorSolid className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-500" />,
                  bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20',
                  onClick: () => goTo('hpp'),
                },
                {
                  label: 'Pelanggan',
                  icon: <UsersSolid className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-purple-500" />,
                  bg: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20',
                  onClick: () => goTo('customers'),
                },
                {
                  label: 'Katalog',
                  icon: <CubeSolid className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-sky-500" />,
                  bg: 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/20',
                  onClick: () => goTo('products'),
                },
                {
                  label: 'Laporan',
                  icon: <ArrowTrendingUpSolid className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-rose-500" />,
                  bg: 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20',
                  onClick: () => goTo('sales-report'),
                },
                {
                  label: 'Cloud Sync',
                  icon: <CloudArrowUpSolid className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-500" />,
                  bg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20',
                  onClick: () => goTo('backup'),
                },
              ].map(tool => (
                <button
                  key={tool.label}
                  type="button"
                  onClick={tool.onClick}
                  className={`apple-press px-1 py-2 sm:p-2.5 rounded-2xl border ${tool.bg} flex flex-col items-center justify-center gap-1 sm:gap-1.5 text-center cursor-pointer transition-all shadow-2xs`}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white dark:bg-slate-800 shadow-2xs flex items-center justify-center shrink-0">
                    {tool.icon}
                  </div>
                  <span className="text-[9px] sm:text-[10.5px] font-bold text-[#25343F] dark:text-white leading-tight tracking-tight text-center w-full line-clamp-1">
                    {tool.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── PERLU TINDAKAN (Apple Reminders Style) ── */}
          <div className="bg-white dark:bg-[#151D28] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-extrabold text-[#25343F] dark:text-white uppercase tracking-wider">
                    Perlu Tindakan
                  </h3>
                  <p className="text-[10.5px] text-[#898989] font-medium">
                    {todoItems.length > 0 ? `${todoItems.length} antrean tugas menunggu` : 'Semua beres & teratur'}
                  </p>
                </div>
                {todoItems.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#FF6A00] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                    {todoItems.length}
                  </span>
                )}
              </div>

              {todoItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-zinc-400">
                  <CheckCircleIcon className="w-10 h-10 text-emerald-500/80 mb-2" />
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                    Semua antrean pesanan & stok beres!
                  </span>
                  <span className="text-[10.5px] text-zinc-400 mt-0.5">
                    Tidak ada pekerjaan yang tertunda saat ini.
                  </span>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                  {todoItems.map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={item.onClick}
                      className="w-full flex items-center justify-between py-2.5 px-1 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] active:scale-[0.98] transition-all cursor-pointer text-left group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${item.dotColor}`} />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#25343F] dark:text-white truncate">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-[#898989] truncate">
                            {item.desc}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        <span className={`px-2 py-0.5 text-[10.5px] font-black rounded-full ${item.badgeBg}`}>
                          {item.count}
                        </span>
                        <ChevronRightIcon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#FF6A00] transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => goTo('orders')}
              className="w-full mt-3 py-2 px-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-[#25343F] dark:text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
            >
              Lihat Semua Antrean Pesanan →
            </button>
          </div>

          {/* ── STOK MENIPIS QUICK GLANCE (Jika ada) ── */}
          {stats.lowStockItems.length > 0 && (
            <div className="bg-white dark:bg-[#151D28] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-[#25343F] dark:text-white uppercase tracking-wider">
                      Stok Perlu Diisi Ulang ({stats.lowStockItemsCount} Barang)
                    </h3>
                    <p className="text-[10.5px] text-[#898989] font-medium">
                      Barang di bawah batas minimum persediaan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => goTo('inventory')}
                  className="text-xs font-extrabold text-[#FF6A00] dark:text-[#FF9B51] hover:underline cursor-pointer flex items-center gap-1"
                >
                  Buka Stok <ChevronRightIcon className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {stats.lowStockItems.slice(0, 4).map(item => (
                  <div
                    key={item.id}
                    onClick={() => goTo('inventory')}
                    className="p-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-all cursor-pointer flex items-center justify-between gap-2 active:scale-95"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#25343F] dark:text-white truncate">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-[#898989]">
                        Batas aman: {item.minStock} {item.unit}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-xl bg-rose-500 text-white font-black text-[10.5px] tabular-nums shrink-0 shadow-2xs">
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </PullToRefresh>
    </>
  );
};

export default DashboardView;
