import React, { useState } from 'react';
import { Lock, Mail, Sun, Moon, AlertCircle, Loader, Eye, EyeOff, ArrowLeft, CheckCircle, LayoutDashboard } from 'lucide-react';
import { useStore } from '../contexts/CentralStore';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';

type Mode = 'login' | 'forgot';

const QUICK_ACCOUNTS = [
  { name: 'Shukri Kamal', role: 'CEO (Super Admin)', email: 'siif-0001@siifmart.com', password: 'Oromo123' },
  { name: 'Abebe Yilma', role: 'Picker (Harar)', email: 'siif-0006@siifmart.com', password: 'siif123' },
  { name: 'Firomsa Hasan', role: 'Packer (Harar)', email: 'siif-0033@siifmart.com', password: 'siif123' },
  { name: 'Betelhem Bekele', role: 'Dispatcher (Harar)', email: 'siif-0005@siifmart.com', password: 'siif123' },
  { name: 'Adam Ahmed', role: 'Receiver (Harar)', email: 'siif-0035@siifmart.com', password: 'siif123' },
  { name: 'Ibsa Sufiyan', role: 'Driver (Harar)', email: 'siif-0032@siifmart.com', password: 'siif123' },
  { name: 'Kamal Idriss', role: 'Warehouse Mgr (Harar)', email: 'siif-0034@siifmart.com', password: 'siif123' },
  { name: 'Kebede Alemayehu', role: 'Warehouse Mgr (Harar)', email: 'siif-0028@siifmart.com', password: 'siif123' }
];

