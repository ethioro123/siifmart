import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './contexts/CentralStore';
import './utils/clearSession'; // Make clearSession available globally

// Components
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
// Dashboard removed
import POSTerminal from './pages/POSTerminal';
import POSCommand from './pages/POSCommand';
import CentralOperations from './pages/CentralOperations';
import WMSDashboard from './pages/WMSDashboard';
import Inventory from './pages/Inventory';
import NetworkView from './pages/NetworkView';
import SettingsPage from './pages/Settings';
import Roadmap from './pages/Roadmap';
import Procurement from './pages/Procurement';
import Customers from './pages/Customers';
import SalesHistory from './pages/SalesHistory';
import Employees from './pages/Employees';
import Fulfillment from './pages/Fulfillment';
import Merchandising from './pages/Merchandising';
import Financials from './pages/Financials';
import LocationSelect from './pages/LocationSelect';
import Profile from './pages/Profile';

import MigrationPanel from './pages/MigrationPanel';

import { native } from './utils/native';
import { runAutoMigration } from './utils/autoMigrate';

import { useData } from './contexts/DataContext';

export default function App() {
  const { user, loading } = useStore();
  const { cleanupAdminProducts, isDataInitialLoading, loadError } = useData();

  React.useEffect(() => {
    if (native.isNative()) {
      native.toast('Welcome to SIIFMART Native App');
    }

    // Run auto-migration once
    runAutoMigration();

    // STRICT SESSION ISOLATION FOR LOCALHOST
    // This ensures that "multi-account" testing works by forcing sessions to be tab-specific (sessionStorage).
    // It prevents standard localStorage tokens from leaking across tabs.
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.includes('-auth-token')) {
          keysToRemove.push(key);
        }
      }
      if (keysToRemove.length > 0) {
        console.log('🧹 Cleaning up legacy localStorage auth tokens to enforce strict tab isolation:', keysToRemove);
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }
    }
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
  if (loading || (user && isDataInitialLoading)) {
    return (
      <div className="min-h-screen bg-cyber-black flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-cyber-primary/20 blur-3xl rounded-full animate-pulse" />
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyber-primary relative z-10"></div>
        </div>
        <h2 className="text-xl font-black text-white tracking-[0.2em] uppercase italic mb-2">
          {loading ? 'Authenticating Pulse' : 'Hydrating Neural Link'}
        </h2>
        <p className="text-xs text-cyber-primary/60 font-mono uppercase tracking-widest animate-pulse">
          {loadError ? 'Retrying Connection...' : 'Synchronizing local databases (100%)'}
        </p>

        {loadError && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl max-w-sm">
            <p className="text-[10px] text-red-400 font-mono uppercase tracking-tighter mb-2">Connection Disrupted</p>
            <p className="text-[11px] text-gray-400">{loadError}</p>
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
          <Routes>
            {/* Dashboard - Accessible by all authenticated users, content varies by role */}
            <Route path="/" element={
              <ProtectedRoute module="dashboard">
                {(() => {
                  // 1. CEO & L2 Directors -> Location Select
                  const l2Roles = ['regional_manager', 'operations_manager', 'supply_chain_manager'];
                  if (user?.role === 'super_admin' || l2Roles.includes(user?.role || '')) {
                    return <Navigate to="/location-select" replace />;
                  }

                  // Store Roles (L3 + L4 Store Staff)
                  const storeRoles = ['store_manager', 'assistant_manager', 'shift_lead', 'cashier', 'sales_associate', 'stock_clerk', 'customer_service', 'manager', 'pos'];

                  // Warehouse Manager Roles (get dashboard)
                  const warehouseManagerRoles = ['warehouse_manager', 'dispatch_manager'];

                  // Warehouse Operations Roles (get Fulfillment/Ops view)
                  const warehouseOpRoles = ['picker', 'packer', 'driver', 'receiver', 'forklift_operator', 'inventory_specialist', 'dispatcher'];

                  if (warehouseOpRoles.includes(user?.role || '')) {
                    return <Navigate to="/wms-ops" replace />;
                  }

                  if (warehouseManagerRoles.includes(user?.role || '')) {
                    return <Navigate to="/wms-dashboard" replace />;
                  }

                  if (storeRoles.includes(user?.role || '')) {
                    return <Navigate to="/pos-dashboard" replace />;
                  }

                  // L2 Specialized Directors
                  if (user?.role === 'hr_manager' || user?.role === 'hr') return <Navigate to="/employees" replace />;
                  if (user?.role === 'finance_manager' || user?.role === 'auditor') return <Navigate to="/finance" replace />;
                  if (user?.role === 'procurement_manager') return <Navigate to="/procurement" replace />;
                  if (user?.role === 'it_support') return <Navigate to="/settings" replace />;
                  if (user?.role === 'admin') return <Navigate to="/admin" replace />;

                  return <Navigate to="/admin" replace />; // Default fallback
                })()}
              </ProtectedRoute>
            } />
            {/* Dashboard removed - merged into Admin */}

            {/* Admin Dashboard - CEO Only */}
            <Route path="/admin" element={
              <ProtectedRoute module="admin">
                <CentralOperations />
              </ProtectedRoute>
            } />

            {/* POS - Cashiers, Managers, Admins */}
            <Route path="/pos" element={
              <ProtectedRoute module="pos">
                <POSTerminal />
              </ProtectedRoute>
            } />

            {/* POS Command Center - Store staff only, NOT super_admin */}
            <Route path="/pos-dashboard" element={
              <ProtectedRoute module="pos">
                <POSCommand />
              </ProtectedRoute>
            } />

            {/* Sales History - Managers, Admins, Auditors */}
            <Route path="/sales" element={
              <ProtectedRoute module="sales">
                <SalesHistory />
              </ProtectedRoute>
            } />

            {/* Inventory - WMS, Managers, Admins, Auditors */}
            <Route path="/inventory" element={
              <ProtectedRoute module="inventory">
                <Inventory />
              </ProtectedRoute>
            } />

            {/* Network Inventory - All authenticated users can view */}
            <Route path="/network-inventory" element={
              <ProtectedRoute module="inventory">
                <NetworkView />
              </ProtectedRoute>
            } />

            {/* Warehouse Operations - WMS, Pickers, Drivers, Admins */}
            <Route path="/wms-ops" element={
              <ProtectedRoute module="warehouse">
                <Fulfillment />
              </ProtectedRoute>
            } />

            {/* WMS Dashboard */}
            <Route path="/wms-dashboard" element={
              <ProtectedRoute module="warehouse">
                <WMSDashboard />
              </ProtectedRoute>
            } />

            {/* Procurement - WMS, Managers, Admins */}
            <Route path="/procurement" element={
              <ProtectedRoute module="procurement">
                <Procurement />
              </ProtectedRoute>
            } />

            {/* Pricing - Managers, Admins */}
            <Route path="/pricing" element={
              <ProtectedRoute module="pricing">
                <Merchandising />
              </ProtectedRoute>
            } />

            {/* Finance - HR, Admins, Auditors */}
            <Route path="/finance" element={
              <ProtectedRoute module="finance">
                <Financials />
              </ProtectedRoute>
            } />

            {/* Customers - POS, Managers, Admins */}
            <Route path="/customers" element={
              <ProtectedRoute module="customers">
                <Customers />
              </ProtectedRoute>
            } />


            {/* Settings - HR, Admins */}
            <Route path="/settings" element={
              <ProtectedRoute module="settings">
                <SettingsPage />
              </ProtectedRoute>
            } />

            {/* Roadmap/Brainstorm Canvas - CEO ONLY */}
            <Route path="/roadmap" element={
              <ProtectedRoute module="admin">
                <Roadmap />
              </ProtectedRoute>
            } />

            {/* Employees - HR, Managers, Admins */}
            <Route path="/employees" element={
              <ProtectedRoute module="employees">
                <Employees />
              </ProtectedRoute>
            } />

            {/* My Profile - All authenticated users */}
            <Route path="/profile" element={
              <ProtectedRoute module="profile">
                <Profile />
              </ProtectedRoute>
            } />

            {/* Migration Panel - CEO Only */}
            <Route path="/migration" element={
              <ProtectedRoute module="settings">
                <MigrationPanel />
              </ProtectedRoute>
            } />

            {/* Location Selection - CEO Only (for Context Switching) */}
            <Route path="/location-select" element={
              <ProtectedRoute module="admin">
                <LocationSelect />
              </ProtectedRoute>
            } />

            {/* Redirect /login to dashboard if already authenticated */}
            <Route path="/login" element={<Navigate to="/" replace />} />

            <Route path="*" element={<div className="text-center pt-20 text-gray-500">Module Access Restricted or Not Found</div>} />
          </Routes>
        </Layout>
      )}
    </Router>
  );
}
