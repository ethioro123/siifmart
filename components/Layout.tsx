import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import NetworkStatusIndicator from './NetworkStatusIndicator';
import { GhostModeBanner } from './GhostModeBanner';
import { useData } from '../contexts/DataContext';
import { useStore } from '../contexts/CentralStore';
import { getRoleDashboardRoute } from '../utils/roleDashboard';
import { native } from '../utils/native';

export default function Layout({ children }: { children?: React.ReactNode }) {
  const { activeSite } = useData();
  const { user } = useStore();
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
      const targetRoute = getRoleDashboardRoute(user?.role, activeSite.type);
      navigate(targetRoute);
    }
  }, [activeSite, user?.role, navigate]);


  return (
    <div className="flex h-[100dvh] min-h-[100dvh] text-gray-700 dark:text-gray-300 font-sans overflow-hidden transition-colors duration-300" style={{ backgroundColor: 'var(--bg-app)', paddingTop: import.meta.env.MODE === 'staging' ? 'calc(1.5rem + env(safe-area-inset-top, 0px))' : undefined, '--app-top-inset': import.meta.env.MODE === 'staging' ? '1.5rem' : '0px' } as React.CSSProperties}>
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