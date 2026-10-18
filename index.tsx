import React from 'react';
import './index.css';
import ReactDOM from 'react-dom/client';
import App from './App';
import { StoreProvider } from './contexts/CentralStore';
import { DataProvider } from './contexts/DataContext';
import { FulfillmentDataProvider } from './components/fulfillment/FulfillmentDataProvider';
import { RosterProvider } from './contexts/RosterContext';
import { GamificationProvider } from './contexts/GamificationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createIDBPersister } from './services/db/persister';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (keep in memory/cache longer for offline)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const persister = createIDBPersister();

const ASSET_RECOVERY_KEY = 'siifmart:asset-recovery-at';
const SW_RELOAD_KEY = 'siifmart:sw-reload-at';
const RELOAD_COOLDOWN_MS = 60_000;

const canReloadOnce = (key: string) => {
  const now = Date.now();
  try {
    const previousReload = Number(sessionStorage.getItem(key) || 0);
    if (previousReload && now - previousReload < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(key, String(now));
  } catch {
    // Continue with an in-memory guard if browser storage is unavailable.
    const guard = window as typeof window & Record<string, unknown>;
    if (guard[key]) return false;
    guard[key] = true;
  }
  return true;
};

// 1. Recover from old mobile browser/PWA caches after a deployment changes chunk names.
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    if (!canReloadOnce(ASSET_RECOVERY_KEY)) {
      console.error('Asset recovery stopped after a repeated chunk load failure.');
      return;
    }

    console.warn('Chunk load failed. Clearing this app’s stale caches before one recovery reload.');
    void (async () => {
      try {
        const registration = await navigator.serviceWorker?.getRegistration();
        await registration?.unregister();
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          const appPrecache = registration ? `workbox-precache-v2-${registration.scope}` : '';
          await Promise.all(cacheNames
            .filter((name) => name === 'html-cache' || (appPrecache && name.startsWith(appPrecache)))
            .map((name) => caches.delete(name)));
        }
      } catch (error) {
        console.warn('Could not clear the stale app cache before recovery.', error);
      }

      const recoveryUrl = new URL(window.location.href);
      recoveryUrl.searchParams.set('__asset_recovery', String(Date.now()));
      window.location.replace(recoveryUrl.toString());
    })();
  });
}

// 2. Automatically activate updated Service Worker on live web and purge on Capacitor
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const isCapacitor = (window as any).Capacitor?.isNativePlatform?.() || (window as any).Capacitor?.getPlatform?.() === 'android';
  if (isCapacitor) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
  } else {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!(window as any).__swReloading && canReloadOnce(SW_RELOAD_KEY)) {
        (window as any).__swReloading = true;
        window.location.reload();
      }
    });
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <GlobalErrorBoundary>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: Infinity,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            const key = query.queryKey[0] as string;
            // POS-Only Persistence Strategy
            // Only persist critical data needed for offline product lookup and customer assignment
            return ['products', 'customers', 'settings'].includes(key);
          }
        }
      }}
    >
      <StoreProvider>
        <DataProvider>
          <FulfillmentDataProvider>
            <RosterProvider>
              <GamificationProvider>
                <LanguageProvider>
                  <App />
                </LanguageProvider>
              </GamificationProvider>
            </RosterProvider>
          </FulfillmentDataProvider>
        </DataProvider>
      </StoreProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </PersistQueryClientProvider>
  </GlobalErrorBoundary>
);
