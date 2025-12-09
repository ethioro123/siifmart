/**
 * Android Native Printing Helper
 * Detects Android app and uses native printing when available
 */

declare global {
    interface Window {
        AndroidNative?: {
            printDocument: (documentName: string) => void;
            isPrintingAvailable: () => boolean;
            showToast: (message: string) => void;
            vibrate: (milliseconds: number) => void;
            getDeviceId: () => string;
        };
        isNativeApp?: boolean;
    }
}

/**
 * Check if running in Android native app
 */
export const isAndroidApp = (): boolean => {
    return typeof window !== 'undefined' &&
        typeof window.AndroidNative !== 'undefined' &&
        window.isNativeApp === true;
};

/**
 * Check if native printing is available
 */
export const isNativePrintingAvailable = (): boolean => {
    return isAndroidApp() &&
        window.AndroidNative?.isPrintingAvailable?.() === true;
};

/**
 * Print document using native Android printing or web printing
 * @param htmlContent - HTML content to print
 * @param documentName - Name of the document (for Android print dialog)
 * @param onSuccess - Callback on success
 * @param onError - Callback on error
 */
export const printDocument = (
    htmlContent: string,
    documentName: string = 'Document',
    onSuccess?: () => void,
    onError?: (error: string) => void
): void => {
    try {
        if (isNativePrintingAvailable()) {
            // Use Android native printing
            console.log('Using Android native printing');

            // Open content in new window/iframe for printing
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                onError?.('Please allow popups to print');
                return;
            }

            // Write content
            printWindow.document.write(htmlContent);
            printWindow.document.close();

            // Wait for content to load, then trigger native print
            setTimeout(() => {
                try {
                    window.AndroidNative?.printDocument(documentName);
                    window.AndroidNative?.vibrate(50); // Haptic feedback
                    onSuccess?.();

                    // Close the popup after a delay
                    setTimeout(() => {
                        printWindow.close();
                    }, 1000);
                } catch (err) {
                    console.error('Native print error:', err);
                    onError?.('Failed to open print dialog');
                }
            }, 500);

        } else {
            // Use regular web printing
            console.log('Using web printing');

            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                onError?.('Please allow popups to print');
                return;
            }

            printWindow.document.write(htmlContent);
            printWindow.document.close();

            setTimeout(() => {
                printWindow.print();
                onSuccess?.();
            }, 500);
        }
    } catch (error) {
        console.error('Print error:', error);
        onError?.(error instanceof Error ? error.message : 'Unknown print error');
    }
};

/**
 * Show toast message (Android only)
 */
export const showToast = (message: string): void => {
    if (isAndroidApp()) {
        window.AndroidNative?.showToast(message);
    } else {
        console.log('Toast (web):', message);
    }
};

/**
 * Vibrate device (Android only)
 */
export const vibrate = (milliseconds: number = 50): void => {
    if (isAndroidApp()) {
        window.AndroidNative?.vibrate(milliseconds);
    } else if (navigator.vibrate) {
        navigator.vibrate(milliseconds);
    }
};

/**
 * Get device ID (Android only)
 */
export const getDeviceId = (): string | null => {
    if (isAndroidApp()) {
        return window.AndroidNative?.getDeviceId() || null;
    }
    return null;
};

export default {
    isAndroidApp,
    isNativePrintingAvailable,
    printDocument,
    showToast,
    vibrate,
    getDeviceId
};
