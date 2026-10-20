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
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
        {/* Futuristic Ambient Monochrome Lighting & Spatial Backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_42%,rgba(255,255,255,0.06)_0%,rgba(16,16,16,0.75)_50%,#000000_100%)] pointer-events-none z-0" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-white/[0.03] rounded-full blur-[100px] pointer-events-none z-0" />

        {/* Brand Display — Bold, Futuristic Apple Monochrome Presentation */}
        <div className="dark relative z-10 flex flex-col items-center text-center">
          {/* Subtle Floating Ambient Halo */}
          <div className="relative mb-5 flex items-center justify-center">
            <div className="absolute -inset-4 rounded-[32px] bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.8)] pointer-events-none" />
            <div className="relative p-5 sm:p-6 flex flex-col items-center">
              <Logo variant="stacked" size={54} />
            </div>
          </div>

          {/* Futuristic Editorial Brand Subtitle */}
          <p className="text-[11px] font-semibold text-white/50 tracking-[0.32em] uppercase mt-1 select-none">
            Enterprise Operating System
          </p>
        </div>

        {/* Futuristic Precision Progress Bar — Monochrome Apple Laser Line */}
        <div className="relative z-10 w-full max-w-[280px] sm:max-w-[320px] mt-10">
          <div className="w-full bg-white/10 rounded-full h-[2.5px] overflow-hidden backdrop-blur-md">
            <div
              style={{
                width: `${loading ? (progressPercent > 0 ? progressPercent : 35) : (progressPercent || 100)}%`,
              }}
              className="h-full bg-gradient-to-r from-white/30 via-white/80 to-white transition-all duration-300 ease-out shadow-[0_0_10px_rgba(255,255,255,0.45)]"
            />
          </div>

          {/* Clean Telemetry Readout (No pulsating text, pure monochrome) */}
          <div className="flex items-center justify-between mt-3 px-0.5 text-[10px] font-mono tracking-wider">
            <span className="text-white/40 uppercase">
              {loading ? 'Securing Gateway' : (loadingProgress?.current || 'Initializing Workspace')}
            </span>
            <span className="text-white/80 font-semibold tabular-nums">
              {loading ? '' : `${progressPercent}%`}
            </span>
          </div>
        </div>

        {/* Error Display with Retry */}
        {loadError && (
          <div className="relative z-10 mt-8 p-4 bg-red-950/40 border border-red-500/20 rounded-2xl max-w-sm w-full backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-red-400 font-mono uppercase tracking-wider mb-1">Connection Disrupted</p>
                <p className="text-xs text-gray-300 leading-relaxed">{loadError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all border border-red-500/30 active:scale-95 cursor-pointer"
                >
                  Retry Connection
                </button>
              </div>
            </div>
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

            {/* Regional Operations Command - Regional Manager & Regional Leads */}
            <Route path="/regional-ops" element={
              <ProtectedRoute module="regional-ops">
                <ModuleErrorBoundary moduleName="Regional Operations">
                  <RegionalOperations />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            {/* POS - Cashiers, Managers, Admins */}
            <Route path="/pos" element={
              <ProtectedRoute module="pos">
                <ModuleErrorBoundary moduleName="POS">
                  <POSTerminal />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/pos/terminal" element={<Navigate to="/pos" replace />} />

            {/* POS Command Center - Store staff only, NOT super_admin */}
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

            {/* Pricing - Managers, Admins */}
            <Route path="/pricing" element={
              <ProtectedRoute module="pricing">
                <ModuleErrorBoundary moduleName="Merchandising">
                  <Merchandising />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

            {/* Online Store Catalog & Order Requests */}
            <Route path="/online-store" element={
              <ProtectedRoute module="pricing">
                <ModuleErrorBoundary moduleName="Online Store">
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
    </Router>
  );
}
