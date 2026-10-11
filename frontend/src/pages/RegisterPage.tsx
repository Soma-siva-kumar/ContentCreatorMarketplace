import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Sparkles, Building2, User, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<'creator' | 'brand'>('creator');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    // Validation
    if (!email || !password) {
      setValidationError('Please enter both email and password.');
      return;
    }
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      return;
    }
    if (role === 'creator' && !displayName.trim()) {
      setValidationError('Please enter your creator display name.');
      return;
    }
    if (role === 'brand' && !companyName.trim()) {
      setValidationError('Please enter your company or brand name.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        email,
        password,
        role,
        displayName: role === 'creator' ? displayName : undefined,
        companyName: role === 'brand' ? companyName : undefined,
        industry: role === 'brand' ? industry : undefined,
      });
      navigate('/profile');
    } catch {
      // Auth error is captured in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-950/60 border border-brand-800 text-brand-300">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Join the Marketplace</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Create your account</h1>
        <p className="text-xs text-slate-400">
          Connect with top brands or discover elite creators
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur shadow-2xl space-y-6">
        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setRole('creator');
              clearError();
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition ${
              role === 'creator'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            I'm a Creator
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('brand');
              clearError();
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition ${
              role === 'brand'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            I'm a Brand
          </button>
        </div>

        {/* Error Banners */}
        {(validationError || error) && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {role === 'creator' ? (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Creator Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-white text-xs placeholder:text-slate-600 transition outline-none"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Company / Brand Name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Nova Media Labs"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-xs placeholder:text-slate-600 transition outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Industry Sector
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs transition outline-none"
                >
                  <option value="Technology">Technology & SaaS</option>
                  <option value="E-Commerce">E-Commerce & Retail</option>
                  <option value="Fashion">Fashion & Lifestyle</option>
                  <option value="Gaming">Gaming & Esports</option>
                  <option value="Health">Health & Wellness</option>
                  <option value="Finance">Fintech & Finance</option>
                  <option value="Entertainment">Media & Entertainment</option>
                </select>
              </div>
            </>
          )}

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
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Password (min. 8 characters)
            </label>
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
              className={`w-full py-3 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50 cursor-pointer ${
                role === 'creator'
                  ? 'bg-brand-600 hover:bg-brand-500 shadow-brand-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
              }`}
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Register as {role === 'creator' ? 'Creator' : 'Brand'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-slate-800/80 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300 transition">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
