import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { UserRole, User } from '../types';
import { employeesService } from '../services/employees.service';
import { useSessionManager, type SessionWarning } from '../hooks/useSessionManager';
import { useDataRefresh } from '../hooks/useDataRefresh';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { systemLogsService } from '../services/local-logs.service';
import { systemLogsService as dbSystemLogsService } from '../services/supabase.service';
import { APP_CONFIG } from '../config/app.config';
import { NotificationContainer } from '../components/notifications/NotificationContainer';
import { usePresence } from '../hooks/useRealtime';
import { logger } from '../utils/logger';
import { fetchLoginLocation } from '../utils/geolocationHelper';
import { evaluateGeofence } from '../utils/geofence';
import { getDeviceDetails } from '../utils/deviceHelper';
import { formatRole } from '../utils/formatting';
interface ToastMessage {
  id: string; message: string; type: 'info' | 'warning' | 'error' | 'success'; duration?: number; title?: string;
}
interface StoreContextType {
  user: User | null; originalUser?: User | null;
  login: (email: string, password: string) => Promise<boolean>; logout: () => void;
  impersonateUser: (user: User) => void; stopImpersonation: () => void;
  theme: 'dark' | 'light'; toggleTheme: () => void; isSidebarOpen: boolean; toggleSidebar: () => void;
  loading: boolean; isOnline: boolean; isServerDown: boolean;
  showToast: (message: string, type?: 'info' | 'warning' | 'error' | 'success', duration?: number, title?: string) => void;
  updateUserAvatar: (newAvatar: string) => void; onlineIds: Set<string>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isServerDown, setIsServerDown] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Session warning handler
  const showToast = useCallback((message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info', duration?: number, title?: string) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type, duration, title }]);
  }, []);

  const handleSessionWarning = useCallback((warning: SessionWarning) => {
    const message = warning.type === 'mfa_required'
      ? warning.message
      : `You’ll be signed out in ${warning.minutesLeft} minute${warning.minutesLeft !== 1 ? 's' : ''} due to inactivity. Please save your work.`;
    showToast(
      message,
      'warning',
      APP_CONFIG.TOAST_WARNING_DURATION
    );
  }, [showToast]);

  const handleSessionTimeout = useCallback(() => {
    showToast('Session expired due to inactivity per Zero-Trust role security policy.', 'warning');
    setUser(null);
    void authService.signOut();
  }, []);

  // Activate session management with warning callback & Zero-Trust inactivity timeout
  useSessionManager(handleSessionWarning, handleSessionTimeout, user?.role);

  // Monitor network status
  const { isOnline, wasOffline } = useNetworkStatus();

  // Hydrate user profile from database to ensure metadata is sync'd
  // IMPORTANT: Wrapped with timeout to prevent infinite loading on production
  const syncUserProfile = async (presetLocation?: string) => {
    const SYNC_TIMEOUT_MS = 12000; // 12 seconds max for profile sync on mobile/cellular

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
        
        // Stored role IDs are canonical; no alias mapping is performed
        const mappedRole = rawNormalized;

        // Resolve location: use preset on explicit login, check sessionStorage/localStorage, or fallback to active session
        let location = presetLocation;
        if (!location) {
          try {
            location = sessionStorage.getItem('siifmart_login_location') || localStorage.getItem('siifmart_login_location') || undefined;
          } catch (e) {
            logger.warn('CentralStore', 'sessionStorage is disabled in this environment');
          }
        }

        if (!location) {
          location = 'Local-Session';
          // Non-blocking background location resolution for active session
          fetchLoginLocation()
            .then(resolvedLoc => {
              try {
                sessionStorage.setItem('siifmart_login_location', resolvedLoc);
                localStorage.setItem('siifmart_login_location', resolvedLoc);
              } catch (_) {}
              setUser(prev => prev ? { ...prev, loginLocation: resolvedLoc } : null);
            })
            .catch(() => {});
        } else {
          try {
            sessionStorage.setItem('siifmart_login_location', location);
            localStorage.setItem('siifmart_login_location', location);
          } catch (_) {}
        }

        // Save last login GPS, timestamp, device, and login history ONLY on explicit login
        if (presetLocation && location) {
          try {
            const employeeData = await employeesService.getById(profile.id);
            const currentHistory = Array.isArray(employeeData.loginHistory) ? employeeData.loginHistory : [];

            const device = getDeviceDetails();
            const timestamp = new Date().toISOString();

            // Append to login history, limit to last 10 entries
            const updatedHistory = [
              { timestamp, location, device },
              ...currentHistory
            ].slice(0, 10);

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
          title: profile.jobTitle || formatRole(rawRole),
          jobTitle: profile.jobTitle || formatRole(rawRole),
          siteId: profile.siteId,
          employeeId: (profile as any).employeeId || profile.id,
          code: (profile as any).code || '',
          email: profile.email,
          loginLocation: location,
          regionCode: (profile as any).regionCode || (profile as any).region_code,
          region_code: (profile as any).region_code || (profile as any).regionCode,
          scopeLevel: (profile as any).scopeLevel || (profile as any).scope_level,
          scope_level: (profile as any).scope_level || (profile as any).scopeLevel,
          country: (profile as any).country_code,
          country_code: (profile as any).country_code
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

            const geofence = evaluateGeofence(location);
            if (geofence.isForeignAnomaly || geofence.isOffPremise) {
              dbSystemLogsService.create({
                user_name: profile.name,
                action: 'GEOFENCE_ALERT',
                details: `SECURITY ALERT: User ${profile.name} (${mappedRole}) authenticated from off-premise / foreign location: ${location}. ${geofence.anomalyReason || ''}`,
                module: 'Security'
              }).catch(() => {});
            }
          } catch (err) {
            logger.error('CentralStore', 'Failed to log USER_LOGIN to database:', err);
          }
        }
      } else {
        logger.warn('CentralStore', 'CentralStore: No profile returned, user may need to re-login');
      }
    } catch (error: any) {
      if (error?.message === 'Profile sync timeout') {
        logger.debug('CentralStore', 'CentralStore: Profile sync deferred, continuing with cached session');
      } else {
        logger.error('CentralStore', 'CentralStore: Sync failed', error);
      }
    }
  };

  // Initialize
  useEffect(() => {
    let profileSyncTimeout: ReturnType<typeof setTimeout> | null = null;
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      (event, session) => {
        logger.debug('CentralStore', 'Auth state changed:');
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          // Supabase invokes this callback while holding its auth lock. Defer
          // profile reads until after the callback returns to avoid deadlocking
          // getSession() and other auth operations during startup.
          if (profileSyncTimeout) clearTimeout(profileSyncTimeout);
          profileSyncTimeout = setTimeout(() => {
            profileSyncTimeout = null;
            void syncUserProfile().catch(error => {
              logger.error('CentralStore', 'Auto sign-in profile sync failed:', error);
            });
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          if (profileSyncTimeout) clearTimeout(profileSyncTimeout);
          profileSyncTimeout = null;
          setUser(null);
          try {
            sessionStorage.removeItem('siifmart_login_location');
          } catch (e) {}
        }
      }
    );

    return () => {
      if (profileSyncTimeout) clearTimeout(profileSyncTimeout);
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

  // --- SERVER HEALTH KILL-SWITCH (Event-Driven On Suspected Error) ---
  useEffect(() => {
    let recoveryTimeout: ReturnType<typeof setTimeout> | null = null;

    const checkServerHealth = async () => {
      try {
        const { supabase } = await import('../lib/supabase');
        // Targeted check: read one site ID only when connection disruption is suspected
        const { error } = await supabase.from('sites').select('id').limit(1);

        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed')) {
            if (!isServerDown) {
              logger.warn('CentralStore', 'Connection to server lost.');
            }
            setIsServerDown(true);
            // Single retry in 30s while connection remains down
            if (recoveryTimeout) clearTimeout(recoveryTimeout);
            recoveryTimeout = setTimeout(checkServerHealth, 30000);
          } else {
            if (isServerDown) logger.debug('CentralStore', 'Connection to server restored.');
            setIsServerDown(false);
          }
        } else {
          if (isServerDown) logger.debug('CentralStore', 'Connection to server restored.');
          setIsServerDown(false);
        }
      } catch (e) {
        logger.error('CentralStore', 'Health check exception:', e as Error);
        setIsServerDown(true);
        if (recoveryTimeout) clearTimeout(recoveryTimeout);
        recoveryTimeout = setTimeout(checkServerHealth, 30000);
      }
    };

    // Trigger ONLY when an error is suspected or network reconnects:
    const handleOnline = () => {
      checkServerHealth();
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason?.message || String(event?.reason || '');
      const lower = reason.toLowerCase();
      if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network request failed')) {
        checkServerHealth();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      if (recoveryTimeout) clearTimeout(recoveryTimeout);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [isServerDown]);

  const checkSession = async () => {
    // FAIL-SAFE: Ensure loading is ALWAYS set to false within 6 seconds on slow mobile
    const failSafeTimeout = setTimeout(() => {
      logger.warn('CentralStore', 'Session check fail-safe triggered');
      setLoading(false);
    }, 6000);

    try {
      const session = await authService.getSession();
      if (session?.user) {
        await syncUserProfile();
      } else {
        setUser(null);
      }
    } catch (error: any) {
      logger.warn('CentralStore', 'Session check failed:', error?.message);
      setUser(null);
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
    queryClient.clear();
    setUser(null);
    try {
      sessionStorage.removeItem('siifmart_login_location');
      localStorage.removeItem('siifmart_sites_cache');
    } catch (e) {}
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
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
      {/* Real-time On-Screen Explanatory Notification Cards */}
      <NotificationContainer toasts={toasts} onRemoveToast={removeToast} />
    </StoreContext.Provider>
  );
}

const STORE_FALLBACK: StoreContextType = {
  user: null, originalUser: null, login: async () => false, logout: () => {},
  impersonateUser: () => {}, stopImpersonation: () => {}, theme: 'light', toggleTheme: () => {},
  isSidebarOpen: false, toggleSidebar: () => {}, loading: false, isOnline: true, isServerDown: false,
  showToast: () => {}, updateUserAvatar: () => {}, onlineIds: new Set<string>()
};

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    logger.warn('CentralStore', 'useStore called outside StoreProvider - returning safe defaults');
    return STORE_FALLBACK;
  }
  return context;
}
