import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, ArrowLeft, Printer, Box, Power, LayoutDashboard
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Protected from '../components/Protected';
import PinPad from '../components/pos/PinPad';

// Components & Context
import { POSCommandProvider, usePOSCommand } from '../components/pos-command/POSCommandContext';
import { POSCommandModals } from '../components/pos-command/POSCommandModals';
import { DashboardKPIs } from '../components/pos-command/layout/DashboardKPIs';
import { ShiftProgress } from '../components/pos-command/layout/ShiftProgress';
import { POSCommandCharts } from '../components/pos-command/layout/POSCommandCharts';

// External Existing Components Used inside the layout
import SiteRoster from '../components/SiteRoster';
import RosterManager from '../components/RosterManager';
import { LeaderboardWidget } from '../components/WorkerPointsDisplay';
import StoreBonusDisplay from '../components/StoreBonusDisplay';
import DateRangeSelector from '../components/DateRangeSelector';

import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';

const POSCommandContent: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useStore();
  const { storePoints, activeSite, shifts } = useData();

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
    handleEndShift,
    setIsReceivingModalOpen,
    setIsStockListOpen,
    dateRange,
    setDateRange
  } = usePOSCommand();

  const [pinError, setPinError] = useState('');

  const handleUnlock = () => {
    if (activeShift?.pin !== pin) {
      setPinError(t('pos.invalidPin'));
      setPin('');
      return;
    }
    setIsLocked(false);
    setPin('');
    setPinError('');
  };

  const currentShift = shifts.find(s => s.cashierId === user?.id && s.status === 'Open');

  // Lock Screen — Woody Style
  if (isLocked) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#FAF8F5] via-[#F4F0E6] to-[#FAF8F5] dark:from-[#0B0F0D] dark:via-[#131915] dark:to-[#0B0F0D] transition-colors duration-500">
        {/* Ambient glows */}
        <div className="absolute top-[-10%] left-[10%] w-[45vw] h-[45vw] rounded-full bg-[#2C5E3B]/10 dark:bg-[#1E3F27]/5 blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-amber-600/10 dark:bg-amber-700/5 blur-[140px] pointer-events-none animate-pulse" />
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(44,94,59,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(44,94,59,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(169,203,162,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(169,203,162,0.012)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-[400px] w-full bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-10 relative z-10 shadow-[0_24px_80px_-12px_rgba(34,50,38,0.06)] dark:shadow-[0_32px_96px_-12px_rgba(5,8,6,0.65)] backdrop-blur-2xl flex flex-col items-center">
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

      {/* === Ambient Glows (pinned to page, not container) === */}
      <div className="fixed top-[-10%] left-[5%] w-[50vw] h-[50vw] rounded-full bg-[#2C5E3B]/8 dark:bg-[#1E3F27]/4 blur-[160px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[5%] w-[55vw] h-[55vw] rounded-full bg-amber-600/8 dark:bg-amber-700/3 blur-[180px] pointer-events-none z-0" />

      {/* === Grid Texture === */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(44,94,59,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(44,94,59,0.025)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(169,203,162,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(169,203,162,0.012)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,#000_60%,transparent_100%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">

        {/* ===== HEADER CARD ===== */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-transparent border-b border-[#E2DCCE] dark:border-emerald-950/20 px-6 pt-6 pb-6 relative z-30">
          {/* Inner ambient glow */}
          <div className="absolute inset-0 overflow-hidden rounded-[32px] pointer-events-none">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#2C5E3B]/5 rounded-full blur-[100px] -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-amber-600/5 rounded-full blur-[80px] -ml-24 -mb-24" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-[#2C5E3B]/30 to-transparent" />
          </div>

          {/* Left — Logo + Title */}
          <div className="relative z-10 flex items-center gap-5">
            <button
              title={t('common.back') || 'Back'}
              aria-label={t('common.back') || 'Back'}
              onClick={() => navigate('/pos/terminal')}
              className="p-3.5 bg-white/70 dark:bg-white/5 hover:bg-[#2C5E3B]/10 text-[#4D6E56] dark:text-gray-400 hover:text-[#2C5E3B] dark:hover:text-[#A9CBA2] rounded-2xl transition-all active:scale-95 border border-[#E2DCCE] dark:border-white/5 hover:border-[#2C5E3B]/30 shadow-sm hover:shadow-md backdrop-blur-sm"
            >
              <ArrowLeft size={22} />
            </button>

            {/* Logo icon */}
            <div className="relative group select-none">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#2C5E3B] via-[#4A855A] to-amber-600 rounded-2xl blur-md opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1E3F27] via-[#2C5E3B] to-amber-700 flex items-center justify-center shadow-[0_8px_20px_rgba(44,94,59,0.2)] transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
                <LayoutDashboard size={22} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
              </div>
            </div>

            <div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#1E3F27] dark:text-[#EAE5D9]">
                  SIIF<span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2C5E3B] to-amber-600 dark:from-[#A9CBA2] dark:to-[#DFD5C6] font-black">MART</span>
                </h1>
                <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-[0.25em] font-bold mt-0.5 select-none">{t('posCommand.dashboardHeader')}</p>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                <span className="text-[#4D6E56]/70 dark:text-gray-500 uppercase tracking-widest">{t('pos.activeShift')}:</span>
                <span className={`px-2 py-0.5 rounded-lg border flex items-center gap-1.5 text-[10px] font-bold ${currentShift ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${currentShift ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  {currentShift?.id.substring(0, 8) || t('posCommand.noActiveShift')}
                </span>
                <span className="text-[#4D6E56]/50 dark:text-gray-600">•</span>
                <span className="text-[#4D6E56] dark:text-gray-400 font-sans font-bold tracking-wide">
                  {activeSite?.name || t('posCommand.loadingLocation')}
                </span>
              </div>
            </div>
          </div>

          {/* Right — Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 relative z-50 bg-white/60 dark:bg-black/20 p-2 rounded-2xl border border-[#E2DCCE]/50 dark:border-white/5 backdrop-blur-sm">
            <DateRangeSelector value={dateRange} onChange={setDateRange} />

            <div className="w-px h-8 bg-[#E2DCCE] dark:bg-white/10 mx-1" />

            <button
              onClick={() => setIsReceivingModalOpen(true)}
              className="px-4 py-2.5 bg-[#224429] dark:bg-[#2C5E3B]/20 hover:bg-[#1B3520] dark:hover:bg-[#2C5E3B]/30 text-[#FAF8F5] dark:text-[#A9CBA2] text-[11px] font-bold uppercase tracking-widest rounded-2xl border border-transparent dark:border-[#2C5E3B]/30 transition-all flex items-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98] group"
            >
              <Box size={14} className="group-hover:-translate-y-0.5 transition-transform" />
              {t('posCommand.receiveLabel')}
            </button>

            <button
              onClick={() => setIsStockListOpen(true)}
              className="px-4 py-2.5 bg-white/80 dark:bg-white/5 hover:bg-[#2C5E3B]/10 text-[#2C4D35] dark:text-gray-300 hover:text-[#1E3F27] dark:hover:text-white text-[11px] font-bold uppercase tracking-widest rounded-2xl border border-[#E2DCCE] dark:border-white/5 hover:border-[#2C5E3B]/20 transition-all flex items-center gap-2 group shadow-sm"
            >
              <Box size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" />
              {t('posCommand.stockListLabel')}
            </button>

            <button
              onClick={handleLockScreen}
              className="px-4 py-2.5 bg-white/80 dark:bg-white/5 hover:bg-[#2C5E3B]/10 text-[#2C4D35] dark:text-gray-300 hover:text-[#1E3F27] dark:hover:text-white text-[11px] font-bold uppercase tracking-widest rounded-2xl border border-[#E2DCCE] dark:border-white/5 hover:border-[#2C5E3B]/20 transition-all flex items-center gap-2 group shadow-sm"
            >
              <Lock size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" />
              {t('posCommand.lockScreen')}
            </button>

            <button
              onClick={handleReprint}
              className="px-4 py-2.5 bg-white/80 dark:bg-white/5 hover:bg-[#2C5E3B]/10 text-[#2C4D35] dark:text-gray-300 hover:text-[#1E3F27] dark:hover:text-white text-[11px] font-bold uppercase tracking-widest rounded-2xl border border-[#E2DCCE] dark:border-white/5 hover:border-[#2C5E3B]/20 transition-all flex items-center gap-2 group shadow-sm"
            >
              <Printer size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" />
              {t('posCommand.reprintLast')}
            </button>

            <div className="w-px h-8 bg-[#E2DCCE] dark:bg-white/10 mx-1" />

            <button
              onClick={handleEndShift}
              className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-bold uppercase tracking-[0.15em] rounded-2xl border border-red-500/20 hover:border-red-500/30 transition-all flex items-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98] group"
            >
              <Power size={14} className="group-hover:rotate-180 transition-transform duration-500 ease-out" />
              <span>{t('posCommand.endShift')}</span>
            </button>
          </div>
        </div>

        {/* ===== SHIFT PROGRESS ===== */}
        <ShiftProgress />

        {/* ===== KPI GRID ===== */}
        <DashboardKPIs />

        {/* ===== ROSTER GRID ===== */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white/85 dark:bg-[#18201B]/60 backdrop-blur-2xl border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-8 relative overflow-hidden shadow-[0_24px_80px_-12px_rgba(34,50,38,0.06)] dark:shadow-[0_32px_96px_-12px_rgba(5,8,6,0.65)]">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#2C5E3B]/20 to-transparent" />
            <SiteRoster layout="list" limit={6} highlightUser={user?.id} />
          </div>
          <div className="bg-white/85 dark:bg-[#18201B]/60 backdrop-blur-2xl border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-8 relative overflow-hidden shadow-[0_24px_80px_-12px_rgba(34,50,38,0.06)] dark:shadow-[0_32px_96px_-12px_rgba(5,8,6,0.65)]">
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
