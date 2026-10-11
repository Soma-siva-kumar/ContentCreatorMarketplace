import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api, ApiError } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { 
  KeyRound, 
  UserX, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ArrowLeft,
  ShieldCheck 
} from 'lucide-react';

export const AccountSettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Deactivation / deletion state
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordSubmitting(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setPasswordMessage({ type: 'success', text: 'Password successfully updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMessage({
        type: 'error',
        text: err instanceof ApiError ? err.message : 'Failed to change password.',
      });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Are you sure you want to deactivate your account? You will be signed out.')) {
      return;
    }

    setActionLoading(true);
    try {
      await api.deactivateAccount();
      await logout();
      navigate('/login');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to deactivate account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePermanent = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      alert('Please type "DELETE" exactly to confirm permanent account removal.');
      return;
    }

    setActionLoading(true);
    try {
      await api.deleteAccount();
      await logout();
      navigate('/register');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete account.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Profile
          </Link>
          <h1 className="text-2xl font-black text-white">Account & Security Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your credentials, session policies, and privacy controls
          </p>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-brand-400" />
          Change Password
        </h2>

        {passwordMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
              passwordMessage.type === 'success'
                ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-200'
                : 'bg-rose-950/40 border border-rose-800/50 text-rose-200'
            }`}
          >
            {passwordMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{passwordMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 text-white text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              New Password (min. 8 characters)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 text-white text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 text-white text-xs outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={passwordSubmitting}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {passwordSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            Update Password
          </button>
        </form>
      </div>

      {/* Account Status Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Email Verification Status
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-300 font-semibold">{user?.email}</p>
            <p className="text-[11px] text-slate-500">
              {user?.isVerified ? 'Verified account' : 'Verification pending'}
            </p>
          </div>
          {!user?.isVerified && (
            <Link
              to="/verify-email"
              className="px-3.5 py-1.5 rounded-xl bg-brand-600/20 border border-brand-500/40 text-brand-300 hover:text-white text-xs font-semibold transition"
            >
              Verify Now
            </Link>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Danger Zone
          </h2>
          <p className="text-xs text-rose-300/70">
            Irreversible actions regarding your account data and marketplace presence
          </p>
        </div>

        <div className="pt-2 border-t border-rose-900/40 space-y-6">
          {/* Deactivation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-white">Deactivate Account</h3>
              <p className="text-[11px] text-slate-400">
                Temporarily disable your profile, hide from search, and pause notifications.
              </p>
            </div>
            <button
              onClick={handleDeactivate}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-amber-300 transition shrink-0 cursor-pointer"
            >
              <UserX className="w-3.5 h-3.5 inline mr-1.5" />
              Deactivate
            </button>
          </div>

          {/* Permanent Deletion */}
          <div className="pt-4 border-t border-rose-900/30 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white">Delete Account Permanently</h3>
              <p className="text-[11px] text-slate-400 max-w-md">
                Permanently deletes your account credentials, profiles, portfolio links, and campaign records from MongoDB. This action cannot be reversed.
              </p>

              {confirmDelete && (
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] text-rose-300 font-semibold">
                    Type "DELETE" in capital letters to confirm:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    placeholder="DELETE"
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-rose-800 text-xs text-white outline-none font-mono"
                  />
                </div>
              )}
            </div>

            {confirmDelete ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-2 rounded-xl bg-slate-900 text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePermanent}
                  disabled={actionLoading || deleteConfirmationText !== 'DELETE'}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-xs font-bold text-white transition shrink-0 cursor-pointer shadow-lg shadow-rose-600/30"
                >
                  <Trash2 className="w-3.5 h-3.5 inline mr-1.5" />
                  Confirm Deletion
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-xs font-semibold text-rose-300 transition shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 inline mr-1.5" />
                Delete Account
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
