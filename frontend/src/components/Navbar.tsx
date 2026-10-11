import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Sparkles, 
  Shield, 
  Compass, 
  BookOpen, 
  Layers, 
  LogOut, 
  Settings,
  Briefcase,
  MessageSquare
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';

export const Navbar: React.FC = () => {
  const { user, profile, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const displayName =
    (profile && 'displayName' in profile ? profile.displayName : undefined) ||
    (profile && 'companyName' in profile ? profile.companyName : undefined) ||
    user?.email?.split('@')[0] ||
    'User';

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-white group-hover:text-brand-300 transition">
              HacXLerate
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
              Kampus.VC
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 border border-slate-800/80 px-2 py-1 rounded-full text-xs font-medium text-slate-300">
          <Link
            to="/marketplace"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:text-white hover:bg-slate-800/80 transition"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            Marketplace
          </Link>
          <Link
            to="/campaigns"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:text-white hover:bg-slate-800/80 transition"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            Campaigns
          </Link>
          <Link
            to="/ai-studio"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:text-white hover:bg-slate-800/80 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            AI Studio
          </Link>
          <Link
            to="/guardian"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:text-white hover:bg-slate-800/80 transition"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            AI Guardian
          </Link>
          <Link
            to="/academy"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:text-white hover:bg-slate-800/80 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-pink-400" />
            Academy
          </Link>
        </nav>

        {/* Quick Actions / Auth Profile */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-500/50 text-xs text-white transition group"
              >
                <div className="w-6 h-6 rounded-lg bg-brand-600/30 text-brand-300 flex items-center justify-center font-bold text-[10px]">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold leading-none group-hover:text-brand-300 truncate max-w-[100px]">
                    {displayName}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase mt-0.5">
                    {user.role}
                  </span>
                </div>
              </Link>

              <Link
                to="/collaborations"
                title="Collaborations Workspace"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <Briefcase className="w-4 h-4 text-indigo-400" />
              </Link>

              <Link
                to="/messages"
                title="Direct Messages"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <MessageSquare className="w-4 h-4 text-sky-400" />
              </Link>

              <NotificationCenter />

              <Link
                to="/settings"
                title="Account Settings"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <Settings className="w-4 h-4" />
              </Link>

              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-300 hover:text-white transition px-3 py-2"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-600/20 hover:shadow-brand-600/40 transition active:scale-95"
              >
                Join Marketplace
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
