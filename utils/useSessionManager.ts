import { useEffect, useRef, useState } from 'react';
import { authService } from '../services/auth.service';
import { APP_CONFIG } from '../config/app.config';

/**
 * Session Manager Hook (Enhanced)
 * - Auto-refresh sessions
 * - Expiration detection
 * - User warnings before expiry
 * - Visibility API integration
 */
export function useSessionManager(onSessionWarning?: (minutesLeft: number) => void) {
    const refreshIntervalRef = useRef<NodeJS.Timeout>();
    const expirationCheckRef = useRef<NodeJS.Timeout>();
    const [hasWarned, setHasWarned] = useState(false);
    const hasCheckedRef = useRef(false);

    useEffect(() => {
        let isActive = true;

        const checkAndRefreshSession = async () => {
            // Only check if user is logged in (avoid checking on login page)
            if (!hasCheckedRef.current) {
                hasCheckedRef.current = true;
                return; // Skip first check to avoid issues on mount
            }

            try {
                const session = await authService.getSession();

                if (!session) {
                    // No session - user is not logged in, don't do anything
                    // The app will show login page automatically
                    return;
                }

                // Check if session is close to expiring
                if (session.expires_at) {
                    const expiresAt = new Date(session.expires_at * 1000);
                    const now = new Date();
                    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

                    // Warn user if session expires in less than 5 minutes
                    if (timeUntilExpiry < APP_CONFIG.SESSION_EXPIRY_WARNING_TIME && !hasWarned) {
                        const minutesLeft = Math.floor(timeUntilExpiry / 60000);
                        console.warn(`Session expires in ${minutesLeft} minutes`);
                        setHasWarned(true);
                        onSessionWarning?.(minutesLeft);
                    }

                    // Reset warning flag if session was refreshed
                    if (timeUntilExpiry > APP_CONFIG.SESSION_EXPIRY_WARNING_TIME) {
                        setHasWarned(false);
                    }
                }
            } catch (error) {
                console.error('Session check failed:', error);
            }
        };

        const startTimers = () => {
            // Clear any existing timers first
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
            if (expirationCheckRef.current) clearInterval(expirationCheckRef.current);

            // Refresh session every 30 minutes
            refreshIntervalRef.current = setInterval(async () => {
                if (!document.hidden && isActive) {
                    await checkAndRefreshSession();
                    console.log('Session auto-refreshed');
                }
            }, APP_CONFIG.SESSION_REFRESH_INTERVAL);

            // Check for session expiration every 5 minutes
            expirationCheckRef.current = setInterval(async () => {
                if (!document.hidden && isActive) {
                    await checkAndRefreshSession();
                }
            }, APP_CONFIG.SESSION_EXPIRY_CHECK_INTERVAL);
        };

        // Visibility API: Pause when tab is hidden
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Tab hidden - pause timers
                if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
                if (expirationCheckRef.current) clearInterval(expirationCheckRef.current);
            } else {
                // Tab visible - resume timers (don't check immediately to avoid spam)
                if (isActive) {
                    startTimers();
                }
            }
        };

        // Start timers after a short delay to avoid initial check
        setTimeout(() => {
            if (isActive) {
                startTimers();
            }
        }, 2000);

        // Listen for visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup on unmount
        return () => {
            isActive = false;
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
            if (expirationCheckRef.current) clearInterval(expirationCheckRef.current);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [hasWarned, onSessionWarning]);
}
