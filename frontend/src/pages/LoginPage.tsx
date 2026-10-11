import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Sparkles, AlertCircle, ArrowRight, RefreshCw, Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Redirect destination after login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/profile';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    if (!email || !password) {
      setValidationError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch {
      // Error handled in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-950/60 border border-brand-800 text-brand-300">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>HacXLerate Sign In</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome back</h1>
        <p className="text-xs text-slate-400">
          Enter your credentials to access your creator or brand workspace
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur shadow-2xl space-y-6">
        {/* Error Notification */}
        {(validationError || error) && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-white text-xs placeholder:text-slate-600 transition outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] text-brand-400 hover:text-brand-300 transition"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-white text-xs placeholder:text-slate-600 transition outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Sign In
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-slate-800/80 text-center text-xs text-slate-400">
          New to HacXLerate?{' '}
          <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300 transition">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};
