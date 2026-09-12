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
        // Double tap shortcut on Beranda: trigger full dashboard refresh & sync with haptic pulse
        window.dispatchEvent(new CustomEvent('sukunaru:refresh_dashboard_manual'));
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(25);
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
    <nav
      id="mobile-bottom-navigation"
      aria-label="Navigasi Utama"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 w-full bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-2xl border-t border-black/[0.08] dark:border-white/[0.08] shadow-[0_-4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] select-none transition-colors duration-200"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 4px)' }}
    >
      <div className="grid grid-cols-5 h-[62px] sm:h-[68px] max-w-lg mx-auto px-1.5 items-center">
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
              className="flex flex-col items-center justify-center h-full w-full py-1 cursor-pointer active:scale-95 active:opacity-75 transition-all duration-150 group touch-manipulation"
            >
              {/* Icon Container with Badge */}
              <div className="relative flex items-center justify-center">
                {item.id === 'profile' ? (
                  settings?.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt={settings.businessName || 'Profil'}
                      className={`w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] rounded-full object-cover transition-all duration-200 ${
                        isActive
                          ? 'ring-2 ring-[#FF9B51] ring-offset-2 dark:ring-offset-[#0B0F17] scale-110 shadow-xs'
                          : 'opacity-85 grayscale-30 ring-1 ring-black/10 dark:ring-white/20'
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] rounded-full flex items-center justify-center font-bold text-[10px] sm:text-[11px] uppercase transition-all duration-200 ${
                        isActive
                          ? 'bg-[#FF9B51] text-white ring-2 ring-[#FF9B51] ring-offset-2 dark:ring-offset-[#0B0F17] scale-110 shadow-xs'
                          : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {settings?.businessName ? settings.businessName.slice(0, 2) : 'SK'}
                    </div>
                  )
                ) : (
                  <Icon
                    className={`w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] transition-all duration-200 ${
                      isActive
                        ? 'text-[#FF9B51] scale-110'
                        : 'text-[#8E8E93] dark:text-slate-400 group-hover:text-[#25343F] dark:group-hover:text-white'
                    }`}
                  />
                )}

                {/* Apple-style Red Badge / Lock Badge */}
                {isLocked ? (
                  <span className="absolute -top-1 -right-2.5 w-4 h-4 rounded-full bg-[#FF9B51] text-white flex items-center justify-center border-2 border-white dark:border-[#0B0F17] shadow-xs pointer-events-none">
                    <LockClosedIcon className="w-2.5 h-2.5" />
                  </span>
                ) : item.badge !== undefined ? (
                  <span className="absolute -top-1.5 -right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF3B30] text-white text-[10px] font-black tracking-tight flex items-center justify-center border-2 border-white dark:border-[#0B0F17] shadow-xs pointer-events-none animate-in zoom-in-50">
                    {item.badge}
                  </span>
                ) : null}
              </div>

              {/* Apple-style Label */}
              <span
                className={`text-[11px] sm:text-[12px] mt-1.5 leading-none tracking-tight transition-colors duration-200 ${
                  isActive
                    ? 'text-[#FF9B51] font-bold'
                    : 'text-[#8E8E93] dark:text-slate-400 font-medium group-hover:text-[#25343F] dark:group-hover:text-white'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
