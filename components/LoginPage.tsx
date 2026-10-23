import { ThemeSelector } from './ThemeSelector';
import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Loader, Eye, EyeOff, ArrowLeft, CheckCircle, Crown } from 'lucide-react';
import { useStore } from '../contexts/CentralStore';
import { useData } from '../contexts/DataContext';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';
import { KenyanQuickLogin } from './login/KenyanQuickLogin';
import { CountryQuickLoginPanel } from './login/CountryQuickLoginPanel';
import Logo from './Logo';
import { useStagingAccounts, useStagingQuickLogin } from '../hooks/useStagingQuickLogin';
import { isStagingQuickLoginAvailable } from '../utils/stagingQuickLogin';

type Mode = 'login' | 'forgot';

export default function LoginPage() {
  const { login } = useStore();
  const { settings } = useData();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const quickLogin = useStagingQuickLogin();
  const { data: stagingAccounts = [] } = useStagingAccounts();
  const stagingExecutive = stagingAccounts.find(account => account.country === 'GLOBAL');
  const stagingKeRegionalMgr = stagingAccounts.find(
    account => account.country === 'KE' && account.roleId === 'regional_operations_manager'
  );
  const stagingEtRegionalMgr = stagingAccounts.find(
    account => account.country === 'ET' && account.roleId === 'regional_operations_manager'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const success = await login(email, password);
        if (success) {
          window.location.hash = '#/';
        } else {
          setError('Invalid credentials. Please check your email/username and password.');
        }
      } else if (mode === 'forgot') {
        await authService.resetPassword(email);
        setSuccess('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      logger.error('LoginPage', 'Auth error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setError('');
    setSuccess('');
    setPassword('');
  };

  const handleQuickLogin = async (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('');
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await quickLogin.mutateAsync(quickEmail);
      window.location.hash = '#/';
    } catch (err: any) {
      logger.error('LoginPage', 'Quick login error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#FAF8F5] dark:bg-[#000000] transition-colors duration-300"
      style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 1rem)' }}
    >

      {/* Premium Theme Switcher */}
      <div className="absolute right-6 z-20" style={{ top: 'calc(1.5rem + env(safe-area-inset-top, 0px))' }}>
        <ThemeSelector />
      </div>

      {/* Main 3-Column Layout: Left (Ethiopia) | Center (Login) | Right (Kenya) */}
      <div className="w-full max-w-[1380px] mx-auto flex flex-col lg:flex-row items-center justify-center gap-4 xl:gap-6 relative z-10 py-4 px-2 sm:px-4">
        
        {/* Left: Ethiopian Quick Logins (Desktop) */}
        {mode === 'login' && (
          <div className="hidden lg:block shrink-0">
            <CountryQuickLoginPanel
              country="ET"
              title="Ethiopia Staging Roles"
              onSelectAccount={handleQuickLogin}
              disabled={loading}
            />
          </div>
        )}

        {/* Center: Main Login Card */}
        <div className="max-w-[440px] w-full shrink-0 bg-white dark:bg-[#111111] border border-stone-200 dark:border-white/10 rounded-[32px] p-8 sm:p-10 relative z-10 shadow-2xl transition-all duration-300">
          
          {/* Header Branding section */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="mb-2 select-none flex flex-col items-center">
              <Logo variant="stacked" size={32} className="justify-center" />
            </div>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-[0.25em] font-bold mt-1 select-none text-center px-4">
              {mode === 'login' ? (settings?.slogan || 'Operations Access Portal') : 'Security Recovery'}
            </p>
          </div>

          {/* Quick Login for Staging Key Leadership on localhost */}
          {mode === 'login' && isStagingQuickLoginAvailable() && (
            <div className="mb-5 space-y-2">
              {stagingExecutive && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin(stagingExecutive.email)}
                  className="w-full py-2.5 px-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 hover:border-amber-500/40 text-amber-900 dark:text-amber-100 text-xs font-semibold flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer shadow-xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      <Crown size={15} />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                        <span>Group Chief Executive Officer</span>
                        <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30">ALL ACCESS</span>
                      </div>
                      <div className="text-[10px] text-amber-700/80 dark:text-amber-300/80 font-medium">Cross-Border Sovereign Executive</div>
                    </div>
                  </div>
                  <span className="text-[9.5px] font-mono opacity-70 group-hover:opacity-100 shrink-0 font-medium">{stagingExecutive.email}</span>
                </button>
              )}

              {/* Mobile / Compact Quick Switches for Regional Leadership */}
              {(stagingEtRegionalMgr || stagingKeRegionalMgr) && (
                <div className="grid grid-cols-2 gap-1.5 lg:hidden">
                  {stagingEtRegionalMgr && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickLogin(stagingEtRegionalMgr.email)}
                      className="py-1.5 px-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 hover:border-amber-500/40 text-amber-800 dark:text-amber-200 text-[11px] font-semibold flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer"
                      title={`Quick Login: ${stagingEtRegionalMgr.name} (${stagingEtRegionalMgr.role})`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs">🇪🇹</span>
                        <span className="truncate">Henok (ET Lead)</span>
                      </div>
                    </button>
                  )}
                  {stagingKeRegionalMgr && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickLogin(stagingKeRegionalMgr.email)}
                      className="py-1.5 px-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-[11px] font-semibold flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer"
                      title={`Quick Login: ${stagingKeRegionalMgr.name} (${stagingKeRegionalMgr.role})`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs">🇰🇪</span>
                        <span className="truncate">Kamau (KE Lead)</span>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 dark:bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-xs leading-relaxed animate-fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-emerald-600 dark:text-emerald-400 text-xs leading-relaxed animate-fade-in">
              <CheckCircle size={16} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2 select-none">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 hover:border-stone-400 dark:hover:border-white/20 rounded-2xl px-4 py-3.5 pl-11 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:border-black dark:focus:border-white focus:ring-4 focus:ring-black/5 dark:focus:ring-white/10 focus:outline-none transition-all duration-300 text-sm"
                  placeholder="name@company.com"
                  required
                />
                <Mail className="absolute left-4 top-4 text-stone-400 dark:text-stone-500" size={16} />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-2 select-none">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); resetForm(); }}
                    className="text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 hover:border-stone-400 dark:hover:border-white/20 rounded-2xl px-4 py-3.5 pl-11 pr-11 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 focus:border-black dark:focus:border-white focus:ring-4 focus:ring-black/5 dark:focus:ring-white/10 focus:outline-none transition-all duration-300 text-sm"
                    placeholder="••••••••"
                    required
                  />
                  <Lock className="absolute left-4 top-4 text-stone-400 dark:text-stone-500" size={16} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-[0.98] text-white dark:text-black font-semibold py-3.5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 mt-8 shadow-sm hover:shadow-md dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  <span>{mode === 'forgot' ? 'Sending...' : 'Signing In...'}</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Sign In' : 'Send Reset Link'}</span>
              )}
            </button>

            {/* Mode switching links */}
            <div className="flex flex-col gap-3 mt-6 text-center select-none">
              {mode === 'login' && (
                <div className="text-xs text-stone-500 dark:text-stone-400 leading-normal">
                  Need access? Contact your systems manager.
                </div>
              )}
              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => { setMode('login'); resetForm(); }}
                  className="text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-black dark:hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  Back to Sign In
                </button>
              )}
            </div>
          </form>

          {/* Mobile-only collapsible quick login panel */}
          {mode === 'login' && (
            <div className="lg:hidden mt-4">
              <KenyanQuickLogin
                onSelectAccount={handleQuickLogin}
                disabled={loading}
              />
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-[#E2DCCE]/40 dark:border-white/[0.04] text-center select-none">
            <p className="text-[10px] text-stone-500 dark:text-stone-400 font-bold tracking-[0.16em] uppercase">SIIFMART Operations v3.6.1</p>
          </div>
        </div>

        {/* Right: Kenyan Quick Logins (Desktop) */}
        {mode === 'login' && (
          <div className="hidden lg:block shrink-0">
            <CountryQuickLoginPanel
              country="KE"
              title="Kenya Staging Roles"
              onSelectAccount={handleQuickLogin}
              disabled={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
