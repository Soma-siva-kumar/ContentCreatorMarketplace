import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Sparkles, 
  Compass, 
  BookOpen, 
  Layers, 
  LogOut, 
  Settings,
  Briefcase,
  MessageSquare,
  Menu,
  X,
  HelpCircle,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';

export const Navbar: React.FC = () => {
  const { user, profile, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHome = location.pathname === '/';

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const displayName =
    (profile && 'displayName' in profile ? profile.displayName : undefined) ||
    (profile && 'companyName' in profile ? profile.companyName : undefined) ||
    user?.email?.split('@')[0] ||
    'User';

  const navLinks = [
    { label: 'Home', path: '/', isAnchor: false },
    { label: 'Discover Creators', path: '/marketplace', isAnchor: false, icon: Compass },
    { label: 'Campaigns', path: '/campaigns', isAnchor: false, icon: Layers },
    { label: 'AI Studio', path: '/ai-studio', isAnchor: false, icon: Sparkles },
    { label: 'Creator Academy', path: '/#academy', isAnchor: true, icon: BookOpen },
    { label: 'How It Works', path: '/#how-it-works', isAnchor: true, icon: HelpCircle },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path.startsWith('/#')) return location.hash === path.substring(1);
    return location.pathname.startsWith(path);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 backdrop-blur-md ${
        isHome
          ? 'bg-[#FAFAFC]/90 border-b border-purple-100/90 shadow-sm'
          : 'bg-slate-950/85 border-b border-slate-800/80 shadow-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Left Side: Modern AI-Inspired Logo & Brand */}
        <Link 
          to="/" 
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-3 group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#3B82F6] p-0.5 shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 group-hover:scale-105 transition duration-300">
            <div className={`w-full h-full rounded-[10px] flex items-center justify-center transition-colors ${
              isHome ? 'bg-white' : 'bg-slate-950'
            }`}>
              <Sparkles className="w-5 h-5 text-[#7C3AED] group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className={`font-extrabold text-base tracking-tight transition ${
                isHome ? 'text-[#17152B] group-hover:text-[#7C3AED]' : 'text-white group-hover:text-purple-300'
              }`}>
                CreatorConnect
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] text-white font-mono shadow-xs">
                AI
              </span>
            </div>
            <span className={`text-[10px] font-semibold tracking-wider uppercase transition ${
              isHome ? 'text-[#686779]' : 'text-slate-400'
            }`}>
              HacXLerate • Kampus.VC
            </span>
          </div>
        </Link>

        {/* Center Navigation Links (Desktop) */}
        <nav
          className={`hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            isHome
              ? 'bg-white/90 border-purple-100 shadow-xs text-[#686779]'
              : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
          }`}
        >
          {navLinks.map((item) => {
            const active = isActive(item.path);
            const content = (
              <span
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition duration-150 ${
                  active
                    ? isHome
                      ? 'bg-purple-100/80 text-[#7C3AED] font-semibold shadow-xs'
                      : 'bg-slate-800 text-white font-semibold'
                    : isHome
                    ? 'hover:text-[#17152B] hover:bg-purple-50/70'
                    : 'hover:text-white hover:bg-slate-800/70'
                }`}
              >
                {item.icon && <item.icon className="w-3.5 h-3.5 text-[#7C3AED]" />}
                {item.label}
              </span>
            );

            return item.isAnchor ? (
              <a key={item.label} href={item.path} className="inline-block">
                {content}
              </a>
            ) : (
              <Link key={item.label} to={item.path} className="inline-block">
                {content}
              </Link>
            );
          })}
        </nav>

        {/* Right Side: Auth / User Profile Controls */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/profile"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition group ${
                  isHome
                    ? 'bg-white border-purple-100 hover:border-purple-300 shadow-xs text-[#17152B]'
                    : 'bg-slate-900 border-slate-800 hover:border-purple-500/50 text-white'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#3B82F6] text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold leading-none group-hover:text-[#7C3AED] truncate max-w-[100px]">
                    {displayName}
                  </span>
                  <span className={`text-[9px] font-mono uppercase mt-0.5 ${
                    isHome ? 'text-[#686779]' : 'text-slate-400'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </Link>

              <Link
                to="/collaborations"
                title="Collaborations Workspace"
                className={`p-2 rounded-xl border transition ${
                  isHome
                    ? 'bg-white border-purple-100 text-[#686779] hover:text-[#7C3AED] hover:bg-purple-50 shadow-xs'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-4 h-4 text-[#7C3AED]" />
              </Link>

              <Link
                to="/messages"
                title="Direct Messages"
                className={`p-2 rounded-xl border transition ${
                  isHome
                    ? 'bg-white border-purple-100 text-[#686779] hover:text-[#3B82F6] hover:bg-blue-50 shadow-xs'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-[#3B82F6]" />
              </Link>

              <NotificationCenter />

              <Link
                to="/settings"
                title="Account Settings"
                className={`p-2 rounded-xl border transition ${
                  isHome
                    ? 'bg-white border-purple-100 text-[#686779] hover:text-[#17152B] hover:bg-slate-100 shadow-xs'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Settings className="w-4 h-4" />
              </Link>

              <button
                onClick={handleLogout}
                title="Sign Out"
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isHome
                    ? 'bg-white border-purple-100 text-[#686779] hover:text-rose-600 hover:bg-rose-50 shadow-xs'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                }`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${
                  isHome
                    ? 'text-[#17152B] hover:text-[#7C3AED] hover:bg-purple-50/80'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Log In
              </Link>
              <Link
                to="/register"
                className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition ${
                  isHome
                    ? 'border-purple-200 text-[#7C3AED] hover:bg-purple-50 bg-white shadow-xs'
                    : 'border-slate-800 text-purple-300 hover:bg-slate-800'
                }`}
              >
                Sign Up
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#3B82F6] hover:from-[#6D28D9] hover:to-[#2563EB] text-white shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 sm:hidden">
          {isAuthenticated && <NotificationCenter />}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className={`p-2 rounded-xl border transition ${
              isHome
                ? 'bg-white border-purple-200 text-[#17152B] hover:bg-purple-50'
                : 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800'
            }`}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          className={`lg:hidden border-b px-4 py-4 space-y-4 shadow-xl transition-all ${
            isHome
              ? 'bg-[#FAFAFC] border-purple-100 text-[#17152B]'
              : 'bg-slate-950 border-slate-800 text-white'
          }`}
        >
          <div className="space-y-1">
            {navLinks.map((item) => {
              const active = isActive(item.path);
              const linkClasses = `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
                active
                  ? isHome
                    ? 'bg-purple-100 text-[#7C3AED] font-semibold'
                    : 'bg-slate-800 text-white font-semibold'
                  : isHome
                  ? 'text-[#686779] hover:text-[#17152B] hover:bg-purple-50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`;

              return item.isAnchor ? (
                <a
                  key={item.label}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={linkClasses}
                >
                  {item.icon && <item.icon className="w-4 h-4 text-[#7C3AED]" />}
                  <span>{item.label}</span>
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={linkClasses}
                >
                  {item.icon && <item.icon className="w-4 h-4 text-[#7C3AED]" />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className={`pt-3 border-t ${isHome ? 'border-purple-100' : 'border-slate-800'}`}>
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-medium text-slate-500">Signed in as</span>
                  <span className="text-xs font-mono font-bold uppercase text-[#7C3AED]">{user.role}</span>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                    isHome ? 'hover:bg-purple-50 text-[#17152B]' : 'hover:bg-slate-900 text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  My Profile ({displayName})
                </Link>
                <Link
                  to="/collaborations"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                    isHome ? 'hover:bg-purple-50 text-[#17152B]' : 'hover:bg-slate-900 text-white'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-[#7C3AED]" />
                  Collaborations
                </Link>
                <Link
                  to="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                    isHome ? 'hover:bg-purple-50 text-[#17152B]' : 'hover:bg-slate-900 text-white'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-[#3B82F6]" />
                  Messages
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                    isHome ? 'hover:bg-purple-50 text-[#17152B]' : 'hover:bg-slate-900 text-white'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Account Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`py-2 text-center rounded-xl text-sm font-semibold border ${
                      isHome
                        ? 'border-purple-200 text-[#17152B] hover:bg-purple-50 bg-white'
                        : 'border-slate-800 text-white hover:bg-slate-900'
                    }`}
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`py-2 text-center rounded-xl text-sm font-semibold border ${
                      isHome
                        ? 'border-purple-200 text-[#7C3AED] hover:bg-purple-50 bg-white'
                        : 'border-slate-800 text-purple-300 hover:bg-slate-900'
                    }`}
                  >
                    Sign Up
                  </Link>
                </div>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center rounded-xl text-sm font-semibold bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#3B82F6] text-white shadow-md shadow-purple-500/25"
                >
                  Get Started Free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
