/**
 * SIIFMART Global Notification Bus
 * 
 * Provides an event-driven channel for immediate on-screen pop-up alert cards,
 * ensuring high-priority errors, barcode conflicts, and operational messages
 * appear directly on screen instead of being buried in notification dropdowns.
 */

import { logger } from '../utils/logger';

export type NotificationPopupType = 'alert' | 'error' | 'warning' | 'info' | 'success';

export interface NotificationToastItem {
  id: string;
  type: NotificationPopupType;
  message: string;
  title?: string;
  duration?: number;
  timestamp: string;
  tip?: string;
  details?: string;
}

type ToastListener = (item: NotificationToastItem) => void;

class NotificationBus {
  private listeners: Set<ToastListener> = new Set();
  private clearListeners = new Set<() => void>();

  subscribeClear(listener: () => void): () => void {
    this.clearListeners.add(listener);
    return () => { this.clearListeners.delete(listener); };
  }

  clear(): void {
    this.clearListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        logger.error('NotificationBus', 'Failed to clear displayed notifications', error);
      }
    });
  }

  /**
   * Subscribe to new notification popup events.
   * Returns an unsubscribe cleanup function.
   */
  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit a notification popup to all active on-screen containers.
   */
  notify(item: {
    type?: NotificationPopupType;
    message: string;
    title?: string;
    duration?: number;
    tip?: string;
    details?: string;
    id?: string;
  }): string {
    const id = item.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
    const resolvedType: NotificationPopupType = item.type || 'info';

    // Default durations: 9s for errors/alerts (ample time to read "what went wrong"), 6s for warnings, 4.5s for others
    const defaultDuration = (resolvedType === 'alert' || resolvedType === 'error') ? 9000 : resolvedType === 'warning' ? 6000 : 4500;

    const fullItem: NotificationToastItem = {
      id,
      type: resolvedType,
      message: item.message,
      title: item.title,
      duration: item.duration ?? defaultDuration,
      tip: item.tip,
      details: item.details,
      timestamp: new Date().toISOString()
    };

    this.listeners.forEach(listener => {
      try {
        listener(fullItem);
      } catch (err) {
        logger.error('NotificationBus', 'Listener failed', err);
      }
    });

    return id;
  }

  showError(message: string, options?: { title?: string; duration?: number; tip?: string; details?: string }): string {
    return this.notify({
      type: 'error',
      message,
      ...options
    });
  }

  showWarning(message: string, options?: { title?: string; duration?: number; tip?: string; details?: string }): string {
    return this.notify({
      type: 'warning',
      message,
      ...options
    });
  }

  showSuccess(message: string, options?: { title?: string; duration?: number; tip?: string }): string {
    return this.notify({
      type: 'success',
      message,
      ...options
    });
  }

  showInfo(message: string, options?: { title?: string; duration?: number; tip?: string }): string {
    return this.notify({
      type: 'info',
      message,
      ...options
    });
  }
}

export const notificationBus = new NotificationBus();
