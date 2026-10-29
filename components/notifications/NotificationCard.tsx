import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, ChevronDown, FileText } from 'lucide-react';
import type { NotificationToastItem } from '../../services/notification-bus';

interface NotificationCardProps {
  item: NotificationToastItem;
  onDismiss: (id: string) => void;
}

// Presentation follows the caller's explicit severity, never keywords in its message.
// A message cannot prove a diagnosis, outcome, or recovery action on its own.
export function inferCardMeta(type: string, _message?: string): {
  title: string;
  badge: string;
  subtitle: string;
  tip?: string;
} {
  switch (type) {
    case 'error':
      return { title: 'Error', badge: 'ERROR', subtitle: 'Message:' };
    case 'alert':
      return { title: 'Notice', badge: 'NOTICE', subtitle: 'Message:' };
    case 'warning':
      return { title: 'Warning', badge: 'WARNING', subtitle: 'Message:' };
    case 'success':
      return { title: 'Success', badge: 'SUCCESS', subtitle: 'Result:' };
    default:
      return { title: 'Information', badge: 'INFO', subtitle: 'Message:' };
  }
}

const THEMES = {
  error: {
    border: 'border-[var(--theme-status-danger-border)]', rail: 'bg-[var(--theme-status-danger)]',
    iconBg: 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)]',
    badgeBg: 'bg-[var(--theme-status-danger-bg)] text-[var(--theme-status-danger-text)] border border-[var(--theme-status-danger-border)]',
    titleColor: 'text-[var(--theme-text-primary)]',
    explanationBg: 'bg-[var(--theme-bg-subtle)] border border-[var(--theme-status-danger-border)]',
    subtitleColor: 'text-[var(--theme-status-danger-text)]', progress: 'bg-[var(--theme-status-danger)]',
    Icon: AlertTriangle
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
  const tipText = item.tip;
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
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--theme-status-danger-bg)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--theme-status-danger-bg)]" />
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
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-status-info-border)]"
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
          className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-status-info-border)]"
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
