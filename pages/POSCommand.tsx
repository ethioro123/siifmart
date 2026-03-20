import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, ArrowLeft, Printer, Box, Power
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Protected from '../components/Protected';
import PinPad from '../components/pos/PinPad'; // Force TS Server refresh

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

  // Lock Screen Render
  if (isLocked) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-cyber-primary/20 flex items-center justify-center mb-6 border border-cyber-primary/50 shadow-[0_0_30px_rgba(0,255,157,0.3)]">
          <Lock size={32} className="text-cyber-primary" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('pos.sessionLocked')}</h2>
        <p className="text-gray-400 mb-8">{t('pos.enterPinToResume')}</p>
        <PinPad pin={pin} setPin={setPin} onEnter={handleUnlock} />
        {pinError && <p className="text-red-400 text-sm mt-4 font-bold animate-pulse">{pinError}</p>}
      </div>
    );
  }

  return (
    <div className="font-sans selection:bg-cyber-primary/30 min-h-full">
      <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 relative z-30 group shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {/* Background Decorative Layer (Handles Clipping for Glows) */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyber-primary/5 rounded-full blur-[100px] -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] -ml-32 -mb-32" />
            {/* Top Edge Detail */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-cyber-primary/50 to-transparent" />
          </div>

          <div className="relative z-10 flex items-center gap-5">
            <button
              title={t('common.back') || "Back"}
              aria-label={t('common.back') || "Back"}
              onClick={() => navigate('/pos/terminal')}
              className="p-3.5 bg-white/5 hover:bg-cyber-primary/10 text-gray-400 hover:text-cyber-primary rounded-2xl transition-all active:scale-95 border border-white/5 hover:border-cyber-primary/30 shadow-[0_0_15px_transparent] hover:shadow-[0_0_20px_rgba(0,255,157,0.2)]"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">
                  {t('posCommand.dashboardHeader')}
                </h1>
                <span className="text-[10px] font-black px-2.5 py-1 bg-cyber-primary/10 text-cyber-primary rounded-lg uppercase tracking-[0.2em] border border-cyber-primary/20 shadow-[0_0_15px_rgba(0,255,157,0.15)] ring-1 ring-cyber-primary/10">
                  v2.0
                </span>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                <span className="text-gray-500 uppercase tracking-widest">{t('pos.activeShift')}:</span>
                <span className={`px-2 py-0.5 rounded border flex items-center gap-1.5 ${currentShift ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${currentShift ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  {currentShift?.id.substring(0, 8) || t('posCommand.noActiveShift')}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400 font-sans font-bold tracking-wide">
                  {activeSite?.name || t('posCommand.loadingLocation')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-50 bg-black/40 p-2 rounded-2xl border border-white/5">
            <DateRangeSelector
              value={dateRange}
              onChange={setDateRange}
            />

            <div className="w-px h-8 bg-white/10 mx-1" />

            <button
              onClick={() => setIsReceivingModalOpen(true)}
              className="px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[11px] font-black uppercase tracking-widest rounded-xl border border-blue-500/20 transition-all flex items-center gap-2 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] group"
            >
              <Box size={14} className="group-hover:-translate-y-0.5 transition-transform" />
              {t('posCommand.receiveLabel')}
            </button>

            <button
              onClick={() => setIsStockListOpen(true)}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[11px] font-black uppercase tracking-widest rounded-xl border border-white/5 hover:border-white/10 transition-all flex items-center gap-2 group"
            >
              <Box size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              {t('posCommand.stockListLabel')}
            </button>
            <button
              onClick={handleLockScreen}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[11px] font-black uppercase tracking-widest rounded-xl border border-white/5 hover:border-white/10 transition-all flex items-center gap-2 group"
            >
              <Lock size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              {t('posCommand.lockScreen')}
            </button>
            <button
              onClick={handleReprint}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[11px] font-black uppercase tracking-widest rounded-xl border border-white/5 hover:border-white/10 transition-all flex items-center gap-2 group"
            >
              <Printer size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              {t('posCommand.reprintLast')}
            </button>

            <div className="w-px h-8 bg-white/10 mx-1" />

            <button
              onClick={handleEndShift}
              className="px-5 py-2.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 text-red-400 text-[11px] font-black uppercase tracking-[0.15em] rounded-xl border border-red-500/30 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_25px_rgba(239,68,68,0.25)] group relative overflow-hidden"
            >
              <Power size={14} className="group-hover:rotate-180 transition-transform duration-500 ease-out relative z-10" />
              <span className="relative z-10">{t('posCommand.endShift')}</span>
            </button>
          </div>
        </div>

        {/* Shift Progress Line */}
        <ShiftProgress />

        {/* KPI Grid */}
        <DashboardKPIs />

        {/* Site Team Roster & Scheduling Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-black/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-primary/20 to-transparent" />
            <SiteRoster layout="list" limit={6} highlightUser={user?.id} />
          </div>
          <div className="bg-black/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-primary/20 to-transparent" />
            <RosterManager />
          </div>
        </div>

        {/* Motivation & Performance Section */}
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

        {/* Charts & Actions Grid */}
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
