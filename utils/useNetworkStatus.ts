import { useState, useEffect } from 'react';

/**
 * Network Status Hook
 * Detects online/offline status and notifies user
 */
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            console.log('Network: Back online');
            setIsOnline(true);

            // If we were offline, show a notification and reload data
            if (wasOffline) {
                setWasOffline(false);
                // Trigger a data reload
                window.dispatchEvent(new CustomEvent('network-reconnected'));
            }
        };

        const handleOffline = () => {
            console.warn('Network: Offline');
            setIsOnline(false);
            setWasOffline(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [wasOffline]);

    return { isOnline, wasOffline };
}
