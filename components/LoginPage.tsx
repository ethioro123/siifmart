import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, Sun, Moon, AlertCircle, Loader, Eye, EyeOff, Package, Truck, UserCircle } from 'lucide-react';
import { useStore } from '../contexts/CentralStore';
import { authService } from '../services/auth.service';
import { sitesService } from '../services/supabase.service';
import Logo from './Logo';

// Quick login list for development/testing
const QUICK_LOGINS = [
  {
    role: 'Super Admin',
    email: 'shukri.kamal@siifmart.com',
    password: 'Oromo123',
    icon: Shield,
    color: 'text-cyber-primary'
  },
  {
    role: 'Warehouse Manager',
    email: 'lensa.merga@siifmart.com',
    password: 'lensa123',
    icon: Package,
    color: 'text-blue-400'
  },
  {
    role: 'Picker',
    email: 'helen.getachew@siifmart.com',
    password: 'helen123',
    icon: Truck,
    color: 'text-purple-400'
  }
];


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

        {isLogin && (
          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-4 text-center">Quick Access Prototypes</p>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_LOGINS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(account.password);
                  }}
                  className="flex items-center gap-3 w-full p-2 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/10 transition-all group text-left"
                >
                  <div className={`p-2 rounded-lg bg-black/40 ${account.color}`}>
                    <account.icon size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">{account.role}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{account.email}</p>
                  </div>
                </button>
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
