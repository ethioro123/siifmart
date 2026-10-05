import React from 'react';

declare global {
  interface Window {
    AndroidNative?: {
      printDocument: (documentName: string) => void;
      isPrintingAvailable: () => boolean;
      showToast: (message: string) => void;
      vibrate: (milliseconds: number) => void;
      getDeviceId: () => string;
      generateBarcode?: (content: string) => string;
    };
    isNativeApp?: boolean;
  }
}

export * from './types/auth';
export * from './types/employee';
export * from './types/product';
export * from './types/sales';
export * from './types/wms';
export * from './types/infrastructure';
export * from './types/gamification';
export * from './types/salary-request';
export * from './types/payroll-run';
export * from './types/expense';
export * from './types/drawer-reconciliation';
export * from './types/accounts-payable';
export * from './types/general-ledger';
export * from './types/budget-reconciliation';
export * from './types/accounts-receivable';
export * from './types/petty-cash';
export * from './types/margin-approval';
export type { Country } from './utils/localization';