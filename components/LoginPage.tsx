import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, Sun, Moon, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../contexts/CentralStore';
import { authService } from '../services/auth.service';
import { sitesService } from '../services/supabase.service';
import Logo from './Logo';



export default function LoginPage() {
  const { login, toggleTheme, theme } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [defaultSiteId, setDefaultSiteId] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);


  useEffect(() => {
    // Fetch the default site ID for signup
    const fetchDefaultSite = async () => {
      try {
        const sites = await sitesService.getAll();
        if (sites && sites.length > 0) {
          setDefaultSiteId(sites[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch sites:', err);
      }
    };

    fetchDefaultSite();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        console.log('Attempting login with:', email);
        const success = await login(email, password);
        console.log('Login result:', success);

        if (!success) {
          setError('Invalid credentials. Please check your email/username and password.');
        }
        // If successful, the user will be redirected automatically by App.tsx
      } else {
        // Sign up
        if (!defaultSiteId) {
          throw new Error('No site configuration found. Please contact support.');
        }

        console.log('Attempting signup with:', email, defaultSiteId);
        await authService.signUp(email, password, 'super_admin', name, defaultSiteId);
        setSuccess('Account created! You can now log in.');
        setIsLogin(true);
        setPassword(''); // Clear password for security
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-20" />

      <button onClick={toggleTheme} className="absolute top-6 right-6 p-3 rounded-full bg-cyber-gray border border-white/10 text-gray-400 hover:text-cyber-primary hover:border-cyber-primary transition-all z-20">
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="max-w-md w-full bg-cyber-dark border border-white/10 rounded-2xl p-8 relative z-10 shadow-[0_0_50px_rgba(0,255,157,0.1)]">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="mb-4">
            <Logo size={60} />
          </div>
          <p className="text-cyber-primary tracking-widest uppercase text-xs font-bold opacity-80">
            {isLogin ? 'Secure Access Portal' : 'New Account Registration'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400 text-sm">
            <Shield size={16} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 pl-10 text-white focus:border-cyber-primary focus:outline-none transition-colors"
                  placeholder="Enter your name"
                  required
                />
                <Shield className="absolute left-3 top-3.5 text-gray-500" size={16} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Email or Username</label>
            <div className="relative">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 pl-10 text-white focus:border-cyber-primary focus:outline-none transition-colors"
                placeholder="username or email@company.com"
                required
              />
              <Mail className="absolute left-3 top-3.5 text-gray-500" size={16} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 pl-10 pr-10 text-white focus:border-cyber-primary focus:outline-none transition-colors"
                placeholder="••••••••"
                required
              />
              <Lock className="absolute left-3 top-3.5 text-gray-500" size={16} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-500 hover:text-cyber-primary transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyber-primary text-black font-bold py-3 rounded-xl hover:bg-cyber-primary/90 transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-6 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={20} />
                <span>Please wait...</span>
              </>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
            }}
            className="text-gray-400 text-sm hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        {/* Quick Login for Development - Comprehensive */}
        {isLogin && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest text-center mb-3">Quick Access</p>
            <div className="max-h-[280px] overflow-y-auto pr-1 space-y-4 custom-scrollbar">

              {/* HQ / Admin Roles */}
              <div>
                <p className="text-[9px] text-yellow-400 uppercase tracking-widest mb-2 font-bold">🏢 Central Operations</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { email: 'shukri.kamal@siifmart.com', role: 'CEO', icon: '👑', color: 'from-yellow-500/30 to-amber-600/30 border-yellow-500/40' },
                    { email: 'sara.tesfaye@siifmart.com', role: 'Admin', icon: '⚙️', color: 'from-purple-500/20 to-purple-600/20 border-purple-500/30' },
                    { email: 'tigist.alemayehu@siifmart.com', role: 'HR', icon: '👔', color: 'from-pink-500/20 to-pink-600/20 border-pink-500/30' },
                    { email: 'rahel.tesfaye@siifmart.com', role: 'Finance', icon: '💰', color: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30' },
                    { email: 'yohannes.bekele@siifmart.com', role: 'Procurement', icon: '📦', color: 'from-amber-500/20 to-amber-600/20 border-amber-500/30' },
                    { email: 'dawit.haile@siifmart.com', role: 'Auditor', icon: '🔍', color: 'from-red-500/20 to-red-600/20 border-red-500/30' },
                    { email: 'selamawit.girma@siifmart.com', role: 'CS Mgr', icon: '🎧', color: 'from-violet-500/20 to-violet-600/20 border-violet-500/30' },
                    { email: 'elias.kebede@siifmart.com', role: 'IT', icon: '💻', color: 'from-blue-500/20 to-blue-600/20 border-blue-500/30' },
                  ].map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={async () => {
                        setEmail(acc.email);
                        setPassword('Oromo123');
                        setError('');
                        setLoading(true);
                        try {
                          const success = await login(acc.email, 'Oromo123');
                          if (!success) setError(`Login failed: ${acc.role}`);
                        } catch (err: any) {
                          setError(err.message || 'Login failed');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className={`bg-gradient-to-r ${acc.color} border text-white font-bold py-1.5 px-2 rounded-lg hover:opacity-80 transition-all flex items-center justify-center gap-1 disabled:opacity-50 text-[10px]`}
                    >
                      <span>{acc.icon}</span>
                      <span className="truncate">{acc.role}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Warehouse WH-001 */}
              <div>
                <p className="text-[9px] text-violet-400 uppercase tracking-widest mb-2 font-bold">🏭 WH-001 Main Hub</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { email: 'lensa.merga@siifmart.com', role: 'WH Mgr', icon: '🏭', color: 'from-violet-500/20 to-violet-600/20 border-violet-500/30' },
                    { email: 'betelhem.bekele@siifmart.com', role: 'Dispatch', icon: '📤', color: 'from-purple-500/20 to-purple-600/20 border-purple-500/30' },
                    { email: 'hanna.mulugeta@siifmart.com', role: 'Inventory', icon: '📊', color: 'from-pink-500/20 to-pink-600/20 border-pink-500/30' },
                    { email: 'meron.yilma@siifmart.com', role: 'Picker 1', icon: '🛒', color: 'from-orange-500/20 to-orange-600/20 border-orange-500/30' },
                    { email: 'betelhem.yilma@siifmart.com', role: 'Picker 2', icon: '🛒', color: 'from-orange-500/20 to-orange-600/20 border-orange-500/30' },
                    { email: 'helen.getachew@siifmart.com', role: 'Picker 3', icon: '🛒', color: 'from-orange-500/20 to-orange-600/20 border-orange-500/30' },
                    { email: 'mulugeta.tadesse@siifmart.com', role: 'Driver', icon: '🚚', color: 'from-teal-500/20 to-teal-600/20 border-teal-500/30' },
                  ].map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={async () => {
                        setEmail(acc.email);
                        setPassword('Oromo123');
                        setError('');
                        setLoading(true);
                        try {
                          const success = await login(acc.email, 'Oromo123');
                          if (!success) setError(`Login failed: ${acc.role}`);
                        } catch (err: any) {
                          setError(err.message || 'Login failed');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className={`bg-gradient-to-r ${acc.color} border text-white font-bold py-1.5 px-2 rounded-lg hover:opacity-80 transition-all flex items-center justify-center gap-1 disabled:opacity-50 text-[10px]`}
                    >
                      <span>{acc.icon}</span>
                      <span className="truncate">{acc.role}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stores */}
              {[
                {
                  site: 'ST-001 Bole', color: 'text-cyan-400', workers: [
                    { email: 'abdi.rahman@siifmart.com', role: 'Manager', icon: '👔' },
                    { email: 'sara.bekele@siifmart.com', role: 'Supervisor', icon: '👁️' },
                    { email: 'tomas.tesfaye@siifmart.com', role: 'Cashier', icon: '💵' },
                  ]
                },
                {
                  site: 'ST-002 Ambo', color: 'text-green-400', workers: [
                    { email: 'sara.mohammed@siifmart.com', role: 'Manager', icon: '👔' },
                    { email: 'helen.kebede@siifmart.com', role: 'Supervisor', icon: '👁️' },
                  ]
                },
                {
                  site: 'ST-003 Adama', color: 'text-pink-400', workers: [
                    { email: 'hanna.girma@siifmart.com', role: 'Manager', icon: '👔' },
                  ]
                },
                {
                  site: 'ST-004 Jimma', color: 'text-sky-400', workers: [
                    { email: 'ahmed.hassan@siifmart.com', role: 'Manager', icon: '👔' },
                  ]
                },
                {
                  site: 'ST-005 Harar', color: 'text-red-400', workers: [
                    { email: 'solomon.tesfaye@siifmart.com', role: 'Manager', icon: '👔' },
                  ]
                },
                {
                  site: 'ST-006 Dire Dawa', color: 'text-orange-400', workers: [
                    { email: 'fatima.yusuf@siifmart.com', role: 'Manager', icon: '👔' },
                  ]
                },
              ].map((store) => (
                <div key={store.site}>
                  <p className={`text-[9px] ${store.color} uppercase tracking-widest mb-2 font-bold`}>🏪 {store.site}</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {store.workers.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={async () => {
                          setEmail(acc.email);
                          setPassword('Oromo123');
                          setError('');
                          setLoading(true);
                          try {
                            const success = await login(acc.email, 'Oromo123');
                            if (!success) setError(`Login failed: ${acc.role}`);
                          } catch (err: any) {
                            setError(err.message || 'Login failed');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className="bg-gradient-to-r from-white/5 to-white/10 border border-white/20 text-white font-bold py-1.5 px-2 rounded-lg hover:opacity-80 transition-all flex items-center justify-center gap-1 disabled:opacity-50 text-[10px]"
                      >
                        <span>{acc.icon}</span>
                        <span className="truncate">{acc.role}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-600 font-mono">SECURE CONNECTION • v2.5.0 • ENCRYPTED</p>
        </div>
      </div>
    </div>
  );
}
