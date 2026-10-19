// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notificationBus } from '../../services/notification-bus';
import { inferCardMeta } from '../../components/notifications/NotificationCard';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useNotificationState } from '../../contexts/hooks/useNotificationState';

describe('Factual notification popups', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(cleanup);

  describe('inferCardMeta', () => {
    it.each([
      'Product created successfully',
      'Stock updated successfully',
      'Barcode registered for SKU KEGR001',
      'Login settings saved',
      'Required price field updated',
    ])('does not turn success into a failure diagnosis: %s', message => {
      const meta = inferCardMeta('success', message);
      expect(meta.title).toBe('Success');
      expect(meta.badge).toBe('SUCCESS');
      expect(meta.tip).toBeUndefined();
    });

    it.each([
      'Network request timed out',
      'Database statement timeout',
      'Permission denied for stock write-off',
      'This barcode is registered under SKU KEGR001',
      'Session settings could not be saved',
    ])('does not invent a cause or recovery step: %s', message => {
      const meta = inferCardMeta('alert', message);
      expect(meta.title).toBe('Notice');
      expect(meta.subtitle).toBe('Message:');
      expect(meta.tip).toBeUndefined();
    });
  });

  describe('notificationBus', () => {
    it('dispatches notifications to subscribers with custom or default durations', () => {
      const received: any[] = [];
      const unsubscribe = notificationBus.subscribe(item => {
        received.push(item);
      });

      notificationBus.notify({
        type: 'alert',
        message: 'This barcode is flagged because it is already registered under SKU KEGR001 (Juma Ugali Flour)'
      });

      expect(received.length).toBe(1);
      expect(received[0].type).toBe('alert');
      expect(received[0].message).toBe('This barcode is flagged because it is already registered under SKU KEGR001 (Juma Ugali Flour)');
      // For alert/error, duration should be 9000ms so user has time to read
      expect(received[0].duration).toBe(9000);

      unsubscribe();
    });
  });

  describe('useNotificationState integration', () => {
    it('dispatches to notificationBus whenever addNotification is invoked', () => {
      const notifySpy = vi.spyOn(notificationBus, 'notify');
      const { result } = renderHook(() => useNotificationState({ user: undefined }));

      act(() => {
        result.current.addNotification(
          'alert',
          'This barcode is flagged because it is already registered under SKU KEGR001 (Juma Ugali Flour)'
        );
      });

      expect(notifySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'alert',
          message: 'This barcode is flagged because it is already registered under SKU KEGR001 (Juma Ugali Flour)'
        })
      );

      // Verify it is also stored in notification history for topbar dropdown
      expect(result.current.notifications.length).toBe(1);
      expect(result.current.notifications[0].message).toBe(
        'This barcode is flagged because it is already registered under SKU KEGR001 (Juma Ugali Flour)'
      );
    });
  });

  describe('NotificationCard interactions', () => {
    it('shows the source message without invented advice and retains explicit advice', async () => {
      const { NotificationCard } = await import('../../components/notifications/NotificationCard');
      const { render, screen } = await import('@testing-library/react');
      const React = await import('react');
      const item = {
        id: 'session-notice', type: 'warning' as const,
        message: 'Session settings changed.', timestamp: new Date().toISOString()
      };
      const view = render(React.createElement(NotificationCard, { item, onDismiss: vi.fn() }));
      expect(screen.getByText(item.message)).toBeDefined();
      expect(screen.queryByText('Sign-in Needed')).toBeNull();
      expect(screen.queryByText('Next step')).toBeNull();

      view.rerender(React.createElement(NotificationCard, {
        item: { ...item, title: 'Configuration notice', tip: 'Review the displayed configuration.' }, onDismiss: vi.fn()
      }));
      expect(screen.getByText('Configuration notice')).toBeDefined();
      expect(screen.getByText('Review the displayed configuration.')).toBeDefined();
    });

    it('calls onDismiss when the dismiss button is clicked or Escape is pressed', async () => {
      const { NotificationCard } = await import('../../components/notifications/NotificationCard');
      const { render, screen, fireEvent } = await import('@testing-library/react');
      const onDismiss = vi.fn();

      const item = {
        id: 'test-item-1',
        type: 'alert' as const,
        message: 'This barcode is flagged because it is already registered under SKU KEGR001 (Juma Ugali Flour)',
        timestamp: new Date().toISOString()
      };

      const React = await import('react');
      render(React.createElement(NotificationCard, { item, onDismiss }));

      // Hovering pauses the countdown and must not dismiss
      const alertEl = screen.getByRole('alert');
      fireEvent.mouseEnter(alertEl);
      fireEvent.mouseLeave(alertEl);
      expect(onDismiss).not.toHaveBeenCalled();

      // Dismiss button
      const closeButton = screen.getByRole('button', { name: /dismiss notification/i });
      expect(closeButton).toBeDefined();
      fireEvent.click(closeButton);
      expect(onDismiss).toHaveBeenCalledWith('test-item-1');

      // Verify Escape key dismisses
      onDismiss.mockClear();
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onDismiss).toHaveBeenCalledWith('test-item-1');
    });
  });
});
