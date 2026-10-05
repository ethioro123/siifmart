// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationBus } from '../../services/notification-bus';
import { inferCardMeta } from '../../components/notifications/NotificationCard';
import { renderHook, act } from '@testing-library/react';
import { useNotificationState } from '../../contexts/hooks/useNotificationState';

describe('Notification Popups & Barcode Conflict On-Screen Cards', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('inferCardMeta', () => {
    it('detects barcode conflict and provides explanatory card metadata', () => {
      const message = 'This barcode is flagged because it is already registered under SKU KEGR001 (Juma Ugali Flour)';
      const meta = inferCardMeta('alert', message);

      expect(meta.title).toBe('Barcode Conflict Flagged');
      expect(meta.badge).toBe('CONFLICT');
      expect(meta.subtitle).toBe('What went wrong:');
      expect(meta.tip).toContain('already assigned to another catalog SKU');
    });

    it('detects duplicate SKU errors', () => {
      const message = 'Duplicate SKU! A product with SKU "KE-GR001" already exists';
      const meta = inferCardMeta('alert', message);

      expect(meta.title).toBe('Duplicate SKU Detected');
      expect(meta.badge).toBe('DUPLICATE');
      expect(meta.subtitle).toBe('What went wrong:');
    });

    it('detects inventory and stock alerts', () => {
      const message = 'Insufficient stock available for allocation';
      const meta = inferCardMeta('alert', message);

      expect(meta.title).toBe('Inventory Alert');
      expect(meta.badge).toBe('INVENTORY');
      expect(meta.subtitle).toBe('What went wrong:');
    });

    it('detects permission / role restriction errors', () => {
      const message = 'Unauthorized: Permission denied for stock write-off';
      const meta = inferCardMeta('alert', message);

      expect(meta.title).toBe('Access Restricted');
      expect(meta.badge).toBe('SECURITY');
      expect(meta.subtitle).toBe('What went wrong:');
    });

    it('provides clear fallback card metadata for general errors', () => {
      const message = 'Network request timed out';
      const meta = inferCardMeta('alert', message);

      expect(meta.title).toBe('Connection Notice');
      expect(meta.subtitle).toBe('What went wrong:');
    });

    it('provides clear card metadata for success events', () => {
      const message = 'Product created successfully';
      const meta = inferCardMeta('success', message);

      expect(meta.title).toBe('Operation Completed');
      expect(meta.badge).toBe('SUCCESS');
      expect(meta.subtitle).toBe('Result:');
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
          type: 'error',
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
