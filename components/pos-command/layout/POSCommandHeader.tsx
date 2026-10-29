import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, ArrowLeft, Printer, Box, Power, Play, PackageCheck, Vault,
  UserPlus, ReceiptText, ChevronDown, Tags
} from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useStore } from '../../../contexts/CentralStore';
import { useData } from '../../../contexts/DataContext';
import { usePOSCommand } from '../POSCommandContext';
import { CyberClock } from '../../dashboard/widgets/CyberClock';
import DateRangeSelector from '../../DateRangeSelector';
import { CommandProductUpdatesNotice } from '../CommandProductUpdatesNotice';
import type { Country } from '../../../utils/localization';

export interface POSCommandHeaderProps {
  canOnboard: boolean;
  onOpenSafeLedger: () => void;
  onOpenOnboardTalent: () => void;
}

export const POSCommandHeader: React.FC<POSCommandHeaderProps> = ({
  canOnboard,
  onOpenSafeLedger,
  onOpenOnboardTalent
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useStore();
  const { activeSite, effectiveCountry, settings } = useData();
  const activeCountry = (activeSite?.country || effectiveCountry || settings?.country || 'ET') as Country;

  const {
    activeShift,
    handleLockScreen,
    handleReprint,
    handleEndShift,
    setIsStartShiftModalOpen,
    setIsReceivingModalOpen,
    setIsStockListOpen,
    setIsPrintHubOpen,
    dateRange,
    setDateRange
  } = usePOSCommand();

  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false);
  const printMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPrintMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (printMenuRef.current && !printMenuRef.current.contains(event.target as Node)) {
        setIsPrintMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPrintMenuOpen]);

  const handleBack = () => {
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      const isExecutive = ['group_ceo', 'regional_operations_manager', 'country_operations_director'].includes(user?.role || '');
      navigate(isExecutive ? '/admin' : '/pos');
    }
  };

  const currentShift = activeShift;

  return (
    <div className="space-y-3">
      {/* ===== TIER 1: STATION IDENTITY & SECURITY HEADER ===== */}
      <header className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-4 lg:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Back Button + Store Identity & Shift Status */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            title={t('common.back') || 'Back'}
            aria-label={t('common.back') || 'Back'}
            onClick={handleBack}
            className="min-h-11 px-3.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] rounded-2xl transition-colors border border-[var(--theme-border)] shadow-2xs flex items-center gap-2 text-xs font-semibold group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
          >
            <div className="w-5 h-5 rounded-md bg-[color-mix(in_srgb,var(--theme-accent)_12%,transparent)] text-[var(--theme-accent)] flex items-center justify-center shrink-0 transition-transform group-hover:-translate-x-0.5">
              <ArrowLeft size={13} />
            </div>
            <span>{t('common.back') || 'Back'}</span>
          </button>

          <div className="h-6 w-px bg-[var(--theme-border)] hidden sm:block" />

          {/* Store Name & Store Code */}
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[var(--theme-text-primary)] tracking-tight leading-none">
              {activeSite?.name || t('posCommand.loadingLocation')}
            </h2>
            {activeSite?.code && (
              <span className="px-2 py-0.5 rounded-lg bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs font-mono font-semibold text-[var(--theme-text-secondary)]">
                {activeSite.code}
              </span>
            )}
          </div>

          {/* Counter & Shift Status Pill */}
          {currentShift ? (
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] text-xs font-semibold text-[var(--theme-status-success-text)] shadow-2xs"
              title={`Cashier: ${currentShift.cashierName || user?.name || 'Staff'} • Float: ${(currentShift.openingFloat || 0).toLocaleString()}`}
            >
              <span className="w-2 h-2 rounded-full bg-[var(--theme-status-success)] animate-pulse" />
              <span className="font-mono font-bold">{currentShift.cashierCode || currentShift.cashier_code || user?.code || 'STAFF'}</span>
              <span className="text-[10px] opacity-60">•</span>
              <span>{currentShift.counterNumber || currentShift.counter_number || 'Counter 1'}</span>
              <span className="text-[10px] opacity-75 font-mono">
                ({new Date(currentShift.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: activeCountry === 'KE' ? 'Africa/Nairobi' : 'Africa/Addis_Ababa'
                })})
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-muted)] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[var(--theme-text-muted)]" />
              <span>{t('posCommand.drawerInactive')}</span>
            </span>
          )}
        </div>

        {/* Right: Sovereign Live Clock & Terminal Security Lifecycle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden lg:flex items-center">
            <CyberClock country={activeCountry} compact />
          </div>

          {/* Lock Terminal */}
          <button
            type="button"
            onClick={handleLockScreen}
            className="min-h-11 px-3.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] rounded-2xl border border-[var(--theme-border)] shadow-2xs transition-colors flex items-center gap-2 text-xs font-semibold group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
            title="Lock Terminal Screen"
          >
            <div className="w-5 h-5 rounded-md bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] flex items-center justify-center shrink-0">
              <Lock size={13} />
            </div>
            <span>{t('posCommand.lockScreen')}</span>
          </button>

          {/* Primary Shift Action (End / Start Shift) */}
          {currentShift ? (
            <button
              type="button"
              onClick={handleEndShift}
              className="min-h-11 px-4 bg-[var(--theme-status-danger-bg)] hover:opacity-90 text-[var(--theme-status-danger-text)] text-xs font-semibold rounded-2xl border border-[var(--theme-status-danger-border)] transition-colors flex items-center gap-2 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-status-danger)]"
              title="End Shift and Reconcile Cash Drawer"
            >
              <div className="w-5 h-5 rounded-md bg-[color-mix(in_srgb,var(--theme-status-danger)_20%,transparent)] text-[var(--theme-status-danger-text)] flex items-center justify-center shrink-0">
                <Power size={13} />
              </div>
              <span>{t('posCommand.endShift') || 'End Shift'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsStartShiftModalOpen(true)}
              className="min-h-11 px-4 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] text-xs font-semibold rounded-2xl shadow-xs transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
              title="Input opening float and start daily cashier shift"
            >
              <div className="w-5 h-5 rounded-md bg-[color-mix(in_srgb,var(--theme-primary-text)_20%,transparent)] text-[var(--theme-primary-text)] flex items-center justify-center shrink-0">
                <Play size={12} className="fill-current" />
              </div>
              <span>{t('posCommand.startShift')}</span>
            </button>
          )}
        </div>
      </header>

      {/* ===== TIER 2: COMMAND TOOLBAR & ANALYTICS SCOPE ===== */}
      <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-2.5 sm:p-3 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Left: Operations & Tools */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Store Inventory Group */}
          <div className="flex items-center bg-[var(--theme-bg-subtle)] rounded-xl border border-[var(--theme-border)] p-1 shadow-2xs gap-0.5">
            <button
              type="button"
              onClick={() => setIsStockListOpen(true)}
              className="min-h-10 px-3 hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
              title="Stock Catalog & Pricing"
            >
              <div className="w-5 h-5 rounded-md bg-[color-mix(in_srgb,var(--theme-accent)_12%,transparent)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                <Box size={13} />
              </div>
              <span>{t('posCommand.stockList')}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsReceivingModalOpen(true)}
              className="min-h-10 px-3 hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
              title="Receive Stock"
            >
              <div className="w-5 h-5 rounded-md bg-[color-mix(in_srgb,var(--theme-accent)_12%,transparent)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                <PackageCheck size={13} />
              </div>
              <span>{t('posCommand.receiveLabel')}</span>
            </button>

            <button
              type="button"
              onClick={onOpenSafeLedger}
              className="min-h-10 px-3 hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
              title="Drop Safe Ledger & Armored Pickups"
            >
              <div className="w-5 h-5 rounded-md bg-[color-mix(in_srgb,var(--theme-accent)_12%,transparent)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                <Vault size={13} />
              </div>
              <span>{t('posCommand.safeLedgerLabel')}</span>
            </button>
          </div>

          {/* Services & Tools: Print Center Dropdown */}
          <div className="relative" ref={printMenuRef}>
            <button
              type="button"
              onClick={() => setIsPrintMenuOpen(prev => !prev)}
              aria-expanded={isPrintMenuOpen}
              aria-controls="pos-command-print-menu"
              className="min-h-11 px-3.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] text-xs font-semibold rounded-xl border border-[var(--theme-border)] shadow-2xs transition-colors flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
              title="Unified Print Center (Receipts, Barcodes & Shelf Tags)"
            >
              <div className="w-5 h-5 rounded-md bg-[color-mix(in_srgb,var(--theme-accent)_12%,transparent)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                <Printer size={13} />
              </div>
              <span>{t('posCommand.printAction')}</span>
              <ChevronDown size={12} className={`text-[var(--theme-text-muted)] transition-transform duration-150 ${isPrintMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isPrintMenuOpen && (
              <div id="pos-command-print-menu" role="group" aria-label="Print options" className="absolute left-0 top-full mt-2 w-64 p-1.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setIsPrintMenuOpen(false);
                    handleReprint();
                  }}
                  className="w-full min-h-11 px-3 py-2 text-left rounded-xl hover:bg-[var(--theme-bg-subtle)] transition-colors flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                  title="Reprint last customer transaction receipt"
                >
                  <div className="w-6 h-6 rounded-lg bg-[color-mix(in_srgb,var(--theme-accent)_12%,transparent)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                    <ReceiptText size={13} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--theme-text-primary)] leading-tight">{t('posCommand.reprintReceipt')}</p>
                    <p className="text-[10px] text-[var(--theme-text-secondary)] mt-0.5">{t('posCommand.customerSaleReceipt')}</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPrintMenuOpen(false);
                    setIsPrintHubOpen(true);
                  }}
                  className="w-full min-h-11 px-3 py-2 text-left rounded-xl hover:bg-[var(--theme-bg-subtle)] transition-colors flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                  title="Generate barcode labels and shelf price tags"
                >
                  <div className="w-6 h-6 rounded-lg bg-[color-mix(in_srgb,var(--theme-accent)_12%,transparent)] text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                    <Tags size={13} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--theme-text-primary)] leading-tight">{t('posCommand.printLabels')}</p>
                    <p className="text-[10px] text-[var(--theme-text-secondary)] mt-0.5">{t('posCommand.priceTagsAndBarcodes')}</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Onboard Talent (Managerial role) */}
          {canOnboard && (
            <button
              type="button"
              onClick={onOpenOnboardTalent}
              className="min-h-11 px-3.5 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
              title="Onboard store cashiers, sales staff & stock clerks"
            >
              <div className="w-5 h-5 rounded-md bg-[color-mix(in_srgb,var(--theme-primary-text)_20%,transparent)] text-[var(--theme-primary-text)] flex items-center justify-center shrink-0">
                <UserPlus size={13} />
              </div>
              <span>{t('posCommand.onboardTalent')}</span>
            </button>
          )}
        </div>

        {/* Right: Product Updates Notice & Analytical Time Window Selector */}
        <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
          <CommandProductUpdatesNotice />
          <DateRangeSelector value={dateRange} onChange={setDateRange} align="right" />
        </div>
      </div>
    </div>
  );
};
