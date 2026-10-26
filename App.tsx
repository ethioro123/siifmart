import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './contexts/CentralStore';
import './utils/clearSession'; // Make clearSession available globally

// Components
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { ModuleErrorBoundary } from './components/shared';

// Lazy-loaded Pages
const POSTerminal = lazy(() => import('./pages/POSTerminal'));
const POSCommand = lazy(() => import('./pages/POSCommand'));
const CentralOperations = lazy(() => import('./pages/CentralOperations'));
const RegionalOperations = lazy(() => import('./pages/RegionalOperations'));
const WMSDashboard = lazy(() => import('./pages/WMSDashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const NetworkView = lazy(() => import('./pages/NetworkView'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const Procurement = lazy(() => import('./pages/Procurement'));
const PurchaseRequests = lazy(() => import('./pages/PurchaseRequests'));
const Customers = lazy(() => import('./pages/Customers'));
const SalesHistory = lazy(() => import('./pages/SalesHistory'));
const Employees = lazy(() => import('./pages/Employees'));
const Fulfillment = lazy(() => import('./pages/Fulfillment'));
const Merchandising = lazy(() => import('./pages/Merchandising'));
const OnlineStoreManagement = lazy(() => import('./pages/OnlineStoreManagement'));
const Financials = lazy(() => import('./pages/Financials'));
const LocationSelect = lazy(() => import('./pages/LocationSelect'));
const Profile = lazy(() => import('./pages/Profile'));
const MigrationPanel = lazy(() => import('./pages/MigrationPanel'));

/**
 * Minimal Apple boot-style progress indicator.
 * Progressively and smoothly advances forward, syncing with real data hydration.
 */
function AppleBootProgress({ realProgress }: { realProgress: number }) {
  const [progress, setProgress] = React.useState(8);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        // If real data progress is higher, smoothly catch up towards it
        if (realProgress > 0 && realProgress > prev) {
          return Math.min(100, prev + Math.max(2, (realProgress - prev) * 0.35));
        }
        // Continuous organic Apple startup pacing
        if (prev < 35) return prev + 2.5;
        if (prev < 65) return prev + 1.8;
        if (prev < 85) return prev + 1.0;
        if (prev < 95) return prev + 0.3;
        return prev;
      });
    }, 70);

    return () => clearInterval(timer);
  }, [realProgress]);

  const activePercent = Math.min(100, Math.max(progress, realProgress || 0));

  return (
    <div className="w-48 sm:w-56 mt-10">
      <div className="w-full h-[3px] bg-black/10 dark:bg-white/20 rounded-full overflow-hidden">
        <div
          style={{ width: `${activePercent}%` }}
          className="h-full bg-black dark:bg-white rounded-full transition-all duration-200 ease-out"
        />
      </div>
    </div>
  );
}

// Fallback loader for code splitting
function ModuleLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center select-none">
      <div className="relative mb-3">
        <div className="w-7 h-7 rounded-full border-2 border-stone-200 dark:border-white/10 border-t-black dark:border-t-white animate-spin" />
      </div>
      <p className="text-[11px] text-[var(--theme-text-muted)] font-mono uppercase tracking-[0.2em]">
        Loading Module...
      </p>
    </div>
  );
}


import { native } from './utils/native';
import { runAutoMigration } from './utils/autoMigrate';
import { useCapacitor } from './hooks/useCapacitor';
import { getRoleDashboardRoute } from './utils/roleDashboard';

import { useData } from './contexts/DataContext';
import { systemConfigService } from './services/supabase.service';
import { initializeAvatarsBucket } from './services/imageStorage.service';
import StagingEnvironmentBanner from './components/StagingEnvironmentBanner';
import Logo from './components/Logo';
import { AiReloadIndicator } from './components/dev/AiReloadIndicator';

