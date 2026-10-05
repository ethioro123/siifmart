import React from 'react';
import { useData } from '../contexts/DataContext';
import { POSProvider, usePOS } from '../components/pos/POSContext';
import { POSProductGrid } from '../components/pos/POSProductGrid';
import { POSCartPanel } from '../components/pos/POSCartPanel';
import { POSModals } from '../components/pos/POSModals';
import { MapPin, Store } from 'lucide-react';

const POSTerminalContent: React.FC = () => {
  const { needsStoreSelection } = usePOS();
  const { sites, setActiveSite } = useData();

  // STORE SELECTION REQUIRED FOR ADMIN USERS
  if (needsStoreSelection) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center p-8 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl max-w-md shadow-xl transition-all duration-300">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <MapPin size={32} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-[var(--theme-text-primary)] mb-2">Select a Store</h2>
          <p className="text-xs text-[var(--theme-text-secondary)] mb-6">
            To access POS, tap your store below or select from the dropdown in the top bar.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {sites.filter(s => s.type === 'Store' || s.type === 'Dark Store').map(site => (
              <button
                key={site.id}
                type="button"
                onClick={() => setActiveSite(site.id)}
                className="px-4 py-2.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] border border-[var(--theme-border)] rounded-xl text-xs sm:text-sm font-bold text-[var(--theme-text-primary)] transition-colors cursor-pointer flex items-center gap-2 min-h-[44px] shadow-xs"
              >
                <Store size={15} />
                <span>{site.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[calc(100vh-160px)]">
      <div className="relative z-10 h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6 animate-in fade-in duration-300">
        <POSProductGrid />
        <POSCartPanel />
      </div>

      <POSModals />
    </div>
  );
};

export default function POSTerminal() {
  return (
    <POSProvider>
      <POSTerminalContent />
    </POSProvider>
  );
}
