import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Layers, 
  PlusCircle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Briefcase, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { CampaignData, ApplicationData, PaginationData } from '../types';

const CAMPAIGN_CATEGORIES = [
  'AI Video Ad',
  'Product Launch',
  'Social Media UGC',
  '3D Product Animation',
  'Brand Storytelling',
  'Tech Demo & Tutorial',
  'Creative Campaign'
];

export const CampaignsExplorePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Active Tab: 'explore' | 'my-campaigns' (if brand) | 'my-applications' (if creator)
  const [activeTab, setActiveTab] = useState<'explore' | 'my-campaigns' | 'my-applications'>('explore');

  // Explore state
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [minBudget, setMinBudget] = useState<string>('');
  const [maxBudget, setMaxBudget] = useState<string>('');

  // User-specific tab state
  const [brandCampaigns, setBrandCampaigns] = useState<CampaignData[]>([]);
  const [myApplications, setMyApplications] = useState<ApplicationData[]>([]);
  const [userTabLoading, setUserTabLoading] = useState<boolean>(false);

  const fetchCampaigns = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.exploreCampaigns({
        q: searchQuery,
        category: selectedCategory,
        skill: selectedSkill,
        minBudget: minBudget ? Number(minBudget) : undefined,
        maxBudget: maxBudget ? Number(maxBudget) : undefined,
        page,
        limit: 9,
      });

      if (res.success) {
        setCampaigns(res.data);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedSkill, minBudget, maxBudget]);

  useEffect(() => {
    if (activeTab === 'explore') {
      fetchCampaigns(1);
    } else if (activeTab === 'my-campaigns' && user?.role === 'brand') {
      setUserTabLoading(true);
      api.getBrandCampaigns()
        .then((res) => {
          if (res.success) setBrandCampaigns(res.campaigns);
        })
        .catch((err: any) => setError(err.message))
        .finally(() => setUserTabLoading(false));
    } else if (activeTab === 'my-applications' && user?.role === 'creator') {
      setUserTabLoading(true);
      api.getMyApplications()
        .then((res) => {
          if (res.success) setMyApplications(res.applications);
        })
        .catch((err: any) => setError(err.message))
        .finally(() => setUserTabLoading(false));
    }
  }, [activeTab, fetchCampaigns, user?.role]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedSkill('');
    setMinBudget('');
    setMaxBudget('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              Campaign Marketplace
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Opportunities & Creative Briefs
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Discover active, funded brand campaigns seeking generative content creators. 
              Review deliverables, budgets, and submit verified proposals.
            </p>
          </div>

          {/* Brand Create Action */}
          {user?.role === 'brand' && (
            <Link
              to="/campaigns/new"
              className="px-6 py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-600/30 transition active:scale-95 flex items-center justify-center gap-2 flex-shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              Post New Campaign
            </Link>
          )}
        </div>
      </div>

      {/* Tabs Switcher for Authenticated Users */}
      {isAuthenticated && (
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'explore'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            Explore All Opportunities
          </button>

          {user?.role === 'brand' && (
            <button
              onClick={() => setActiveTab('my-campaigns')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'my-campaigns'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              My Brand Campaigns ({brandCampaigns.length})
            </button>
          )}

          {user?.role === 'creator' && (
            <button
              onClick={() => setActiveTab('my-applications')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'my-applications'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-pink-400" />
              My Proposals & Applications ({myApplications.length})
            </button>
          )}
        </div>
      )}

      {/* TAB 1: EXPLORE CAMPAIGNS */}
      {activeTab === 'explore' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search campaigns by keyword, product, or brief..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min $"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
                <input
                  type="number"
                  placeholder="Max $"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
                <button
                  onClick={() => fetchCampaigns(1)}
                  className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition"
                >
                  Filter
                </button>
                <button
                  onClick={resetFilters}
                  title="Reset filters"
                  className="p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                Category:
              </span>
              {CAMPAIGN_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(isSelected ? '' : cat)}
                    className={`text-[11px] px-3 py-1 rounded-lg border transition ${
                      isSelected
                        ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading & Error */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="h-5 bg-slate-800 rounded w-3/4" />
                  <div className="h-4 bg-slate-800 rounded w-1/2" />
                  <div className="h-16 bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && campaigns.length === 0 && (
            <div className="text-center py-16 px-4 bg-slate-900/30 border border-slate-800 rounded-3xl space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">No campaigns available</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                No active campaigns match your current query or filters. Check back soon or clear filters.
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Campaigns Grid */}
          {!loading && !error && campaigns.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((camp) => (
                <div
                  key={camp._id}
                  className="group bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 rounded-2xl p-6 transition flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300">
                        {camp.category}
                      </span>
                      {camp.brandProfile && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="font-semibold text-slate-200 truncate max-w-[120px]">
                            {camp.brandProfile.companyName}
                          </span>
                          {camp.brandProfile.isVerified && (
                            <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition line-clamp-1">
                        {camp.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {camp.description}
                      </p>
                    </div>

                    {/* Budget & Deliverables Badges */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Budget</div>
                        <div className="text-xs font-bold text-emerald-400 font-mono">
                          ${camp.budget.min} - ${camp.budget.max} {camp.budget.currency}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Deliverables</div>
                        <div className="text-xs font-bold text-white font-mono">
                          {camp.deliverables ? camp.deliverables.length : 1} Items
                        </div>
                      </div>
                    </div>

                    {/* Required Skills Tags */}
                    {camp.requiredSkills && camp.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {camp.requiredSkills.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer & Action */}
                  <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{camp.applicationsCount || 0} applicants</span>
                    </div>

                    <Link
                      to={`/campaigns/${camp._id}`}
                      className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                    >
                      View Brief &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-slate-800">
              <button
                onClick={() => fetchCampaigns(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-semibold text-slate-400">
                Page <span className="text-white">{pagination.page}</span> of{' '}
                <span className="text-white">{pagination.totalPages}</span>
              </span>
              <button
                onClick={() => fetchCampaigns(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY BRAND CAMPAIGNS */}
      {activeTab === 'my-campaigns' && user?.role === 'brand' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Your Managed Campaigns</h2>
            <Link
              to="/campaigns/new"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New Campaign
            </Link>
          </div>

          {userTabLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading your campaigns...</div>
          ) : brandCampaigns.length > 0 ? (
            <div className="space-y-3">
              {brandCampaigns.map((camp) => (
                <div
                  key={camp._id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        camp.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : camp.status === 'draft'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {camp.status}
                      </span>
                      <h3 className="text-sm font-bold text-white">{camp.title}</h3>
                    </div>
                    <p className="text-xs text-slate-400">
                      Budget: ${camp.budget.min} - ${camp.budget.max} {camp.budget.currency} &bull; {camp.applicationsCount || 0} applicants
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/campaigns/${camp._id}`}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
                    >
                      Manage & Review Applicants
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900/30 border border-slate-800 rounded-2xl space-y-3">
              <p className="text-xs text-slate-400">You haven't posted any campaigns yet.</p>
              <Link
                to="/campaigns/new"
                className="inline-block px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl"
              >
                Create Your First Campaign
              </Link>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MY CREATOR APPLICATIONS */}
      {activeTab === 'my-applications' && user?.role === 'creator' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">Your Submitted Proposals</h2>

          {userTabLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading your applications...</div>
          ) : myApplications.length > 0 ? (
            <div className="space-y-3">
              {myApplications.map((app) => {
                const campaignTitle = typeof app.campaignId === 'object' && app.campaignId !== null
                  ? app.campaignId.title
                  : 'Campaign Opportunity';
                const campaignObjId = typeof app.campaignId === 'object' && app.campaignId !== null
                  ? app.campaignId._id
                  : app.campaignId;

                const statusColors: Record<string, string> = {
                  submitted: 'bg-sky-500/20 text-sky-400',
                  shortlisted: 'bg-amber-500/20 text-amber-400',
                  accepted: 'bg-emerald-500/20 text-emerald-400',
                  rejected: 'bg-rose-500/20 text-rose-400',
                  withdrawn: 'bg-slate-800 text-slate-400',
                };

                return (
                  <div
                    key={app._id}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusColors[app.status] || 'bg-slate-800 text-slate-400'}`}>
                          {app.status}
                        </span>
                        <h3 className="text-sm font-bold text-white">{campaignTitle}</h3>
                      </div>
                      <p className="text-xs text-slate-400">
                        Proposed Rate: <strong className="text-emerald-400">${app.proposedRate}</strong> &bull; Estimated: {app.estimatedDays} days &bull; Submitted on {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/campaigns/${campaignObjId}`}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
                      >
                        View Campaign
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900/30 border border-slate-800 rounded-2xl space-y-3">
              <p className="text-xs text-slate-400">You haven't submitted any proposals yet.</p>
              <button
                onClick={() => setActiveTab('explore')}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl"
              >
                Browse Open Opportunities
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
