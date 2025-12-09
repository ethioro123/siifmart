import React from 'react';
import { useStore } from '../contexts/CentralStore';
import { WifiOff } from 'lucide-react';

/**
 * Network Status Indicator
 * Shows when the app is offline
 */
export default function NetworkStatusIndicator() {
    const { isOnline } = useStore();

    if (isOnline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-2">
            <WifiOff size={16} />
            <span>You are offline. Some features may not work.</span>
        </div>
    );
}
