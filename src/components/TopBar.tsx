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
      {/* ── DESKTOP: top bar penuh ── */}
      <header
        id="main-topbar"
        className="hidden lg:flex h-14 bg-white border-b border-[#BFC9D1]/40 px-3 sm:px-6 items-center justify-between sticky top-0 z-30 select-none"
      >
        {/* Left side: Sidebar Collapse Toggle + MagnifyingGlassIcon bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop Sidebar Toggle button */}
          <button
            type="button"
            id="btn-desktop-sidebar-toggle"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? "Tampilkan Menu Sidebar (⌘B)" : "Sembunyikan Menu / Full Screen Workspace (⌘B)"}
            className="flex items-center gap-1.5 p-1.5 px-2 rounded-lg text-[#898989] hover:text-[#25343F] hover:bg-[#EAEFEF] border border-[#BFC9D1]/25 text-xs font-medium transition-colors cursor-pointer"
          >
            {isSidebarCollapsed ? (
              <>
                <Bars3Icon className="w-4 h-4 text-zinc-700 " />
                <span className="text-[11px] text-zinc-700 font-semibold">Tampilkan Menu</span>
              </>
            ) : (
              <>
                <ChevronDoubleLeftIcon className="w-4 h-4 text-[#898989] " />
                <span className="text-[11px] text-[#898989]">Sembunyikan</span>
              </>
            )}
          </button>

          {/* Quick MagnifyingGlassIcon trigger */}
          <button
            id="btn-topbar-search"
            type="button"
            onClick={onOpenSearch}
            className="flex items-center justify-between w-60 md:w-72 px-3 py-1.5 rounded-lg border border-[#BFC9D1]/25 bg-white hover:border-[#BFC9D1] text-xs transition-colors cursor-pointer text-[#898989]"
          >
            <div className="flex items-center gap-2 truncate">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-[#898989] shrink-0" />
              <span className="text-[#898989] font-normal text-xs truncate">Cari cepat...</span>
            </div>
            <kbd className="inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[#EAEFEF] border border-[#BFC9D1]/25 rounded text-[#898989] shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Side: Date + Fullscreen + Kasir */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:block text-xs text-[#898989] font-normal">
            {currentDateStr || 'Senin, 24 Agt'}
          </div>

          <button
            type="button"
            id="btn-toggle-fullscreen"
            onClick={toggleBrowserFullscreen}
            title={isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh (Kiosk)"}
            className="p-2 rounded-lg text-[#898989] hover:text-[#25343F] hover:bg-[#EAEFEF] transition-colors cursor-pointer"
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="w-4 h-4 " />
            ) : (
              <ArrowsPointingOutIcon className="w-4 h-4 " />
            )}
          </button>

          <button
            type="button"
            id="btn-topbar-pos"
            onClick={() => handleNav('pos')}
            className="px-3 py-1 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-md"
          >
            <BuildingStorefrontIcon className="w-3.5 h-3.5" />
            <span>Kasir POS</span>
          </button>
        </div>
      </header>
    </>
  );
};
