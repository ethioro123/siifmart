import { useState, useCallback } from 'react';
import type { DiscountCode } from '../../types';

interface UseDiscountCodesStateProps {
  addNotification: (type: 'alert' | 'success' | 'info', message: string, userId?: string, isGlobal?: boolean) => void;
}

export function useDiscountCodesState({ addNotification }: UseDiscountCodesStateProps) {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([
    {
      id: 'DC-001',
      code: 'WELCOME10',
      name: 'Welcome Discount',
      type: 'PERCENTAGE',
      value: 10,
      validFrom: '2024-01-01',
      validUntil: '2025-12-31',
      usageCount: 0,
      status: 'Active',
      createdBy: 'System',
      createdAt: new Date().toISOString(),
      description: '10% off for new customers'
    },
    {
      id: 'DC-002',
      code: 'SAVE50',
      name: 'Fixed Discount',
      type: 'FIXED',
      value: 50,
      minPurchaseAmount: 200,
      validFrom: '2024-01-01',
      validUntil: '2025-12-31',
      usageCount: 0,
      status: 'Active',
      createdBy: 'System',
      createdAt: new Date().toISOString(),
      description: '50 ETB off on orders over 200 ETB'
    },
    {
      id: 'DC-003',
      code: 'VIP2024',
      name: 'VIP Member Discount',
      type: 'PERCENTAGE',
      value: 15,
      maxDiscountAmount: 500,
      validFrom: '2024-01-01',
      validUntil: '2025-12-31',
      usageCount: 0,
      status: 'Active',
      createdBy: 'System',
      createdAt: new Date().toISOString(),
      description: '15% off (max 500 ETB) for VIP members'
    }
  ]);

  const addDiscountCode = useCallback((code: DiscountCode) => {
    setDiscountCodes(prev => [...prev, code]);
    addNotification('success', `Discount code "${code.code}" created`);
  }, [addNotification]);

  const updateDiscountCode = useCallback((code: DiscountCode) => {
    setDiscountCodes(prev => prev.map(c => c.id === code.id ? code : c));
    addNotification('success', `Discount code "${code.code}" updated`);
  }, [addNotification]);

  const deleteDiscountCode = useCallback((id: string) => {
    setDiscountCodes(prev => prev.filter(c => c.id !== id));
    addNotification('info', 'Discount code deleted');
  }, [addNotification]);

  const validateDiscountCode = useCallback((code: string, siteId?: string, subtotal?: number): { valid: boolean; discountCode?: DiscountCode; error?: string } => {
    const discountCode = discountCodes.find(dc => dc.code.toUpperCase() === code.toUpperCase());

    if (!discountCode) {
      return { valid: false, error: 'Invalid discount code' };
    }

    if (discountCode.status !== 'Active') {
      return { valid: false, error: 'This discount code is not active' };
    }

    const now = new Date();
    const validFrom = new Date(discountCode.validFrom);
    const validUntil = new Date(discountCode.validUntil);

    if (now < validFrom) {
      return { valid: false, error: 'This discount code is not yet valid' };
    }

    if (now > validUntil) {
      return { valid: false, error: 'This discount code has expired' };
    }

    if (discountCode.usageLimit !== undefined && discountCode.usageCount >= discountCode.usageLimit) {
      return { valid: false, error: 'This discount code has reached its usage limit' };
    }

    if (discountCode.minPurchaseAmount !== undefined && subtotal !== undefined && subtotal < discountCode.minPurchaseAmount) {
      return { valid: false, error: `Minimum purchase of ${discountCode.minPurchaseAmount} required` };
    }

    if (discountCode.applicableSites && discountCode.applicableSites.length > 0 && siteId) {
      if (!discountCode.applicableSites.includes(siteId)) {
        return { valid: false, error: 'This discount code is not valid at this location' };
      }
    }

    return { valid: true, discountCode };
  }, [discountCodes]);

  const useDiscountCode = useCallback((codeId: string) => {
    setDiscountCodes(prev => prev.map(c =>
      c.id === codeId
        ? { ...c, usageCount: c.usageCount + 1 }
        : c
    ));
  }, []);

  return {
    discountCodes,
    setDiscountCodes,
    addDiscountCode,
    updateDiscountCode,
    deleteDiscountCode,
    validateDiscountCode,
    useDiscountCode
  };
}
