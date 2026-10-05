import React, { useEffect, useRef, useCallback } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, ShieldAlert } from 'lucide-react';
import type { NotificationToastItem } from '../../services/notification-bus';

interface NotificationCardProps {
  item: NotificationToastItem;
  onDismiss: (id: string) => void;
}

export function inferCardMeta(type: string, message: string): {
  title: string;
  badge: string;
  subtitle: string;
  tip?: string;
} {
  const lower = (message || '').toLowerCase();

  // Security / RBAC / Permission
  if (lower.includes('permission') || lower.includes('denied') || lower.includes('forbidden') || lower.includes('unauthorized') || lower.includes('role restriction')) {
    return {
      title: 'Access Restricted',
      badge: 'SECURITY',
      subtitle: 'What went wrong:',
      tip: 'This operation requires higher managerial authorization or a dual-signoff.'
    };
  }

  // Barcode specific conflict
  if (lower.includes('barcode') && (lower.includes('registered') || lower.includes('flagged') || lower.includes('sku') || lower.includes('conflict'))) {
    return {
      title: 'Barcode Conflict Flagged',
      badge: 'CONFLICT',
      subtitle: 'What went wrong:',
      tip: 'This barcode is already assigned to another catalog SKU. Barcodes must be uniquely mapped.'
    };
  }

  // Barcode format / scan alert
  if (lower.includes('barcode')) {
    return {
      title: 'Barcode Validation Alert',
      badge: 'BARCODE',
      subtitle: 'What went wrong:',
      tip: 'Verify barcode symbology, checksum digit, or catalog assignment.'
    };
  }

  // SKU duplicate
  if (lower.includes('sku') && (lower.includes('duplicate') || lower.includes('exists') || lower.includes('conflict'))) {
    return {
      title: 'Duplicate SKU Detected',
      badge: 'DUPLICATE',
      subtitle: 'What went wrong:',
      tip: 'A product with this SKU already exists in this market catalog.'
    };
  }

  // Inventory / Stock
  if (lower.includes('stock') || lower.includes('inventory') || lower.includes('deplet') || lower.includes('insufficient')) {
    return {
      title: 'Inventory Alert',
      badge: 'INVENTORY',
      subtitle: 'What went wrong:',
      tip: 'Verify current on-hand balance or submit an HQ replenishment request.'
    };
  }

  // Pricing / Margins
  if (lower.includes('price') || lower.includes('cost') || lower.includes('margin')) {
    return {
      title: 'Pricing Restriction',
      badge: 'PRICING',
      subtitle: 'What went wrong:',
      tip: 'Ensure pricing is strictly positive and adheres to corporate landed margin rules.'
    };
  }


  // Network / Connection
  if (lower.includes('network') || lower.includes('offline') || lower.includes('timeout') || lower.includes('connection')) {
    return {
      title: 'Connection Notice',
      badge: 'NETWORK',
      subtitle: 'What went wrong:',
      tip: 'SIIFMART offline mode is maintaining your session. Changes will sync upon reconnect.'
    };
  }

  // Default by type
  if (type === 'error' || type === 'alert') {
    return {
      title: 'Action Blocked — Issue Detected',
      badge: 'FLAGGED',
      subtitle: 'What went wrong:'
    };
  }

  if (type === 'warning') {
    return {
      title: 'Attention Required',
      badge: 'WARNING',
      subtitle: 'Notice:'
    };
  }

  if (type === 'success') {
    return {
      title: 'Operation Completed',
      badge: 'SUCCESS',
      subtitle: 'Result:'
    };
  }

  return {
    title: 'System Notice',
    badge: 'INFO',
    subtitle: 'Details:'
  };
}

const THEMES = {
  error: {
    border: 'border-rose-500/40 dark:border-rose-400/40',
    glow: 'shadow-[0_18px_50px_-12px_rgba(244,63,94,0.45)]',
    rail: 'bg-gradient-to-b from-rose-400 to-red-600',
    iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 ring-1 ring-rose-500/30',
    badgeBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    titleColor: 'text-rose-950 dark:text-rose-50',
    explanationBg: 'bg-rose-50/80 dark:bg-rose-500/10 border-rose-200/70 dark:border-rose-400/20',
    subtitleColor: 'text-rose-600 dark:text-rose-300',
    progress: 'bg-gradient-to-r from-rose-500 to-red-600',
    Icon: ShieldAlert
  },
  warning: {
    border: 'border-amber-500/40 dark:border-amber-400/40',
    glow: 'shadow-[0_18px_50px_-12px_rgba(245,158,11,0.4)]',
    rail: 'bg-gradient-to-b from-amber-400 to-orange-600',
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 ring-1 ring-amber-500/30',
    badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    titleColor: 'text-amber-950 dark:text-amber-50',
    explanationBg: 'bg-amber-50/80 dark:bg-amber-500/10 border-amber-200/70 dark:border-amber-400/20',
    subtitleColor: 'text-amber-600 dark:text-amber-300',
    progress: 'bg-gradient-to-r from-amber-500 to-orange-600',
    Icon: AlertTriangle
  },
  success: {
    border: 'border-emerald-500/40 dark:border-emerald-400/40',
    glow: 'shadow-[0_18px_50px_-12px_rgba(16,185,129,0.4)]',
    rail: 'bg-gradient-to-b from-emerald-400 to-teal-600',
    iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-500/30',
    badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    titleColor: 'text-emerald-950 dark:text-emerald-50',
    explanationBg: 'bg-emerald-50/80 dark:bg-emerald-500/10 border-emerald-200/70 dark:border-emerald-400/20',
    subtitleColor: 'text-emerald-600 dark:text-emerald-300',
    progress: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    Icon: CheckCircle2
  },
  info: {
    border: 'border-sky-500/40 dark:border-sky-400/40',
    glow: 'shadow-[0_18px_50px_-12px_rgba(14,165,233,0.4)]',
    rail: 'bg-gradient-to-b from-sky-400 to-indigo-600',
    iconBg: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 ring-1 ring-sky-500/30',
    badgeBg: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
    titleColor: 'text-sky-950 dark:text-sky-50',
    explanationBg: 'bg-sky-50/80 dark:bg-sky-500/10 border-sky-200/70 dark:border-sky-400/20',
    subtitleColor: 'text-sky-600 dark:text-sky-300',
    progress: 'bg-gradient-to-r from-sky-500 to-indigo-600',
    Icon: Info
  }
} as const;

