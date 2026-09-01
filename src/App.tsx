import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { ViewType, BusinessSettings } from './types';
import { ToastProvider, useToast } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { GlobalSearchModal } from './components/GlobalSearchModal';

// Views
import { DashboardView } from './views/DashboardView';
import { PosView } from './views/PosView';
import { OrdersView } from './views/OrdersView';
import { CustomersView } from './views/CustomersView';
import { ProductsView } from './views/ProductsView';
import { HppCalculatorView } from './views/HppCalculatorView';
import { InventoryView } from './views/InventoryView';
import { FinanceView } from './views/FinanceView';
import { InvoicesView } from './views/InvoicesView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { AppearanceView } from './views/AppearanceView';
import { AppInfoView } from './views/AppInfoView';
import { MenuView } from './views/MenuView';
import { GuideView } from './views/GuideView';
import { ContactView } from './views/ContactView';
import { SupportView } from './views/SupportView';
import { ProfileView } from './views/ProfileView';
import { BusinessProfileView } from './views/BusinessProfileView';
import { ActivationView } from './views/ActivationView';
import { BackupRestoreView } from './views/BackupRestoreView';
import { CloudSyncView } from './views/CloudSyncView';
import { OnboardingView } from './views/OnboardingView';
import { ProGate } from './components/ProGate';
import { initThemeSystem } from './services/themeManager';
import { initSyncSystem } from './services/syncManager';

const defaultSettings: BusinessSettings = {
  businessName: 'SUKUNARU STUDIO',
  tagline: 'Percetakan & Desain Grafis Cepat',
  phone: '0812-3456-7890',
  email: 'sukunarustudio@gmail.com',
  address: 'Jl. Percetakan Studio No. 12, Malang, Jawa Timur',
  receiptHeader: 'SUKUNARU STUDIO - Cetak Stiker, MDF, Undangan & Desain',
  receiptFooter: 'Terima kasih atas kepercayaan Anda!',
  bankAccount: 'BCA: 123-456-7890 a.n Sukunaru Studio\nMandiri: 987-654-3210 a.n Sukunaru Studio',
};

