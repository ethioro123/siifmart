import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationBus, NotificationToastItem } from '../../services/notification-bus';
import { NotificationCard } from './NotificationCard';

interface LegacyToastItem {
  id: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
  title?: string;
}

interface NotificationContainerProps {
  toasts?: LegacyToastItem[];
  onRemoveToast?: (id: string) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({ toasts, onRemoveToast }) => {
  const [items, setItems] = useState<NotificationToastItem[]>([]);

  const handleDismiss = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    if (onRemoveToast) {
      onRemoveToast(id);
    }
  }, [onRemoveToast]);

  // Subscribe to the global notification bus
  useEffect(() => {
    const unsubscribe = notificationBus.subscribe(newItem => {
      // Trigger native device haptic feedback on errors/alerts if available
      try {
        const isNative = (window as any).Capacitor?.isNativePlatform?.();
        if (isNative && (newItem.type === 'error' || newItem.type === 'alert')) {
          const Haptics = (window as any).Capacitor?.Plugins?.Haptics;
          if (Haptics?.notification) {
            Haptics.notification({ type: 'ERROR' }).catch(() => {});
          }
        }
      } catch (e) {
        // Non-blocking haptic attempt
      }

      setItems(prev => {
        // Prevent exact duplicates within a short window
        const isDuplicate = prev.some(
          existing => existing.message === newItem.message && (Date.now() - new Date(existing.timestamp).getTime() < 3000)
        );
        if (isDuplicate) return prev;

        // Keep maximum 4 concurrent notifications to prevent viewport flooding
        const next = [newItem, ...prev].slice(0, 4);
        return next;
      });
    });

    return unsubscribe;
  }, []);

  // Sync legacy toasts if provided from CentralStore
  useEffect(() => {
    if (!toasts || toasts.length === 0) return;

    setItems(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const newItems: NotificationToastItem[] = [];

      toasts.forEach(t => {
        if (!existingIds.has(t.id)) {
          newItems.push({
            id: t.id,
            type: t.type === 'error' ? 'error' : t.type || 'info',
            message: t.message,
            title: t.title,
            duration: t.duration,
            timestamp: new Date().toISOString()
          });
        }
      });

      if (newItems.length === 0) return prev;
      return [...newItems, ...prev].slice(0, 4);
    });
  }, [toasts]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="System Notifications"
      className="fixed top-20 right-4 sm:right-6 z-[999999] pointer-events-none flex flex-col gap-3 max-w-[420px] w-[calc(100vw-2rem)] sm:w-[420px]"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map(item => (
          <motion.div
            key={item.id}
            layout="position"
            initial={{ opacity: 0, x: 48, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 64, scale: 0.96, transition: { duration: 0.18, ease: 'easeIn' } }}
            transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }}
            drag="x"
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.1, right: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 90 || info.velocity.x > 500) handleDismiss(item.id);
            }}
            className="w-full touch-pan-y will-change-transform"
          >
            <NotificationCard item={item} onDismiss={handleDismiss} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
