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
export * from './types/infrastructure';
export * from './types/gamification';