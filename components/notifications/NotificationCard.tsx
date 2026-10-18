import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, ShieldAlert, ChevronDown, FileText } from 'lucide-react';
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

  // Recognize concrete failure signals and avoid advice that assumes app behavior.
  if (lower.includes('permission') || lower.includes('denied') || lower.includes('forbidden') || lower.includes('unauthorized') || lower.includes('role restriction')) {
    return {
      title: 'Access Restricted',
      badge: 'SECURITY',
      subtitle: 'What went wrong:',
      tip: 'Check that you are signed in with the role and site access required for this action.'
    };
  }

  // Barcode specific conflict
  if (lower.includes('barcode') && (lower.includes('registered') || lower.includes('flagged') || lower.includes('sku') || lower.includes('conflict'))) {
    return {
      title: 'Barcode Conflict Flagged',
      badge: 'CONFLICT',
      subtitle: 'What went wrong:',
      tip: 'Check the existing product record before changing the barcode assignment.'
    };
  }

  // Barcode format / scan alert
  if (lower.includes('barcode')) {
    return {
      title: 'Barcode Validation Alert',
      badge: 'BARCODE',
      subtitle: 'What went wrong:',
      tip: 'Rescan the label and check that its barcode is complete and readable.'
    };
  }

  // SKU duplicate
  if (lower.includes('sku') && (lower.includes('duplicate') || lower.includes('exists') || lower.includes('conflict'))) {
    return {
      title: 'Duplicate SKU Detected',
      badge: 'DUPLICATE',
      subtitle: 'What went wrong:',
      tip: 'Open the matching product record to confirm whether it is the item you need.'
    };
  }

  // Inventory / Stock
  if (lower.includes('stock') || lower.includes('inventory') || lower.includes('deplet') || lower.includes('insufficient')) {
    return {
      title: 'Inventory Alert',
      badge: 'INVENTORY',
      subtitle: 'What went wrong:',
      tip: 'Review the latest stock balance and the quantity requested before trying again.'
    };
  }

  // Pricing / cost input
  if (lower.includes('price') || lower.includes('cost') || lower.includes('margin')) {
    return {
      title: lower.includes('margin') ? 'Margin Check' : 'Pricing Issue',
      badge: 'PRICING',
      subtitle: 'What went wrong:',
      tip: 'Check the entered amount, currency, and any pricing limits shown on this screen.'
    };
  }


  // Network / Connection
  if (lower.includes('network') || lower.includes('offline') || lower.includes('connection') || (lower.includes('timeout') && !lower.includes('statement timeout') && !lower.includes('database') && !lower.includes('supabase') && !lower.includes('pgrst'))) {
    return {
      title: 'Connection Notice',
      badge: 'NETWORK',
      subtitle: 'What went wrong:',
      tip: 'Check your connection, then retry. Confirm whether the action completed before submitting it again.'
    };
  }

  if (lower.includes('57014') || lower.includes('statement timeout') || lower.includes('database') || lower.includes('supabase') || lower.includes('pgrst') || lower.includes('query timed out')) {
    return {
      title: 'Data Service Issue',
      badge: 'DATA',
      subtitle: 'What went wrong:',
      tip: 'Wait briefly and retry. If it continues, share this message with your support or system administrator.'
    };
  }

  if (lower.includes('session') || lower.includes('token expired') || lower.includes('sign in') || lower.includes('login')) {
    return {
      title: 'Sign-in Needed',
      badge: 'ACCOUNT',
      subtitle: 'What happened:',
      tip: 'Sign in again to continue. If you were saving work, check whether it was saved before repeating the action.'
    };
  }

  if (lower.includes('required') || lower.includes('invalid') || lower.includes('validation') || lower.includes('must be')) {
    return {
      title: 'Check the Entered Information',
      badge: 'INPUT',
      subtitle: 'What needs attention:',
      tip: 'Review the highlighted fields and correct the value before submitting again.'
    };
  }

  if (lower.includes('not found') || lower.includes('no longer exists') || lower.includes('missing record')) {
    return {
      title: 'Record Not Found',
      badge: 'RECORD',
      subtitle: 'What happened:',
      tip: 'Refresh the list and check that the record is still available to your account.'
    };
  }

  if (lower.includes('save') || lower.includes('update') || lower.includes('create') || lower.includes('submit') || lower.includes('failed')) {
    return {
      title: 'Could Not Complete Action',
      badge: 'ACTION',
      subtitle: 'What went wrong:',
      tip: 'Check the details and try again. If it repeats, share the message with your support or system administrator.'
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
    border: 'border-[var(--theme-status-danger-border)]', rail: 'bg-[var(--theme-status-danger)]',
    iconBg: 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)]',
    badgeBg: 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]',
    titleColor: 'text-[var(--theme-text-primary)]',
    explanationBg: 'bg-[var(--theme-bg-subtle)] border border-[var(--theme-status-danger-border)]',
    subtitleColor: 'text-[var(--theme-status-danger-text)]', progress: 'bg-[var(--theme-status-danger)]',
    Icon: ShieldAlert
  },
  warning: {
    border: 'border-[var(--theme-status-warning-border)]', rail: 'bg-[var(--theme-status-warning)]',
    iconBg: 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)]',
    badgeBg: 'bg-[var(--theme-status-warning-bg)] text-[var(--theme-status-warning-text)] border border-[var(--theme-status-warning-border)]',
    titleColor: 'text-[var(--theme-text-primary)]',
    explanationBg: 'bg-[var(--theme-bg-subtle)] border border-[var(--theme-status-warning-border)]',
    subtitleColor: 'text-[var(--theme-status-warning-text)]', progress: 'bg-[var(--theme-status-warning)]',
    Icon: AlertTriangle
  },
  success: {
    border: 'border-[var(--theme-status-success-border)]', rail: 'bg-[var(--theme-status-success)]',
    iconBg: 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)]',
    badgeBg: 'bg-[var(--theme-status-success-bg)] text-[var(--theme-status-success-text)] border border-[var(--theme-status-success-border)]',
    titleColor: 'text-[var(--theme-text-primary)]',
    explanationBg: 'bg-[var(--theme-bg-subtle)] border border-[var(--theme-status-success-border)]',
    subtitleColor: 'text-[var(--theme-status-success-text)]', progress: 'bg-[var(--theme-status-success)]',
    Icon: CheckCircle2
  },
  info: {
    border: 'border-[var(--theme-status-info-border)]', rail: 'bg-[var(--theme-status-info)]',
    iconBg: 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)]',
    badgeBg: 'bg-[var(--theme-status-info-bg)] text-[var(--theme-status-info-text)] border border-[var(--theme-status-info-border)]',
    titleColor: 'text-[var(--theme-text-primary)]',
    explanationBg: 'bg-[var(--theme-bg-subtle)] border border-[var(--theme-status-info-border)]',
    subtitleColor: 'text-[var(--theme-status-info-text)]', progress: 'bg-[var(--theme-status-info)]',
    Icon: Info
  }
} as const;