export default function LoginPage() {
  const { login, toggleTheme, theme } = useStore();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showQuickLogin, setShowQuickLogin] = useState(false);

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const ok = await login(quickEmail, quickPass);
      if (!ok) {
        setError('Invalid credentials. Please check your email/username and password.');
      }
    } catch (err: any) {
      logger.error('LoginPage', 'Auth error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const success = await login(email, password);
        if (!success) {
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#FAF8F5] via-[#F4F0E6] to-[#FAF8F5] dark:from-[#0B0F0D] dark:via-[#131915] dark:to-[#0B0F0D] transition-colors duration-500">
      
      {/* Premium Decorative Ambient Glows — DESKTOP ONLY (blur kills mobile GPU) */}
      <div className="hidden lg:block absolute top-[-10%] left-[10%] w-[45vw] h-[45vw] rounded-full bg-[#2C5E3B]/10 dark:bg-[#1E3F27]/5 blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="hidden lg:block absolute bottom-[-10%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-amber-600/10 dark:bg-amber-700/3 blur-[140px] pointer-events-none animate-pulse-slow" />

      {/* Grid Pattern — DESKTOP ONLY */}
      <div className="hidden lg:block absolute inset-0 bg-[linear-gradient(to_right,rgba(44,94,59,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(44,94,59,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(169,203,162,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(169,203,162,0.012)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Premium Theme Switcher */}
      <button 
        onClick={toggleTheme} 
        aria-label="Toggle Theme"
        className="absolute top-6 right-6 p-3 rounded-2xl bg-white/80 dark:bg-[#18201B]/70 border border-[#E2DCCE] dark:border-emerald-950/20 text-[#2C4D35] dark:text-[#A9CBA2] hover:text-[#1E3F27] dark:hover:text-white hover:scale-105 active:scale-95 transition-all shadow-[0_2px_12px_rgba(44,94,59,0.03)] dark:shadow-none lg:backdrop-blur-md z-20 cursor-pointer"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Login Card */}
      <div className="max-w-[440px] w-full bg-white/85 dark:bg-[#18201B]/60 border border-[#E2DCCE] dark:border-emerald-950/20 rounded-[32px] p-8 sm:p-10 relative z-10 shadow-[0_24px_80px_-12px_rgba(34,50,38,0.06)] dark:shadow-[0_32px_96px_-12px_rgba(5,8,6,0.65)] lg:backdrop-blur-2xl transition-all duration-300">
        
        {/* Header Branding section */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="relative group mb-4 select-none">
            {/* Elegant logo back-glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#2C5E3B] via-[#4A855A] to-amber-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1E3F27] via-[#2C5E3B] to-amber-700 flex items-center justify-center shadow-[0_8px_20px_rgba(44,94,59,0.25)] transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
              <LayoutDashboard size={30} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
            </div>
          </div>
          
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1E3F27] dark:text-[#EAE5D9] flex items-center gap-1.5 select-none">
            SIIF<span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2C5E3B] to-amber-600 dark:from-[#A9CBA2] dark:to-[#DFD5C6] font-black">MART</span>
          </h1>
          <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] uppercase tracking-[0.25em] font-bold mt-2 select-none">
            {mode === 'login' ? 'Operations Access Portal' : 'Security Recovery'}
          </p>
        </div>

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
            <label className="block text-xs font-semibold text-[#2C4D35] dark:text-[#A9CBA2] uppercase tracking-wider mb-2 select-none">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#CFC6B4] dark:hover:border-emerald-900/15 rounded-2xl px-4 py-3.5 pl-11 text-[#1E3F27] dark:text-[#EAE5D9] placeholder-stone-400 dark:placeholder-stone-500 focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-4 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 focus:outline-none transition-all duration-300 text-sm"
                placeholder="name@company.com"
                required
              />
              <Mail className="absolute left-4 top-4 text-[#4D6E56] dark:text-[#7A9E83]" size={16} />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-2 select-none">
                <label className="block text-xs font-semibold text-[#2C4D35] dark:text-[#A9CBA2] uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); resetForm(); }}
                  className="text-xs font-semibold text-[#4D6E56] dark:text-[#A9CBA2] hover:text-[#2C5E3B] dark:hover:text-[#EAE5D9] transition-colors cursor-pointer"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/90 dark:bg-black/25 border border-[#E2DCCE] dark:border-emerald-950/20 hover:border-[#CFC6B4] dark:hover:border-emerald-900/15 rounded-2xl px-4 py-3.5 pl-11 pr-11 text-[#1E3F27] dark:text-[#EAE5D9] placeholder-stone-400 dark:placeholder-stone-500 focus:border-[#2C5E3B] dark:focus:border-[#A9CBA2] focus:ring-4 focus:ring-[#2C5E3B]/10 dark:focus:ring-[#A9CBA2]/10 focus:outline-none transition-all duration-300 text-sm"
                  placeholder="••••••••"
                  required
                />
                <Lock className="absolute left-4 top-4 text-[#4D6E56] dark:text-[#7A9E83]" size={16} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-[#4D6E56] dark:text-[#7A9E83] hover:text-[#2C5E3B] dark:hover:text-[#EAE5D9] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#224429] dark:bg-[#EAE5D9] hover:bg-[#1B3520] dark:hover:bg-[#DFD9CA] active:scale-[0.98] text-[#FAF8F5] dark:text-[#1E3B24] font-semibold py-3.5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 mt-8 shadow-sm hover:shadow-md dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={18} />
                <span>{mode === 'forgot' ? 'Sending...' : 'Authenticating...'}</span>
              </>
            ) : (
              <span>{mode === 'login' ? 'Sign In' : 'Send Reset Link'}</span>
            )}
          </button>

          {/* Mode switching links */}
          <div className="flex flex-col gap-3 mt-6 text-center select-none">
            {mode === 'login' && (
              <div className="text-xs text-[#4D6E56] dark:text-[#7A9E83] leading-normal">
                Need access? Contact your systems manager.
              </div>
            )}
            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => { setMode('login'); resetForm(); }}
                className="text-xs font-semibold text-[#4D6E56] dark:text-[#A9CBA2] hover:text-[#224429] dark:hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} />
                Back to Sign In
              </button>
            )}
          </div>
        </form>

        {/* Quick Dev Sign-In Panel */}
        {mode === 'login' && (
          <div className="mt-6 pt-6 border-t border-[#E2DCCE]/40 dark:border-white/[0.04]">
            <button
              type="button"
              onClick={() => setShowQuickLogin(!showQuickLogin)}
              className="w-full flex items-center justify-between text-xs font-black text-[#2C5E3B] dark:text-[#A9CBA2] uppercase tracking-widest hover:underline cursor-pointer"
            >
              <span>Quick Dev Sign-In</span>
              <span className="text-[10px]">{showQuickLogin ? '▼' : '▲'}</span>
            </button>
            
            {showQuickLogin && (
              <div className="grid grid-cols-2 gap-2 mt-4 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {QUICK_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickLogin(acc.email, acc.password)}
                    className="p-2 text-left bg-stone-50/70 dark:bg-black/25 border border-[#E2DCCE]/50 dark:border-emerald-950/20 hover:border-[#2C5E3B] dark:hover:border-[#A9CBA2] rounded-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
                  >
                    <span className="text-[10px] font-black text-[#1E3F27] dark:text-[#EAE5D9] truncate w-full">{acc.name}</span>
                    <span className="text-[8px] font-bold text-stone-500 dark:text-stone-400 uppercase mt-0.5">{acc.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-[#E2DCCE]/40 dark:border-white/[0.04] text-center select-none">
          <p className="text-[10px] text-[#4D6E56] dark:text-[#7A9E83] font-semibold tracking-wider uppercase">SiifMart Operations v3.0</p>
        </div>
      </div>
    </div>
  );
}
