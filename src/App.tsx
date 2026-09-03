import React, { useState, useEffect, useCallback, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { User } from '@supabase/supabase-js';
import { api } from './services/api';
import { ViewType, BusinessSettings } from './types';
import { ToastProvider, useToast } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { SignInView } from './views/auth/SignInView';
import { SignUpView } from './views/auth/SignUpView';
import { ForgotPasswordView } from './views/auth/ForgotPasswordView';
import { onAuthStateChange, getSession } from './services/authService';

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
  businessName: 'Nama Bisnis Anda',
  tagline: 'Tagline / Slogan Bisnis Anda',
  phone: '',
  email: '',
  address: '',
  receiptHeader: '',
  receiptFooter: 'Terima kasih atas kepercayaan Anda!',
  bankAccount: '',
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

  // Auth state — null = not checked yet, undefined = checked but not logged in
  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined);
  // Auth sub-screen: 'sign-in' | 'sign-up' | 'forgot-password'
  const [authScreen, setAuthScreen] = useState<'sign-in' | 'sign-up' | 'forgot-password'>('sign-in');
  // Whether user explicitly chose offline mode (skip auth)
  const [offlineMode, setOfflineMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sukunaru_offline_mode') === 'true';
    } catch {
      return false;
    }
  });

  // Check existing session on mount
  useEffect(() => {
    getSession().then((session) => {
      setAuthUser(session?.user ?? null);
    });
    // Subscribe to future auth changes
    const cleanup = onAuthStateChange((user) => {
      setAuthUser(user);
      if (!user) {
        // User signed out — clear offline mode so sign-in screen shows
        localStorage.removeItem('sukunaru_offline_mode');
        setOfflineMode(false);
      }
    });
    return cleanup;
  }, []);

  // App Startup Splash Screen state
  const [showSplash, setShowSplash] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

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
      if (settingsData) {
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

  const historyStackRef = useRef<ViewType[]>([currentView]);

  const handleNavigate = useCallback((view: ViewType, recordId?: string) => {
    setCurrentView(curr => {
      if (curr !== view) {
        setPreviousView(curr);
        if (view === 'dashboard') {
          historyStackRef.current = ['dashboard'];
        } else if (historyStackRef.current[historyStackRef.current.length - 1] !== view) {
          historyStackRef.current.push(view);
        }
      }
      return view;
    });
    setTargetRecordId(recordId);
    setIsMobileSidebarOpen(false);
    try {
      localStorage.setItem('sukunaru_current_view', view);
    } catch {}
  }, []);

  // Android Hardware / Gesture Back Button Interceptor
  const currentViewRef = useRef<ViewType>(currentView);
  const isSearchOpenRef = useRef<boolean>(isSearchOpen);
  const isMobileSidebarOpenRef = useRef<boolean>(isMobileSidebarOpen);
  const lastBackPressTimeRef = useRef<number>(0);

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  useEffect(() => {
    isSearchOpenRef.current = isSearchOpen;
  }, [isSearchOpen]);

  useEffect(() => {
    isMobileSidebarOpenRef.current = isMobileSidebarOpen;
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    let backListener: any = null;

    const attachBackListener = async () => {
      try {
        backListener = await CapacitorApp.addListener('backButton', () => {
          // 1. Close search modal if open
          if (isSearchOpenRef.current) {
            setIsSearchOpen(false);
            return;
          }

          // 2. Close mobile drawer sidebar if open
          if (isMobileSidebarOpenRef.current) {
            setIsMobileSidebarOpen(false);
            return;
          }

          // 3. Navigate back through history stack
          if (historyStackRef.current.length > 1) {
            historyStackRef.current.pop(); // remove current view
            const prevView = historyStackRef.current[historyStackRef.current.length - 1] || 'dashboard';
            setCurrentView(prevView);
            currentViewRef.current = prevView;
            try { localStorage.setItem('sukunaru_current_view', prevView); } catch {}
            return;
          }

          if (currentViewRef.current !== 'dashboard') {
            handleNavigate('dashboard');
            return;
          }

          // 4. If already on Dashboard, ask user confirmation or exit on double tap within 2 seconds
          const now = Date.now();
          if (now - lastBackPressTimeRef.current < 2000) {
            CapacitorApp.exitApp();
          } else {
            lastBackPressTimeRef.current = now;
            showToast('Tekan sekali lagi untuk keluar dari BisnisUrang', 'info');
          }
        });
      } catch (err) {
        // Not on mobile / Capacitor environment
      }
    };

    attachBackListener();

    return () => {
      if (backListener && typeof backListener.remove === 'function') {
        backListener.remove();
      }
    };
  }, [handleNavigate, showToast]);

  const handleResetSampleData = async () => {
    try {
      await api.resetSampleData();
      showToast('Data berhasil di-reset ke sample default!', 'success');
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

  const handleContinueOffline = () => {
    try {
      localStorage.setItem('sukunaru_offline_mode', 'true');
    } catch {}
    setOfflineMode(true);
  };

  // ── Auth Gate ─────────────────────────────────────────────────────────────
  // authUser === undefined → session check still loading → show nothing (splash covers)
  // authUser === null + not offline → show sign-in/sign-up/forgot
  // authUser !== null || offlineMode → proceed to app
  const isAuthLoading = authUser === undefined;
  const needsAuth = !isAuthLoading && authUser === null && !offlineMode;

  if (needsAuth) {
    if (authScreen === 'sign-up') {
      return (
        <SignUpView
          onSignUpSuccess={() => {
            // After sign-up, state change via onAuthStateChange will update authUser
            setAuthScreen('sign-in');
          }}
          onNavigateToSignIn={() => setAuthScreen('sign-in')}
          onContinueOffline={handleContinueOffline}
        />
      );
    }

    if (authScreen === 'forgot-password') {
      return (
        <ForgotPasswordView
          onNavigateToSignIn={() => setAuthScreen('sign-in')}
        />
      );
    }

    // Default: sign-in
    return (
      <SignInView
        onSignInSuccess={() => {
          // authUser will be set via onAuthStateChange
        }}
        onNavigateToSignUp={() => setAuthScreen('sign-up')}
        onNavigateToForgotPassword={() => setAuthScreen('forgot-password')}
        onContinueOffline={handleContinueOffline}
      />
    );
  }

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

      {/* Animated App Splash Screen */}
      {showSplash && (
        <div className="fixed inset-0 z-[9999] bg-white transition-opacity duration-700 ease-in-out pointer-events-none flex items-center justify-center">
          <img
            src="/splash.png"
            alt="BisnisUrang"
            className="w-full h-full object-contain animate-fade-in"
          />
        </div>
      )}
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
