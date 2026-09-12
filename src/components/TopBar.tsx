import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  ChevronDoubleLeftIcon,
  Bars3Icon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  BuildingStorefrontIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { ViewType, BusinessSettings } from '../types';

interface TopBarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onOpenSearch: () => void;
  settings: BusinessSettings;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onNavigate,
  onOpenSearch,
  settings,
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenMobileSidebar,
}) => {
  const handleNav = (v: ViewType) => {
    if (typeof onNavigate === 'function') {
      onNavigate(v);
    }
  };
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      };
      setCurrentDateStr(new Intl.DateTimeFormat('id-ID', options).format(now));
    };
    updateTime();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleBrowserFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request not supported or blocked:', err);
    }
  };

  return (
    <>
      {/* ── DESKTOP & TABLET: Seamless TopBar ── */}
      <header
        id="main-topbar"
        className="hidden md:flex h-14 bg-[#EAEFEF]/80 dark:bg-[#0B0F17]/80 backdrop-blur-xl px-3 sm:px-4 lg:px-6 items-center justify-between sticky top-0 z-30 select-none shrink-0 min-w-0"
      >
        {/* Left side: Sidebar Collapse Toggle + Search bar */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Desktop Sidebar Toggle button */}
          <button
            type="button"
            id="btn-desktop-sidebar-toggle"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? "Tampilkan Menu Sidebar (⌘B)" : "Sembunyikan Menu / Full Screen Workspace (⌘B)"}
            className="flex items-center gap-1.5 p-2 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-[#25343F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 text-xs font-semibold transition-all active:scale-90 cursor-pointer shrink-0"
          >
            {isSidebarCollapsed ? (
              <>
                <Bars3Icon className="w-4.5 h-4.5 text-zinc-700 dark:text-zinc-300" />
                <span className="text-[11px] hidden sm:inline font-bold">Menu</span>
              </>
            ) : (
              <>
                <ChevronDoubleLeftIcon className="w-4.5 h-4.5 text-zinc-500" />
                <span className="text-[11px] hidden sm:inline font-bold">Tutup</span>
              </>
            )}
          </button>

          {/* Quick Search trigger (Seamless Apple Pill) */}
          <button
            id="btn-topbar-search"
            type="button"
            onClick={onOpenSearch}
            className="flex items-center justify-between w-36 sm:w-44 md:w-52 lg:w-68 xl:w-76 px-3.5 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.1] text-xs transition-all active:scale-[0.98] cursor-pointer text-[#898989] shrink min-w-0"
          >
            <div className="flex items-center gap-2 truncate min-w-0">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="text-zinc-500 dark:text-zinc-400 font-medium text-xs truncate">Cari transaksi, produk...</span>
            </div>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9.5px] font-mono font-bold bg-white/80 dark:bg-slate-800/80 rounded-md text-zinc-600 dark:text-zinc-400 shadow-2xs shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Side: Date + Fullscreen + Kasir */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden lg:block text-xs text-zinc-500 dark:text-zinc-400 font-semibold truncate tracking-tight pr-1">
            {currentDateStr || 'Senin, 24 Agt'}
          </div>

          <button
            type="button"
            id="btn-topbar-activation"
            onClick={() => handleNav('activation')}
            title="Status & Aktivasi Lisensi"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold text-[#25343F] dark:text-white transition-all active:scale-95 cursor-pointer"
          >
            <ShieldCheckIcon className="w-4 h-4 text-[#FF9B51]" />
            <span className="hidden xl:inline">Lisensi</span>
          </button>

          <button
            type="button"
            id="btn-toggle-fullscreen"
            onClick={toggleBrowserFullscreen}
            title={isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh (Kiosk)"}
            className="p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-[#25343F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-90 cursor-pointer"
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="w-4.5 h-4.5" />
            ) : (
              <ArrowsPointingOutIcon className="w-4.5 h-4.5" />
            )}
          </button>

          <button
            type="button"
            id="btn-topbar-pos"
            onClick={() => handleNav('pos')}
            className="px-4 py-1.5 bg-[#FF6A00] hover:bg-[#e65c00] text-white rounded-full text-xs font-extrabold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shadow-sm shadow-[#FF6A00]/25 shrink-0"
          >
            <BuildingStorefrontIcon className="w-3.5 h-3.5 stroke-[2.2]" />
            <span className="hidden sm:inline">Kasir POS</span>
            <span className="sm:hidden">Kasir</span>
          </button>
        </div>
      </header>
    </>
  );
};
