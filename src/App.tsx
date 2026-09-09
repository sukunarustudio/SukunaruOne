import React, { useState, useEffect, useCallback, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { User } from '@supabase/supabase-js';
import { api } from './services/api';
import { localDb } from './services/localDb';
import { ViewType, BusinessSettings } from './types';
import { ToastProvider, useToast } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { SignInView } from './views/auth/SignInView';
import { SignUpView } from './views/auth/SignUpView';
import { ForgotPasswordView } from './views/auth/ForgotPasswordView';
import { LimitedModeView } from './views/LimitedModeView';
import { DataRecoveryModal } from './components/DataRecoveryModal';
import {
  onAuthStateChange,
  getSession,
  restoreUserLicenseSession,
  isSessionLocked,
  unlockBusinessSession,
} from './services/authService';
import {
  checkLocalAndCloudDataPresence,
  applyCloudToLocalWithBackup,
  applyLocalToCloudWithConfirmation,
  mergeLocalAndCloud,
  subscribeToRealtimeChanges,
  DataPresenceInfo,
} from './services/syncManager';

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
import { PlanChangeFloatingNotification } from './components/PlanChangeFloatingNotification';
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
  // Whether session is currently locked (e.g. after user logout)
  const [sessionLocked, setSessionLocked] = useState<boolean>(() => isSessionLocked());

  // Data Recovery Modal state (conflict resolution between local & cloud)
  const [recoveryPresence, setRecoveryPresence] = useState<DataPresenceInfo | null>(null);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState<boolean>(false);

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

  // Handle restoring business context & license entitlement on login
  const handleUserSessionRestoration = useCallback(
    async (user: User, isFreshLogin: boolean = false) => {
      try {
        unlockBusinessSession();
        setSessionLocked(false);

        // 1. Auto-restore license entitlement from Cloud
        //    (auto-provisions license for new users if none exists)
        const licRes = await restoreUserLicenseSession(user);

        // Check if this is a brand new signup
        let isNewSignup = false;
        try {
          isNewSignup =
            sessionStorage.getItem('sukunaru_is_new_signup') === 'true' ||
            localStorage.getItem('sukunaru_new_signup_welcome') === 'true';
          if (isNewSignup) {
            sessionStorage.removeItem('sukunaru_is_new_signup');
          }
        } catch {}

        if (isNewSignup) {
          // Guarantee 100% clean local database for new signup
          const cleanRes = await localDb.resetToCleanNewUserState(user.email, user.user_metadata?.display_name);
          setSettings(cleanRes.settings);
          // Flag for PlanChangeFloatingNotification to trigger persistent congratulations notification
          localStorage.setItem('sukunaru_new_signup_welcome', 'true');
          localStorage.removeItem('sukunaru_last_acknowledged_plan');
        }

        if (licRes.found && licRes.valid) {
          localStorage.setItem('sukunaru_onboarding_completed', 'true');
          setIsOnboardingCompleted(true);

          // Welcome toast for newly provisioned accounts
          if (isNewSignup) {
            showToast('Trial Fitur Pro 14 hari telah aktif.', 'success');
          }
        } else if (!licRes.found && !licRes.valid) {
          // Provisioning failed (e.g., offline) — still let user in (offline mode)
          console.warn('[App] License provisioning failed — continuing without license:', licRes.message);
          localStorage.setItem('sukunaru_onboarding_completed', 'true');
          setIsOnboardingCompleted(true);
        } else if (licRes.found && !licRes.valid && licRes.message) {
          showToast(licRes.message, 'error');
        }

        // 2. Check local vs cloud data presence ONLY during fresh login (not new signup)
        if (isFreshLogin && !isNewSignup) {
          const presence = await checkLocalAndCloudDataPresence();
          if (presence.hasLocalData && presence.hasCloudData) {
            setRecoveryPresence(presence);
            setIsRecoveryModalOpen(true);
          } else if (presence.hasCloudData && !presence.hasLocalData) {
            // Fresh / reset device: pull from Cloud directly
            await applyCloudToLocalWithBackup();
            subscribeToRealtimeChanges(true);
            await refreshStatsAndSettings();
          } else {
            subscribeToRealtimeChanges(true);
            await refreshStatsAndSettings();
          }
        } else {
          // Regular app startup / reload / new signup: start realtime & refresh stats
          subscribeToRealtimeChanges(true);
          await refreshStatsAndSettings();
        }
      } catch (err: any) {
        console.warn('[Session Restore Error]:', err);
        subscribeToRealtimeChanges(true);
        await refreshStatsAndSettings();
      }
    },
    [refreshStatsAndSettings, showToast]
  );



  // Check existing session on mount (app startup)
  useEffect(() => {
    getSession().then(async (session) => {
      const user = session?.user ?? null;
      setAuthUser(user);
      if (user && !isSessionLocked()) {
        let isFresh = false;
        try {
          if (sessionStorage.getItem('sukunaru_just_signed_in') === 'true') {
            isFresh = true;
            sessionStorage.removeItem('sukunaru_just_signed_in');
          }
        } catch {}
        await handleUserSessionRestoration(user, isFresh);
      }
    });

    // Subscribe to future auth changes
    const cleanup = onAuthStateChange(async (user) => {
      setAuthUser(user);
      if (user) {
        let isFresh = false;
        try {
          if (sessionStorage.getItem('sukunaru_just_signed_in') === 'true') {
            isFresh = true;
            sessionStorage.removeItem('sukunaru_just_signed_in');
          }
        } catch {}
        await handleUserSessionRestoration(user, isFresh);
      } else {
        setSessionLocked(isSessionLocked());
      }
    });
    return cleanup;
  }, [handleUserSessionRestoration]);

  // App Startup Splash Screen state
  const [showSplash, setShowSplash] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
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

  // Data Recovery Action Handlers
  const handleUseCloud = async () => {
    try {
      const res = await applyCloudToLocalWithBackup();
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memulihkan data', 'error');
    } finally {
      setIsRecoveryModalOpen(false);
      setRecoveryPresence(null);
      await refreshStatsAndSettings();
      handleNavigate('dashboard');
    }
  };

  const handleUseLocal = async () => {
    try {
      const res = await applyLocalToCloudWithConfirmation();
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunggah data', 'error');
    } finally {
      setIsRecoveryModalOpen(false);
      setRecoveryPresence(null);
      await refreshStatsAndSettings();
      handleNavigate('dashboard');
    }
  };

  const handleMergeData = async () => {
    try {
      const res = await mergeLocalAndCloud();
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal menggabungkan data', 'error');
    } finally {
      setIsRecoveryModalOpen(false);
      setRecoveryPresence(null);
      await refreshStatsAndSettings();
      handleNavigate('dashboard');
    }
  };

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

  const handleOnboardingComplete = (targetScreen?: 'sign-in' | 'sign-up') => {
    try {
      localStorage.setItem('sukunaru_onboarding_completed', 'true');
    } catch {}
    setIsOnboardingCompleted(true);
    if (targetScreen) {
      setAuthScreen(targetScreen);
    }
  };

  // ── 1. Splash Screen Gate (Initial launch & session verification) ───────────
  const isAuthLoading = authUser === undefined;
  if (showSplash || isAuthLoading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white dark:bg-[#0B0F17] flex items-center justify-center transition-colors">
        <img
          src="/splash.png"
          alt="BisnisUrang"
          className="w-full h-full object-contain animate-fade-in"
        />
      </div>
    );
  }

  // ── 2. First Launch Onboarding Gate (BEFORE Sign In / Sign Up) ───────────
  // If first launch after install: display smooth Onboarding first
  if (!isOnboardingCompleted) {
    return (
      <OnboardingView
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // ── 3. Auth / Limited Mode Gate ────────────────────────────────────────────
  const needsAuth = authUser === null;

  if (needsAuth) {
    if (sessionLocked) {
      return (
        <LimitedModeView
          onSignIn={() => {
            setSessionLocked(false);
            setAuthScreen('sign-in');
          }}
          onSignUp={() => {
            setSessionLocked(false);
            setAuthScreen('sign-up');
          }}
        />
      );
    }

    if (authScreen === 'sign-up') {
      return (
        <SignUpView
          onSignUpSuccess={() => {
            // After sign-up, state change via onAuthStateChange will update authUser
            setAuthScreen('sign-in');
          }}
          onNavigateToSignIn={() => setAuthScreen('sign-in')}
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
          // Handled via onAuthStateChange and handleUserSessionRestoration
        }}
        onNavigateToSignUp={() => setAuthScreen('sign-up')}
        onNavigateToForgotPassword={() => setAuthScreen('forgot-password')}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#EAEFEF] text-[#25343F] font-sans antialiased">
      {/* Persistent Floating Notification on Plan Change (requires manual X close) */}
      <PlanChangeFloatingNotification onNavigate={handleNavigate} />

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
            <HppCalculatorView
              onSavedToProducts={() => handleNavigate('products')}
              onNavigate={handleNavigate}
            />
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

      {/* Data Recovery Conflict Resolution Modal */}
      {isRecoveryModalOpen && recoveryPresence && (
        <DataRecoveryModal
          isOpen={isRecoveryModalOpen}
          presenceInfo={recoveryPresence}
          onUseCloud={handleUseCloud}
          onUseLocal={handleUseLocal}
          onMerge={handleMergeData}
          onClose={() => {
            setIsRecoveryModalOpen(false);
            setRecoveryPresence(null);
          }}
        />
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
