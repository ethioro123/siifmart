import { CommandProductUpdatesNotice } from '../components/pos-command/CommandProductUpdatesNotice';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, ArrowLeft, Printer, Box, Power, Play, PackageCheck, Vault, UserPlus,
  ReceiptText, ShieldCheck, Users2, LayoutGrid, ChevronDown, Tags
} from 'lucide-react';
import Logo from '../components/Logo';
import { useLanguage } from '../contexts/LanguageContext';
import Protected from '../components/Protected';
import PinPad from '../components/pos/PinPad';
import { matchStaffPin } from '../utils/employeeIdGenerator';
import OnboardTalentModal from '../components/employees/OnboardTalentModal';
import NewHireHandoverBanner from '../components/employees/NewHireHandoverBanner';
import { isManagerialRole } from '../utils/roles';

// Components & Context
import { POSCommandProvider, usePOSCommand } from '../components/pos-command/POSCommandContext';
import { POSCommandModals } from '../components/pos-command/POSCommandModals';
import { DashboardKPIs } from '../components/pos-command/layout/DashboardKPIs';
import { ShiftReconciliationTable } from '../components/pos-command/layout/ShiftReconciliationTable';
import { OverrideVelocityWidget } from '../components/pos-command/layout/OverrideVelocityWidget';
import { SafeLedgerModal } from '../components/pos-command/modals/SafeLedgerModal';
import { POSCommandCharts } from '../components/pos-command/layout/POSCommandCharts';
import { RecentTransactions } from '../components/pos-command/layout/RecentTransactions';

// External Existing Components Used inside the layout
import SiteRoster from '../components/SiteRoster';
import RosterManager from '../components/RosterManager';
import { LeaderboardWidget } from '../components/WorkerPointsDisplay';
import StoreBonusDisplay from '../components/StoreBonusDisplay';
import DateRangeSelector from '../components/DateRangeSelector';

import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { formatShiftId } from '../utils/jobIdFormatter';
import { CyberClock } from '../components/dashboard/widgets/CyberClock';
import type { Country } from '../utils/localization';

