import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { NotificationCard } from './notifications/NotificationCard';
import type { NotificationToastItem } from '../services/notification-bus';

interface ToastProps {
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
  onClose: () => void;
  title?: string;
}

/**
 * Toast Notification Component (Legacy Compatible)
 * Renders the new explanatory NotificationCard while preserving the original API.
 * The item identity is stable across re-renders so the countdown never restarts.
 */
export default function Toast({ message, type = 'info', duration, onClose, title }: ToastProps) {
  const idRef = useRef('legacy-toast-' + Math.random().toString(36).substring(2, 9));
  const timestampRef = useRef(new Date().toISOString());

  const item: NotificationToastItem = {
    id: idRef.current,
    type,
    message,
    title,
    duration,
    timestamp: timestampRef.current
  };

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-[999999] pointer-events-none max-w-[420px] w-[calc(100vw-2rem)] sm:w-[420px]">
      <motion.div
        initial={{ opacity: 0, x: 48, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }}
      >
        <NotificationCard item={item} onDismiss={() => onClose()} />
      </motion.div>
    </div>
  );
}

export { NotificationContainer } from './notifications/NotificationContainer';
export { NotificationCard } from './notifications/NotificationCard';
