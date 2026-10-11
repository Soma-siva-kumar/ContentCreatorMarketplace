import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Sparkles, 
  Star, 
  CheckCircle, 
  Heart, 
  ArrowUpDown, 
  Clock, 
  Briefcase, 
  Layers, 
  RotateCcw,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { CreatorProfileData, PaginationData } from '../types';

const POPULAR_NICHES = [
  'AI Film & Video',
  'Tech & SaaS',
  'Fashion & Luxury',
  'Gaming & 3D',
  'Web3 & Crypto',
  'Education & EdTech',
  'Health & Fitness',
  'Music & Audio'
];

const POPULAR_SKILLS = [
  'Motion Design',
  'GenAI Prompting',
  'Video Editing',
  '3D Animation',
  'Copywriting',
  'Visual Effects',
  'Sound Design',
  'Storyboarding'
];

const POPULAR_TOOLS = [
  'Runway Gen-3',
  'Midjourney v6',
  'ElevenLabs',
  'Stable Diffusion',
  'Sora',
  'Pika',
  'Kling',
  'ComfyUI',
  'Blender'
];

export const MarketplacePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // State
  const [creators, setCreators] = useState<CreatorProfileData[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNiche, setSelectedNiche] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('');
  const [minCraftScore, setMinCraftScore] = useState<number>(0);
  const [maxHourlyRate, setMaxHourlyRate] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('craftScore');

  // Favorites tracking
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favLoading, setFavLoading] = useState<string | null>(null);

  const fetchCreators = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.searchCreators({
        q: searchQuery,
        niche: selectedNiche,
        skill: selectedSkill,
        tool: selectedTool,
        availability: selectedAvailability,
        minCraftScore: minCraftScore > 0 ? minCraftScore : undefined,
        maxRate: maxHourlyRate ? Number(maxHourlyRate) : undefined,
        sortBy,
        page,
        limit: 12,
      });

      if (res.success) {
        setCreators(res.data);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load creator directory.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedNiche, selectedSkill, selectedTool, selectedAvailability, minCraftScore, maxHourlyRate, sortBy]);

  // Load favorites if user is logged in
  useEffect(() => {
    if (isAuthenticated) {
      api.getFavorites()
        .then((res) => {
          if (res.success && res.favorites) {
            const ids = new Set(res.favorites.map((f: any) => f.userId?._id || f.userId));
            setFavoriteIds(ids);
          }
        })
        .catch(() => {
          // Ignore favorite pre-load errors silently
        });
    }
  }, [isAuthenticated]);

  // Fetch when filters change
  useEffect(() => {
    fetchCreators(1);
  }, [fetchCreators]);

  const handleToggleFavorite = async (creatorUserId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Please sign in to save creators to your favorites.');
      return;
    }

    setFavLoading(creatorUserId);
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
    } catch (err: any) {
      alert(err.message || 'Failed to update favorites.');
    } finally {
      setFavLoading(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedNiche('');
    setSelectedSkill('');
    setSelectedTool('');
    setSelectedAvailability('');
    setMinCraftScore(0);
    setMaxHourlyRate('');
    setSortBy('craftScore');
  };

  return (
    <div className="min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Vetted Creator Marketplace
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Discover Top AI Content Creators
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Connect with verified creators skilled in generative video, 3D worldbuilding, AI promptcraft, 
            and multimedia storytelling. Evaluated with our real-time Originality & Craft Score.
          </p>

          {/* Quick Search Bar */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by creator name, niche, skill, or AI tool (e.g. Midjourney, Sora)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
              />
            </div>
            <button
              onClick={() => fetchCreators(1)}
              className="px-6 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-brand-600/20 transition flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Explore
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Sidebar Filters + Creator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="space-y-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 h-fit backdrop-blur-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Filter className="w-4 h-4 text-brand-400" />
              Filter Creators
            </div>
            <button
              onClick={resetFilters}
              className="text-xs text-slate-400 hover:text-brand-300 flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-indigo-400" />
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="craftScore">Highest Craft Score</option>
              <option value="rating">Highest Verified Rating</option>
              <option value="rate_asc">Hourly Rate: Low to High</option>
              <option value="rate_desc">Hourly Rate: High to Low</option>
              <option value="newest">Newest Joined</option>
            </select>
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" />
              Availability
            </label>
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="">Any Availability</option>
              <option value="available">Available Now</option>
              <option value="busy">Busy / Limited Capacity</option>
              <option value="not_taking_clients">Not Taking Clients</option>
            </select>
          </div>

          {/* Minimum Craft Score Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                Min Craft Score
              </span>
              <span className="text-amber-400 font-mono font-bold">{minCraftScore}/100</span>
            </div>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={minCraftScore}
              onChange={(e) => setMinCraftScore(Number(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer"
            />
          </div>

          {/* Max Hourly Rate */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-emerald-400" />
              Max Hourly Rate ($/hr)
            </label>
            <input
              type="number"
              placeholder="e.g. 150"
              value={maxHourlyRate}
              onChange={(e) => setMaxHourlyRate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>

          {/* Popular Niches */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-pink-400" />
              Creative Niches
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_NICHES.map((niche) => {
                const isSelected = selectedNiche === niche;
                return (
                  <button
                    key={niche}
                    onClick={() => setSelectedNiche(isSelected ? '' : niche)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                      isSelected
                        ? 'bg-pink-500/20 border-pink-500/50 text-pink-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {niche}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Tools */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              AI Tools & Workflows
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_TOOLS.map((tool) => {
                const isSelected = selectedTool === tool;
                return (
                  <button
                    key={tool}
                    onClick={() => setSelectedTool(isSelected ? '' : tool)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {tool}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Core Skills
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SKILLS.map((skill) => {
                const isSelected = selectedSkill === skill;
                return (
                  <button
                    key={skill}
                    onClick={() => setSelectedSkill(isSelected ? '' : skill)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                      isSelected
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Creator Results Section */}
        <section className="lg:col-span-3 space-y-6">
          {/* Active Filter Indicators & Total Count */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl px-5 py-3">
            <div className="text-sm text-slate-300">
              Showing <span className="font-bold text-white">{creators.length}</span> of{' '}
              <span className="font-bold text-brand-400">{pagination.total}</span> vetted creators
            </div>
            {(selectedNiche || selectedSkill || selectedTool || selectedAvailability || minCraftScore > 0 || maxHourlyRate) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">Active filters:</span>
                {selectedNiche && (
                  <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 text-xs flex items-center gap-1">
                    {selectedNiche}
                    <button onClick={() => setSelectedNiche('')} className="hover:text-white">&times;</button>
                  </span>
                )}
                {selectedSkill && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs flex items-center gap-1">
                    {selectedSkill}
                    <button onClick={() => setSelectedSkill('')} className="hover:text-white">&times;</button>
                  </span>
                )}
                {selectedTool && (
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-xs flex items-center gap-1">
                    {selectedTool}
                    <button onClick={() => setSelectedTool('')} className="hover:text-white">&times;</button>
                  </span>
                )}
                {selectedAvailability && (
                  <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs flex items-center gap-1">
                    {selectedAvailability}
                    <button onClick={() => setSelectedAvailability('')} className="hover:text-white">&times;</button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Loading & Error States */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-800 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-800 rounded w-3/4" />
                      <div className="h-3 bg-slate-800 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-10 bg-slate-800 rounded" />
                  <div className="h-6 bg-slate-800 rounded w-2/3" />
                </div>
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => fetchCreators(1)}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && creators.length === 0 && (
            <div className="text-center py-16 px-4 bg-slate-900/30 border border-slate-800 rounded-3xl space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">No creators match your filters</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Try widening your search terms or clearing specific filters to discover creators across other niches and AI tool sets.
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Creator Cards Grid */}
          {!loading && !error && creators.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {creators.map((creator) => {
                const targetUserId = typeof creator.userId === 'object' && creator.userId !== null
                  ? (creator.userId as any)._id
                  : creator.userId;
                const isFavorited = favoriteIds.has(targetUserId);

                return (
                  <div
                    key={creator._id || targetUserId}
                    className="group bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-brand-500/50 rounded-2xl p-6 transition flex flex-col justify-between shadow-lg relative overflow-hidden"
                  >
                    {/* Top Creator Header */}
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          {creator.avatarUrl ? (
                            <img
                              src={creator.avatarUrl}
                              alt={creator.displayName}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-md shadow-brand-600/30">
                              {creator.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-white text-base group-hover:text-brand-300 transition truncate max-w-[150px]">
                                {creator.displayName}
                              </h3>
                              <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
                            </div>
                            <p className="text-xs text-slate-400 truncate max-w-[160px]">
                              {creator.tagline || 'AI Content Specialist'}
                            </p>
                          </div>
                        </div>

                        {/* Favorite button */}
                        <button
                          onClick={(e) => handleToggleFavorite(targetUserId, e)}
                          disabled={favLoading === targetUserId}
                          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                          className={`p-2 rounded-xl border transition ${
                            isFavorited
                              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-rose-400 hover:border-slate-700'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-400' : ''}`} />
                        </button>
                      </div>

                      {/* Bio Excerpt */}
                      {creator.bio && (
                        <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                          {creator.bio}
                        </p>
                      )}

                      {/* Craft Score & Verified Rating Row */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Craft Score</div>
                            <div className="text-xs font-bold text-white font-mono">{creator.craftScore || 85}/100</div>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Rating</div>
                            <div className="text-xs font-bold text-white font-mono">
                              {creator.rating > 0 ? `${creator.rating} (${creator.reviewCount})` : 'New'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Skills & Tools Tags */}
                      <div className="space-y-2 mb-4">
                        {creator.tools && creator.tools.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {creator.tools.slice(0, 3).map((tool) => (
                              <span
                                key={tool}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300"
                              >
                                {tool}
                              </span>
                            ))}
                            {creator.tools.length > 3 && (
                              <span className="text-[10px] px-1.5 py-0.5 text-slate-500">
                                +{creator.tools.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        {creator.niches && creator.niches.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {creator.niches.slice(0, 2).map((niche) => (
                              <span
                                key={niche}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300"
                              >
                                {niche}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Pricing & Action */}
                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] uppercase text-slate-400 font-semibold">Starting At</div>
                        <div className="text-sm font-bold text-white font-mono">
                          {creator.pricing?.hourlyRate ? (
                            `$${creator.pricing.hourlyRate}/hr`
                          ) : creator.pricing?.projectMinimum ? (
                            `$${creator.pricing.projectMinimum} min`
                          ) : (
                            'Custom rate'
                          )}
                        </div>
                      </div>

                      <Link
                        to={`/marketplace/creator/${creator._id || targetUserId}`}
                        className="px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-brand-600/20 transition active:scale-95"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-slate-800">
              <button
                onClick={() => fetchCreators(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-semibold text-slate-400">
                Page <span className="text-white">{pagination.page}</span> of{' '}
                <span className="text-white">{pagination.totalPages}</span>
              </span>
              <button
                onClick={() => fetchCreators(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
