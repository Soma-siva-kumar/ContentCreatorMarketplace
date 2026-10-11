import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api, ApiError } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle2, AlertTriangle, RefreshCw, ArrowRight, MailCheck } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();

  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performVerification = async (verifyToken: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await api.verifyEmail(verifyToken);
      setSuccess(true);
      await refreshUser();
    } catch (err) {
      setErrorMessage(
        err instanceof ApiError ? err.message : 'Invalid or expired verification link.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) {
      setToken(t);
      performVerification(t);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      performVerification(token.trim());
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center space-y-2 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-brand-950 border border-brand-800 text-brand-400 flex items-center justify-center mx-auto shadow-lg">
          <MailCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">Email Verification</h1>
        <p className="text-xs text-slate-400">
          Confirm your email address to unlock all marketplace privileges
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur shadow-2xl space-y-6 text-center">
        {loading ? (
          <div className="py-8 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-brand-400 mx-auto" />
            <p className="text-sm font-semibold text-white">Verifying token against database...</p>
            <p className="text-xs text-slate-400">Please wait a moment</p>
          </div>
        ) : success ? (
          <div className="space-y-4 py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Email Successfully Verified!</h2>
              <p className="text-xs text-slate-300">
                Your account is now verified. You can submit proposals, publish campaigns, and access the AI Content Studio.
              </p>
            </div>
            <div className="pt-4 flex justify-center gap-3">
              <Link
                to="/profile"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 font-semibold text-xs text-white flex items-center gap-2 shadow-lg transition"
              >
                Go to Profile
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="space-y-4 py-4">
            <div className="w-14 h-14 rounded-full bg-rose-950/80 border border-rose-700/60 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Verification Failed</h2>
              <p className="text-xs text-rose-300/90">{errorMessage}</p>
            </div>

            <form onSubmit={handleManualSubmit} className="pt-4 text-left space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Enter Token Manually
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste verification token here"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-white transition"
              >
                Retry Verification
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Verification Code
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste code from verification email"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 font-mono text-white text-xs placeholder:text-slate-600 transition outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 font-bold text-xs text-white transition"
            >
              Verify Code
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