const POSCommandContent: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useStore();
  const { storePoints, activeSite, shifts, effectiveCountry, settings } = useData();
  const activeCountry = (activeSite?.country || effectiveCountry || settings?.country || 'ET') as Country;

  const {
    activeShift,
    myPoints,
    siteWorkerPoints,
    isLocked,
    setIsLocked,
    pin,
    setPin,
    handleLockScreen,
    handleReprint,
    handleStartShift,
    handleEndShift,
    isStartShiftModalOpen,
    setIsStartShiftModalOpen,
    setIsReceivingModalOpen,
    setIsStockListOpen,
    setIsPrintHubOpen,
    dateRange,
    setDateRange
  } = usePOSCommand();

  const [pinError, setPinError] = useState('');
  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false);
  const [isSafeLedgerOpen, setIsSafeLedgerOpen] = useState(false);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'roster' | 'all'>('overview');
  const canOnboard = isManagerialRole(user?.role) && ['store_manager', 'assistant_store_manager', 'shift_supervisor', 'group_ceo', 'country_managing_director', 'country_operations_director', 'regional_operations_manager'].includes(user?.role || '');

  const handleUnlock = () => {
    const userPin = user?.code?.trim();
    if (!userPin || !matchStaffPin(userPin, pin.trim())) {
      setPinError(t('pos.invalidPin') || 'Invalid PIN. Enter your staff PIN.');
      setPin('');
      return;
    }
    setIsLocked(false);
    setPin('');
    setPinError('');
  };

  const currentShift = activeShift;

  const handleBack = () => {
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      const isExecutive = ['group_ceo', 'regional_operations_manager', 'country_operations_director'].includes(user?.role || '');
      navigate(isExecutive ? '/admin' : '/pos');
    }
  };

  // Lock Screen — Apple Minimalist Style
  if (isLocked) {
    return (
      <div className="pos-codex-workspace min-h-screen w-full flex items-center justify-center p-4 relative bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] transition-colors duration-300">
        <div className="max-w-[400px] w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-10 relative z-10 shadow-lg flex flex-col items-center">
          {/* Logo */}
          <div className="relative mb-6 select-none flex flex-col items-center gap-4">
            <Logo variant="stacked" size={28} />
            <div className="w-12 h-12 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-primary)]">
              <Lock size={22} />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--theme-text-primary)] mb-1">{t('pos.sessionLocked')}</h2>
          <p className="text-xs text-[var(--theme-text-secondary)] uppercase tracking-[0.2em] font-bold mb-8">{t('pos.enterPinToResume')}</p>
          <PinPad pin={pin} setPin={setPin} onEnter={handleUnlock} />
          {pinError && <p role="alert" className="text-[var(--theme-status-danger-text)] text-sm mt-4 font-semibold">{pinError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="pos-codex-workspace min-h-full w-full relative bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] transition-colors duration-300">
      <div className="relative z-10 max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">

        {/* ===== HEADER CARD (Seamless Apple Minimalist Top Bar) ===== */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-transparent border-0 border-transparent shadow-none px-6 pt-4 pb-4 relative z-10">
          {/* Left — Back Action + Store & Shift Status */}
          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <button
              type="button"
              title={t('common.back') || 'Back'}
              aria-label={t('common.back') || 'Back'}
              onClick={handleBack}
              className="min-h-11 px-3.5 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] rounded-2xl transition-colors border border-[var(--theme-border)] shadow-2xs flex items-center gap-2 text-xs font-semibold group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
            >
              <div className="w-5 h-5 rounded-md bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0 transition-transform group-hover:-translate-x-0.5">
                <ArrowLeft size={13} />
              </div>
              <span>{t('common.back') || 'Back'}</span>
            </button>

            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-primary)] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[var(--theme-status-warning)]" />
              <span>{activeSite?.name || t('posCommand.loadingLocation')}</span>
            </span>

            {currentShift ? (
              <span
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[var(--theme-status-success-bg)] border border-[var(--theme-status-success-border)] text-xs font-semibold text-[var(--theme-status-success-text)] shadow-2xs"
                title={`Cashier: ${currentShift.cashierName || user?.name || 'Staff'} • Float: ${(currentShift.openingFloat || 0).toLocaleString()}`}
              >
                <span className="w-2 h-2 rounded-full bg-[var(--theme-status-success)]" />
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
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-muted)] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-stone-400" />
                <span>{t('posCommand.drawerInactive')}</span>
              </span>
            )}
          </div>

          {/* Center/Right — Sovereign Live Clock & Calendar */}
          <div className="hidden md:flex items-center relative z-30">
            <CyberClock country={activeCountry} compact />
          </div>

          {/* Right — Clean Segmented Action Groups */}
          <div className="flex flex-wrap items-center gap-3 relative z-50">
            {/* Primary Shift Action */}
            {currentShift ? (
              <button
                type="button"
                onClick={handleEndShift}
                className="min-h-11 px-4 bg-[var(--theme-status-danger-bg)] hover:opacity-90 text-[var(--theme-status-danger-text)] text-xs font-semibold rounded-2xl border border-[var(--theme-status-danger-border)] transition-colors flex items-center gap-2 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-status-danger)]"
                title="End Shift and Reconcile Cash Drawer"
              >
                <div className="w-5 h-5 rounded-md bg-[var(--theme-status-danger)]/20 text-[var(--theme-status-danger-text)] flex items-center justify-center shrink-0">
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
                <div className="w-5 h-5 rounded-md bg-black/10 dark:bg-white/10 flex items-center justify-center shrink-0">
                  <Play size={12} className="fill-current" />
                </div>
                <span>{t('posCommand.startShift')}</span>
              </button>
            )}

            <CommandProductUpdatesNotice />

            {/* Store Inventory Operations */}
            <div className="flex items-center bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] p-1 shadow-2xs gap-0.5">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStockListOpen(true)}
                  className="min-h-11 px-3 hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                  title="Stock Catalog & Pricing"
                >
                  <div className="w-5 h-5 rounded-md bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                    <Box size={13} />
                  </div>
                  <span>{t('posCommand.stockList')}</span>
                </button>

              </div>

              <button
                type="button"
                onClick={() => setIsReceivingModalOpen(true)}
                className="min-h-11 px-3 hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                title="Receive Stock"
              >
                <div className="w-5 h-5 rounded-md bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                  <PackageCheck size={13} />
                </div>
                <span>{t('posCommand.receiveLabel')}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSafeLedgerOpen(true)}
                className="min-h-11 px-3 hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                title="Drop Safe Ledger & Armored Pickups"
              >
                <div className="w-5 h-5 rounded-md bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                  <Vault size={13} />
                </div>
                <span>{t('posCommand.safeLedgerLabel')}</span>
              </button>
            </div>

            {/* Store Talent Onboarding */}
            {canOnboard && (
              <button
                type="button"
                onClick={() => setIsOnboardModalOpen(true)}
                className="min-h-11 px-3.5 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] text-xs font-semibold rounded-2xl shadow-xs transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                title="Onboard store cashiers, sales staff & stock clerks"
              >
                <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                  <UserPlus size={13} />
                </div>
                <span>{t('posCommand.onboardTalent')}</span>
              </button>
            )}

            {/* Terminal Controls — Consolidated Print Center & Lock */}
            <div className="flex items-center bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] p-1 shadow-2xs gap-0.5 relative">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPrintMenuOpen(prev => !prev)}
                  aria-expanded={isPrintMenuOpen}
                  aria-controls="pos-command-print-menu"
                  className="min-h-11 px-3 hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                  title="Unified Print Center (Receipts, Barcodes & Shelf Tags)"
                >
                  <div className="w-5 h-5 rounded-md bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
                    <Printer size={13} />
                  </div>
                  <span>{t('posCommand.printAction')}</span>
                  <ChevronDown size={11} className={`text-[var(--theme-text-muted)] transition-transform duration-150 ${isPrintMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isPrintMenuOpen && (
                  <div id="pos-command-print-menu" role="group" aria-label="Print options" className="absolute right-0 top-full mt-2 w-60 p-1.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPrintMenuOpen(false);
                        handleReprint();
                      }}
                      className="w-full min-h-11 px-3 py-2 text-left rounded-xl hover:bg-[var(--theme-bg-subtle)] transition-colors flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                      title="Reprint last customer transaction receipt"
                    >
                      <div className="w-6 h-6 rounded-lg bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
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
                      <div className="w-6 h-6 rounded-lg bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] flex items-center justify-center shrink-0">
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

              <button
                type="button"
                onClick={handleLockScreen}
                className="min-h-11 px-3 hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                title="Lock Terminal Screen"
              >
                <div className="w-5 h-5 rounded-md bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] flex items-center justify-center shrink-0">
                  <Lock size={13} />
                </div>
                <span>{t('posCommand.lockScreen')}</span>
              </button>
            </div>

            {/* Date Filter */}
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
          </div>
        </div>

        {/* ===== NEW RECRUIT CREDENTIAL HANDOVER ALERT ===== */}
        <NewHireHandoverBanner />

        {/* ===== MASTER COMMAND DECK (Unified Main Cards) ===== */}
        <DashboardKPIs />

        {/* ===== PANEL NAVIGATION TABS (Apple Segmented Control) ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-1 border-b border-[var(--theme-border)]">
          <div role="group" aria-label="POS command panels" className="inline-flex items-center p-1 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] shadow-2xs gap-1 overflow-x-auto max-w-full">
            {[
              { id: 'overview', label: t('posCommand.tabOverview'), icon: ReceiptText },
              { id: 'audit', label: t('posCommand.tabAudit'), icon: ShieldCheck },
              { id: 'roster', label: t('posCommand.tabRoster'), icon: Users2 },
              { id: 'all', label: t('posCommand.tabAll'), icon: LayoutGrid },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as 'overview' | 'audit' | 'roster' | 'all')}
                aria-pressed={activeTab === tab.id}
                className={`min-h-11 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                  activeTab === tab.id
                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-2xs border border-[var(--theme-border)]'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                }`}
              >
                <tab.icon size={13} aria-hidden="true" className={activeTab === tab.id ? 'text-[var(--theme-accent)]' : ''} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[var(--theme-text-secondary)] font-mono">
            <span className="w-2 h-2 rounded-full bg-[var(--theme-accent)]" aria-hidden="true" />
            <h1 className="text-sm font-semibold text-[var(--theme-text-primary)]">{t('posCommand.title')}</h1>
            {activeSite?.code && <span>• [{activeSite.code}]</span>}
          </div>
        </div>

        {/* ===== PANEL CONTENT ===== */}

        {/* 1. Register & Sales Panel */}
        {(activeTab === 'overview' || activeTab === 'all') && (
          <div className="space-y-6">
            {activeTab === 'all' && (
              <div className="flex items-center gap-2 pt-2 text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                <ReceiptText size={14} aria-hidden="true" className="text-[var(--theme-accent)]" />
                <span>{t('posCommand.tabOverviewHeader')}</span>
              </div>
            )}
            <POSCommandCharts />
            <RecentTransactions />
          </div>
        )}

        {/* 2. Cash & Audit Control Panel */}
        {(activeTab === 'audit' || activeTab === 'all') && (
          <div className="space-y-6">
            {activeTab === 'all' && (
              <div className="flex items-center gap-2 pt-2 text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                <ShieldCheck size={14} aria-hidden="true" className="text-[var(--theme-accent)]" />
                <span>{t('posCommand.tabAuditHeader')}</span>
              </div>
            )}
            <ShiftReconciliationTable />
            <OverrideVelocityWidget />
          </div>
        )}

        {/* 3. Staff & Floor Roster Panel */}
        {(activeTab === 'roster' || activeTab === 'all') && (
          <div className="space-y-6">
            {activeTab === 'all' && (
              <div className="flex items-center gap-2 pt-2 text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                <Users2 size={14} aria-hidden="true" className="text-[var(--theme-accent)]" />
                <span>{t('posCommand.tabRosterHeader')}</span>
              </div>
            )}

            {/* Shift Roster & Schedules Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 relative overflow-hidden shadow-xs isolate">
                <SiteRoster layout="list" limit={6} highlightUser={user?.id} />
              </div>
              <div className="bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl p-6 relative overflow-hidden shadow-xs isolate">
                <RosterManager />
              </div>
            </div>

            {/* Performance & Bonus Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <StoreBonusDisplay
                  storePoints={storePoints.find(sp => sp.siteId === activeSite?.id)}
                  siteName={activeSite?.name}
                  siteId={activeSite?.id}
                  currentUserRole={user?.role}
                  workerPoints={myPoints}
                  leaderboard={siteWorkerPoints}
                />
              </div>
              <div className="lg:col-span-1">
                <LeaderboardWidget workers={siteWorkerPoints} currentUserId={user?.id} />
              </div>
            </div>
          </div>
        )}

        {/* All Modals */}
        <POSCommandModals />
        <SafeLedgerModal isOpen={isSafeLedgerOpen} onClose={() => setIsSafeLedgerOpen(false)} />
        <OnboardTalentModal isOpen={isOnboardModalOpen} onClose={() => setIsOnboardModalOpen(false)} />
      </div>
    </div>
  );
};

export const POSCommand: React.FC = () => {
  return (
    <Protected permission="VIEW_POS_DASHBOARD">
      <POSCommandProvider>
        <POSCommandContent />
      </POSCommandProvider>
    </Protected>
  );
};

export default POSCommand;
