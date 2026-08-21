import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import NetworkStatusIndicator from './NetworkStatusIndicator';
import { GhostModeBanner } from './GhostModeBanner';
import { useData } from '../contexts/DataContext';

export default function Layout({ children }: { children?: React.ReactNode }) {
  const { activeSite } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const hasMounted = useRef(false);
  const prevSiteIdRef = useRef<string | undefined>(activeSite?.id);

  useEffect(() => {
    // Skip on initial mount — just record the starting site id
    if (!hasMounted.current) {
      hasMounted.current = true;
      prevSiteIdRef.current = activeSite?.id;
      return;
    }

    // After mount, any real site selection (even from empty state) triggers redirect
    if (activeSite?.id && activeSite.id !== prevSiteIdRef.current) {
      prevSiteIdRef.current = activeSite.id;
      const siteType = activeSite.type || '';
      const isWarehouse = ['Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center'].includes(siteType);
      const isStore = ['Store', 'Dark Store', 'Retail', 'POS'].includes(siteType);

      if (isWarehouse) {
        navigate('/wms-ops');
      } else if (isStore) {
        navigate('/pos-dashboard');
      } else {
        // HQ / Administration site selected
        navigate('/admin');
      }
    } else {
      // Site was cleared (setActiveSite('')) — just update ref, no redirect
      prevSiteIdRef.current = activeSite?.id;
    }
  }, [activeSite, navigate]);


  return (
    <div className="flex h-screen text-gray-700 dark:text-gray-300 font-sans overflow-hidden transition-colors duration-300" style={{ backgroundColor: 'var(--bg-app)' }}>
      <NetworkStatusIndicator />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <GhostModeBanner />
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scroll-smooth">
          <div className="w-full space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}