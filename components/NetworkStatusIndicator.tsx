import React from 'react';
import { useStore } from '../contexts/CentralStore';
import { WifiOff, ServerOff } from 'lucide-react';

/**
 * Network Status Indicator
 * Shows when the app is offline
 */
export default function NetworkStatusIndicator() {
    const { isOnline, isServerDown } = useStore();

    if (isOnline && !isServerDown) return null;

    return (
        <div className={`fixed top-0 left-0 right-0 z-[100] ${isServerDown ? 'bg-orange-600' : 'bg-red-500'} text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-3 backdrop-blur-md shadow-lg border-b border-white/20 animate-pulse`}>
            {isServerDown ? (
                <>
                    <ServerOff size={14} className="animate-spin-slow" />
                    <span className="tracking-widest uppercase">Central Intelligence Link Lost - Attempting Reconnection...</span>
                </>
            ) : (
                <>
                    <WifiOff size={14} />
                    <span className="tracking-widest uppercase">Network Disconnected - Check your internet connection</span>
                </>
            )}
        </div>
    );
}