export const NotificationCard: React.FC<NotificationCardProps> = ({ item, onDismiss }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
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
    const handleVisibilityChange = () => {
      if (document.hidden) pause();
      else resume();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pause, resume]);

  useEffect(() => {
    remainingRef.current = duration;
    pausedRef.current = true; // let resume() perform the initial start
    if (!document.hidden) resume();
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
      onFocusCapture={pause}
      onBlurCapture={event => {
        const nextTarget = event.relatedTarget;
        if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) resume();
      }}
      className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border ${theme.border} bg-[var(--theme-bg-card)] shadow-xl shadow-black/20 pl-4 pr-2.5 pt-3.5 pb-4 sm:pl-5 sm:pr-3.5 select-text`}
    >
      {/* Accent rail */}
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${theme.rail}`} aria-hidden="true" />

      <div className="flex items-start gap-3">
        <div className={`relative mt-0.5 shrink-0 rounded-xl p-2.5 ${theme.iconBg}`} aria-hidden="true">
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
            <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${theme.badgeBg}`}>
              {meta.badge}
            </span>
          </div>
          <h4 className={`mt-1.5 text-[15px] font-bold tracking-tight leading-snug ${theme.titleColor}`}>
            {displayTitle}
          </h4>

          {showExplanation ? (
            <div className={`mt-2 rounded-xl border p-2.5 ${theme.explanationBg}`}>
              <p className={`mb-1 text-[11px] font-bold uppercase tracking-wide ${theme.subtitleColor}`}>
                {meta.subtitle}
              </p>
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100 leading-relaxed break-words">
                {item.message}
              </p>
            </div>
          ) : (
            <p className="mt-1.5 text-sm font-medium text-stone-700 dark:text-stone-200 leading-relaxed break-words">
              {item.message}
            </p>
          )}

          {tipText && (
            <div className="mt-2.5 flex gap-2 rounded-lg bg-stone-100 px-3 py-2 dark:bg-white/5">
              <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">Next step</span>
              <p className="text-xs font-medium leading-relaxed text-stone-700 dark:text-stone-300">{tipText}</p>
            </div>
          )}

          {item.details && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setDetailsOpen(open => !open)}
                aria-expanded={detailsOpen}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <FileText size={14} aria-hidden="true" />
                {detailsOpen ? 'Hide technical details' : 'Show technical details'}
                <ChevronDown size={14} className={`transition-transform ${detailsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {detailsOpen && (
                <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-stone-100 p-2.5 text-xs leading-relaxed text-stone-700 dark:bg-black/30 dark:text-stone-300">
                  {item.details}
                </pre>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => dismissRef.current(item.id)}
          className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X size={15} />
        </button>
      </div>

      {/* Countdown progress: pauses on hover/focus, resumes where it left off */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-200 dark:bg-white/10" aria-hidden="true">
        <motion.div
          className={`h-full origin-left will-change-transform ${theme.progress}`}
          initial={{ scaleX: 1 }}
          animate={controls}
        />
      </div>
    </div>
  );
};
