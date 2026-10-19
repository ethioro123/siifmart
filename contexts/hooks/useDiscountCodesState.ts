import { useState, useCallback } from 'react';
import type { DiscountCode } from '../../types';

interface UseDiscountCodesStateProps {
  addNotification: (type: 'alert' | 'success' | 'info', message: string, userId?: string, isGlobal?: boolean) => void;
}

export function useDiscountCodesState({ addNotification }: UseDiscountCodesStateProps) {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([
    // ETHIOPIA PROMOTIONAL CODES (ET)
    {
      id: 'DC-ET-001',
      code: 'WELCOME10',
      name: 'Welcome Discount',
      type: 'PERCENTAGE',
      value: 10,
      country: 'ET',
      country_code: 'ET',
      currency: 'ETB',
      validFrom: '2024-01-01',
      validUntil: '2027-12-31',
      usageCount: 0,
      status: 'Active',
      createdBy: 'System HQ',
      createdAt: new Date().toISOString(),
      description: '10% off for new customers'
    },
    {
      id: 'DC-ET-002',
      code: 'SAVE50',
      name: 'Fixed Discount',
      type: 'FIXED',
      value: 50,
      country: 'ET',
      country_code: 'ET',
      currency: 'ETB',
      minPurchaseAmount: 200,
      validFrom: '2024-01-01',
      validUntil: '2027-12-31',
      usageCount: 0,
      status: 'Active',
      createdBy: 'System HQ',
      createdAt: new Date().toISOString(),
      description: '50 ETB off on orders over 200 ETB'
    },
    {
      id: 'DC-ET-003',
      code: 'VIP2026',
      name: 'VIP Member Discount',
      type: 'PERCENTAGE',
      value: 15,
      country: 'ET',
      country_code: 'ET',
      currency: 'ETB',
      maxDiscountAmount: 500,
      validFrom: '2024-01-01',
      validUntil: '2027-12-31',
      usageCount: 0,
      status: 'Active',
      createdBy: 'System HQ',
      createdAt: new Date().toISOString(),
      description: '15% off (max 500 ETB) for VIP members'
    },

    // KENYA PROMOTIONAL CODES (KE) - 100% Isolated
    {
      id: 'DC-KE-001',
      code: 'KARIBU10',
      name: 'Karibu Discount',
      type: 'PERCENTAGE',
      value: 10,
      country: 'KE',
      country_code: 'KE',
      currency: 'KSh',
      validFrom: '2024-01-01',
      validUntil: '2027-12-31',
      usageCount: 0,
      status: 'Active',
      createdBy: 'System HQ',
      createdAt: new Date().toISOString(),
      description: '10% off for new Kenyan customers'
    },
    {
      id: 'DC-KE-002',
      code: 'MASHUJAA50',
      name: 'Mashujaa Savings',
      type: 'FIXED',
      value: 50,
      country: 'KE',
      country_code: 'KE',
      currency: 'KSh',
      minPurchaseAmount: 250,
      validFrom: '2024-01-01',
      validUntil: '2027-12-31',
      usageCount: 0,
      status: 'Active',
      createdBy: 'System HQ',
      createdAt: new Date().toISOString(),
      description: '50 KSh off on orders over 250 KSh'
    }
  ]);

  const addDiscountCode = useCallback((code: DiscountCode) => {
    setDiscountCodes(prev => [...prev, code]);
  }, [addNotification]);

  const updateDiscountCode = useCallback((code: DiscountCode) => {
    setDiscountCodes(prev => prev.map(c => c.id === code.id ? code : c));
  }, [addNotification]);

  const deleteDiscountCode = useCallback((id: string) => {
    setDiscountCodes(prev => prev.filter(c => c.id !== id));
  }, [addNotification]);

  const validateDiscountCode = useCallback((
    code: string,
    siteId?: string,
    subtotal?: number,
    targetCountry: string = 'ET'
  ): { valid: boolean; discountCode?: DiscountCode; error?: string } => {
    const discountCode = discountCodes.find(dc => dc.code.toUpperCase() === code.toUpperCase().trim());

    if (!discountCode) {
      return { valid: false, error: 'Invalid discount code' };
    }

    // National Campaign & Voucher Isolation: Check country match
    const codeCountry = discountCode.country || discountCode.country_code || 'ET';
    if (targetCountry && codeCountry !== targetCountry) {
      return { valid: false, error: 'Invalid discount code for this market' };
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
      return { valid: false, error: `Minimum purchase of ${discountCode.currency || ''} ${discountCode.minPurchaseAmount} required` };
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
