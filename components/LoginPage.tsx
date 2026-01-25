import React, { useState } from 'react';
import { Lock, Mail, Sun, Moon, AlertCircle, Loader, Eye, EyeOff, UserPlus, ArrowLeft, CheckCircle } from 'lucide-react';
import { useStore } from '../contexts/CentralStore';
import { authService } from '../services/auth.service';
import { supabase } from '../lib/supabase';
import Logo from './Logo';

type Mode = 'login' | 'signup' | 'forgot';

export default function LoginPage() {
  const { login, toggleTheme, theme } = useStore();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);


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
      } else if (mode === 'signup') {
        // Validate passwords match
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }

        // Sign up with Supabase Auth
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        });

        if (signUpError) {
          throw signUpError;
        }

        if (data.user) {
          setSuccess('Account created! Please check your email to confirm, then log in.');
          setMode('login');
          setPassword('');
          setConfirmPassword('');
        }
      } else if (mode === 'forgot') {
        await authService.resetPassword(email);
        setSuccess('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
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
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Password Recovery'}
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
            <CheckCircle size={16} />
            {success}
          </div>
        )}


        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name field for signup */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 pl-10 text-white focus:border-cyber-primary focus:outline-none transition-colors"
                  placeholder="Your full name"
                  required
                />
                <UserPlus className="absolute left-3 top-3.5 text-gray-500" size={16} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 uppercase font-bold mb-1">
              {mode === 'signup' ? 'Email' : 'Email Address'}
            </label>
            <div className="relative">
              <input
                type={mode === 'signup' ? 'email' : 'text'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 pl-10 text-white focus:border-cyber-primary focus:outline-none transition-colors"
                placeholder={mode === 'signup' ? 'name@company.com' : 'name@company.com'}
                required
              />
              <Mail className="absolute left-3 top-3.5 text-gray-500" size={16} />
            </div>
          </div>

          {mode !== 'forgot' && (
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
          )}

          {/* Confirm password for signup */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 pl-10 text-white focus:border-cyber-primary focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
                <Lock className="absolute left-3 top-3.5 text-gray-500" size={16} />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyber-primary text-black font-bold py-3 rounded-xl hover:bg-cyber-primary/90 transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-6 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={20} />
                <span>{mode === 'signup' ? 'Creating Account...' : mode === 'forgot' ? 'Sending...' : 'Logging in...'}</span>
              </>
            ) : (
              mode === 'login' ? 'Log In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'
            )}
          </button>

          {/* Mode switching links */}
          <div className="flex flex-col gap-2 mt-4">
            {mode === 'login' && (
              <>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); resetForm(); }}
                  className="text-sm text-cyber-primary/70 hover:text-cyber-primary transition-colors"
                >
                  Need an account? <span className="font-bold">Sign Up</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); resetForm(); }}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Forgot password?
                </button>
              </>
            )}
            {(mode === 'signup' || mode === 'forgot') && (
              <button
                type="button"
                onClick={() => { setMode('login'); resetForm(); }}
                className="text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft size={14} />
                Back to Login
              </button>
            )}
          </div>
        </form>


        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-600 font-mono">SiifMart Operations v2.5</p>
        </div>
      </div>
    </div>
  );
}
