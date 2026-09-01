import React from 'react';
import { BuildingStorefrontIcon, ShoppingCartIcon, UsersIcon, CubeIcon, CalculatorIcon, Square3Stack3DIcon, WalletIcon, ReceiptPercentIcon, DocumentTextIcon, ArrowTrendingUpIcon, ChartBarIcon, ArchiveBoxIcon, Cog6ToothIcon, InformationCircleIcon, ChevronRightIcon, SparklesIcon, CircleStackIcon, SwatchIcon } from '@heroicons/react/24/outline';
import { ViewType, BusinessSettings } from '../types';

interface MenuViewProps {
  onNavigate: (view: ViewType) => void;
  settings: BusinessSettings;
  activeOrdersCount: number;
  lowStockCount: number;
}

export const MenuView: React.FC<MenuViewProps> = ({
  onNavigate,
  settings,
  activeOrdersCount,
  lowStockCount,
}) => {
  const menuSections = [
    {
      title: 'TRANSAKSI',
      items: [
        {
          id: 'pos' as ViewType,
          label: 'Kasir POS',
          icon: BuildingStorefrontIcon,
          iconBg: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25',
        },
        {
          id: 'orders' as ViewType,
          label: 'Pesanan',
          icon: ShoppingCartIcon,
          iconBg: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25',
          badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
          badgeColor: 'bg-[#25343F] text-white',
        },
        {
          id: 'customers' as ViewType,
          label: 'Pelanggan',
          icon: UsersIcon,
          iconBg: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25',
        },
      ],
    },
    {
      title: 'PRODUKSI',
      items: [
        {
          id: 'products' as ViewType,
          label: 'Produk & Jasa',
          icon: CubeIcon,
          iconBg: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25',
        },
        {
          id: 'hpp' as ViewType,
          label: 'Kalkulator HPP',
          icon: CalculatorIcon,
          iconBg: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25',
        },
        {
          id: 'inventory' as ViewType,
          label: 'Bahan Baku',
          icon: Square3Stack3DIcon,
          iconBg: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25',
          badge: lowStockCount > 0 ? lowStockCount : undefined,
          badgeColor: 'bg-[#FF9B51] text-white',
        },
      ],
    },
    {
      title: 'KEUANGAN',
      items: [
        {
          id: 'finance' as ViewType,
          label: 'Arus Kas',
          icon: WalletIcon,
          iconBg: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25',
        },
        {
          id: 'invoices' as ViewType,
          label: 'Riwayat Transaksi',
          icon: DocumentTextIcon,
          iconBg: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25',
        },
      ],
    },
    {
      title: 'LAPORAN',
      items: [
        {
          id: 'sales-report' as ViewType,
          label: 'Laporan Penjualan',
          icon: ArrowTrendingUpIcon,
          iconBg: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25',
        },
        {
          id: 'profit-report' as ViewType,
          label: 'Laporan Profit',
          icon: ChartBarIcon,
          iconBg: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25',
        },
        {
          id: 'stock-report' as ViewType,
          label: 'Laporan Stok',
          icon: ArchiveBoxIcon,
          iconBg: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25',
        },
      ],
    },
    {
      title: 'SISTEM',
      items: [
        {
          id: 'settings' as ViewType,
          label: 'Pengaturan',
          icon: Cog6ToothIcon,
          iconBg: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25',
        },
        {
          id: 'appearance' as ViewType,
          label: 'Tampilan & Tema',
          icon: SwatchIcon,
          iconBg: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25',
        },
        {
          id: 'backup' as ViewType,
          label: 'Cadangan Data & Sinkronisasi Cloud',
          icon: CircleStackIcon,
          iconBg: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25',
        },
        {
          id: 'app-info' as ViewType,
          label: 'Versi Aplikasi',
          icon: InformationCircleIcon,
          iconBg: 'bg-[#EAEFEF] text-[#25343F] border border-[#BFC9D1]/25',
        },
      ],
    },
  ];

  return (
    <div id="full-menu-view" className="max-w-2xl mx-auto space-y-3.5 pb-28">
      {/* Header Profile / Studio Info Card */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#BFC9D1]/25 shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.businessName || 'Logo'}
              className="w-10 h-10 rounded-xl object-cover shadow-md border border-[#BFC9D1]/25 shrink-0 bg-white"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#25343F] text-white font-extrabold flex items-center justify-center text-xs tracking-wider shrink-0 shadow-md uppercase">
              {settings.businessName ? settings.businessName.slice(0, 2) : 'SS'}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-[#25343F] tracking-tight truncate leading-tight">
              {settings.businessName || 'SUKUNARU STUDIO'}
            </h1>
            <p className="text-xs text-[#898989] font-medium truncate mt-0.5">
              {settings.tagline || 'Solusi Percetakan & Desain Kreatif'}
            </p>
          </div>
        </div>

        <span className="hidden xs:inline-flex px-2 py-0.5 rounded-full bg-[#EAEFEF] border border-[#BFC9D1]/25 text-[#25343F] text-[10px] font-bold tracking-wide shrink-0">
          STUDIO OS
        </span>
      </div>

      {/* Menu Groups */}
      <div className="space-y-3.5">
        {menuSections.map(section => (
          <div key={section.title} className="space-y-1.5">
            {/* Section Category Title */}
            <div className="px-1.5">
              <span className="text-[10px] font-bold text-[#898989] uppercase tracking-wider">
                {section.title}
              </span>
            </div>

            {/* Section Item Cards */}
            <div className="bg-white rounded-2xl border border-[#BFC9D1]/25 shadow-md overflow-hidden divide-y divide-slate-100">
              {section.items.map(item => {
                const IconComp = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className="w-full h-14 px-4 text-left flex items-center justify-between gap-3 hover:bg-[#EAEFEF] active:bg-[#EAEFEF] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Icon */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${item.iconBg}`}
                      >
                        <IconComp className="w-4 h-4 stroke-[2]" />
                      </div>

                      {/* Menu Label */}
                      <span className="font-semibold text-[14px] text-[#25343F] truncate">
                        {item.label}
                      </span>
                    </div>

                    {/* Right Badge + Chevron */}
                    <div className="flex items-center gap-2 shrink-0">
                      {item.badge !== undefined && (
                        <span
                          className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center shadow-sm ${
                            item.badgeColor || 'bg-[#25343F] text-white'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronRightIcon className="w-4 h-4 text-slate-300 stroke-[2]" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