export default function App() {
  useCapacitor();
  const { user, loading } = useStore();
  const { activeSite, cleanupAdminProducts, isDataInitialLoading, loadError, loadingProgress, settings } = useData();

  // Sync document title and brand accent color from system configuration
  React.useEffect(() => {
    if (settings?.storeName) {
      document.title = `${settings.storeName} | Retail & Warehouse System`;
    }
    if (settings?.brandColor) {
      document.documentElement.style.setProperty('--brand-accent', settings.brandColor);
      document.documentElement.style.setProperty('--color-accent', settings.brandColor);
    }
  }, [settings?.storeName, settings?.brandColor]);

  React.useEffect(() => {
    if (native.isNative()) {
      native.toast('Welcome to SIIFMART Native App');
    }

    // Run auto-migration once
    runAutoMigration();
  }, []);

  // Keyboard shortcut: Ctrl+Shift+H (or Cmd+Shift+H on Mac) to cleanup HQ products
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Check for Ctrl+Shift+H or Cmd+Shift+H
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        console.log('🧹 Triggering Admin products cleanup...');
        cleanupAdminProducts();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cleanupAdminProducts]);

  // Prevent scaling, pinch-to-zoom, and trackpad zoom on mobile/hybrid browsers
  React.useEffect(() => {
    const preventPinchZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', preventPinchZoom, { passive: false });
    document.addEventListener('touchmove', preventPinchZoom, { passive: false });
    document.addEventListener('wheel', preventWheelZoom, { passive: false });

    return () => {
      document.removeEventListener('touchstart', preventPinchZoom);
      document.removeEventListener('touchmove', preventPinchZoom);
      document.removeEventListener('wheel', preventWheelZoom);
    };
  }, []);
  // Initial Auth/Data Loading State
  if (loading || (user && isDataInitialLoading)) {
    // Calculate progress based on entities loaded
    const progressPercent = loadingProgress?.total > 0
      ? Math.round((loadingProgress.loaded / loadingProgress.total) * 100)
      : 0;

    return (
      <div className="min-h-screen bg-white dark:bg-black text-[#09090B] dark:text-white flex flex-col items-center justify-center p-6 select-none transition-colors duration-200">
        {/* Brand Display — Pure, Simple, Elegant Apple Presentation */}
        <div className="flex flex-col items-center text-center">
          <Logo variant="stacked" size={36} />
        </div>

        {/* Minimal Apple Precision Progress Bar */}
        <AppleBootProgress realProgress={progressPercent} />

        {/* Error Display with Retry */}
        {loadError && (
          <div className="mt-8 p-4 border border-red-500/30 rounded-2xl max-w-sm w-full text-center">
            <p className="text-xs text-red-500 mb-2">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded-lg transition-opacity hover:opacity-80 active:scale-95 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Router>
      <StagingEnvironmentBanner />
      {!user ? (
        <LoginPage />
      ) : (
        <Layout>
          <Suspense fallback={<ModuleLoader />}>
            <Routes>
            {/* Dashboard - Accessible by all authenticated users, content strictly scoped by role & active site */}
            <Route path="/" element={
              <ProtectedRoute>
                <Navigate to={getRoleDashboardRoute(user?.role, activeSite?.type)} replace />
              </ProtectedRoute>
            } />
            {/* Dashboard removed - merged into Admin */}

            {/* Admin Dashboard - CEO Only */}
            <Route path="/admin" element={
              <ProtectedRoute module="admin">
                <ModuleErrorBoundary moduleName="Central Operations">
                  <CentralOperations />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            {/* Regional Operations Command - Regional Operations Manager & Regional Department Managers */}
            <Route path="/regional-ops" element={
              <ProtectedRoute module="regional-ops">
                <ModuleErrorBoundary moduleName="Regional Operations">
                  <RegionalOperations />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            {/* POS - Cashiers, Store Managers, Shift Leads (Till checkout locked to authorized checkout roles) */}
            <Route path="/pos" element={
              <ProtectedRoute module="pos" permission="PROCESS_SALE">
                <ModuleErrorBoundary moduleName="POS">
                  <POSTerminal />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/pos/terminal" element={<Navigate to="/pos" replace />} />

            {/* POS Command Center - Store staff only, NOT group_ceo */}
            <Route path="/pos-dashboard" element={
              <ProtectedRoute module="pos">
                <ModuleErrorBoundary moduleName="POS Command">
                  <POSCommand />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            {/* Sales History - Managers, Admins, Auditors */}
            <Route path="/sales" element={
              <ProtectedRoute module="sales">
                <ModuleErrorBoundary moduleName="Sales History">
                  <SalesHistory />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            {/* Inventory - WMS, Managers, Admins, Auditors */}
            <Route path="/inventory" element={
              <ProtectedRoute module="inventory">
                <ModuleErrorBoundary moduleName="Inventory">
                  <Inventory />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            {/* Network Inventory - All authenticated users can view */}
            <Route path="/network-inventory" element={
              <ProtectedRoute module="inventory">
                <ModuleErrorBoundary moduleName="Network View">
                  <NetworkView />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            {/* Warehouse Operations - WMS, Pickers, Drivers, Admins */}
            <Route path="/wms-ops" element={
              <ProtectedRoute module="warehouse">
                <ModuleErrorBoundary moduleName="Fulfillment">
                  <Fulfillment />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            {/* WMS Dashboard */}
            <Route path="/wms-dashboard" element={
              <ProtectedRoute module="warehouse">
                <ModuleErrorBoundary moduleName="WMS Dashboard">
                  <WMSDashboard />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            {/* Procurement - WMS, Managers, Admins */}
            <Route path="/procurement" element={
              <ProtectedRoute module="procurement">
                <ModuleErrorBoundary moduleName="Procurement">
                  <Procurement />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            <Route path="/purchase-requests" element={
              <ProtectedRoute>
                <ModuleErrorBoundary moduleName="Purchase Requests">
                  <PurchaseRequests />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            {/* Pricing - Managers, Admins */}
            <Route path="/pricing" element={
              <ProtectedRoute module="pricing">
                <ModuleErrorBoundary moduleName="Merchandising">
                  <Merchandising />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            {/* Internal warehouse and distribution center online order desk */}
            <Route path="/online-store" element={
              <ProtectedRoute module="warehouse">
                <ModuleErrorBoundary moduleName="Online Operations">
                  <OnlineStoreManagement />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            {/* Finance - HR, Admins, Auditors */}
            <Route path="/finance" element={
              <ProtectedRoute module="finance">
                <ModuleErrorBoundary moduleName="Financials">
                  <Financials />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            {/* Customers - POS, Managers, Admins */}
            <Route path="/customers" element={
              <ProtectedRoute module="customers">
                <ModuleErrorBoundary moduleName="Customers">
                  <Customers />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />


            {/* Settings - HR, Admins */}
            <Route path="/settings" element={
              <ProtectedRoute module="settings">
                <ModuleErrorBoundary moduleName="Settings">
                  <SettingsPage />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            {/* Roadmap/Brainstorm Canvas - CEO ONLY */}
            <Route path="/roadmap" element={
              <ProtectedRoute module="admin">
                <ModuleErrorBoundary moduleName="Roadmap">
                  <Roadmap />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            {/* Employees - HR, Managers, Admins */}
            <Route path="/employees" element={
              <ProtectedRoute module="employees">
                <ModuleErrorBoundary moduleName="Employees">
                  <Employees />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            {/* My Profile - All authenticated users */}
            <Route path="/profile" element={
              <ProtectedRoute module="profile">
                <ModuleErrorBoundary moduleName="Profile">
                  <Profile />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            {/* Migration Panel - CEO Only */}
            <Route path="/migration" element={
              <ProtectedRoute module="settings">
                <ModuleErrorBoundary moduleName="Migration">
                  <MigrationPanel />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            {/* Location Selection - CEO Only (for Context Switching) */}
            <Route path="/location-select" element={
              <ProtectedRoute module="admin">
                <ModuleErrorBoundary moduleName="Location Select">
                  <LocationSelect />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            {/* Redirect /login to dashboard if already authenticated */}
            <Route path="/login" element={<Navigate to="/" replace />} />

            <Route path="*" element={<div className="text-center pt-20 text-gray-500">Module Access Restricted or Not Found</div>} />
          </Routes>
        </Suspense>
      </Layout>
      )}
      {import.meta.env.DEV && <AiReloadIndicator />}
    </Router>
  );
}
