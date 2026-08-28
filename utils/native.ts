/**
 * Native Android & Capacitor Interface Bridge
 * Allows the web app to communicate with the Android wrapper
 */

export const native = {
    /**
     * Check if running in native Android or Capacitor app
     */
    isNative: (): boolean => {
        if (typeof window === 'undefined') return false;
        const isCapacitor = (window as any).Capacitor?.isNativePlatform?.() || (window as any).Capacitor?.getPlatform?.() === 'android';
        return !!(window as any).AndroidNative || !!(window as any).isNativeApp || !!isCapacitor;
    },

    /**
     * Check if running specifically on Android Mobile / Scanner
     */
    isAndroid: (): boolean => {
        if (typeof window === 'undefined') return false;
        const isCapacitorAndroid = (window as any).Capacitor?.getPlatform?.() === 'android';
        const isUserAgentAndroid = /android/i.test(navigator.userAgent || '');
        const isElectron = !!(window as any).electronAPI;
        return (isCapacitorAndroid || isUserAgentAndroid || !!(window as any).AndroidNative) && !isElectron;
    },

    /**
     * Returns true if app should be locked to Clean Fulfillment + POS mode
     */
    isCleanMobileMode: (): boolean => {
        return native.isAndroid() || native.isNative();
    },

    /**
     * Show a native Android toast message
     */
    toast: (message: string) => {
        if (typeof window !== 'undefined' && (window as any).AndroidNative?.showToast) {
            (window as any).AndroidNative.showToast(message);
        }
    },

    /**
     * Vibrate the device
     */
    vibrate: (milliseconds: number = 200) => {
        if (typeof window !== 'undefined' && (window as any).AndroidNative?.vibrate) {
            (window as any).AndroidNative.vibrate(milliseconds);
        } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(milliseconds);
        }
    },

    /**
     * Get the unique Android device ID
     */
    getDeviceId: (): string | null => {
        if (typeof window !== 'undefined' && (window as any).AndroidNative?.getDeviceId) {
            return (window as any).AndroidNative.getDeviceId();
        }
        return null;
    }
};
