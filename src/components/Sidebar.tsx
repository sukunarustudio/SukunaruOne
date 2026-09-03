import React from 'react';
import { Squares2X2Icon, BuildingStorefrontIcon, ClipboardDocumentListIcon, UsersIcon, CubeIcon, CalculatorIcon, Square3Stack3DIcon, WalletIcon, ReceiptPercentIcon, DocumentTextIcon, ArrowTrendingUpIcon, ChartBarIcon, ArchiveBoxIcon, Cog6ToothIcon, InformationCircleIcon, BookOpenIcon, ChatBubbleLeftEllipsisIcon, HeartIcon, ChevronDoubleLeftIcon, XMarkIcon, CircleStackIcon, LockClosedIcon, CloudArrowUpIcon, SwatchIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
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
  const proViews: ViewType[] = ['orders', 'hpp', 'finance', 'sales-report', 'profit-report', 'stock-report'];

  const handleNav = (v: ViewType) => {
    if (typeof onNavigate === 'function') {
      onNavigate(v);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navSections = [
    {
      title: 'BERANDA',
      items: [
        { id: 'dashboard' as ViewType, label: 'Beranda', icon: Squares2X2Icon },
      ],
    },
    {
      title: 'TRANSAKSI',
      items: [
        { id: 'pos' as ViewType, label: 'Kasir POS', icon: BuildingStorefrontIcon },
        {
          id: 'orders' as ViewType,
          label: 'Pesanan',
          icon: ClipboardDocumentListIcon,
          badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
          badgeColor: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25',
        },
        { id: 'customers' as ViewType, label: 'Pelanggan', icon: UsersIcon },
      ],
    },
    {
      title: 'PRODUKSI',
      items: [
        { id: 'products' as ViewType, label: 'Produk & Jasa', icon: CubeIcon },
        { id: 'hpp' as ViewType, label: 'Kalkulator HPP', icon: CalculatorIcon },
        {
          id: 'inventory' as ViewType,
          label: 'Bahan Baku',
          icon: Square3Stack3DIcon,
          badge: lowStockCount > 0 ? lowStockCount : undefined,
          badgeColor: 'bg-[#FF9B51]/15 text-[#c45e00] border border-[#FF9B51]/40',
        },
      ],
    },
    {
      title: 'KEUANGAN',
      items: [
        { id: 'finance' as ViewType, label: 'Arus Kas', icon: WalletIcon },
        { id: 'invoices' as ViewType, label: 'Riwayat Transaksi', icon: DocumentTextIcon },
      ],
    },
    {
      title: 'LAPORAN',
      items: [
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
        { id: 'backup' as ViewType, label: 'Cadangan Data & Sinkronisasi Cloud', icon: CloudArrowUpIcon },
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
    <div className="flex flex-col h-full bg-white text-zinc-700 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-100 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.businessName || 'Logo'}
              className="w-8 h-8 rounded-lg object-cover shadow-sm border border-[#BFC9D1]/25 shrink-0 bg-white"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#FF9B51] text-[#25343F] font-extrabold flex items-center justify-center text-xs tracking-wider shrink-0 shadow-sm uppercase">
              {settings.businessName ? settings.businessName.slice(0, 2) : 'SS'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm text-[#25343F] tracking-tight truncate leading-tight">
              {settings.businessName || 'Sukunaru Studio'}
            </h2>
            <p className="text-[10px] text-[#898989] font-semibold tracking-wider uppercase mt-0.5">
              STUDIO OS
            </p>
          </div>
        </div>

        {/* Desktop Collapse Button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Sembunyikan Menu (Full Screen Workspace)"
            className="hidden lg:flex p-1.5 rounded-lg text-[#898989] hover:text-[#25343F] hover:bg-[#EAEFEF] transition-colors cursor-pointer"
          >
            <ChevronDoubleLeftIcon className="w-4 h-4 " />
          </button>
        )}

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            title="Tutup Menu"
            className="lg:hidden p-1.5 rounded-lg text-[#898989] hover:text-[#25343F] hover:bg-[#EAEFEF] transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5 " />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3.5 scrollbar-none">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-2 text-[10px] font-bold text-[#898989] tracking-wider uppercase">
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
                    className={`w-full flex items-center justify-between px-2.5 py-2 lg:py-1.5 rounded-lg text-xs transition-colors cursor-pointer group ${
                      isActive
                        ? 'bg-[#FF9B51]/15 text-[#25343F] font-bold border border-[#FF9B51]/30'
                        : 'text-[#898989] hover:text-[#25343F] hover:bg-[#EAEFEF] font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 lg:w-3.5 lg:h-3.5 shrink-0 transition-colors ${
                          isActive ? 'text-[#FF9B51] stroke-2' : 'text-[#898989] group-hover:text-[#25343F] '
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isLocked && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FF9B51]/15 text-[#FF9B51] border border-[#FF9B51]/30" title="Fitur Pro">
                          <LockClosedIcon className="w-2.5 h-2.5" />
                          PRO
                        </span>
                      )}
                      {item.badge !== undefined && !isLocked && (
                        <span
                          className={`px-1.5 py-0.2 text-[10px] font-bold rounded-md ${item.badgeColor}`}
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
      <div className="p-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-[#898989] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#25343F] animate-pulse" />
          <span className="text-[#898989] font-medium text-[11px]">System Ready</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-[#898989] bg-[#EAEFEF] px-1.5 py-0.5 rounded">v1.1</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Tablet & Desktop Persistent Sidebar (md/lg screens) */}
      <aside
        id="main-sidebar"
        className={`hidden md:flex w-56 lg:w-60 shrink-0 border-r border-[#BFC9D1]/40 h-screen sticky top-0 z-20 transition-all duration-200 ${
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
