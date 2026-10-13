import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, ArrowLeft, Printer, Box, Power, Play, PackageCheck, Vault, UserPlus,
  ReceiptText, ShieldCheck, Users2, LayoutGrid, ChevronDown, Tags
} from 'lucide-react';
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
  const { storePoints, activeSite, shifts, products, effectiveCountry, settings } = useData();
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
  const canOnboard = isManagerialRole(user?.role) && ['store_manager', 'assistant_manager', 'shift_lead', 'store_supervisor', 'super_admin', 'admin', 'operations_manager', 'regional_manager'].includes(user?.role || '');

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
      const isExecutive = ['super_admin', 'regional_manager', 'operations_manager'].includes(user?.role || '');
      navigate(isExecutive ? '/admin' : '/pos');
    }
  };

  const { lastSeenUpdates } = usePOSCommand();

  // ── Notification badge: count UNSEEN products updated in the last 24 h ──
  const updatedProductCount = useMemo(() => {
    const siteId = activeSite?.id || user?.siteId;
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return products.filter((p: any) => {
      const matchesSite = !siteId || p.siteId === siteId || p.site_id === siteId;
      const updatedAt = p.updatedAt || p.updated_at;
      if (!updatedAt) return false;
      const ts = new Date(updatedAt).getTime();
      const isRecent = ts > cutoff;
      const isUnseen = ts > lastSeenUpdates;
      return matchesSite && isRecent && isUnseen;
    }).length;
  }, [products, activeSite, user?.siteId, lastSeenUpdates]);

  // Lock Screen — Apple Minimalist Style
  if (isLocked) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative bg-[var(--theme-bg-app)] transition-colors duration-300">
        <div className="max-w-[400px] w-full bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-3xl p-10 relative z-10 shadow-lg flex flex-col items-center">
          {/* Logo */}
          <div className="relative mb-6 select-none">
            <div className="w-16 h-16 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] flex items-center justify-center text-[var(--theme-text-primary)]">
              <Lock size={28} />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--theme-text-primary)] mb-1">{t('pos.sessionLocked')}</h2>
          <p className="text-xs text-[var(--theme-text-secondary)] uppercase tracking-[0.2em] font-bold mb-8">{t('pos.enterPinToResume')}</p>
          <PinPad pin={pin} setPin={setPin} onEnter={handleUnlock} />
          {pinError && <p className="text-red-500 dark:text-red-400 text-sm mt-4 font-bold animate-pulse">{pinError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full relative bg-[var(--theme-bg-app)] transition-colors duration-300">
      <div className="relative z-10 max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">

        {/* ===== HEADER CARD (Seamless Apple Minimalist Top Bar) ===== */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-transparent border-0 border-transparent shadow-none px-6 pt-4 pb-4 relative z-10">
          {/* Left — Back Action + Store & Shift Status */}
          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <button
              title={t('common.back') || 'Back'}
              aria-label={t('common.back') || 'Back'}
              onClick={handleBack}
              className="px-3.5 py-2 bg-[var(--theme-bg-subtle)] hover:bg-[var(--theme-bg-card-hover)] text-[var(--theme-text-primary)] rounded-2xl transition-all active:scale-95 border border-[var(--theme-border)] shadow-2xs flex items-center gap-2 text-xs font-semibold cursor-pointer group"
            >
              <div className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 transition-transform group-hover:-translate-x-0.5">
                <ArrowLeft size={13} />
              </div>
              <span>{t('common.back') || 'Back'}</span>
            </button>

            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-text-primary)] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{activeSite?.name || t('posCommand.loadingLocation')}</span>
            </span>

            {currentShift ? (
              <span
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-2xs cursor-default"
                title={`Cashier: ${currentShift.cashierName || user?.name || 'Staff'} • Float: ${(currentShift.openingFloat || 0).toLocaleString()}`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
                <span>Drawer Inactive • No Active Shift</span>
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
                onClick={handleEndShift}
                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-2xl border border-rose-500/25 transition-all flex items-center gap-2 shadow-2xs active:scale-95 cursor-pointer"
                title="End Shift and Reconcile Cash Drawer"
              >
                <div className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                  <Power size={13} />
                </div>
                <span>{t('posCommand.endShift') || 'End Shift'}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsStartShiftModalOpen(true)}
                className="px-4 py-2 bg-[var(--theme-primary)] hover:opacity-90 text-[var(--theme-primary-text)] text-xs font-semibold rounded-2xl shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                title="Input opening float and start daily cashier shift"
              >
                <div className="w-5 h-5 rounded-md bg-black/10 dark:bg-white/10 flex items-center justify-center shrink-0">
                  <Play size={12} className="fill-current" />
                </div>
                <span>Start Shift</span>
              </button>
            )}

            {/* Store Inventory Operations */}
            <div className="flex items-center bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] p-1 shadow-2xs gap-0.5">
              <div className="relative">
                <button
                  onClick={() => setIsStockListOpen(true)}
                  className="px-3 py-1.5 hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer group"
                  title="Stock Catalog & Pricing"
                >
                  <div className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Box size={13} />
                  </div>
                  <span>Stock List</span>
                </button>
                {updatedProductCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                    {updatedProductCount > 99 ? '99+' : updatedProductCount}
                  </span>
                )}
              </div>

              <button
                onClick={() => setIsReceivingModalOpen(true)}
                className="px-3 py-1.5 hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer group"
                title="Receive Stock"
              >
                <div className="w-5 h-5 rounded-md bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0">
                  <PackageCheck size={13} />
                </div>
                <span>Receive</span>
              </button>

              <button
                onClick={() => setIsSafeLedgerOpen(true)}
                className="px-3 py-1.5 hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer group"
                title="Drop Safe Ledger & Armored Pickups"
              >
                <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Vault size={13} />
                </div>
                <span>Safe Ledger</span>
              </button>
            </div>

            {/* Store Talent Onboarding */}
            {canOnboard && (
              <button
                type="button"
                onClick={() => setIsOnboardModalOpen(true)}
                className="px-3.5 py-2 bg-[#0071E3] dark:bg-[#2997FF] hover:opacity-95 text-white text-xs font-semibold rounded-2xl shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                title="Onboard store cashiers, sales staff & stock clerks"
              >
                <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                  <UserPlus size={13} />
                </div>
                <span>Onboard Talent</span>
              </button>
            )}

            {/* Terminal Controls — Consolidated Print Center & Lock */}
            <div className="flex items-center bg-[var(--theme-bg-card)] rounded-2xl border border-[var(--theme-border)] p-1 shadow-2xs gap-0.5 relative">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPrintMenuOpen(prev => !prev)}
                  className="px-3 py-1.5 hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer group"
                  title="Unified Print Center (Receipts, Barcodes & Shelf Tags)"
                >
                  <div className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                    <Printer size={13} />
                  </div>
                  <span>Print</span>
                  <ChevronDown size={11} className={`text-[var(--theme-text-muted)] transition-transform duration-150 ${isPrintMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isPrintMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 p-1.5 bg-[var(--theme-bg-card)] border border-[var(--theme-border)] rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPrintMenuOpen(false);
                        handleReprint();
                      }}
                      className="w-full px-3 py-2 text-left rounded-xl hover:bg-[var(--theme-bg-subtle)] transition-colors flex items-center gap-2.5 cursor-pointer group"
                      title="Reprint last customer transaction receipt"
                    >
                      <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                        <ReceiptText size={13} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--theme-text-primary)] leading-tight">Reprint Last Receipt</p>
                        <p className="text-[10px] text-[var(--theme-text-secondary)] mt-0.5">Customer sale receipt</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsPrintMenuOpen(false);
                        setIsPrintHubOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left rounded-xl hover:bg-[var(--theme-bg-subtle)] transition-colors flex items-center gap-2.5 cursor-pointer group"
                      title="Generate barcode labels and shelf price tags"
                    >
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                        <Tags size={13} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--theme-text-primary)] leading-tight">Price Tags & Barcodes</p>
                        <p className="text-[10px] text-[var(--theme-text-secondary)] mt-0.5">Thermal label hub</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleLockScreen}
                className="px-3 py-1.5 hover:bg-[var(--theme-bg-subtle)] text-[var(--theme-text-primary)] text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer group"
                title="Lock Terminal Screen"
              >
                <div className="w-5 h-5 rounded-md bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <Lock size={13} />
                </div>
                <span>Lock</span>
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
          <div className="inline-flex items-center p-1 rounded-2xl bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] shadow-2xs gap-1">
            {[
              { id: 'overview', label: 'Register & Sales', icon: ReceiptText },
              { id: 'audit', label: 'Cash & Audit Control', icon: ShieldCheck },
              { id: 'roster', label: 'Staff & Roster', icon: Users2 },
              { id: 'all', label: 'All Panels', icon: LayoutGrid },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as 'overview' | 'audit' | 'roster' | 'all')}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[var(--theme-bg-card)] text-[var(--theme-text-primary)] shadow-2xs border border-[var(--theme-border)]'
                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-card-hover)]'
                }`}
              >
                <tab.icon size={13} className={activeTab === tab.id ? 'text-[#0071E3] dark:text-[#2997FF]' : ''} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[var(--theme-text-secondary)] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Terminal Live</span>
            {activeSite?.code && <span>• [{activeSite.code}]</span>}
          </div>
        </div>

        {/* ===== PANEL CONTENT ===== */}

        {/* 1. Register & Sales Panel */}
        {(activeTab === 'overview' || activeTab === 'all') && (
          <div className="space-y-6">
            {activeTab === 'all' && (
              <div className="flex items-center gap-2 pt-2 text-xs font-semibold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                <ReceiptText size={14} className="text-[#0071E3] dark:text-[#2997FF]" />
                <span>Register Performance &amp; Live Activity</span>
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
                <ShieldCheck size={14} className="text-[#0071E3] dark:text-[#2997FF]" />
                <span>Daily Cash Drawer &amp; Supervisory Audit</span>
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
                <Users2 size={14} className="text-[#0071E3] dark:text-[#2997FF]" />
                <span>Personnel Roster, Schedule &amp; Team Bonus</span>
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
