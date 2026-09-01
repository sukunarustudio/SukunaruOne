import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ChevronDoubleLeftIcon, Bars3Icon, ArrowsPointingOutIcon, ArrowsPointingInIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { ViewType, BusinessSettings } from '../types';

interface TopBarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onOpenSearch: () => void;
  onResetSampleData: () => void;
  settings: BusinessSettings;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onNavigate,
  onOpenSearch,
  onResetSampleData,
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
      {/* ── DESKTOP & TABLET: top bar penuh ── */}
      <header
        id="main-topbar"
        className="hidden md:flex h-14 bg-white border-b border-[#BFC9D1]/40 px-3 sm:px-4 lg:px-6 items-center justify-between sticky top-0 z-30 select-none shrink-0 min-w-0"
      >
        {/* Left side: Sidebar Collapse Toggle + Search bar */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Desktop Sidebar Toggle button */}
          <button
            type="button"
            id="btn-desktop-sidebar-toggle"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? "Tampilkan Menu Sidebar (⌘B)" : "Sembunyikan Menu / Full Screen Workspace (⌘B)"}
            className="flex items-center gap-1.5 p-1.5 px-2 rounded-lg text-[#898989] hover:text-[#25343F] hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 text-xs font-medium transition-colors cursor-pointer shrink-0"
          >
            {isSidebarCollapsed ? (
              <>
                <Bars3Icon className="w-4 h-4 text-zinc-700" />
                <span className="text-[11px] text-zinc-700 font-semibold hidden sm:inline">Tampilkan Menu</span>
              </>
            ) : (
              <>
                <ChevronDoubleLeftIcon className="w-4 h-4 text-[#898989]" />
                <span className="text-[11px] text-[#898989] hidden sm:inline">Sembunyikan</span>
              </>
            )}
          </button>

          {/* Quick Search trigger */}
          <button
            id="btn-topbar-search"
            type="button"
            onClick={onOpenSearch}
            className="flex items-center justify-between w-36 sm:w-44 md:w-48 lg:w-64 xl:w-72 px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#BFC9D1]/25 bg-white hover:border-[#BFC9D1] text-xs transition-colors cursor-pointer text-[#898989] shrink min-w-0"
          >
            <div className="flex items-center gap-2 truncate min-w-0">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-[#898989] shrink-0" />
              <span className="text-[#898989] font-normal text-xs truncate">Cari cepat...</span>
            </div>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[#EAEFEF] border border-[#BFC9D1]/25 rounded text-[#898989] shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Side: Date + Fullscreen + Kasir */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
          <div className="hidden lg:block text-xs text-[#898989] font-normal truncate">
            {currentDateStr || 'Senin, 24 Agt'}
          </div>

          <button
            type="button"
            id="btn-toggle-fullscreen"
            onClick={toggleBrowserFullscreen}
            title={isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh (Kiosk)"}
            className="p-1.5 sm:p-2 rounded-lg text-[#898989] hover:text-[#25343F] hover:bg-[#EAEFEF] transition-colors cursor-pointer"
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="w-4 h-4" />
            ) : (
              <ArrowsPointingOutIcon className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            id="btn-topbar-pos"
            onClick={() => handleNav('pos')}
            className="px-2.5 sm:px-3 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-md shrink-0"
          >
            <BuildingStorefrontIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kasir POS</span>
            <span className="sm:hidden">Kasir</span>
          </button>
        </div>
      </header>
    </>
  );
};