export const NotificationCard: React.FC<NotificationCardProps> = ({ item, onDismiss }) => {
  const isError = item.type === 'error' || item.type === 'alert';
  const isWarning = item.type === 'warning';
  const isSuccess = item.type === 'success';

  const meta = inferCardMeta(item.type, item.message);
  const displayTitle = item.title || meta.title;
  const tipText = item.tip || meta.tip;
  // Errors and warnings explain what went wrong; success/info stay compact.
  const showExplanation = isError || isWarning;

  const duration = item.duration ?? (isError ? 9000 : isWarning ? 6000 : 4500);
  const theme = isError ? THEMES.error : isWarning ? THEMES.warning : isSuccess ? THEMES.success : THEMES.info;
  const IconComponent = theme.Icon;

  // The countdown runs as a single GPU-driven animation (scaleX) plus one timeout.
  // No per-frame React state, so the card never re-renders while counting down.
  const controls = useAnimationControls();
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  const remainingRef = useRef(duration);
  const startedAtRef = useRef(0);
  const pausedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const resume = useCallback(() => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    startedAtRef.current = Date.now();
    clearTimer();
    timerRef.current = setTimeout(() => dismissRef.current(item.id), remainingRef.current);
    controls.start({ scaleX: 0, transition: { duration: remainingRef.current / 1000, ease: 'linear' } });
  }, [controls, item.id]);

  const pause = useCallback(() => {
    if (pausedRef.current) return;
    pausedRef.current = true;
    clearTimer();
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current));
    controls.stop();
  }, [controls]);

  useEffect(() => {
    remainingRef.current = duration;
    pausedRef.current = true; // let resume() perform the initial start
    resume();
    return clearTimer;
  }, [duration, resume]);

  // Escape dismisses the card
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissRef.current(item.id);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item.id]);

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border ${theme.border} ${theme.glow} bg-white/90 dark:bg-[#12161A]/90 backdrop-blur-xl pl-5 pr-3.5 pt-3.5 pb-4 select-text`}
    >
      {/* Accent rail */}
      <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${theme.rail}`} aria-hidden="true" />

      <div className="flex items-start gap-3">
        <div className={`relative shrink-0 p-2 rounded-xl ${theme.iconBg}`}>
          <IconComponent size={18} />
          {isError && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${theme.badgeBg}`}>
              {meta.badge}
            </span>
          </div>
          <h4 className={`mt-1 text-sm font-extrabold tracking-tight leading-snug ${theme.titleColor}`}>
            {displayTitle}
          </h4>

          {showExplanation ? (
            <div className={`mt-2 rounded-xl border p-2.5 ${theme.explanationBg}`}>
              <p className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${theme.subtitleColor}`}>
                {meta.subtitle}
              </p>
              <p className="text-[13px] font-semibold text-stone-900 dark:text-stone-100 leading-relaxed break-words">
                {item.message}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-[13px] font-medium text-stone-700 dark:text-stone-200 leading-relaxed break-words">
              {item.message}
            </p>
          )}

          {tipText && (
            <p className="mt-2 text-[11px] text-stone-600 dark:text-stone-400 font-medium leading-normal">
              💡 {tipText}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => dismissRef.current(item.id)}
          className="shrink-0 p-1.5 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
          title="Dismiss (Esc)"
          aria-label="Dismiss notification"
        >
          <X size={15} />
        </button>
      </div>

      {/* Countdown progress: pauses on hover/focus, resumes where it left off */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/10" aria-hidden="true">
        <motion.div
          className={`h-full origin-left will-change-transform ${theme.progress}`}
          initial={{ scaleX: 1 }}
          animate={controls}
        />
      </div>
    </div>
  );
};
