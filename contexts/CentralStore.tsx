import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { UserRole } from '../types';
import { employeesService } from '../services/employees.service';
import { useSessionManager } from '../hooks/useSessionManager';
import { useDataRefresh } from '../hooks/useDataRefresh';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { systemLogsService } from '../services/local-logs.service';
import { systemLogsService as dbSystemLogsService } from '../services/supabase.service';
import { APP_CONFIG } from '../config/app.config';
import Toast from '../components/Toast';
import { usePresence } from '../services/realtime.service';
import { logger } from '../utils/logger';
interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  title: string;
  siteId?: string;
  employeeId?: string;
  email?: string;
  loginLocation?: string;
}
interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
}
interface StoreContextType {
  user: User | null;
  originalUser?: User | null; // For Ghost Mode
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  impersonateUser: (user: User) => void;
  stopImpersonation: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  loading: boolean;
  isOnline: boolean;
  isServerDown: boolean;
  showToast: (message: string, type?: 'info' | 'warning' | 'error' | 'success', duration?: number) => void;
  updateUserAvatar: (newAvatar: string) => void; // Update current user's avatar
  onlineIds: Set<string>;
}

const fetchLoginLocation = async (): Promise<string> => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser. Location tracking is required to log in.');
  }

  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds to allow clicking "Allow" on browser prompt
        maximumAge: 0   // Force fresh location capture
      });
    });
    return `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
  } catch (geoErr: any) {
    logger.error('CentralStore', 'Browser GPS geolocation failed:', geoErr);
    
    let errMsg = 'Location permission is required to access the system. Please grant location permissions in your browser settings.';
    if (geoErr.code === geoErr.TIMEOUT) {
      errMsg = 'Location request timed out. Please ensure GPS is enabled and grant location permissions to continue.';
    } else if (geoErr.code === geoErr.POSITION_UNAVAILABLE) {
      errMsg = 'Your location could not be determined. Please ensure your device GPS is active.';
    }
    
    throw new Error(`Location tracking failed: ${errMsg}`);
  }
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isServerDown, setIsServerDown] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Session warning handler
  const handleSessionWarning = (minutesLeft: number) => {
    showToast(
      `Your session will expire in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}. Please save your work.`,
      'warning',
      APP_CONFIG.TOAST_WARNING_DURATION
    );
  };

  // Activate session management with warning callback
  useSessionManager(handleSessionWarning);

  // Activate periodic data refresh (every 5 minutes)
  // TEMPORARILY DISABLED - causing page blinking on load
  // const { refresh } = useDataRefresh(5);

  // Monitor network status
  const { isOnline, wasOffline } = useNetworkStatus();

  // Hydrate user profile from database to ensure metadata is sync'd
  // IMPORTANT: Wrapped with timeout to prevent infinite loading on production
  const syncUserProfile = async (presetLocation?: string) => {
    const SYNC_TIMEOUT_MS = 5000; // 5 seconds max for profile sync

    try {
      logger.debug('CentralStore', 'CentralStore: Syncing user profile from database...');

      // Race between profile fetch and timeout
      const profilePromise = authService.getCurrentAuthUser();
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Profile sync timeout')), SYNC_TIMEOUT_MS)
      );

      const profile = await Promise.race([profilePromise, timeoutPromise]);

      if (profile) {
        logger.debug('CentralStore', 'CentralStore: Profile found in DB, syncing state...');
        const rawRole = profile.role;
        const rawNormalized = rawRole.toLowerCase().trim().replace(/[\s-]/g, '_');
        
        // Map common aliases to internal role keys used in ACTION_PERMISSIONS
        let mappedRole = rawNormalized;
        if (rawNormalized === 'ceo') mappedRole = 'super_admin';
        else if (rawNormalized === 'procurement') mappedRole = 'procurement_manager';

        // Resolve location: use preset, then check sessionStorage, then fetch precisely.
        let location = presetLocation;
        if (!location) {
          try {
            location = sessionStorage.getItem('siifmart_login_location') || undefined;
          } catch (e) {
            logger.warn('CentralStore', 'sessionStorage is disabled in this environment');
          }
        }

        if (!location) {
          // If no pre-cached session location, we must attempt to fetch the location.
          // This will throw an error to block the sign-in if location tracking is disabled.
          location = await fetchLoginLocation();
        }

        // Cache the verified login location for this browser session
        try {
          sessionStorage.setItem('siifmart_login_location', location);
        } catch (e) {
          logger.warn('CentralStore', 'Could not cache session location');
        }

        // Save last login GPS, timestamp, device, and login history to Supabase
        if (location) {
          try {
            const employeeData = await employeesService.getById(profile.id);
            const currentHistory = Array.isArray(employeeData.loginHistory) ? employeeData.loginHistory : [];

            // Helper to get simplified device/OS details
            const getDeviceDetails = (): string => {
              if (typeof window === 'undefined' || !navigator) return 'Unknown Device';
              const ua = navigator.userAgent;
              let browser = 'Unknown Browser';
              let os = 'Unknown OS';
              if (ua.includes('Windows')) os = 'Windows';
              else if (ua.includes('Macintosh')) os = 'macOS';
              else if (ua.includes('Linux')) os = 'Linux';
              else if (ua.includes('Android')) os = 'Android';
              else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
              if (ua.includes('Firefox')) browser = 'Firefox';
              else if (ua.includes('Chrome')) browser = 'Chrome';
              else if (ua.includes('Safari')) browser = 'Safari';
              else if (ua.includes('Edge')) browser = 'Edge';
              return `${browser} on ${os}`;
            };

            const device = getDeviceDetails();
            const timestamp = new Date().toISOString();

            // Append to login history, limit to last 20 entries
            const updatedHistory = [
              { timestamp, location, device },
              ...currentHistory
            ].slice(0, 20);

            await employeesService.update(profile.id, {
              lastLoginGps: location,
              lastLoginAt: timestamp,
              lastLoginDevice: device,
              loginHistory: updatedHistory
            });
          } catch (updateErr) {
            logger.error('CentralStore', 'Failed to update employee login history and details:', updateErr);
          }
        }

        setUser({
          id: profile.id,
          name: profile.name,
          role: mappedRole as UserRole,
          avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=0D8ABC&color=fff`,
          title: rawRole.charAt(0).toUpperCase() + rawRole.slice(1),
          siteId: profile.siteId,
          employeeId: profile.id,
          email: profile.email,
          loginLocation: location
        });

        // Audit log security event with location details only when presetLocation is provided (new sign-in)
        if (presetLocation) {
          // 1. Log to client-side localStorage audit trail
          systemLogsService.logSecurity(
            'USER_LOGIN',
            `User ${profile.name} logged in from location: ${location}`,
            { id: profile.id, role: mappedRole, name: profile.name }
          );

          // 2. Log to global Supabase database system_logs table (displays in Settings -> Audit Log)
          try {
            dbSystemLogsService.create({
              user_name: profile.name,
              action: 'USER_LOGIN',
              details: `Logged in from location: ${location}`,
              module: 'Security'
            }).catch(dbErr => logger.error('CentralStore', 'Non-blocking DB logging failure', dbErr as Error));
          } catch (err) {
            logger.error('CentralStore', 'Failed to log USER_LOGIN to database:', err);
          }
        }
      } else {
        logger.warn('CentralStore', 'CentralStore: No profile returned, user may need to re-login');
      }
    } catch (error: any) {
      if (error?.message === 'Profile sync timeout') {
        logger.warn('CentralStore', '⚠️ CentralStore: Profile sync timed out after 5s - continuing without blocking');
      } else {
        logger.error('CentralStore', 'CentralStore: Sync failed', error);
        // Force logout if strict location check throws error during sync lifecycle
        if (error?.message?.includes('Location tracking failed')) {
          await authService.signOut();
          setUser(null);
          try {
            sessionStorage.removeItem('siifmart_login_location');
          } catch (e) {}
          throw error;
        }
      }
    }
  };

  // Initialize
  useEffect(() => {
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        logger.debug('CentralStore', 'Auth state changed:');
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            await syncUserProfile();
          } catch (e) {
            logger.error('CentralStore', 'Auto sign-in profile sync failed due to geolocation lock:', e);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          try {
            sessionStorage.removeItem('siifmart_login_location');
          } catch (e) {}
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle network reconnection
  // DISABLED - refresh function not available
  // useEffect(() => {
  //   if (wasOffline && isOnline) {
  //     logger.debug('CentralStore', 'Network reconnected - refreshing data');
  //     refresh();
  //   }
  // }, [isOnline, wasOffline, refresh]);

  // Periodic log cleanup (daily)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      systemLogsService.cleanupOldLogs(30); // Keep last 30 days
    }, 24 * 60 * 60 * 1000); // Once per day

    return () => clearInterval(cleanupInterval);
  }, []);

  // Theme persistence
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // --- SERVER HEALTH KILL-SWITCH ---
  useEffect(() => {
    // We import supabase here to avoid circular dependencies if any
    const checkServerHealth = async () => {
      try {
        const { supabase } = await import('../lib/supabase');
        // Simple light-weight check: Read one site record
        const { error } = await supabase.from('sites').select('id').limit(1);

        if (error) {
          // If message contains 'fetch' it's almost certainly a connection issue
          const msg = error.message.toLowerCase();
          if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed')) {
            if (!isServerDown) { // Only log on state change
              logger.warn('CentralStore', '⚠️ Connection to server lost.');
            }
            setIsServerDown(true);
          } else {
            // Other errors (auth, etc) mean the server IS reachable
            if (isServerDown) logger.debug('CentralStore', '✅ Connection to server restored.');
            setIsServerDown(false);
          }
        } else {
          if (isServerDown) logger.debug('CentralStore', '✅ Connection to server restored.');
          setIsServerDown(false);
        }
      } catch (e) {
        logger.error('CentralStore', 'CRITICAL: Health check exception!', e);
        setIsServerDown(true);
      }
    };

    // Check every 5 seconds
    const interval = setInterval(checkServerHealth, 5000);
    checkServerHealth(); // Immediate check

    return () => clearInterval(interval);
  }, []);

  const checkSession = async () => {
    // FAIL-SAFE: Ensure loading is ALWAYS set to false within 10 seconds
    const failSafeTimeout = setTimeout(() => {
      logger.warn('CentralStore', '⚠️ CentralStore: Session check fail-safe triggered after 10s');
      setLoading(false);
    }, 10000);

    try {
      const session = await authService.getSession();
      if (session?.user) {
        await syncUserProfile();
      }
    } catch (error) {
      logger.error('CentralStore', 'Session check failed:', error);
    } finally {
      clearTimeout(failSafeTimeout);
      setLoading(false);
    }
  };

  // --- Actions ---
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      logger.debug('CentralStore', 'CentralStore: Attempting login...');

      // 1. MUST capture location first (throws if fails)
      const location = await fetchLoginLocation();
      logger.debug('CentralStore', 'CentralStore: Location captured successfully:');

      const result = await authService.signIn(email, password);
      logger.debug('CentralStore', 'CentralStore: Sign in successful!');

      if (result?.user) {
        await syncUserProfile(location);
        logger.debug('CentralStore', 'CentralStore: Login complete!');
        // Force navigate to root to trigger role-based redirects in App.tsx
        window.location.hash = '#/';
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('CentralStore', 'Login failed:', error);
      // Re-throw so that LoginPage can display the specific error message
      throw error;
    }
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
    try {
      sessionStorage.removeItem('siifmart_login_location');
    } catch (e) {}
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const showToast = (message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info', duration?: number) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const [originalUser, setOriginalUser] = useState<User | null>(null);

  // ... existing state ...

  // --- Impersonation (Ghost Mode) ---
  const impersonateUser = (targetUser: User) => {
    if (!originalUser) {
      setOriginalUser(user); // Save current admin
    }
    setUser(targetUser);
    showToast(`👻 Ghost Mode Active: Impersonating ${targetUser.name}`, 'warning');
  };

  const stopImpersonation = () => {
    if (originalUser) {
      setUser(originalUser);
      setOriginalUser(null);
      showToast('👻 Ghost Mode Deactivated', 'success');
    }
  };

  // Update current user's avatar in local state
  const updateUserAvatar = (newAvatar: string) => {
    logger.debug('CentralStore', '📷 CentralStore.updateUserAvatar called');
    logger.debug('CentralStore', '📷 Current user:');
    logger.debug('CentralStore', '📷 New avatar (first 100 chars)');
    if (user) {
      const updatedUser = { ...user, avatar: newAvatar };
      logger.debug('CentralStore', '📷 Setting updated user state');
      setUser(updatedUser);
      logger.debug('CentralStore', '📷 User state updated successfully');
    }
  };

  // Global Real-time Presence subscription — registered exactly once when user is logged in
  const onlineIds = usePresence(user?.id || undefined, user?.name || undefined);

  const value = React.useMemo(() => ({
    user,
    originalUser, // Expose original user to check if impersonating
    login,
    logout,
    impersonateUser,
    stopImpersonation,
    theme,
    toggleTheme,
    isSidebarOpen,
    toggleSidebar,
    loading,
    isOnline,
    isServerDown,
    showToast,
    updateUserAvatar,
    onlineIds
  }), [user, originalUser, theme, isSidebarOpen, loading, isOnline, isServerDown, onlineIds]);

  return (
    <StoreContext.Provider value={value}>
      {children}
      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
