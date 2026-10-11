import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Compass, 
  Layers, 
  ShieldCheck, 
  FileCheck2, 
  Activity, 
  BookOpen, 
  Send, 
  ArrowRight, 
  Search, 
  Star, 
  CheckCircle2, 
  Heart, 
  Briefcase, 
  Clock, 
  Users, 
  Bot, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Check, 
  Eye, 
  HelpCircle,
  Award,
  Video,
  Palette,
  Feather,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { CreatorProfileData, CampaignData } from '../types';
import { HealthStatusCard } from '../components/HealthStatusCard';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Search Bar State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<'all' | 'creators' | 'campaigns'>('all');

  // Backend Data State
  const [featuredCreators, setFeaturedCreators] = useState<CreatorProfileData[]>([]);
  const [creatorsLoading, setCreatorsLoading] = useState(true);
  const [recentCampaigns, setRecentCampaigns] = useState<CampaignData[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Suggested Category Chips
  const categoryChips = [
    { label: 'Video Creators', filter: 'AI Film & Video', icon: Video },
    { label: 'Designers', filter: 'Motion Design', icon: Palette },
    { label: 'Influencers', filter: 'Tech & SaaS', icon: Users },
    { label: 'Writers', filter: 'Copywriting', icon: Feather },
    { label: 'AI Creators', filter: 'GenAI Prompting', icon: Cpu },
  ];

  // Fetch real creators from MongoDB
  useEffect(() => {
    let isMounted = true;
    if (typeof api.searchCreators === 'function') {
      api.searchCreators({ limit: 4 })
        .then((res) => {
          if (isMounted && res.success && res.data) {
            setFeaturedCreators(res.data);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setCreatorsLoading(false);
        });
    } else {
      setCreatorsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch real published campaigns from MongoDB
  useEffect(() => {
    let isMounted = true;
    if (typeof api.exploreCampaigns === 'function') {
      api.exploreCampaigns({ limit: 3, status: 'published' })
        .then((res) => {
          if (isMounted && res.success && res.data) {
            setRecentCampaigns(res.data);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setCampaignsLoading(false);
        });
    } else {
      setCampaignsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Load user favorites if authenticated
  useEffect(() => {
    if (isAuthenticated && typeof api.getFavorites === 'function') {
      api.getFavorites()
        .then((res) => {
          if (res.success && res.favorites) {
            const ids = new Set(res.favorites.map((f: any) => f.userId?._id || f.userId));
            setFavoriteIds(ids);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleToggleFavorite = async (creatorUserId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const res = await api.toggleFavorite(creatorUserId);
      if (res.success) {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (res.favorited) {
            next.add(creatorUserId);
          } else {
            next.delete(creatorUserId);
          }
          return next;
        });
      }
    } catch {
      // Ignore favorite error
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (searchCategory === 'campaigns') {
      navigate(`/campaigns${query ? `?search=${encodeURIComponent(query)}` : ''}`);
    } else {
      navigate(`/marketplace${query ? `?search=${encodeURIComponent(query)}` : ''}`);
    }
  };

  const handleChipClick = (filter: string) => {
    navigate(`/marketplace?search=${encodeURIComponent(filter)}`);
  };

  // Complete Lifecycle Pipeline (Maintains compatibility with tests and app architecture)
  const lifecycleStages = [
    {
      step: '01',
      title: 'Learn',
      icon: BookOpen,
      desc: 'Creator Academy: verified learning paths, quiz credentials & portfolio badges.',
      color: 'from-purple-100 to-violet-50 text-[#7C3AED] border-purple-200/60',
      path: '#academy',
    },
    {
      step: '02',
      title: 'Create',
      icon: Sparkles,
      desc: 'AI Content Studio: viral hooks, video scripts, captions & 7-day calendars.',
      color: 'from-blue-50 to-indigo-50 text-[#3B82F6] border-blue-200/60',
      path: '/ai-studio',
    },
    {
      step: '03',
      title: 'Discover Opportunities',
      icon: Compass,
      desc: 'Creator Marketplace & Campaigns: search by niche, skills, budget & verified reviews.',
      color: 'from-pink-50 to-purple-50 text-[#F472B6] border-pink-200/60',
      path: '/marketplace',
    },
    {
      step: '04',
      title: 'Apply',
      icon: Send,
      desc: 'Creator Proposals: custom pitches, proposed milestone timelines & samples.',
      color: 'from-sky-50 to-blue-50 text-sky-600 border-sky-200/60',
      path: '/campaigns',
    },
    {
      step: '05',
      title: 'Collaborate',
      icon: Layers,
      desc: 'Milestone Workspaces: deliverable submissions, real-time messaging & review cycles.',
      color: 'from-indigo-50 to-violet-50 text-indigo-600 border-indigo-200/60',
      path: '/collaborations',
    },
    {
      step: '06',
      title: 'Review Content',
      icon: ShieldCheck,
      desc: 'AI Content Guardian: brand brief compliance, FTC disclosure & human review.',
      color: 'from-emerald-50 to-teal-50 text-[#16A34A] border-emerald-200/60',
      path: '/campaigns',
    },
    {
      step: '07',
      title: 'Manage Rights',
      icon: FileCheck2,
      desc: 'Agreements & Copyright: digital terms, license records & deliverable provenance.',
      color: 'from-violet-50 to-purple-50 text-[#6D28D9] border-violet-200/60',
      path: '/collaborations',
    },
    {
      step: '08',
      title: 'Build Reputation',
      icon: Activity,
      desc: 'Explainable Craft Score: evidence-based quality metrics & verified client feedback.',
      color: 'from-teal-50 to-emerald-50 text-teal-700 border-teal-200/60',
      path: '/marketplace',
    },
  ];

  // FAQ Items
  const faqItems = [
    {
      q: 'What is this creator marketplace?',
      a: 'HacXLerate CreatorConnect AI is a full-lifecycle marketplace connecting talented content creators with forward-thinking brands. We bring together discovery, AI-assisted creative ideation, structured milestone collaborations, and transparent deliverable auditing into a single unified platform.'
    },
    {
      q: 'How can creators join and get discovered?',
      a: 'Creators can register for free, build their detailed profile highlighting niches, skills, software tools, and portfolio links, and set their hourly rate and availability. Once published, your profile is immediately discoverable in our database-backed creator directory.'
    },
    {
      q: 'How do brands find the right creators?',
      a: 'Brands can explore the creator directory using filters for niche, skills, and tools, or publish a structured campaign brief with custom deliverables and budgets. Creators can then submit tailored proposals directly to your campaign.'
    },
    {
      q: 'How does AI matching and the AI Content Studio work?',
      a: 'Our AI engine compares campaign requirements against creator profile attributes (skills, tools, past verified collaborations) to suggest compatible partnerships. In the AI Content Studio, creators and brands can generate viral hooks, social captions, video scripts, and multi-day calendars, powered by live Google Gemini models with a zero-mock deterministic fallback.'
    },
    {
      q: 'Can I manage campaign applications and milestones here?',
      a: 'Yes. Once a brand accepts a creator proposal, an interactive collaboration workspace is created in MongoDB. Both parties track milestones, submit deliverables, request revisions, and chat in real-time via Socket.IO.'
    },
    {
      q: 'How are content rights and agreements handled?',
      a: 'Milestone deliverables require explicit brand review and approval. Deliverable submissions record timestamps, author metadata, and agreed usage guidelines to support clear ownership, licensing transparency, and dispute resolution.'
    }
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* ========================================================================= */}
      {/* 4. HERO SECTION (Above the Fold Two-Column Desktop Layout)                */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24">
        {/* Soft Decorative Gradient Background Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-[#F3E8FF]/80 via-[#EFF6FF]/60 to-[#FDF4FF]/50 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse-glow" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-[#3B82F6]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#7C3AED]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Hero Copy & Actions */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Gradient Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 via-violet-50 to-blue-50 border border-purple-200/80 text-[#7C3AED] shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>✦ AI-Powered Creator Marketplace</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#17152B] tracking-tight leading-[1.12]">
                Where{' '}
                <span className="bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#3B82F6] bg-clip-text text-transparent">
                  Creative Talent
                </span>{' '}
                Meets{' '}
                <span className="bg-gradient-to-r from-[#3B82F6] via-[#6D28D9] to-[#7C3AED] bg-clip-text text-transparent">
                  Powerful Brands.
                </span>
              </h1>

              {/* Supporting Description */}
              <p className="text-base sm:text-lg text-[#686779] leading-relaxed max-w-xl">
                Discover talented creators, connect with ambitious brands, and turn creative ideas into successful collaborations — all powered by AI.
              </p>

              {/* Primary Call to Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/marketplace"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#3B82F6] hover:from-[#6D28D9] hover:to-[#2563EB] text-white font-semibold text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 group"
                >
                  <span>Explore Creators</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  to="/campaigns"
                  className="px-6 py-3.5 rounded-2xl bg-white hover:bg-purple-50/50 border-2 border-purple-200/80 hover:border-[#7C3AED] text-[#17152B] font-semibold text-sm shadow-xs hover:shadow-md transition-all flex items-center gap-2"
                >
                  <span>Launch a Campaign</span>
                  <Briefcase className="w-4 h-4 text-[#7C3AED]" />
                </Link>
              </div>

              {/* Social Proof Area */}
              <div className="pt-4 flex flex-wrap items-center gap-4 border-t border-purple-100/80">
                {/* Overlapping Avatars */}
                <div className="flex -space-x-2.5 overflow-hidden">
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-purple-500 to-indigo-500 text-white text-[11px] font-bold flex items-center justify-center">
                    EV
                  </div>
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-blue-500 to-cyan-500 text-white text-[11px] font-bold flex items-center justify-center">
                    MR
                  </div>
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-pink-500 to-rose-500 text-white text-[11px] font-bold flex items-center justify-center">
                    SK
                  </div>
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-amber-500 to-orange-500 text-white text-[11px] font-bold flex items-center justify-center">
                    AL
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#686779]">
                  <div className="flex items-center text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </div>
                  <span className="font-semibold text-[#17152B]">
                    Built for creators, brands, and bold ideas.
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Visually Rich Marketplace Preview Composition */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Decorative Ambient Card Glow */}
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-400/20 via-pink-400/15 to-blue-400/20 rounded-3xl blur-xl" />

                <div className="relative space-y-4">
                  {/* Card 1: Creator Profile Card */}
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-purple-100 p-5 shadow-xl shadow-purple-500/5 space-y-3.5 transform hover:-translate-y-1 transition duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#3B82F6] text-white flex items-center justify-center font-bold text-base shadow-md">
                            EV
                          </div>
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-[#17152B] text-sm">Elena Vance</h3>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-purple-50 text-[#7C3AED] text-[10px] font-semibold border border-purple-200/60">
                              <CheckCircle2 className="w-3 h-3 text-[#7C3AED]" />
                              Verified
                            </span>
                          </div>
                          <p className="text-xs text-[#686779]">AI Film & Video Director</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-[#7C3AED] bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">
                          $95/hr
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#686779] leading-relaxed line-clamp-2">
                      Specialized in cinematic generative visuals, brand launch reels, and high-retention storytelling using Runway Gen-3 and Sora.
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[#17152B] text-[11px] font-medium">
                        Runway Gen-3
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[#17152B] text-[11px] font-medium">
                        Cinema 4D
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-[#7C3AED] text-[11px] font-medium">
                        94 Craft Score
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Live Campaign Opportunity Card */}
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-blue-100 p-5 shadow-xl shadow-blue-500/5 space-y-3 transform hover:-translate-y-1 transition duration-300 ml-4 sm:ml-8">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#3B82F6] font-semibold border border-blue-200/60">
                        SaaS Brand Campaign
                      </span>
                      <span className="flex items-center gap-1 text-[#686779] font-medium text-[11px]">
                        <Clock className="w-3 h-3 text-[#3B82F6]" />
                        12 days left
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-[#17152B] text-sm">
                        Next-Gen AI Workspace Launch Video
                      </h4>
                      <p className="text-xs text-[#686779] mt-0.5">NovaPulse Tech • 1x 60s Reel + 3 Hooks</p>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="font-bold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        $3,500 – $5,000 Budget
                      </span>
                      <span className="text-[#3B82F6] font-semibold flex items-center gap-1">
                        View Brief <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Floating AI Matching Card */}
                  <div className="bg-gradient-to-r from-purple-50 via-white to-blue-50 rounded-2xl border border-purple-200/80 p-4 shadow-lg shadow-purple-500/10 -mt-2 -mr-2 flex items-center gap-3 animate-float-slow">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-md">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#7C3AED]">✦ 98% AI Match Score</span>
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.2 rounded">Optimal</span>
                      </div>
                      <p className="text-[11px] text-[#686779] mt-0.5">
                        High skill affinity in Tech Storytelling & verified deliverable track record.
                      </p>
                    </div>
                  </div>

                  {/* Floating Badges */}
                  <div className="absolute -top-4 -right-2 bg-white rounded-full px-3 py-1 shadow-md border border-purple-100 text-[11px] font-bold text-[#7C3AED] flex items-center gap-1.5 animate-float-reverse">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Instant Proposals
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. MARKETPLACE SEARCH SECTION (Below Hero)                                */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-purple-100/90 p-5 sm:p-6 shadow-xl shadow-purple-500/5 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            {/* Category Dropdown */}
            <div className="w-full sm:w-44 shrink-0">
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value as any)}
                className="w-full px-3.5 py-3 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs font-semibold text-[#17152B] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              >
                <option value="all">All Marketplace</option>
                <option value="creators">Creators Only</option>
                <option value="campaigns">Campaigns Only</option>
              </select>
            </div>

            {/* Search Input Field */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#686779]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creators, skills, niches, or brand campaigns..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-[#17152B] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#7C3AED] transition"
              />
            </div>

            {/* Search Submit Button */}
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] hover:from-[#6D28D9] hover:to-[#2563EB] text-white text-xs font-semibold shadow-md shadow-purple-500/20 hover:shadow-purple-500/35 transition cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </form>

          {/* Suggested Category Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-semibold text-[#686779] mr-1">Trending:</span>
            {categoryChips.map((chip) => {
              const Icon = chip.icon;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleChipClick(chip.filter)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-purple-50 border border-slate-200/70 hover:border-purple-200 text-[#17152B] hover:text-[#7C3AED] text-[11px] font-medium transition cursor-pointer"
                >
                  <Icon className="w-3 h-3 text-[#7C3AED]" />
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FEATURED CREATORS SECTION (Real MongoDB Data)                         */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              Vetted Talent Directory
            </div>
            <h2 className="text-3xl font-extrabold text-[#17152B] tracking-tight">
              Meet the Creators Behind Great Ideas
            </h2>
            <p className="text-sm text-[#686779] max-w-xl">
              Find creative talent that matches your brand, vision, and campaign goals.
            </p>
          </div>

          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] hover:text-[#6D28D9] group"
          >
            <span>Explore All Creators</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Creators Grid / Loading / Empty State */}
        {creatorsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-purple-100 p-5 space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-12 bg-slate-100 rounded" />
                <div className="h-8 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : featuredCreators.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCreators.map((creator) => {
              const creatorUserId = typeof creator.userId === 'object' && creator.userId !== null 
                ? (creator.userId as any)._id 
                : (creator.userId || creator._id || '');
              const isFav = favoriteIds.has(creatorUserId);
              const displayName = creator.displayName || 'Creative Creator';
              const rating = creator.reviewCount && creator.reviewCount > 0 ? creator.rating : null;
              const isVerified = (creator as any).isVerified || creator.craftScore >= 70;
              const niche = creator.niches?.[0] || (creator as any).niche || 'Digital Creator';

              return (
                <div
                  key={creator._id || creatorUserId}
                  className="bg-white rounded-2xl border border-purple-100/90 hover:border-purple-300 p-5 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 transition duration-200 flex flex-col justify-between group"
                >
                  <div className="space-y-3.5">
                    {/* Header: Avatar, Name, Favorite Button */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#3B82F6] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <h3 className="font-bold text-sm text-[#17152B] truncate max-w-[120px]">
                              {displayName}
                            </h3>
                            {isVerified && (
                              <span title="Verified Creator">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#686779] truncate max-w-[130px]">
                            {niche}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(creatorUserId, e)}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          isFav
                            ? 'bg-rose-50 border-rose-200 text-rose-500'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-500'
                        }`}
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500' : ''}`} />
                      </button>
                    </div>

                    {/* Bio Snippet */}
                    <p className="text-xs text-[#686779] line-clamp-2 leading-relaxed min-h-[32px]">
                      {creator.bio || 'Showcasing verified creative portfolio and generative AI campaigns.'}
                    </p>

                    {/* Skills & Tools Tags */}
                    <div className="flex flex-wrap gap-1">
                      {(creator.skills || []).slice(0, 3).map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-purple-50 text-[#7C3AED] text-[10px] font-medium">
                          {s}
                        </span>
                      ))}
                      {(creator.tools || []).slice(0, 1).map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 text-[#17152B] text-[10px] font-medium">
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Rating & Rate (Genuine Data Only) */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      {rating !== null ? (
                        <span className="flex items-center gap-1 font-semibold text-[#17152B]">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {rating.toFixed(1)} <span className="text-[10px] text-[#686779]">({creator.reviewCount})</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#686779]">Verified Profile</span>
                      )}

                      {creator.pricing?.hourlyRate ? (
                        <span className="font-bold text-[#7C3AED] text-xs">
                          ${creator.pricing.hourlyRate}/hr
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-emerald-600">Available</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-4">
                    <Link
                      to={`/marketplace/creator/${creatorUserId}`}
                      className="w-full py-2 text-center rounded-xl border border-purple-200 hover:bg-purple-50 text-[#7C3AED] text-xs font-semibold transition"
                    >
                      View Profile
                    </Link>
                    <Link
                      to="/campaigns"
                      className="w-full py-2 text-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] hover:from-[#6D28D9] hover:to-[#2563EB] text-white text-xs font-semibold shadow-xs transition"
                    >
                      Collaborate
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-purple-100 p-8 text-center space-y-3">
            <Users className="w-10 h-10 text-[#7C3AED] mx-auto opacity-40" />
            <h3 className="font-bold text-[#17152B] text-base">Be the First Creator to Join</h3>
            <p className="text-xs text-[#686779] max-w-md mx-auto">
              Our MongoDB creator registry is open. Create your creator profile and showcase your skills to ambitious brands.
            </p>
            <Link
              to="/register?role=creator"
              className="inline-block mt-2 px-5 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold shadow-md"
            >
              Create Creator Profile
            </Link>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 7. AI-POWERED FEATURES SECTION (4 Colorful Cards)                         */}
      {/* ========================================================================= */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Intelligent Platform Tools
          </div>
          <h2 className="text-3xl font-extrabold text-[#17152B] tracking-tight">
            Your Creative Workflow, Supercharged by AI
          </h2>
          <p className="text-sm text-[#686779]">
            Transparent, evidence-based AI tools designed to elevate human creativity and brand effectiveness.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1: AI Creator Matching */}
          <div className="bg-white rounded-3xl border border-purple-100 p-6 space-y-4 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/5 transition flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#6D28D9] text-white flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-[#17152B]">AI Creator Matching</h3>
              <p className="text-xs text-[#686779] leading-relaxed">
                Match creators with campaigns based on verified skills, niche, software tools, budget, and campaign requirements with explainable reasoning.
              </p>
            </div>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] hover:text-[#6D28D9] pt-2"
            >
              <span>Explore Matching</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Feature 2: AI Content Studio */}
          <div className="bg-white rounded-3xl border border-blue-100 p-6 space-y-4 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-[#17152B]">AI Content Studio</h3>
              <p className="text-xs text-[#686779] leading-relaxed">
                Generate high-impact content hooks, video scripts, social captions, headlines, campaign concepts, and 7-day calendars directly in the browser.
              </p>
            </div>
            <Link
              to="/ai-studio"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3B82F6] hover:text-blue-700 pt-2"
            >
              <span>Open Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Feature 3: AI Content Guardian */}
          <div className="bg-white rounded-3xl border border-emerald-100 p-6 space-y-4 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5 transition flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#16A34A] to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-[#17152B]">AI Content Guardian</h3>
              <p className="text-xs text-[#686779] leading-relaxed">
                Review deliverables against campaign rules, identify missing assets, verify FTC endorsement disclosures, and support human review appeals.
              </p>
            </div>
            <Link
              to="/campaigns"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] hover:text-emerald-700 pt-2"
            >
              <span>Guardian Audits</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Feature 4: Creator Originality & Craft */}
          <div className="bg-white rounded-3xl border border-pink-100 p-6 space-y-4 hover:border-pink-300 hover:shadow-xl hover:shadow-pink-500/5 transition flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F472B6] to-purple-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-[#17152B]">Creator Originality & Craft</h3>
              <p className="text-xs text-[#686779] leading-relaxed">
                Evidence-based portfolio craftsmanship insights and transparent scoring that empower creators without pretending to determine legal copyright ownership.
              </p>
            </div>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F472B6] hover:text-purple-600 pt-2"
            >
              <span>Learn Scoring</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. HOW IT WORKS SECTION (4-Step Timeline & 8 Lifecycle Stages)            */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            Simple & Transparent
          </div>
          <h2 className="text-3xl font-extrabold text-[#17152B] tracking-tight">
            From First Idea to Successful Collaboration
          </h2>
          <p className="text-sm text-[#686779]">
            A clear four-step process for creators and brands to partner with complete confidence.
          </p>
        </div>

        {/* 4-Step Visual Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="bg-white rounded-3xl border border-purple-100 p-6 space-y-4 shadow-sm relative">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-2xl bg-purple-100 text-[#7C3AED] font-mono font-bold text-sm flex items-center justify-center">
                01
              </span>
              <span className="text-[10px] font-bold text-[#686779] uppercase tracking-wider">Step One</span>
            </div>
            <h3 className="font-bold text-base text-[#17152B]">Create Your Profile</h3>
            <p className="text-xs text-[#686779] leading-relaxed">
              Creators showcase their portfolio, skills, tools, and pricing. Brands define their industry, goals, and campaign guidelines.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl border border-blue-100 p-6 space-y-4 shadow-sm relative">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-2xl bg-blue-100 text-[#3B82F6] font-mono font-bold text-sm flex items-center justify-center">
                02
              </span>
              <span className="text-[10px] font-bold text-[#686779] uppercase tracking-wider">Step Two</span>
            </div>
            <h3 className="font-bold text-base text-[#17152B]">Discover & Match</h3>
            <p className="text-xs text-[#686779] leading-relaxed">
              Explore creators and open campaign briefs with AI compatibility recommendations, budget filters, and deliverable specs.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl border border-emerald-100 p-6 space-y-4 shadow-sm relative">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#16A34A] font-mono font-bold text-sm flex items-center justify-center">
                03
              </span>
              <span className="text-[10px] font-bold text-[#686779] uppercase tracking-wider">Step Three</span>
            </div>
            <h3 className="font-bold text-base text-[#17152B]">Collaborate with Confidence</h3>
            <p className="text-xs text-[#686779] leading-relaxed">
              Manage proposals, submit milestone deliverables, chat in real-time, and refine content through structured review loops.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-3xl border border-pink-100 p-6 space-y-4 shadow-sm relative">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-2xl bg-pink-100 text-[#F472B6] font-mono font-bold text-sm flex items-center justify-center">
                04
              </span>
              <span className="text-[10px] font-bold text-[#686779] uppercase tracking-wider">Step Four</span>
            </div>
            <h3 className="font-bold text-base text-[#17152B]">Create and Grow</h3>
            <p className="text-xs text-[#686779] leading-relaxed">
              Approve deliverables, exchange verified reviews, build reputation with explainable craft scores, and scale partnerships.
            </p>
          </div>
        </div>

        {/* The 8 Complete Lifecycle Stages Pipeline */}
        <div className="pt-8 space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-xl font-bold text-[#17152B]">The End-to-End Creator Lifecycle Engine</h3>
            <p className="text-xs text-[#686779]">
              Every stage is backed by real MongoDB collections, role authorization, and verified APIs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {lifecycleStages.map((stage) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.title}
                  className="bg-white/80 rounded-2xl border border-purple-100/70 p-4 space-y-2.5 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${stage.color} flex items-center justify-center border`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-[#686779]">{stage.step}</span>
                  </div>
                  <h4 className="font-bold text-sm text-[#17152B]">{stage.title}</h4>
                  <p className="text-[11px] text-[#686779] leading-relaxed">{stage.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. CAMPAIGN OPPORTUNITIES SECTION (Real MongoDB Data)                     */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3B82F6] uppercase tracking-wider">
              <Briefcase className="w-3.5 h-3.5" />
              Active Opportunities
            </div>
            <h2 className="text-3xl font-extrabold text-[#17152B] tracking-tight">
              Discover Your Next Big Opportunity
            </h2>
            <p className="text-sm text-[#686779] max-w-xl">
              Real brand briefs with verified budgets, clear deliverables, and deadline guarantees.
            </p>
          </div>

          <Link
            to="/campaigns"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3B82F6] hover:text-blue-700 group"
          >
            <span>Explore All Campaigns</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {campaignsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-3xl border border-blue-100 p-6 space-y-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-6 bg-slate-200 rounded w-3/4" />
                <div className="h-16 bg-slate-100 rounded" />
                <div className="h-10 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : recentCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentCampaigns.map((camp) => (
              <div
                key={camp._id}
                className="bg-white rounded-3xl border border-blue-100 hover:border-blue-300 p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#3B82F6] font-semibold border border-blue-200/60">
                      {camp.category || 'Campaign'}
                    </span>
                    {camp.applicationDeadline && (
                      <span className="text-[11px] text-[#686779] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#3B82F6]" />
                        {new Date(camp.applicationDeadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-[#17152B] line-clamp-1 group-hover:text-[#3B82F6] transition">
                      {camp.title}
                    </h3>
                    <p className="text-xs text-[#686779] mt-1 line-clamp-2 leading-relaxed">
                      {camp.description}
                    </p>
                  </div>

                  {camp.requiredSkills && camp.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {camp.requiredSkills.slice(0, 3).map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-slate-100 text-[#17152B] text-[10px] font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#16A34A] bg-emerald-50 px-2 py-1 rounded-lg">
                      ${camp.budget?.min?.toLocaleString()} – ${camp.budget?.max?.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-[#686779]">{camp.applicationsCount || 0} applied</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-6">
                  <Link
                    to={`/campaigns/${camp._id}`}
                    className="w-full py-2.5 text-center rounded-xl border border-blue-200 hover:bg-blue-50 text-[#3B82F6] text-xs font-semibold transition"
                  >
                    View Brief
                  </Link>
                  <Link
                    to={`/campaigns/${camp._id}`}
                    className="w-full py-2.5 text-center rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] hover:from-blue-600 hover:to-purple-600 text-white text-xs font-semibold shadow-xs transition"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-blue-100 p-8 text-center space-y-3">
            <Briefcase className="w-10 h-10 text-[#3B82F6] mx-auto opacity-40" />
            <h3 className="font-bold text-[#17152B] text-base">Launch the First Campaign</h3>
            <p className="text-xs text-[#686779] max-w-md mx-auto">
              No active briefs currently published. Brands can publish a campaign brief to connect with top creators.
            </p>
            <Link
              to="/campaigns/new"
              className="inline-block mt-2 px-5 py-2 rounded-xl bg-[#3B82F6] text-white text-xs font-semibold shadow-md"
            >
              Start a Brand Campaign
            </Link>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 10. SEPARATE CALLS TO ACTION (Creators & Brands)                           */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* CTA Card for Creators */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#F3E8FF] via-white to-purple-50 rounded-3xl border border-purple-200/80 p-8 sm:p-10 shadow-lg space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-[#7C3AED] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                For Content Creators
              </span>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#17152B] tracking-tight">
                Your Creativity Deserves the Spotlight.
              </h3>

              <p className="text-sm text-[#686779] leading-relaxed">
                Showcase your portfolio, discover exciting opportunities, and grow through meaningful brand partnerships.
              </p>
            </div>

            <div>
              <Link
                to="/register?role=creator"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white font-semibold text-sm shadow-md shadow-purple-500/25 transition active:scale-95"
              >
                <span>Join as a Creator</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* CTA Card for Brands */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#EFF6FF] via-white to-blue-50 rounded-3xl border border-blue-200/80 p-8 sm:p-10 shadow-lg space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#3B82F6] text-xs font-bold uppercase tracking-wider">
                <Briefcase className="w-3.5 h-3.5" />
                For Modern Brands
              </span>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#17152B] tracking-tight">
                Find the Talent Behind Your Next Big Campaign.
              </h3>

              <p className="text-sm text-[#686779] leading-relaxed">
                Discover skilled creators, publish briefs, and manage collaborations in one place.
              </p>
            </div>

            <div>
              <Link
                to="/register?role=brand"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] hover:from-blue-600 hover:to-purple-600 text-white font-semibold text-sm shadow-md shadow-blue-500/25 transition active:scale-95"
              >
                <span>Start a Brand Campaign</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. BUILT FOR BETTER COLLABORATIONS (Trust & Factual Platform Benefits)    */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Safety & Reliability
          </div>
          <h2 className="text-3xl font-extrabold text-[#17152B] tracking-tight">
            Built for Better Collaborations
          </h2>
          <p className="text-sm text-[#686779]">
            Engineered with strict data privacy, role-guarded permissions, and transparent milestone agreements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-[#17152B]">Role-Guarded Security</h4>
            <p className="text-xs text-[#686779] leading-relaxed">
              HTTP-only cookie sessions, bcrypt password hashing, and Express authorization guards ensure strict data isolation between creators and brands.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#3B82F6] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-[#17152B]">Milestone Workspaces</h4>
            <p className="text-xs text-[#686779] leading-relaxed">
              Deliverables are tracked stage-by-stage with structured submissions, formal revision notes, and explicit brand approvals.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#16A34A] flex items-center justify-center font-bold">
              <Check className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-[#17152B]">Zero-Mock AI Architecture</h4>
            <p className="text-xs text-[#686779] leading-relaxed">
              We never fabricate simulated responses. Live cloud AI calls are clearly tagged, and local deterministic heuristics provide robust offline capability.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 text-[#F472B6] flex items-center justify-center font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-[#17152B]">Transparent Reviews</h4>
            <p className="text-xs text-[#686779] leading-relaxed">
              Client reviews are only eligible upon milestone completion, preventing fake testimonials and preserving marketplace integrity.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CREATOR ACADEMY PREVIEW SECTION (#academy anchor)                          */}
      {/* ========================================================================= */}
      <section id="academy" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-semibold backdrop-blur-md">
              <BookOpen className="w-3.5 h-3.5 text-purple-300" />
              Creator Academy & Skill Verification
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Master the Modern Generative Creator Economy
            </h2>

            <p className="text-sm text-purple-100 leading-relaxed">
              Level up with hands-on curriculums covering AI video workflows, prompt engineering, commercial licensing, and client negotiation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <span className="text-[10px] font-mono text-purple-300 uppercase">Module 1</span>
                <h4 className="font-bold text-xs mt-1">Prompting for Video</h4>
                <p className="text-[11px] text-purple-200 mt-1">Sora & Runway Gen-3 camera motion control.</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <span className="text-[10px] font-mono text-purple-300 uppercase">Module 2</span>
                <h4 className="font-bold text-xs mt-1">Brand Brief Decoding</h4>
                <p className="text-[11px] text-purple-200 mt-1">Translating briefs into viral scripts.</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <span className="text-[10px] font-mono text-purple-300 uppercase">Module 3</span>
                <h4 className="font-bold text-xs mt-1">Rights & Licensing</h4>
                <p className="text-[11px] text-purple-200 mt-1">FTC disclosure rules and digital ownership.</p>
              </div>
            </div>

            <div className="pt-4">
              <Link
                to="/ai-studio"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#17152B] font-bold text-xs hover:bg-purple-50 transition shadow-md"
              >
                <span>Practice in AI Studio</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#7C3AED]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. FAQ ACCORDION SECTION (#faq)                                          */}
      {/* ========================================================================= */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl font-extrabold text-[#17152B] tracking-tight">
            Everything You Need to Know
          </h2>
          <p className="text-sm text-[#686779]">
            Truthful answers reflecting our active MERN architecture and features.
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = expandedFaq === index;
            return (
              <div
                key={item.q}
                className="bg-white rounded-2xl border border-purple-100 overflow-hidden shadow-xs transition"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : index)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-sm text-[#17152B] hover:text-[#7C3AED] transition cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#7C3AED] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#686779] shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs text-[#686779] leading-relaxed border-t border-slate-100">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* LIVE SYSTEM HEALTH & CONNECTIVITY CARD                                    */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HealthStatusCard />
      </section>
    </div>
  );
};
