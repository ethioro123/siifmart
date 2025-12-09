import { supabase } from '../lib/supabase';

/**
 * Clear all authentication data and reload
 * Use this if you're stuck on a loading screen
 */
export async function clearSession() {
    try {
        // Sign out from Supabase
        await supabase.auth.signOut();

        // Clear localStorage
        localStorage.clear();

        // Clear sessionStorage
        sessionStorage.clear();

        console.log('✅ Session cleared successfully');

        // Reload the page
        window.location.reload();
    } catch (error) {
        console.error('Error clearing session:', error);
        // Force reload anyway
        window.location.reload();
    }
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
    (window as any).clearSession = clearSession;
}
