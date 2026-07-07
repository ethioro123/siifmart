/**
 * Session management utilities
 * Extracted from auth.service.ts to keep file size manageable.
 */

import type { Session } from '@supabase/supabase-js';

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export const sessionService = {
    /**
     * Store session in localStorage (backup)
     */
    storeSession(session: Session) {
        localStorage.setItem('siif_session', JSON.stringify(session));
    },

    /**
     * Get stored session
     */
    getStoredSession(): Session | null {
        const stored = localStorage.getItem('siif_session');
        return stored ? JSON.parse(stored) : null;
    },

    /**
     * Clear stored session
     */
    clearSession() {
        localStorage.removeItem('siif_session');
    },

    /**
     * Check if session is valid
     */
    isSessionValid(session: Session): boolean {
        if (!session) return false;
        const expiresAt = session.expires_at;
        if (!expiresAt) return false;
        return new Date(expiresAt * 1000) > new Date();
    }
};
