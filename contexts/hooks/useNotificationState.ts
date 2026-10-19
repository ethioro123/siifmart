import { useState, useEffect, useCallback, useRef, type SetStateAction } from 'react';
import type { Notification, User } from '../../types';
import { logger } from '../../utils/logger';
import { notificationBus } from '../../services/notification-bus';

interface UseNotificationStateProps {
  user: User | undefined;
  activeSiteId?: string;
  countryCode?: string;
}

export function useNotificationState({ user, activeSiteId, countryCode }: UseNotificationStateProps) {
  const contextKey = JSON.stringify([user?.id, user?.role, activeSiteId, countryCode]);
  const contextRef = useRef({ key: contextKey, generation: 0 });
  if (contextRef.current.key !== contextKey) {
    contextRef.current = { key: contextKey, generation: contextRef.current.generation + 1 };
  }
  const scopeKey = JSON.stringify([contextKey, contextRef.current.generation]);
  const activeScopeRef = useRef(scopeKey);
  const previousScopeRef = useRef(scopeKey);
  activeScopeRef.current = scopeKey;
  const [history, setHistory] = useState<{ scopeKey: string; items: Notification[] }>({ scopeKey, items: [] });
  const notifications = history.scopeKey === scopeKey ? history.items : [];

  // Old device-wide messages have no trustworthy account/site scope or current status.
  // Events now remain in memory for the current session and operating context only.
  useEffect(() => {
    try {
      localStorage.removeItem('siifmart_notifications');
    } catch (error) {
      logger.warn('useNotificationState', 'Could not remove legacy notification history');
    }
  }, []);

  useEffect(() => {
    if (previousScopeRef.current !== scopeKey) {
      previousScopeRef.current = scopeKey;
      notificationBus.clear();
    }
    setHistory(previous => previous.scopeKey === scopeKey ? previous : { scopeKey, items: [] });
  }, [scopeKey]);

  const setNotifications = useCallback((update: SetStateAction<Notification[]>) => {
    if (activeScopeRef.current !== scopeKey) return;
    setHistory(previous => {
      const items = previous.scopeKey === scopeKey ? previous.items : [];
      return { scopeKey, items: typeof update === 'function' ? update(items) : update };
    });
  }, [scopeKey]);

  useEffect(() => {
    const checkExpiration = () => {
      const now = Date.now();
      setNotifications(previous => previous.filter(notification => {
        const time = new Date(notification.timestamp).getTime();
        return Number.isFinite(time) && time <= now && now - time < 24 * 60 * 60 * 1000;
      }).slice(0, 500));
    };
    const interval = setInterval(checkExpiration, 60000);
    return () => clearInterval(interval);
  }, [setNotifications]);

  const addNotification = useCallback((type: Notification['type'], message: string, userId?: string, isGlobal?: boolean, title?: string) => {
    // Ignore callbacks from an operation that belongs to a previous context.
    if (activeScopeRef.current !== scopeKey || !message.trim()) return;
    if (userId && userId !== user?.id && userId !== user?.employeeId) return;
    const newNotification: Notification = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type,
      message,
      title,
      timestamp: new Date().toISOString(),
      read: false,
      userId: userId || user?.id,
      isGlobal: isGlobal || false
    };
    setNotifications(previous => [newNotification, ...previous].slice(0, 500));
    try {
      notificationBus.notify({ type, message, title });
    } catch (error) {
      logger.error('useNotificationState', 'Failed to dispatch notification popup', error);
    }
  }, [scopeKey, user?.id, user?.employeeId, setNotifications]);

  const clearNotification = useCallback((id: string) => {
    setNotifications(previous => previous.filter(notification => notification.id !== id));
  }, [setNotifications]);

  const clearAllNotifications = useCallback(() => setNotifications([]), [setNotifications]);
  const markNotificationsRead = useCallback(() => {
    setNotifications(previous => previous.map(notification => ({ ...notification, read: true })));
  }, [setNotifications]);

  return { notifications, setNotifications, addNotification, clearNotification, clearAllNotifications, markNotificationsRead };
}
