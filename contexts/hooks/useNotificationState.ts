import { useState, useEffect, useCallback } from 'react';
import type { Notification, User } from '../../types';
import { logger } from '../../utils/logger';

interface UseNotificationStateProps {
  user: User | undefined;
}

export function useNotificationState({ user }: UseNotificationStateProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    try {
      const savedNotifs = localStorage.getItem('siifmart_notifications');
      if (savedNotifs) {
        setNotifications(JSON.parse(savedNotifs));
      }
    } catch (e) {
      logger.error('useNotificationState', 'Failed to load notifications', e);
    }
  }, []);

  // Save notifs to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('siifmart_notifications', JSON.stringify(notifications));
    } catch (e) {
      logger.warn('useNotificationState', 'Failed to save notifications to localStorage');
    }
  }, [notifications]);

  // Check for expired notifications (older than 24h) every minute
  useEffect(() => {
    const checkExpiration = () => {
      const now = new Date().getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;

      setNotifications(prev => {
        const filtered = prev.filter(n => {
          const notifTime = new Date(n.timestamp).getTime();
          return (now - notifTime) < oneDayMs;
        }).slice(0, 500);

        return filtered.length !== prev.length ? filtered : prev;
      });
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 60000);
    return () => clearInterval(interval);
  }, []);

  const addNotification = useCallback((type: 'alert' | 'success' | 'info', message: string, userId?: string, isGlobal?: boolean) => {
    const newNotif: Notification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      userId: userId || user?.id,
      isGlobal: isGlobal || false
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 500));
  }, [user]);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  return {
    notifications,
    setNotifications,
    addNotification,
    clearNotification,
    clearAllNotifications,
    markNotificationsRead
  };
}
