// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useNotificationState } from '../../contexts/hooks/useNotificationState';
import { notificationBus } from '../../services/notification-bus';
import type { User } from '../../types';

const user: User = { id: 'user-a', role: 'cashier', name: 'Cashier', avatar: '', title: 'Cashier' };
const initialProps = { user: user as User | undefined, activeSiteId: 'site-a', countryCode: 'ET' };

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
afterEach(cleanup);

describe('Notification session and operating-context isolation', () => {
  it('does not restore or persist unscoped browser history', () => {
    localStorage.setItem('siifmart_notifications', JSON.stringify([{
      id: 'stale', type: 'alert', message: 'Out of Stock', timestamp: new Date().toISOString(), read: false
    }]));
    const first = renderHook(() => useNotificationState(initialProps));
    expect(first.result.current.notifications).toEqual([]);
    expect(localStorage.getItem('siifmart_notifications')).toBeNull();
    act(() => first.result.current.addNotification('info', 'Sale queued on this device.'));
    expect(first.result.current.notifications).toHaveLength(1);
    expect(localStorage.getItem('siifmart_notifications')).toBeNull();
    first.unmount();
    const next = renderHook(() => useNotificationState(initialProps));
    expect(next.result.current.notifications).toEqual([]);
  });

  it.each([
    { ...initialProps, user: { ...user, id: 'user-b' } },
    { ...initialProps, activeSiteId: 'site-b' },
    { ...initialProps, countryCode: 'KE' },
    { ...initialProps, user: undefined },
  ])('clears events and ignores late callbacks after a scope change: %j', changedProps => {
    const notify = vi.spyOn(notificationBus, 'notify');
    const clear = vi.fn();
    const unsubscribe = notificationBus.subscribeClear(clear);
    const { result, rerender } = renderHook(props => useNotificationState(props), { initialProps });
    act(() => result.current.addNotification('info', 'Previous context message'));
    const oldCallback = result.current.addNotification;
    rerender(changedProps);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(result.current.notifications).toEqual([]);
    notify.mockClear();
    act(() => oldCallback('success', 'Old operation finished'));
    expect(notify).not.toHaveBeenCalled();
    expect(result.current.notifications).toEqual([]);
    rerender(initialProps);
    expect(result.current.notifications).toEqual([]);
    act(() => oldCallback('success', 'Old operation finished after returning'));
    expect(notify).not.toHaveBeenCalled();
    expect(result.current.notifications).toEqual([]);
    unsubscribe();
  });

  it('does not display a message addressed to another employee on this device', () => {
    const notify = vi.spyOn(notificationBus, 'notify');
    const { result } = renderHook(() => useNotificationState(initialProps));
    act(() => result.current.addNotification('info', 'Private recipient message', 'other-user'));
    expect(result.current.notifications).toEqual([]);
    expect(notify).not.toHaveBeenCalled();
  });

  it('marking read changes unread state without changing the recorded outcome', () => {
    const { result } = renderHook(() => useNotificationState(initialProps));
    act(() => result.current.addNotification('alert', 'PO save was not confirmed.'));
    expect(result.current.notifications[0].read).toBe(false);
    act(() => result.current.markNotificationsRead());
    expect(result.current.notifications[0]).toMatchObject({
      message: 'PO save was not confirmed.', type: 'alert', read: true
    });
  });
});
