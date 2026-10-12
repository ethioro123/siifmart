import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import NetworkStatusIndicator from './NetworkStatusIndicator';
import { GhostModeBanner } from './GhostModeBanner';
import { useData } from '../contexts/DataContext';
import { native } from '../utils/native';

export default function Layout({ children }: { children?: React.ReactNode }) {
  const { activeSite } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const hasMounted = useRef(false);
  const prevSiteIdRef = useRef<string | undefined>(activeSite?.id);

  useEffect(() => {
    // Initial hydration: record initial site once it resolves, do not redirect
    if (!prevSiteIdRef.current) {
      prevSiteIdRef.current = activeSite?.id;
      return;
    }

    // Only redirect when switching from an existing site to a DIFFERENT site
    if (activeSite?.id && activeSite.id !== prevSiteIdRef.current) {
      prevSiteIdRef.current = activeSite.id;
      const siteType = activeSite.type || '';
      const isWarehouse = ['Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center'].includes(siteType);
      const isStore = ['Store', 'Dark Store', 'Retail', 'POS'].includes(siteType);

      if (isWarehouse) {
        navigate('/wms-ops');
      } else if (isStore) {
        navigate(native.isCleanMobileMode() ? '/pos' : '/pos-dashboard');
      } else {
        // HQ / Administration site selected
        navigate(native.isCleanMobileMode() ? '/wms-ops' : '/admin');
      }
    }
  }, [activeSite, navigate]);


  return (
    <div className="flex h-[100dvh] min-h-[100dvh] text-gray-700 dark:text-gray-300 font-sans overflow-hidden transition-colors duration-300" style={{ backgroundColor: 'var(--bg-app)' }}>
      <NetworkStatusIndicator />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <GhostModeBanner />
        <TopBar />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 pb-20 md:pb-6 scroll-smooth">
          <div className="w-full space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}