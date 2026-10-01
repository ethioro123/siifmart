import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, ArrowLeft, Printer, Box, Power, Play, PackageCheck
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Protected from '../components/Protected';
import PinPad from '../components/pos/PinPad';

// Components & Context
import { POSCommandProvider, usePOSCommand } from '../components/pos-command/POSCommandContext';
import { POSCommandModals } from '../components/pos-command/POSCommandModals';
import { DashboardKPIs } from '../components/pos-command/layout/DashboardKPIs';
import { ShiftProgress } from '../components/pos-command/layout/ShiftProgress';
import { ShiftReconciliationTable } from '../components/pos-command/layout/ShiftReconciliationTable';
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

const POSCommandContent: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useStore();
  const { storePoints, activeSite, shifts, products } = useData();

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

  const handleUnlock = () => {
    const userPin = user?.code?.trim();
    if (!userPin || pin.trim() !== userPin) {
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
      navigate('/pos');
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

  // Lock Screen — Woody Style
  if (isLocked) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#FAF8F5] via-[#F4F0E6] to-[#FAF8F5] dark:from-[#0B0F0D] dark:via-[#131915] dark:to-[#0B0F0D] transition-colors duration-500">
        {/* Ambient glows — DESKTOP ONLY */}
        <div className="hidden lg:block absolute top-[-10%] left-[10%] w-[45vw] h-[45vw] rounded-full bg-[#2C5E3B]/10 dark:bg-[#1E3F27]/5 blur-[120px] pointer-events-none animate-pulse" />
        <div className="hidden lg:block absolute bottom-[-10%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-amber-600/10 dark:bg-amber-700/5 blur-[140px] pointer-events-none animate-pulse" />
        {/* Grid — DESKTOP ONLY */}
        <div className="hidden lg:block absolute inset-0 bg-[linear-gradient(to_right,rgba(44,94,59,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(44,94,59,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(169,203,162,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(169,203,162,0.012)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-[400px] w-full bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-10 relative z-10 shadow-[0_24px_80px_-12px_rgba(34,50,38,0.06)] dark:shadow-[0_32px_96px_-12px_rgba(5,8,6,0.65)] lg:backdrop-blur-2xl flex flex-col items-center">
          {/* Logo */}
          <div className="relative group mb-6 select-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#2C5E3B] via-[#4A855A] to-amber-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1E3F27] via-[#2C5E3B] to-amber-700 flex items-center justify-center shadow-[0_8px_20px_rgba(44,94,59,0.25)] transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
              <Lock size={28} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#1E3F27] dark:text-[#EAE5D9] mb-1">{t('pos.sessionLocked')}</h2>
          <p className="text-xs text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-[0.2em] font-bold mb-8">{t('pos.enterPinToResume')}</p>
          <PinPad pin={pin} setPin={setPin} onEnter={handleUnlock} />
          {pinError && <p className="text-red-500 dark:text-red-400 text-sm mt-4 font-bold animate-pulse">{pinError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full relative bg-[#FAF8F5] dark:bg-[#18201B] transition-colors duration-500 selection:bg-[#2C5E3B]/20">

      {/* === Ambient Glows — DESKTOP ONLY === */}
      <div className="hidden lg:block fixed top-[-10%] left-[5%] w-[50vw] h-[50vw] rounded-full bg-[#2C5E3B]/8 dark:bg-[#1E3F27]/4 blur-[160px] pointer-events-none z-0" />
      <div className="hidden lg:block fixed bottom-[-10%] right-[5%] w-[55vw] h-[55vw] rounded-full bg-amber-600/8 dark:bg-amber-700/3 blur-[180px] pointer-events-none z-0" />

      {/* === Grid Texture — DESKTOP ONLY === */}
      <div className="hidden lg:block fixed inset-0 bg-[linear-gradient(to_right,rgba(44,94,59,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(44,94,59,0.025)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(169,203,162,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(169,203,162,0.012)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,#000_60%,transparent_100%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">

        {/* ===== HEADER CARD ===== */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-transparent border-b border-[#E2DCCE] dark:border-emerald-950/20 px-6 pt-6 pb-6 relative z-30">
          {/* Inner ambient glow */}
          <div className="absolute inset-0 overflow-hidden rounded-[32px] pointer-events-none">
            <div className="hidden lg:block absolute top-0 right-0 w-[400px] h-[400px] bg-[#2C5E3B]/5 rounded-full blur-[100px] -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-amber-600/5 rounded-full blur-[80px] -ml-24 -mb-24" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-[#2C5E3B]/30 to-transparent" />
          </div>

          {/* Left — Back Action + Store & Shift Status */}
          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <button
              title={t('common.back') || 'Back'}
              aria-label={t('common.back') || 'Back'}
              onClick={handleBack}
              className="px-3.5 py-2.5 bg-white/70 dark:bg-white/5 hover:bg-[#2C5E3B]/10 text-[#4D6E56] dark:text-gray-300 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] rounded-xl transition-all active:scale-95 border border-[#E2DCCE] dark:border-white/10 shadow-xs flex items-center gap-2 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>{t('common.back') || 'Back'}</span>
            </button>

            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/70 dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 text-xs font-bold text-[#1E3F27] dark:text-[#EAE5D9] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {activeSite?.name || t('posCommand.loadingLocation')}
            </span>

            {currentShift ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active Shift: {formatShiftId(currentShift)}</span>
                <span className="text-[10px] opacity-75 font-mono">
                  ({new Date(currentShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-200/60 dark:bg-white/5 border border-[#E2DCCE] dark:border-white/10 text-xs font-semibold text-stone-600 dark:text-stone-400 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-stone-400" />
                <span>Drawer Inactive • No Active Shift</span>
              </span>
            )}
          </div>

          {/* Right — Clean Segmented Action Groups */}
          <div className="flex flex-wrap items-center gap-3 relative z-50">
            {/* Primary Shift Action */}
            {currentShift ? (
              <button
                onClick={handleEndShift}
                className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider rounded-2xl border border-red-500/30 transition-all flex items-center gap-2 shadow-xs hover:shadow-sm active:scale-95 cursor-pointer"
                title="End Shift and Reconcile Cash Drawer"
              >
                <Power size={14} />
                <span>{t('posCommand.endShift') || 'End Shift'}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsStartShiftModalOpen(true)}
                className="px-5 py-2.5 bg-[#2C5E3B] hover:bg-[#1E3F27] text-white text-xs font-bold uppercase tracking-wider rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer ring-2 ring-[#2C5E3B]/20"
                title="Input opening float and start daily cashier shift"
              >
                <Play size={14} className="fill-current" />
                <span>Start Shift</span>
              </button>
            )}

            {/* Store Inventory Operations */}
            <div className="flex items-center bg-white/70 dark:bg-white/5 rounded-2xl border border-[#E2DCCE] dark:border-white/10 p-1 shadow-xs backdrop-blur-sm">
              <div className="relative">
                <button
                  onClick={() => setIsStockListOpen(true)}
                  className="px-3.5 py-2 hover:bg-[#2C5E3B]/10 text-[#2C4D35] dark:text-gray-300 hover:text-[#1E3F27] dark:hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Stock Catalog & Pricing"
                >
                  <Box size={14} />
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
                className="px-3.5 py-2 hover:bg-[#2C5E3B]/10 text-[#2C4D35] dark:text-gray-300 hover:text-[#1E3F27] dark:hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Receive Stock"
              >
                <PackageCheck size={14} />
                <span>Receive</span>
              </button>
            </div>

            {/* Terminal Controls */}
            <div className="flex items-center bg-white/70 dark:bg-white/5 rounded-2xl border border-[#E2DCCE] dark:border-white/10 p-1 shadow-xs backdrop-blur-sm">
              <button
                onClick={handleReprint}
                className="px-3 py-2 hover:bg-[#2C5E3B]/10 text-stone-600 dark:text-stone-300 hover:text-[#1E3F27] dark:hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Reprint Last Sale"
              >
                <Printer size={14} />
                <span>Reprint</span>
              </button>

              <button
                onClick={() => setIsPrintHubOpen(true)}
                className="px-3 py-2 hover:bg-[#2C5E3B]/10 text-stone-600 dark:text-stone-300 hover:text-[#1E3F27] dark:hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Print Hub"
              >
                <Printer size={14} />
                <span>Print Hub</span>
              </button>

              <button
                onClick={handleLockScreen}
                className="px-3 py-2 hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-600 dark:text-stone-300 hover:text-[#1E3F27] dark:hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Lock Terminal Screen"
              >
                <Lock size={14} />
                <span>Lock</span>
              </button>
            </div>

            {/* Date Filter */}
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
          </div>
        </div>

        {/* ===== SHIFT PROGRESS ===== */}
        <ShiftProgress />

        {/* ===== KPI GRID ===== */}
        <DashboardKPIs />

        {/* ===== ROSTER GRID ===== */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white/85 dark:bg-[#18201B]/60 lg:backdrop-blur-2xl border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-8 relative overflow-hidden shadow-[0_24px_80px_-12px_rgba(34,50,38,0.06)] dark:shadow-[0_32px_96px_-12px_rgba(5,8,6,0.65)]">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#2C5E3B]/20 to-transparent" />
            <SiteRoster layout="list" limit={6} highlightUser={user?.id} />
          </div>
          <div className="bg-white/85 dark:bg-[#18201B]/60 lg:backdrop-blur-2xl border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-8 relative overflow-hidden shadow-[0_24px_80px_-12px_rgba(34,50,38,0.06)] dark:shadow-[0_32px_96px_-12px_rgba(5,8,6,0.65)]">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#A9CBA2]/20 to-transparent" />
            <RosterManager />
          </div>
        </div>

        {/* ===== PERFORMANCE SECTION ===== */}
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

        {/* ===== CHARTS ===== */}
        <POSCommandCharts />

        {/* ===== HQ SHIFT & CASH RECONCILIATION ===== */}
        <ShiftReconciliationTable />

        {/* ===== RECENT TRANSACTIONS ===== */}
        <RecentTransactions />

        {/* All Modals */}
        <POSCommandModals />
      </div>
    </div>
  );
};

export const POSCommand: React.FC = () => {
  return (
    <Protected permission="ACCESS_POS">
      <POSCommandProvider>
        <POSCommandContent />
      </POSCommandProvider>
    </Protected>
  );
};

export default POSCommand;
