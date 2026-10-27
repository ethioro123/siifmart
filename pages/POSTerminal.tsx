import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { POSProvider, usePOS } from '../components/pos/POSContext';
import { POSProductGrid } from '../components/pos/POSProductGrid';
import { POSCartPanel } from '../components/pos/POSCartPanel';
import { POSModals } from '../components/pos/POSModals';
import { Store } from 'lucide-react';
import Logo from '../components/Logo';

const POSTerminalContent: React.FC = () => {
  const { needsStoreSelection, setReturnSearchId, setIsReturnModalOpen } = usePOS();
  const { sites, setActiveSite } = useData();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const returnReference = new URLSearchParams(location.search).get('return');
    if (!returnReference) return;
    setReturnSearchId(returnReference);
    setIsReturnModalOpen(true);
    const nextParams = new URLSearchParams(location.search);
    nextParams.delete('return');
    const query = nextParams.toString();
    navigate({ pathname: location.pathname, search: query ? `?${query}` : '' }, { replace: true });
  }, [location.pathname, location.search, navigate, setIsReturnModalOpen, setReturnSearchId]);

  // STORE SELECTION REQUIRED FOR ADMIN USERS
  if (needsStoreSelection) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center p-8 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl max-w-md shadow-xl transition-all duration-300">
          <Logo variant="emblem" size={32} className="mx-auto mb-4 flex justify-center" />
          <h2 className="text-xl font-bold text-[var(--theme-text-primary)] mb-2">{t('pos.selectStore')}</h2>
          <p className="text-xs text-[var(--theme-text-secondary)] mb-6">
            {t('pos.selectStorePrompt')}
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {sites.filter(s => s.type === 'Store').map(site => (
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
    <div className="relative w-full h-full min-h-[calc(100dvh-160px)]">
      <div className="relative z-10 h-[calc(100dvh-140px)] flex flex-col lg:flex-row gap-6 animate-in fade-in duration-300">
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
