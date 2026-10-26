import React, { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, Pause, Check } from 'lucide-react';

interface AiStatusState {
  isWorking: boolean;
  pendingReload: boolean;
  changedCount: number;
  justFinished?: boolean;
}

export const AiReloadIndicator: React.FC = () => {
  // Only render in development and staging
  if (!import.meta.env.DEV) {
    return null;
  }

  const [status, setStatus] = useState<AiStatusState>({
    isWorking: false,
    pendingReload: false,
    changedCount: 0
  });
  const [manualMode, setManualMode] = useState<boolean>(() => {
    return localStorage.getItem('siifmart_ai_reload_manual') === 'true';
  });
  const [isReloading, setIsReloading] = useState(false);

  useEffect(() => {
    // Check initial status via API
    fetch('/__siifmart_ai/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setStatus({
            isWorking: data.isWorking,
            pendingReload: data.pendingReload,
            changedCount: data.changedCount || 0
          });
        }
      })
      .catch(() => {});

    // Listen to custom Vite HMR events
    const hot = (import.meta as any).hot;
    if (!hot) return;

    const handleAiStatus = (data: AiStatusState) => {
      setStatus(data);
      if (data.justFinished && !manualMode) {
        setIsReloading(true);
      }
    };

    hot.on('siifmart:ai-status', handleAiStatus);

    return () => {
      try {
        hot.off?.('siifmart:ai-status', handleAiStatus);
      } catch {
        // Ignore
      }
    };
  }, [manualMode]);

  const handleManualReload = async () => {
    setIsReloading(true);
    try {
      await fetch('/__siifmart_ai/reload', { method: 'POST' });
    } catch {
      window.location.reload();
    }
  };

  const toggleManualMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMode = !manualMode;
    setManualMode(nextMode);
    localStorage.setItem('siifmart_ai_reload_manual', String(nextMode));
  };

  // Only display if AI is working, changes are pending, or reloading
  if (!status.isWorking && !status.pendingReload && !isReloading) {
    return null;
  }

  return (
    <aside 
      aria-label="Development AI reload status"
      className="fixed bottom-4 right-4 z-[9990] flex items-center gap-2 px-3 py-2 rounded-2xl bg-[var(--theme-bg-card)]/90 backdrop-blur-xl border border-[var(--theme-border)] shadow-2xl text-xs font-medium text-[var(--theme-text-primary)] animate-in fade-in slide-in-from-bottom-2 duration-200 select-none"
    >
      <div className="flex items-center gap-2 min-w-0">
        {status.isWorking ? (
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping absolute opacity-75" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 relative" />
          </div>
        ) : isReloading ? (
          <RefreshCw size={13} className="text-primary animate-spin" />
        ) : (
          <Check size={13} className="text-emerald-500" />
        )}

        <div className="flex items-center gap-1.5 truncate">
          <Sparkles size={12} className="text-primary shrink-0" />
          <span className="text-[11px] font-semibold tracking-tight">
            {status.isWorking
              ? `AI Editing · Live reload paused${status.changedCount > 0 ? ` (${status.changedCount})` : ''}`
              : isReloading
              ? 'Applying changes · Reloading...'
              : `Changes ready (${status.changedCount})`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 pl-1.5 border-l border-[var(--theme-border)]">
        <button
          onClick={handleManualReload}
          disabled={isReloading}
          className="min-h-[28px] px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[10px] font-semibold uppercase tracking-wider transition-colors flex items-center gap-1 touch-manipulation cursor-pointer"
          title="Reload the page now"
        >
          <RefreshCw size={10} className={isReloading ? 'animate-spin' : ''} />
          <span>Reload</span>
        </button>

        <button
          onClick={toggleManualMode}
          className={`min-h-[28px] px-2 py-1 rounded-xl border text-[10px] font-medium tracking-tight transition-colors touch-manipulation cursor-pointer ${
            manualMode
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              : 'bg-[var(--theme-bg-subtle)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
          }`}
          title={manualMode ? 'Switch to Auto-reload on AI finish' : 'Switch to Manual-only reload'}
        >
          {manualMode ? <Pause size={10} /> : <Check size={10} />}
          <span className="ml-1">{manualMode ? 'Manual' : 'Auto'}</span>
        </button>
      </div>
    </aside>
  );
};
