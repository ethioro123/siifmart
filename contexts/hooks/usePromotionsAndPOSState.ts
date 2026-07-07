import { useState, useCallback } from 'react';
import { posDB } from '../../services/db/pos.db';
import type { Promotion, HeldOrder } from '../../types';

interface UsePromotionsAndPOSStateProps {
  addNotification: (type: 'alert' | 'success' | 'info', message: string, userId?: string, isGlobal?: boolean) => void;
}

export function usePromotionsAndPOSState({ addNotification }: UsePromotionsAndPOSStateProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);

  // Restore held orders from IndexedDB on mount (this is handled inside DataContext or here)
  const loadHeldOrders = useCallback(async () => {
    try {
      const saved = await posDB.getHeldOrders();
      if (saved.length > 0) {
        setHeldOrders(saved);
      }
    } catch (e) {}
  }, []);

  const holdOrder = useCallback((order: HeldOrder) => {
    setHeldOrders(prev => {
      const updated = [order, ...prev];
      posDB.saveHeldOrders(updated).catch(() => {});
      return updated;
    });
    addNotification('info', 'Order placed on hold');
  }, [addNotification]);

  const releaseHold = useCallback((orderId: string) => {
    setHeldOrders(prev => {
      const updated = prev.filter(o => o.id !== orderId);
      posDB.saveHeldOrders(updated).catch(() => {});
      return updated;
    });
    posDB.removeHeldOrder(orderId).catch(() => {});
  }, []);

  const addPromotion = useCallback((promo: Promotion) => {
    setPromotions(prev => [...prev, promo]);
    addNotification('success', `Promotion ${promo.code} Created`);
  }, [addNotification]);

  const updatePromotion = useCallback((promotion: Partial<Promotion> & { id: string }) => {
    setPromotions(prev => prev.map(p => p.id === promotion.id ? { ...p, ...promotion } : p));
    addNotification('success', 'Promotion updated');
  }, [addNotification]);

  const deletePromotion = useCallback((id: string) => {
    setPromotions(prev => prev.filter(p => p.id !== id));
    addNotification('info', 'Promotion Deleted');
  }, [addNotification]);

  return {
    promotions,
    setPromotions,
    heldOrders,
    setHeldOrders,
    loadHeldOrders,
    holdOrder,
    releaseHold,
    addPromotion,
    updatePromotion,
    deletePromotion
  };
}
