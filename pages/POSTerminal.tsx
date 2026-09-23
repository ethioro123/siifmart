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

  // 🔒 STORE SELECTION REQUIRED FOR ADMIN USERS
  if (needsStoreSelection) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white/95 dark:bg-[#18201B]/95 border border-[#E2DCCE] dark:border-[#223326] rounded-[32px] max-w-md shadow-xl transition-all duration-300">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-600/10 dark:bg-amber-700/10 flex items-center justify-center">
            <MapPin size={32} className="text-amber-600 dark:text-amber-500" />
          </div>
          <h2 className="text-xl font-extrabold text-[#1E3F27] dark:text-[#EAE5D9] mb-2">Select a Store</h2>
          <p className="text-sm text-[#4D6E56] dark:text-[#7A9E83] mb-6">
            To access POS, tap your store below or select from the dropdown in the top bar.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {sites.filter(s => s.type === 'Store' || s.type === 'Dark Store').map(site => (
              <button
                key={site.id}
                type="button"
                onClick={() => setActiveSite(site.id)}
                className="px-4 py-2.5 bg-[#2C5E3B]/10 hover:bg-[#2C5E3B]/20 active:bg-[#2C5E3B]/30 dark:bg-[#2C5E3B]/20 dark:hover:bg-[#2C5E3B]/30 border border-[#2C5E3B]/30 rounded-xl text-xs sm:text-sm font-bold text-[#1E3F27] dark:text-[#A9CBA2] transition-colors cursor-pointer flex items-center gap-2 min-h-[44px]"
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
      {/* Premium Decorative Ambient Glows — DESKTOP ONLY (blur kills mobile GPU) */}
      <div className="hidden lg:block absolute top-[-10%] left-[10%] w-[45vw] h-[45vw] rounded-full bg-[#2C5E3B]/10 dark:bg-[#1E3F27]/5 blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="hidden lg:block absolute bottom-[-10%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-amber-600/10 dark:bg-amber-700/3 blur-[140px] pointer-events-none animate-pulse-slow" />

      {/* Grid Pattern — DESKTOP ONLY */}
      <div className="hidden lg:block absolute inset-0 bg-[linear-gradient(to_right,rgba(44,94,59,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(44,94,59,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(169,203,162,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(169,203,162,0.012)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6 animate-in fade-in duration-700">
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
