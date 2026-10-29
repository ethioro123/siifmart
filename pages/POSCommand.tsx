import { CounterReviewPanel } from '../components/pos-command/layout/CounterReviewPanel';
import React, { useState } from 'react';
import { Lock, ReceiptText, ShieldCheck, Users2, LayoutGrid } from 'lucide-react';
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
import { POSCommandHeader } from '../components/pos-command/layout/POSCommandHeader';
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

import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';

const POSCommandContent: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useStore();
  const { storePoints, activeSite } = useData();

  const {
    myPoints,
    siteWorkerPoints,
    isLocked,
    setIsLocked,
    pin,
    setPin
  } = usePOSCommand();

  const [pinError, setPinError] = useState('');
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

  // Lock Screen — Apple Minimalist Style
  if (isLocked) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] transition-colors duration-300">
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
    <div className="min-h-full w-full relative bg-[var(--theme-bg-app)] text-[var(--theme-text-primary)] transition-colors duration-300">
      <div className="relative z-10 max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">

        {/* ===== TWO-TIER REORGANIZED HEADER & COMMAND TOOLBAR ===== */}
        <POSCommandHeader
          canOnboard={canOnboard}
          onOpenSafeLedger={() => setIsSafeLedgerOpen(true)}
          onOpenOnboardTalent={() => setIsOnboardModalOpen(true)}
        />

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
            <CounterReviewPanel />
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
