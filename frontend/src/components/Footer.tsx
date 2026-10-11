import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Shield, Heart, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <footer
      className={`border-t transition-colors duration-200 ${
        isHome
          ? 'bg-gradient-to-b from-[#FAFAFC] via-[#F3E8FF]/30 to-[#FAFAFC] border-purple-100/90 text-[#686779]'
          : 'bg-slate-950 border-slate-800/80 text-slate-400'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        {/* Main Multi-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3 group inline-block">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#3B82F6] p-0.5 shadow-md shadow-purple-500/20">
                <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${
                  isHome ? 'bg-white' : 'bg-slate-950'
                }`}>
                  <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className={`font-extrabold text-base tracking-tight ${
                    isHome ? 'text-[#17152B]' : 'text-white'
                  }`}>
                    CreatorConnect AI
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-[#7C3AED] font-mono">
                    PRO
                  </span>
                </div>
                <span className={`text-[10px] font-semibold tracking-wider uppercase ${
                  isHome ? 'text-[#686779]' : 'text-slate-400'
                }`}>
                  HacXLerate — Kampus.VC
                </span>
              </div>
            </Link>

            <p className={`text-xs leading-relaxed max-w-sm ${
              isHome ? 'text-[#686779]' : 'text-slate-400'
            }`}>
              AI-Powered Content Creator Marketplace Connecting Creators and Brands. From ideation and discovery to milestone deliverables, copyright provenance, and explainable craft scoring.
            </p>

            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                isHome
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-emerald-950/30 border-emerald-800 text-emerald-400'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                MongoDB & Express Active
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                isHome
                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                  : 'bg-purple-950/30 border-purple-800 text-purple-300'
              }`}>
                <Shield className="w-3 h-3 text-[#7C3AED]" />
                AI Guardian Protected
              </span>
            </div>
          </div>

          {/* Column 2: Platform Navigation */}
          <div className="space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${
              isHome ? 'text-[#17152B]' : 'text-white'
            }`}>
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/marketplace" className="hover:text-[#7C3AED] transition flex items-center gap-1">
                  Discover Creators
                </Link>
              </li>
              <li>
                <Link to="/campaigns" className="hover:text-[#7C3AED] transition flex items-center gap-1">
                  Campaigns
                </Link>
              </li>
              <li>
                <Link to="/ai-studio" className="hover:text-[#7C3AED] transition flex items-center gap-1">
                  AI Content Studio
                  <span className="text-[9px] px-1 rounded bg-[#7C3AED]/10 text-[#7C3AED] font-bold font-mono">NEW</span>
                </Link>
              </li>
              <li>
                <a href="/#academy" className="hover:text-[#7C3AED] transition flex items-center gap-1">
                  Creator Academy
                </a>
              </li>
              <li>
                <a href="/#how-it-works" className="hover:text-[#7C3AED] transition flex items-center gap-1">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: For Creators */}
          <div className="space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${
              isHome ? 'text-[#17152B]' : 'text-white'
            }`}>
              For Creators
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/register?role=creator" className="hover:text-[#7C3AED] transition">
                  Create Profile
                </Link>
              </li>
              <li>
                <Link to="/campaigns" className="hover:text-[#7C3AED] transition">
                  Find Opportunities
                </Link>
              </li>
              <li>
                <Link to="/collaborations" className="hover:text-[#7C3AED] transition">
                  Manage Collaborations
                </Link>
              </li>
              <li>
                <a href="/#academy" className="hover:text-[#7C3AED] transition">
                  Learn & Skill Badges
                </a>
              </li>
              <li>
                <Link to="/ai-studio" className="hover:text-[#7C3AED] transition">
                  AI Script & Reel Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: For Brands */}
          <div className="space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${
              isHome ? 'text-[#17152B]' : 'text-white'
            }`}>
              For Brands
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/marketplace" className="hover:text-[#7C3AED] transition">
                  Discover Talent
                </Link>
              </li>
              <li>
                <Link to="/campaigns/new" className="hover:text-[#7C3AED] transition flex items-center gap-1">
                  Launch a Campaign
                  <ArrowUpRight className="w-3 h-3 text-[#7C3AED]" />
                </Link>
              </li>
              <li>
                <Link to="/collaborations" className="hover:text-[#7C3AED] transition">
                  Review Deliverables
                </Link>
              </li>
              <li>
                <a href="/#features" className="hover:text-[#7C3AED] transition">
                  AI Matching Engine
                </a>
              </li>
              <li>
                <Link to="/register?role=brand" className="hover:text-[#7C3AED] transition">
                  Brand Verification
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal, Guidelines & Compliance Notice */}
        <div className={`pt-8 border-t flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs ${
          isHome ? 'border-purple-100 text-[#686779]' : 'border-slate-800/80 text-slate-500'
        }`}>
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex items-center gap-1 text-[11px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              FTC Disclosure & Synthetic Media Guidance
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Zero-Mock Architecture
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Cryptographic Rights Audit
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a href="#faq" className="hover:underline">Platform Guidelines</a>
            <span>•</span>
            <a href="#faq" className="hover:underline">Terms & Rights</a>
            <span>•</span>
            <a href="#faq" className="hover:underline">AI Ethics</a>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className={`pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] ${
          isHome ? 'border-purple-100/60 text-[#686779]' : 'border-slate-800/60 text-slate-500'
        }`}>
          <p>© {new Date().getFullYear()} HacXLerate — Kampus.VC. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for creators and forward-thinking brands.
          </p>
        </div>
      </div>
    </footer>
  );
};
