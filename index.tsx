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
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  </GlobalErrorBoundary>
);
