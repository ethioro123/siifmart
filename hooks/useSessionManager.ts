import { useEffect, useRef, useState } from 'react';
import { authService } from '../services/auth.service';
import { APP_CONFIG } from '../config/app.config';
import { logger } from '../utils/logger';
import { supabase } from '../lib/supabase';
import {
    getActiveRolePolicy,
    checkMfaRequirement,
} from '../services/zeroTrustPolicies.service';

/**
 * Session Manager Hook (Enhanced with Zero-Trust Inactivity Enforcement)
 * - Auto-refresh sessions
 * - Expiration detection
 * - Zero-Trust Role Policy Inactivity Timeout
 * - User warnings before expiry
 * - Visibility API integration
 */
export function useSessionManager(
    onSessionWarning?: (minutesLeft: number) => void,
    onSessionTimeout?: () => void,
    userRole?: string
) {
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const expirationCheckRef = useRef<NodeJS.Timeout | null>(null);
    const [hasWarned, setHasWarned] = useState(false);
    const hasCheckedRef = useRef(false);
    const mfaCheckedForRef = useRef<string | null>(null);
    const lastActivityRef = useRef<number>(Date.now());

    // Activity tracking: update lastActivity timestamp on user interactions
    useEffect(() => {
        const updateActivity = () => {
            lastActivityRef.current = Date.now();
        };

        const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
        events.forEach(evt => window.addEventListener(evt, updateActivity, { passive: true }));

        return () => {
            events.forEach(evt => window.removeEventListener(evt, updateActivity));
        };
    }, []);

    useEffect(() => {
        let isActive = true;

        const checkAndRefreshSession = async () => {
            // Only check if user is logged in
            if (!hasCheckedRef.current) {
                hasCheckedRef.current = true;
                return;
            }

            try {
                const session = await authService.getSession();

                if (!session) {
                    return;
                }

                const now = Date.now();

                // 1. Zero-Trust Inactivity Policy Check
                const policy = getActiveRolePolicy(userRole);
                const timeoutMinutes = policy?.session_timeout && policy.session_timeout > 0 ? policy.session_timeout : 30;
                const timeoutMs = timeoutMinutes * 60 * 1000;
                const idleDuration = now - lastActivityRef.current;

                if (idleDuration >= timeoutMs) {
                    logger.warn('useSessionManager', `Zero-Trust: Session expired after ${timeoutMinutes}m of inactivity`);
                    onSessionTimeout?.();
                    return;
                }

                // 2. Enforce MFA using Supabase's current session assurance level.
                // Browser metadata and a configured factor do not prove an AAL2 session.
                const mfaCheckKey = `${session.user.id}:${userRole || ''}`;
                if (policy?.mfa_required && mfaCheckedForRef.current !== mfaCheckKey) {
                    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
                    const mfaCheck = checkMfaRequirement(userRole, assuranceError ? 'aal1' : (assurance?.currentLevel ?? undefined));
                    if (mfaCheck.required && !mfaCheck.satisfied) {
                        logger.warn('useSessionManager', mfaCheck.reason || 'MFA requirement not satisfied');
                        onSessionTimeout?.();
                        return;
                    }
                    mfaCheckedForRef.current = mfaCheckKey;
                }

                // Warn when 1 minute remains before inactivity timeout
                const idleRemainingMs = timeoutMs - idleDuration;
                if (idleRemainingMs <= 60000 && idleRemainingMs > 0 && !hasWarned) {
                    setHasWarned(true);
                    onSessionWarning?.(1);
                }

                // 3. JWT Token Expiration Check
                if (session.expires_at) {
                    const expiresAt = new Date(session.expires_at * 1000);
                    const timeUntilExpiry = expiresAt.getTime() - now;

                    // Warn user if token expires in less than configured warning threshold
                    if (timeUntilExpiry < APP_CONFIG.SESSION_EXPIRY_WARNING_TIME && !hasWarned) {
                        const minutesLeft = Math.floor(timeUntilExpiry / 60000);
                        logger.warn('useSessionManager', `Session token expires in ${minutesLeft} minutes`);
                        setHasWarned(true);
                        onSessionWarning?.(minutesLeft);
                    }

                    // Reset warning flag if session was refreshed
                    if (timeUntilExpiry > APP_CONFIG.SESSION_EXPIRY_WARNING_TIME && idleRemainingMs > 60000) {
                        setHasWarned(false);
                    }
                }
            } catch (error) {
                logger.error('useSessionManager', 'Session check failed:', error);
            }
        };

        const startTimers = () => {
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
            if (expirationCheckRef.current) clearInterval(expirationCheckRef.current);

            // Refresh session every 30 minutes
            refreshIntervalRef.current = setInterval(async () => {
                if (!document.hidden && isActive) {
                    await checkAndRefreshSession();
                }
            }, APP_CONFIG.SESSION_REFRESH_INTERVAL);

            // Check for inactivity & session expiration every 15 seconds for responsive Zero-Trust enforcement
            expirationCheckRef.current = setInterval(async () => {
                if (!document.hidden && isActive) {
                    await checkAndRefreshSession();
                }
            }, 15000);
        };

        // Visibility API: Pause when tab is hidden, resume when visible
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
                if (expirationCheckRef.current) clearInterval(expirationCheckRef.current);
            } else {
                if (isActive) {
                    startTimers();
                }
            }
        };

        setTimeout(() => {
            if (isActive) {
                startTimers();
            }
        }, 2000);

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            isActive = false;
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
            if (expirationCheckRef.current) clearInterval(expirationCheckRef.current);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [hasWarned, onSessionWarning, onSessionTimeout, userRole]);
}
