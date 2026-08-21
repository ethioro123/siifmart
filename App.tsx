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
const Financials = lazy(() => import('./pages/Financials'));
const LocationSelect = lazy(() => import('./pages/LocationSelect'));
const Profile = lazy(() => import('./pages/Profile'));
const MigrationPanel = lazy(() => import('./pages/MigrationPanel'));

// Fallback loader for code splitting
function ModuleLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-pulse-slow">
      <div className="relative mb-4">
        <div className="hidden lg:block absolute inset-0 bg-cyber-primary/20 blur-xl rounded-full animate-pulse" />
        <div className="w-12 h-12 bg-black/30 lg:backdrop-blur-xl border border-cyber-primary/30 rounded-xl flex items-center justify-center relative z-10 shadow-[0_0_20px_rgba(0,255,157,0.1)]">
          <div className="w-6 h-6 border-t-2 border-r-2 border-cyber-primary rounded-full animate-spin" />
        </div>
      </div>
      <p className="text-xs text-cyber-primary/70 font-mono uppercase tracking-[0.2em]">
        Hydrating Module...
      </p>
    </div>
  );
}


import { native } from './utils/native';
import { runAutoMigration } from './utils/autoMigrate';

import { useData } from './contexts/DataContext';
import { systemConfigService } from './services/supabase.service';
import { initializeAvatarsBucket } from './services/imageStorage.service';

export default function App() {
  const { user, loading } = useStore();
  const { activeSite, cleanupAdminProducts, isDataInitialLoading, loadError, loadingProgress } = useData();

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
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black z-0" />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:30px_30px] z-0" />

        {/* Logo/Icon */}
        <div className="relative mb-8 transform hover:scale-105 transition-transform duration-700">
          <div className="hidden lg:block absolute inset-0 bg-cyber-primary/20 blur-3xl rounded-full animate-pulse" />
          <div className="w-20 h-20 bg-black/50 lg:backdrop-blur-xl border border-cyber-primary/30 rounded-2xl flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(0,255,157,0.1)]">
            <div className="w-10 h-10 border-t-2 border-r-2 border-cyber-primary rounded-full animate-spin" />
          </div>
        </div>

        {/* Status Text */}
        <h2 className="text-2xl font-black text-white tracking-[0.2em] uppercase italic mb-6 animate-pulse">
          {loading ? 'Authenticating Pulse' : 'Hydrating Neural Link'}
        </h2>

        {/* Progress Bar Container */}
        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-full h-1.5 mb-2 overflow-hidden lg:backdrop-blur-sm relative">
          {/* Animated Progress Fill */}
          <div
            ref={(el) => el?.style.setProperty('--loading-progress', `${loading ? 100 : progressPercent}%`)}
            className="absolute top-0 left-0 h-full w-[var(--loading-progress)] bg-gradient-to-r from-cyber-primary to-cyan-400 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(0,255,157,0.5)]"
          />
        </div>

        {/* Detail Status */}
        <div className="flex justify-between w-full max-w-md px-1">
          <p className="text-[10px] text-cyber-primary/60 font-mono uppercase tracking-widest">
            {loadingProgress?.current || 'Initializing System...'}
          </p>
          <p className="text-[10px] text-white/40 font-mono">
            {loading ? '...' : `${progressPercent}%`}
          </p>
        </div>

        {/* Error Display with Retry */}
        {loadError && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl max-w-sm w-full backdrop-blur-md animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-red-400 font-mono uppercase tracking-tighter mb-1">Connection Disrupted</p>
                <p className="text-xs text-gray-300 leading-relaxed">{loadError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors border border-red-500/20"
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
      {!user ? (
        <LoginPage />
      ) : (
        <Layout>
          <Suspense fallback={<ModuleLoader />}>
            <Routes>
            {/* Dashboard - Accessible by all authenticated users, content strictly scoped by role & active site */}
            <Route path="/" element={
              <ProtectedRoute module="dashboard">
                {(() => {
                  const activeSiteType = activeSite?.type || '';
                  const isWarehouse = ['Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center'].includes(activeSiteType);
                  const isStore = ['Store', 'Dark Store', 'Retail', 'POS'].includes(activeSiteType);

                  // 1. CEO Default Landing -> Administration Access (/admin) unless scoped to a WMS or POS site
                  if (user?.role === 'super_admin' || (user?.role as string) === 'CEO') {
                    if (isWarehouse) return <Navigate to="/wms-ops" replace />;
                    if (isStore) return <Navigate to="/pos-dashboard" replace />;
                    return <Navigate to="/admin" replace />;
                  }

                  // 2. Strict Site-Type Redirection for all staff
                  if (isWarehouse) {
                    return <Navigate to="/wms-ops" replace />;
                  }
                  if (isStore) {
                    return <Navigate to="/pos-dashboard" replace />;
                  }

                  // L2 Specialized Directors
                  if (user?.role === 'hr_manager' || user?.role === 'hr') return <Navigate to="/employees" replace />;
                  if (user?.role === 'finance_manager' || user?.role === 'auditor') return <Navigate to="/finance" replace />;
                  if (user?.role === 'procurement_manager') return <Navigate to="/procurement" replace />;
                  if (user?.role === 'it_support') return <Navigate to="/settings" replace />;

                  return <Navigate to="/admin" replace />;
                })()}
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

            {/* POS - Cashiers, Managers, Admins */}
            <Route path="/pos" element={
              <ProtectedRoute module="pos">
                <ModuleErrorBoundary moduleName="POS">
                  <POSTerminal />
                </ModuleErrorBoundary>
              </ProtectedRoute>
            } />

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
