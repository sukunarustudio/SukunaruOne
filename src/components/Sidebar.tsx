import React from 'react';
import {
  Squares2X2Icon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  CubeIcon,
  CalculatorIcon,
  Square3Stack3DIcon,
  WalletIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ArchiveBoxIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  BookOpenIcon,
  ChatBubbleLeftEllipsisIcon,
  ChevronDoubleLeftIcon,
  XMarkIcon,
  LockClosedIcon,
  CloudArrowUpIcon,
  SwatchIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { ViewType, BusinessSettings } from '../types';
import { useLicense } from '../hooks/useLicense';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  settings: BusinessSettings;
  activeOrdersCount: number;
  lowStockCount: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  settings,
  activeOrdersCount,
  lowStockCount,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { isPro } = useLicense();
  const proViews: ViewType[] = ['orders', 'finance', 'sales-report', 'profit-report', 'stock-report'];
  const lastDashboardClickRef = React.useRef<number>(0);

  const handleNav = (v: ViewType) => {
    const now = Date.now();
    if (v === 'dashboard') {
      if (now - lastDashboardClickRef.current < 500) {
        // Double click shortcut on Beranda
        window.dispatchEvent(new CustomEvent('sukunaru:refresh_dashboard_manual'));
        lastDashboardClickRef.current = 0;
      } else if (currentView === 'dashboard') {
        const scrollEl = document.getElementById('main-content-scrollable');
        if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
      }
      lastDashboardClickRef.current = now;
    }
    if (typeof onNavigate === 'function') {
      onNavigate(v);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navSections = [
    {
      title: 'UTAMA',
      items: [
        { id: 'dashboard' as ViewType, label: 'Beranda', icon: Squares2X2Icon },
      ],
    },
    {
      title: 'TRANSAKSI & PENJUALAN',
      items: [
        { id: 'pos' as ViewType, label: 'Kasir POS', icon: BuildingStorefrontIcon },
        {
          id: 'orders' as ViewType,
          label: 'Pesanan',
          icon: ClipboardDocumentListIcon,
          badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
          badgeColor: 'bg-[#FF9B51]/15 text-[#FF6A00] dark:text-[#FF9B51]',
        },
        { id: 'customers' as ViewType, label: 'Pelanggan', icon: UsersIcon },
      ],
    },
    {
      title: 'PRODUK & INVENTARIS',
      items: [
        { id: 'products' as ViewType, label: 'Produk & Jasa', icon: CubeIcon },
        { id: 'hpp' as ViewType, label: 'Kalkulator HPP', icon: CalculatorIcon },
        {
          id: 'inventory' as ViewType,
          label: 'Stok Barang',
          icon: Square3Stack3DIcon,
          badge: lowStockCount > 0 ? lowStockCount : undefined,
          badgeColor: 'bg-[#FF4267]/15 text-[#FF4267]',
        },
      ],
    },
    {
      title: 'KEUANGAN & LAPORAN',
      items: [
        { id: 'finance' as ViewType, label: 'Arus Kas', icon: WalletIcon },
        { id: 'invoices' as ViewType, label: 'Riwayat Transaksi', icon: DocumentTextIcon },
        { id: 'sales-report' as ViewType, label: 'Laporan Penjualan', icon: ArrowTrendingUpIcon },
        { id: 'profit-report' as ViewType, label: 'Laporan Profit', icon: ChartBarIcon },
        { id: 'stock-report' as ViewType, label: 'Laporan Stok', icon: ArchiveBoxIcon },
      ],
    },
    {
      title: 'SISTEM',
      items: [
        { id: 'settings' as ViewType, label: 'Pengaturan', icon: Cog6ToothIcon },
        { id: 'activation' as ViewType, label: 'Aktivasi Lisensi', icon: ShieldCheckIcon },
        { id: 'appearance' as ViewType, label: 'Tampilan & Tema', icon: SwatchIcon },
        { id: 'backup' as ViewType, label: 'Cadangan & Cloud', icon: CloudArrowUpIcon },
        { id: 'app-info' as ViewType, label: 'Versi Aplikasi', icon: InformationCircleIcon },
      ],
    },
    {
      title: 'BANTUAN',
      items: [
        { id: 'guide' as ViewType, label: 'Panduan Penggunaan', icon: BookOpenIcon },
        { id: 'contact' as ViewType, label: 'Hubungi Kami', icon: ChatBubbleLeftEllipsisIcon },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#F8FAFC]/95 dark:bg-[#0F172A]/95 backdrop-blur-xl text-zinc-700 select-none border-r border-black/[0.06] dark:border-white/[0.08]">
      {/* Brand Header */}
      <div className="p-4 border-b border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.businessName || 'Logo'}
              className="w-8.5 h-8.5 rounded-xl object-cover shadow-xs border border-black/[0.06] dark:border-white/[0.1] shrink-0 bg-white"
            />
          ) : (
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-[#FF6A00] to-[#FF9B51] text-white font-extrabold flex items-center justify-center text-xs tracking-wider shrink-0 shadow-xs uppercase">
              {settings.businessName ? settings.businessName.slice(0, 2) : 'SS'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-sm text-[#25343F] dark:text-white tracking-tight truncate leading-tight">
              {settings.businessName || 'Sukunaru Studio'}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-[#898989] font-bold tracking-wider uppercase">
                STUDIO OS
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Collapse Button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Sembunyikan Menu (Full Screen Workspace)"
            className="hidden lg:flex p-1.5 rounded-xl text-[#898989] hover:text-[#25343F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronDoubleLeftIcon className="w-4 h-4" />
          </button>
        )}

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            title="Tutup Menu"
            className="lg:hidden p-1.5 rounded-xl text-[#898989] hover:text-[#25343F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-none">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-2.5 text-[9.5px] font-black text-[#898989]/80 dark:text-slate-400 tracking-wider uppercase">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                const isLocked = !isPro && proViews.includes(item.id);
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer group active:scale-[0.98] ${
                      isActive
                        ? 'bg-[#FF9B51]/15 text-[#FF6A00] dark:text-[#FF9B51] font-extrabold shadow-2xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-[#25343F] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05] font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                          isActive ? 'text-[#FF6A00] dark:text-[#FF9B51] scale-105 stroke-[2.2]' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-200'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isLocked && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-[#FF9B51]/15 text-[#FF6A00] dark:text-[#FF9B51]" title="Fitur Pro">
                          <LockClosedIcon className="w-2.5 h-2.5" />
                          PRO
                        </span>
                      )}
                      {item.badge !== undefined && !isLocked && (
                        <span
                          className={`px-1.5 py-0.2 text-[9.5px] font-black rounded-full ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-[#898989] shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/40" />
          <span className="text-[#898989] font-bold text-[10.5px]">Sistem Aktif</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-[#898989] bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 rounded-full">v2.0</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Tablet & Desktop Persistent Sidebar (md/lg screens) */}
      <aside
        id="main-sidebar"
        className={`hidden md:flex w-56 lg:w-60 shrink-0 h-screen sticky top-0 z-20 transition-all duration-200 ${
          isCollapsed ? 'md:hidden' : 'md:flex'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