function MainAppContent() {
  const { showToast } = useToast();

  // First launch onboarding detection (sukunaru_onboarding_completed)
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sukunaru_onboarding_completed') === 'true';
    } catch {
      return true;
    }
  });

  const [currentView, setCurrentView] = useState<ViewType>(() => {
    try {
      const saved = localStorage.getItem('sukunaru_current_view');
      const validViews: ViewType[] = [
        'dashboard', 'pos', 'orders', 'customers', 'products',
        'hpp', 'inventory', 'finance', 'expenses', 'invoices',
        'sales-report', 'profit-report', 'stock-report', 'settings',
        'appearance', 'cloud-sync', 'app-info', 'menu', 'guide', 'contact', 'support', 'profile', 'business-profile',
        'activation', 'backup'
      ];
      if (saved && validViews.includes(saved as ViewType)) {
        return saved as ViewType;
      }
    } catch {}
    return 'dashboard';
  });
  const [targetRecordId, setTargetRecordId] = useState<string | undefined>(undefined);
  const [settings, setSettings] = useState<BusinessSettings>(defaultSettings);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [previousView, setPreviousView] = useState<ViewType>('dashboard');

  // Sidebar state: collapsed on desktop & mobile slide-over drawer
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sukunaru_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sukunaru_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Load initial settings and badge counters
  const refreshStatsAndSettings = useCallback(async () => {
    try {
      const [settingsData, statsData] = await Promise.all([
        api.getSettings(),
        api.getStats(),
      ]);
      if (settingsData && settingsData.businessName) {
        setSettings(settingsData);
      }
      if (statsData) {
        setActiveOrdersCount(statsData.activeOrdersCount || 0);
        setLowStockCount(statsData.lowStockItemsCount || 0);
      }
    } catch (err) {
      console.error('Failed to load initial settings/stats:', err);
    }
  }, []);

  useEffect(() => {
    const cleanupTheme = initThemeSystem();
    const cleanupSync = initSyncSystem();

    // Auto Refresh stats, badges, and counters when data mutates or cloud sync completes
    const handleDataChanged = () => {
      refreshStatsAndSettings();
    };

    window.addEventListener('sukunaru:sync_completed', handleDataChanged);
    window.addEventListener('sukunaru:data_mutation', handleDataChanged);

    return () => {
      cleanupTheme();
      cleanupSync();
      window.removeEventListener('sukunaru:sync_completed', handleDataChanged);
      window.removeEventListener('sukunaru:data_mutation', handleDataChanged);
    };
  }, [refreshStatsAndSettings]);

  useEffect(() => {
    refreshStatsAndSettings();
  }, [refreshStatsAndSettings]);

  // Global Keyboard shortcuts:
  // - Ctrl+K / Cmd+K: Search modal
  // - Ctrl+B / Cmd+B or [: Toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebarCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (view: ViewType, recordId?: string) => {
    setPreviousView(currentView); // simpan halaman sebelumnya
    setTargetRecordId(recordId);
    setCurrentView(view);
    setIsMobileSidebarOpen(false);
    try {
      localStorage.setItem('sukunaru_current_view', view);
    } catch {}
  };

  const handleResetSampleData = async () => {
    try {
      await api.resetSampleData();
      showToast('Data berhasil di-reset ke sample default Sukunaru Studio!', 'success');
      await refreshStatsAndSettings();
      handleNavigate('dashboard');
    } catch (err: any) {
      showToast(err.message || 'Gagal mereset data', 'error');
    }
  };

  const handleOnboardingComplete = () => {
    try {
      localStorage.setItem('sukunaru_onboarding_completed', 'true');
    } catch {}
    setIsOnboardingCompleted(true);
    setCurrentView('dashboard');
    refreshStatsAndSettings();
  };

  // If first launch after install: display smooth First Launch Onboarding
  if (!isOnboardingCompleted) {
    return (
      <OnboardingView
        settings={settings}
        onUpdateSettings={newSet => setSettings(newSet)}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#EAEFEF] text-[#25343F] font-sans antialiased">
      {/* Persistent Left Sidebar (Desktop & Mobile Drawer) */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        settings={settings}
        activeOrdersCount={activeOrdersCount}
        lowStockCount={lowStockCount}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopBar
          currentView={currentView}
          onNavigate={handleNavigate}
          onOpenSearch={() => setIsSearchOpen(true)}
          onResetSampleData={handleResetSampleData}
          settings={settings}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebarCollapse}
          onOpenMobileSidebar={() => handleNavigate('menu')}
        />

        <main
          id="main-content-scrollable"
          className="flex-1 px-3 sm:px-4 md:px-6 pb-24 md:pb-6 overflow-y-auto overscroll-y-contain relative"
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
          }}
        >
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
              onOpenSearch={() => setIsSearchOpen(true)}
              settings={settings}
            />
          )}

          {currentView === 'pos' && (
            <PosView
              settings={settings}
              onRefreshDashboard={refreshStatsAndSettings}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'orders' && (() => {
            // targetRecordId can be:
            // - undefined/orderId: open normally
            // - 'filter:BARU' → open Daftar Pesanan with filter preset to BARU
            // - 'filter:BARU:table' → open with filter BARU in table mode
            let ordersTargetId: string | undefined = targetRecordId;
            let ordersInitFilter: string | undefined;
            let ordersInitViewMode: 'pos' | 'table' | 'kanban' | undefined;
            if (targetRecordId?.startsWith('filter:')) {
              const parts = targetRecordId.split(':');
              ordersInitFilter = parts[1];
              ordersInitViewMode = (parts[2] as 'pos' | 'table' | 'kanban') || 'table';
              ordersTargetId = undefined;
            } else if (targetRecordId === 'table' || targetRecordId === 'list' || targetRecordId === 'orders-list') {
              ordersInitViewMode = 'table';
              ordersTargetId = undefined;
            }
            return (
              <ProGate onNavigate={handleNavigate} featureName="Manajemen Pesanan">
                <OrdersView
                  settings={settings}
                  targetOrderId={ordersTargetId}
                  initialStatusFilter={ordersInitFilter}
                  initialViewMode={ordersInitViewMode}
                  onRefreshDashboard={refreshStatsAndSettings}
                  onNavigate={handleNavigate}
                />
              </ProGate>
            );
          })()}

          {currentView === 'customers' && (
            <CustomersView
              targetCustomerId={targetRecordId}
              onNavigateToOrder={orderId => handleNavigate('orders', orderId)}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'products' && (
            <ProductsView
              onOpenHppCalculator={() => handleNavigate('hpp')}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'hpp' && (
            <ProGate onNavigate={handleNavigate} featureName="Kalkulator HPP & Biaya Produksi">
              <HppCalculatorView
                onSavedToProducts={() => handleNavigate('products')}
                onNavigate={handleNavigate}
              />
            </ProGate>
          )}

          {currentView === 'inventory' && (
            <InventoryView
              onRefreshDashboard={refreshStatsAndSettings}
              onNavigate={handleNavigate}
            />
          )}

          {(currentView === 'finance' || (currentView as string) === 'expenses') && (
            <ProGate onNavigate={handleNavigate} featureName="Arus Kas & Keuangan">
              <FinanceView
                onRefreshDashboard={refreshStatsAndSettings}
                onNavigate={handleNavigate}
              />
            </ProGate>
          )}

          {currentView === 'invoices' && (
            <InvoicesView
              settings={settings}
              onNavigate={handleNavigate}
            />
          )}

          {(currentView === 'sales-report' ||
            currentView === 'profit-report' ||
            currentView === 'stock-report') && (
            <ProGate onNavigate={handleNavigate} featureName="Laporan & Analitik Bisnis">
              <ReportsView
                initialReportType={currentView}
                settings={settings}
                onNavigate={handleNavigate}
              />
            </ProGate>
          )}

          {currentView === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={newSet => setSettings(newSet)}
              onResetSampleData={handleResetSampleData}
              onRefreshDashboard={refreshStatsAndSettings}
              onNavigate={view => handleNavigate(view as ViewType)}
              previousView={previousView}
            />
          )}

          {currentView === 'appearance' && (
            <AppearanceView
              onNavigate={handleNavigate}
              previousView={previousView}
            />
          )}

          {(currentView === 'backup' || (currentView as string) === 'cloud-sync') && (
            <BackupRestoreView
              onNavigate={handleNavigate}
              onUpdateSettings={setSettings}
              onRefreshDashboard={refreshStatsAndSettings}
              onResetSampleData={handleResetSampleData}
              previousView={previousView}
            />
          )}

          {currentView === 'business-profile' && (
            <BusinessProfileView
              settings={settings}
              onUpdateSettings={newSet => setSettings(newSet)}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'app-info' && (
            <AppInfoView
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'menu' && (
            <MenuView
              onNavigate={handleNavigate}
              settings={settings}
              activeOrdersCount={activeOrdersCount}
              lowStockCount={lowStockCount}
            />
          )}

          {currentView === 'guide' && (
            <GuideView
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'contact' && (
            <ContactView
              onNavigate={handleNavigate}
              settings={settings}
            />
          )}

          {currentView === 'support' && (
            <SupportView
              onNavigate={handleNavigate}
              settings={settings}
            />
          )}

          {currentView === 'profile' && (
            <ProfileView
              onNavigate={handleNavigate}
              settings={settings}
            />
          )}

          {currentView === 'activation' && (
            <ActivationView
              onNavigate={handleNavigate}
              settings={settings}
            />
          )}


        </main>
      </div>

      {/* Mobile Bottom Navigation Bar for rapid one-thumb access */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
        activeOrdersCount={activeOrdersCount}
        settings={settings}
      />

      {/* Global Universal Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
        onSelectResult={(view, recordId) => {
          setIsSearchOpen(false);
          handleNavigate(view, recordId);
        }}
      />
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <MainAppContent />
    </ToastProvider>
  );
}

export default App;
