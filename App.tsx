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

import MigrationPanel from './pages/MigrationPanel';

import { native } from './utils/native';
import { runAutoMigration } from './utils/autoMigrate';

import { useData } from './contexts/DataContext';

export default function App() {
  const { user, loading } = useStore();
  const { cleanupAdminProducts, activeSite } = useData();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyber-primary"></div>
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
                  // --- ROOT PATH REDIRECTION LOGIC ---

                  // 1. Super Admin with NO Active Site -> Central Ops (Admin Dashboard)
                  // 2. Super Admin WITH Active Site -> Redirect to context-specific dashboard (Store or Warehouse)
                  if (user?.role === 'super_admin') {
                    if (activeSite) {
                      // Contextual Switch: Mimic local manager views
                      if (['Store', 'Dark Store'].includes(activeSite.type)) {
                        return <Navigate to="/pos-dashboard" replace />;
                      }
                      if (['Warehouse', 'Distribution Center'].includes(activeSite.type)) {
                        return <Navigate to="/wms-dashboard" replace />;
                      }
                    }
                    // Default Global View
                    return <Navigate to="/admin" replace />;
                  }

                  const storeRoles = ['manager', 'pos', 'store_supervisor'];
                  const warehouseRoles = ['warehouse_manager', 'dispatcher', 'picker', 'driver', 'inventory_specialist'];

                  if (storeRoles.includes(user?.role || '')) {
                    return <Navigate to="/pos-dashboard" replace />;
                  }
                  if (warehouseRoles.includes(user?.role || '')) {
                    return <Navigate to="/wms-dashboard" replace />;
                  }

                  // Fallback for HR/Auditors/etc if they don't have dashboard access
                  // Redirect to their primary module
                  if (user?.role === 'hr') return <Navigate to="/employees" replace />;
                  if (user?.role === 'auditor') return <Navigate to="/finance" replace />;
                  if (user?.role === 'procurement_manager') return <Navigate to="/procurement" replace />;
                  if (user?.role === 'it_support') return <Navigate to="/settings" replace />;
                  if (user?.role === 'cs_manager') return <Navigate to="/sales" replace />; // or customers

                  return <Navigate to="/admin" replace />; // Default fallback
                })()}
              </ProtectedRoute>
            } />
            {/* Dashboard removed - merged into Admin */}

            {/* Admin Dashboard - Super Admin Only */}
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

            {/* Roadmap - Public/Dev */}
            <Route path="/roadmap" element={
              <Roadmap />
            } />

            {/* Employees - HR, Managers, Admins */}
            <Route path="/employees" element={
              <ProtectedRoute module="employees">
                <Employees />
              </ProtectedRoute>
            } />

            {/* Migration Panel - Super Admin Only */}
            <Route path="/migration" element={
              <ProtectedRoute module="settings">
                <MigrationPanel />
              </ProtectedRoute>
            } />

            {/* Location Selection - Super Admin Only (for Context Switching) */}
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
