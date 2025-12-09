/**
 * Native Android Interface Bridge
 * Allows the web app to communicate with the Android wrapper
 */

declare global {
    interface Window {
        AndroidNative?: {
            showToast: (message: string) => void;
            vibrate: (milliseconds: number) => void;
            getDeviceId: () => string;
        };
        isNativeApp?: boolean;
    }
}

export const native = {
    /**
     * Check if running in the native Android app
     */
    isNative: (): boolean => {
        return !!window.AndroidNative || !!window.isNativeApp;
    },

    /**
     * Show a native Android toast message
     */
    toast: (message: string) => {
        if (window.AndroidNative) {
            window.AndroidNative.showToast(message);
        } else {
            console.log('Native Toast:', message);
        }
    },

    /**
     * Vibrate the device
     */
    vibrate: (milliseconds: number = 200) => {
        if (window.AndroidNative) {
            window.AndroidNative.vibrate(milliseconds);
        } else if (navigator.vibrate) {
            navigator.vibrate(milliseconds);
        }
    },

    /**
     * Get the unique Android device ID
     */
    getDeviceId: (): string | null => {
        if (window.AndroidNative) {
            return window.AndroidNative.getDeviceId();
        }
        return null;
    }
};
