/**
 * Supabase Client Configuration
 * Centralized Supabase instance for the entire app
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables from Vite
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// In local browser development, route through the Vite dev proxy (/supabase-proxy)
// so Node.js can route directly via the healthy Cloudflare IPv4 edge and avoid ISP DNS64/IPv6 timeouts.
const useLocalDevProxy =
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    window.location &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('172.'));

const supabaseUrl = useLocalDevProxy
    ? `${window.location.origin}/supabase-proxy`
    : rawSupabaseUrl;

// Validate environment variables
if (!rawSupabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables!');
    console.error('Please create .env.local with:');
    console.error('VITE_SUPABASE_URL=your-project-url');
    console.error('VITE_SUPABASE_ANON_KEY=your-anon-key');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
});

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
    return !!(rawSupabaseUrl && supabaseAnonKey);
};

// Export types for TypeScript
export type { User, Session } from '@supabase/supabase-js';

