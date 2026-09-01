import React from 'react';
import {
  Squares2X2Icon as SquaresOutline,
  BuildingStorefrontIcon as StoreOutline,
  ClipboardDocumentListIcon as OrdersOutline,
  DocumentTextIcon as DocOutline,
  UserCircleIcon as UserOutline,
} from '@heroicons/react/24/outline';
import {
  Squares2X2Icon as SquaresSolid,
  BuildingStorefrontIcon as StoreSolid,
  ClipboardDocumentListIcon as OrdersSolid,
  DocumentTextIcon as DocSolid,
  UserCircleIcon as UserSolid,
} from '@heroicons/react/24/solid';
import { ViewType, BusinessSettings } from '../types';
import { useLicense } from '../hooks/useLicense';
import { LockClosedIcon } from '@heroicons/react/20/solid';

interface MobileBottomNavProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  activeOrdersCount: number;
  settings?: BusinessSettings;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  activeOrdersCount,
  settings,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ViewType,
      label: 'Beranda',
      solidIcon: SquaresSolid,
      outlineIcon: SquaresOutline,
    },
    {
      id: 'orders' as ViewType,
      label: 'Pesanan',
      solidIcon: OrdersSolid,
      outlineIcon: OrdersOutline,
      badge: activeOrdersCount > 0 ? (activeOrdersCount > 9 ? '9+' : activeOrdersCount) : undefined,
    },
    {
      id: 'pos' as ViewType,
      label: 'Kasir',
      solidIcon: StoreSolid,
      outlineIcon: StoreOutline,
    },
    {
      id: 'invoices' as ViewType,
      label: 'Riwayat',
      solidIcon: DocSolid,
      outlineIcon: DocOutline,
    },
    {
      id: 'profile' as ViewType,
      label: 'Profil',
      solidIcon: UserSolid,
      outlineIcon: UserOutline,
    },
  ];

  const { isPro } = useLicense();
  const proViews: ViewType[] = ['orders'];

  return (
    <nav
      id="mobile-bottom-navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#BFC9D1]/30 px-2 py-2 flex items-center justify-around shadow-[0_-4px_24px_rgba(0,0,0,0.06)] select-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 10px)' }}
    >
      {navItems.map(item => {
        const isActive = currentView === item.id;
        const Icon = isActive ? item.solidIcon : item.outlineIcon;
        const isLocked = !isPro && proViews.includes(item.id);

        return (
          <button
            key={item.id}
            type="button"
            id={`btn-mobile-nav-${item.id}`}
            onClick={() => onNavigate(item.id)}
            className="flex flex-col items-center justify-center flex-1 py-0.5 cursor-pointer active:scale-95 transition-all group"
          >
            {/* Pill Container behind Icon */}
            <div className="relative">
              <div
                className={`w-14 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-[#FFF0E6] text-[#FF9B51] shadow-xs'
                    : 'bg-transparent text-[#898989] group-hover:text-[#25343F]'
                }`}
              >
                {item.id === 'profile' ? (
                  settings?.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt={settings.businessName || 'Profil'}
                      className={`w-6 h-6 rounded-full object-cover transition-all duration-200 ${
                        isActive
                          ? 'ring-2 ring-[#FF9B51] scale-105 shadow-xs'
                          : 'ring-1.5 ring-slate-300/80'
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] uppercase transition-all duration-200 ${
                        isActive
                          ? 'bg-[#FF9B51] text-white ring-2 ring-[#FF9B51] scale-105 shadow-xs'
                          : 'bg-[#898989] text-white ring-1 ring-slate-300'
                      }`}
                    >
                      {settings?.businessName ? settings.businessName.slice(0, 2) : 'SK'}
                    </div>
                  )
                ) : (
                  <Icon
                    className={`w-6 h-6 transition-transform duration-200 ${
                      isActive ? 'scale-105 text-[#FF9B51]' : 'text-[#898989]'
                    }`}
                  />
                )}
              </div>

              {/* Lock Badge if feature is locked */}
              {isLocked ? (
                <span className="absolute -top-1 -right-0.5 w-[18px] h-[18px] rounded-full bg-[#FF9B51] text-white flex items-center justify-center border border-white shadow-xs pointer-events-none">
                  <LockClosedIcon className="w-2.5 h-2.5" />
                </span>
              ) : item.badge !== undefined ? (
                <span className="absolute -top-1 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF9B51] text-white text-[10px] font-black flex items-center justify-center border border-white shadow-xs pointer-events-none">
                  {item.badge}
                </span>
              ) : null}
            </div>

            {/* Label below Icon */}
            <span
              className={`text-[11px] mt-1 leading-tight tracking-tight transition-colors ${
                isActive
                  ? 'text-[#25343F] font-black'
                  : 'text-[#898989] font-bold group-hover:text-[#25343F]'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
