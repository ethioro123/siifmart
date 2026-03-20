import React from 'react';
import { useData } from '../contexts/DataContext';
import { POSProvider, usePOS } from '../components/pos/POSContext';
import { POSProductGrid } from '../components/pos/POSProductGrid';
import { POSCartPanel } from '../components/pos/POSCartPanel';
import { POSModals } from '../components/pos/POSModals';
import { MapPin } from 'lucide-react';

const POSTerminalContent: React.FC = () => {
  const { needsStoreSelection } = usePOS();
  const { sites } = useData();

  // 🔒 STORE SELECTION REQUIRED FOR ADMIN USERS
  if (needsStoreSelection) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8 bg-cyber-gray border border-white/10 rounded-2xl max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <MapPin size={32} className="text-yellow-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Select a Store</h2>
          <p className="text-gray-400 mb-6">
            To access POS, please select a specific store from the dropdown in the top bar.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {sites.filter(s => s.type === 'Store' || s.type === 'Dark Store').slice(0, 5).map(site => (
              <span key={site.id} className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">
                {site.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6 relative animate-in fade-in duration-700">
        <POSProductGrid />
        <POSCartPanel />
      </div>

      <POSModals />
    </>
  );
};

export default function POSTerminal() {
  return (
    <POSProvider>
      <POSTerminalContent />
    </POSProvider>
  );
}
