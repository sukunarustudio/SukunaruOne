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
  const lastDashboardClickRef = React.useRef<number>(0);

  const handleNavClick = (id: ViewType) => {
    const now = Date.now();
    if (id === 'dashboard') {
      if (now - lastDashboardClickRef.current < 500) {
        // Double tap shortcut on Beranda: trigger full dashboard refresh & sync!
        window.dispatchEvent(new CustomEvent('sukunaru:refresh_dashboard_manual'));
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(30);
          }
        } catch {}
        lastDashboardClickRef.current = 0;
        return;
      } else if (currentView === 'dashboard') {
        // Single tap while already on dashboard: scroll smoothly to top
        const scrollEl = document.getElementById('main-content-scrollable');
        if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
      }
      lastDashboardClickRef.current = now;
    }
    onNavigate(id);
  };

  return (
    <div
      id="mobile-bottom-navigation-container"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pointer-events-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 10px)' }}
    >
      <nav
        id="mobile-bottom-navigation"
        className="pointer-events-auto mx-auto max-w-md bg-white/85 dark:bg-[#0F172A]/85 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.09] px-2 py-1.5 rounded-3xl flex items-center justify-around shadow-[0_8px_32px_rgba(0,0,0,0.12)] select-none transition-all"
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
              onClick={() => handleNavClick(item.id)}
              className="flex flex-col items-center justify-center flex-1 py-1 cursor-pointer active:scale-90 transition-transform duration-150 group"
            >
              {/* Pill Container behind Icon */}
              <div className="relative">
                <div
                  className={`w-12 h-7.5 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'bg-[#FF9B51]/15 text-[#FF9B51] shadow-xs'
                      : 'bg-transparent text-[#898989] group-hover:text-[#25343F]'
                  }`}
                >
                  {item.id === 'profile' ? (
                    settings?.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt={settings.businessName || 'Profil'}
                        className={`w-5.5 h-5.5 rounded-full object-cover transition-all duration-200 ${
                          isActive
                            ? 'ring-2 ring-[#FF9B51] scale-105 shadow-xs'
                            : 'ring-1 ring-slate-300/80'
                        }`}
                      />
                    ) : (
                      <div
                        className={`w-5.5 h-5.5 rounded-full flex items-center justify-center font-black text-[9px] uppercase transition-all duration-200 ${
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
                      className={`w-5.5 h-5.5 transition-transform duration-200 ${
                        isActive ? 'scale-105 text-[#FF9B51]' : 'text-[#898989]'
                      }`}
                    />
                  )}
                </div>

                {/* Lock Badge if feature is locked */}
                {isLocked ? (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF9B51] text-white flex items-center justify-center border-1.5 border-white shadow-xs pointer-events-none">
                    <LockClosedIcon className="w-2 h-2" />
                  </span>
                ) : item.badge !== undefined ? (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#FF4267] text-white text-[9px] font-black flex items-center justify-center border-1.5 border-white shadow-xs pointer-events-none animate-in zoom-in-50">
                    {item.badge}
                  </span>
                ) : null}
              </div>

              {/* Label below Icon */}
              <span
                className={`text-[10px] mt-0.5 leading-tight tracking-tight transition-colors ${
                  isActive
                    ? 'text-[#25343F] dark:text-white font-extrabold'
                    : 'text-[#898989] font-semibold group-hover:text-[#25343F]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
