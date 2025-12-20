import { useEffect, useRef, useCallback, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { APP_CONFIG } from '../config/app.config';

/**
 * Data Refresh Hook (Enhanced)
 * - Periodic data refresh
 * - Visibility API integration (pause when hidden)
 * - Request deduplication
 * - Exponential backoff on errors
 */
export function useDataRefresh(intervalMinutes?: number) {
    const { refreshData } = useData();
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const expirationCheckRef = useRef<NodeJS.Timeout | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const retryCountRef = useRef(0);
    const isInitializedRef = useRef(false);
    const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const interval = intervalMinutes
        ? intervalMinutes * 60 * 1000
        : APP_CONFIG.DATA_REFRESH_INTERVAL;

    const refresh = useCallback(async () => {
        // Request deduplication: Don't refresh if already in progress
        if (isRefreshing) {
            console.log('Data refresh already in progress, skipping...');
            return;
        }

        setIsRefreshing(true);

        try {
            console.log('Auto-refreshing data...');
            await refreshData();
            console.log('Data refresh complete');
            retryCountRef.current = 0; // Reset retry count on success
        } catch (error) {
            console.error('Data refresh failed:', error);

            // Exponential backoff retry
            if (retryCountRef.current < APP_CONFIG.DATA_REFRESH_MAX_RETRIES) {
                retryCountRef.current++;
                const delay = APP_CONFIG.DATA_REFRESH_RETRY_DELAY * Math.pow(2, retryCountRef.current - 1);
                console.log(`Retrying in ${delay}ms (attempt ${retryCountRef.current}/${APP_CONFIG.DATA_REFRESH_MAX_RETRIES})`);

                setTimeout(async () => {
                    setIsRefreshing(false);
                    await refresh();
                }, delay);
            } else {
                console.error('Max retries reached, giving up');
                retryCountRef.current = 0;
            }
        } finally {
            if (retryCountRef.current === 0) {
                setIsRefreshing(false);
            }
        }
    }, [refreshData, isRefreshing]);

    useEffect(() => {
        let isActive = true;

        // Mark as initialized after first mount
        setTimeout(() => {
            isInitializedRef.current = true;
        }, 1000);

        // Visibility API: Pause when tab is hidden, resume when visible
        const handleVisibilityChange = () => {
            // Clear any pending visibility timeout
            if (visibilityTimeoutRef.current) {
                clearTimeout(visibilityTimeoutRef.current);
            }

            if (document.hidden) {
                // Tab hidden - pause refresh timer
                if (refreshIntervalRef.current) {
                    clearInterval(refreshIntervalRef.current);
                    console.log('Data refresh paused (tab hidden)');
                }
            } else {
                // Tab visible - debounce to prevent rapid refreshes
                visibilityTimeoutRef.current = setTimeout(() => {
                    if (isActive && isInitializedRef.current) {
                        console.log('Data refresh resumed (tab visible)');
                        refresh(); // Immediate refresh on tab focus

                        // Restart interval
                        refreshIntervalRef.current = setInterval(() => {
                            if (!document.hidden) {
                                refresh();
                            }
                        }, interval);
                    }
                }, 500); // 500ms debounce
            }
        };

        // Initial setup
        refreshIntervalRef.current = setInterval(() => {
            if (!document.hidden && isInitializedRef.current) {
                refresh();
            }
        }, interval);

        // Listen for visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup on unmount
        return () => {
            isActive = false;
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
            if (visibilityTimeoutRef.current) {
                clearTimeout(visibilityTimeoutRef.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [refresh, interval]);

    return { refresh, isRefreshing };
}
