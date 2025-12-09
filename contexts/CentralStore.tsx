import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { useSessionManager } from '../utils/useSessionManager';
import { useDataRefresh } from '../utils/useDataRefresh';
import { useNetworkStatus } from '../utils/useNetworkStatus';
import { systemLogsService } from '../services/systemLogs.service';
import { APP_CONFIG } from '../config/app.config';
import Toast from '../components/Toast';

interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
  title: string;
  siteId?: string;
  employeeId?: string;
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
  showToast: (message: string, type?: 'info' | 'warning' | 'error' | 'success', duration?: number) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
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

  // Initialize
  useEffect(() => {
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN' && session?.user) {
          const u = session.user;
          setUser({
            id: u.id,
            name: u.user_metadata?.name || u.email?.split('@')[0] || 'User',
            role: u.user_metadata?.role || 'pos',
            avatar: u.user_metadata?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
            title: (u.user_metadata?.role || 'pos').charAt(0).toUpperCase() + (u.user_metadata?.role || 'pos').slice(1),
            siteId: u.user_metadata?.site_id,
            employeeId: u.user_metadata?.employee_id
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
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
  //     console.log('Network reconnected - refreshing data');
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

  const checkSession = async () => {
    try {
      const session = await authService.getSession();
      if (session?.user) {
        const u = session.user;
        setUser({
          id: u.id,
          name: u.user_metadata?.name || u.email?.split('@')[0] || 'User',
          role: u.user_metadata?.role || 'pos',
          avatar: u.user_metadata?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          title: (u.user_metadata?.role || 'pos').charAt(0).toUpperCase() + (u.user_metadata?.role || 'pos').slice(1),
          siteId: u.user_metadata?.site_id,
          employeeId: u.user_metadata?.employee_id
        });
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Actions ---
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('CentralStore: Attempting login...');
      const result = await authService.signIn(email, password);
      console.log('CentralStore: Sign in successful!');

      if (result?.user) {
        const u = result.user;
        setUser({
          id: u.id,
          name: u.user_metadata?.name || u.email?.split('@')[0] || 'User',
          role: u.user_metadata?.role || 'pos',
          avatar: u.user_metadata?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          title: (u.user_metadata?.role || 'pos').charAt(0).toUpperCase() + (u.user_metadata?.role || 'pos').slice(1),
          siteId: u.user_metadata?.site_id,
          employeeId: u.user_metadata?.employee_id
        });
        console.log('CentralStore: Login complete!');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login failed:', error);

      // DEMO MODE FALLBACK: Check if employee exists and password is Test123!
      if (password === 'Test123!') {
        console.log('CentralStore: Trying demo mode...');
        try {
          const { supabase } = await import('../lib/supabase');
          const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('*, sites(name)')
            .eq('email', email)
            .single();

          if (!empError && employee) {
            console.log('CentralStore: Demo mode login successful!', employee.name);
            setUser({
              id: employee.id,
              name: employee.name,
              role: employee.role,
              avatar: employee.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
              title: employee.role.charAt(0).toUpperCase() + employee.role.slice(1),
              siteId: employee.site_id || employee.siteId,
              employeeId: employee.id
            });
            return true;
          }
        } catch (demoError) {
          console.error('Demo mode failed:', demoError);
        }
      }

      return false;
    }
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
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
    showToast
  }), [user, originalUser, theme, isSidebarOpen, loading, isOnline]);

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
