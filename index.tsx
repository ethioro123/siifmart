import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { StoreProvider } from './contexts/CentralStore';
import { DataProvider } from './contexts/DataContext';
import { LanguageProvider } from './contexts/LanguageContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <StoreProvider>
    <DataProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </DataProvider>
  </StoreProvider>
);
