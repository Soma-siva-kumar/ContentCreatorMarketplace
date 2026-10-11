import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Star, 
  CheckCircle, 
  Clock, 
  Zap, 
  Briefcase, 
  ExternalLink, 
  Heart, 
  ArrowLeft, 
  ShieldCheck, 
  Award,
  Globe,
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { CreatorProfileData, ReviewData, CampaignData } from '../types';

export const CreatorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();

  const navigate = useNavigate();
  const [creator, setCreator] = useState<CreatorProfileData | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Favorites
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [favLoading, setFavLoading] = useState<boolean>(false);

  // Brand campaign invitation modal
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [brandCampaigns, setBrandCampaigns] = useState<CampaignData[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState<boolean>(false);
  const [startingChat, setStartingChat] = useState<boolean>(false);

  const handleStartConversation = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!creator) return;
    setStartingChat(true);
    try {
      const res = await api.getOrCreateConversation({ targetUserId: creator.userId });
      if (res.success) {
        navigate(`/messages?conversationId=${res.conversation._id}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to start conversation.');
    } finally {
      setStartingChat(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    api.getCreatorDetail(id)
      .then((res) => {
        if (res.success && res.profile) {
          setCreator(res.profile);
          setReviews(res.reviews || []);
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Failed to load creator profile.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // Check favorite state
  useEffect(() => {
    if (isAuthenticated && creator) {
      const targetUserId = typeof creator.userId === 'object' && creator.userId !== null
        ? (creator.userId as any)._id
        : creator.userId;

      api.getFavorites()
        .then((res) => {
          if (res.success && res.favorites) {
            const hasFav = res.favorites.some((f: any) => {
              const uId = typeof f.userId === 'object' ? f.userId?._id : f.userId;
              return uId === targetUserId;
            });
            setIsFavorited(hasFav);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, creator]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to save creators to your favorites.');
      return;
    }
    if (!creator) return;

    const targetUserId = typeof creator.userId === 'object' && creator.userId !== null
      ? (creator.userId as any)._id
      : creator.userId;

    setFavLoading(true);
    try {
      const res = await api.toggleFavorite(targetUserId);
      if (res.success) {
        setIsFavorited(res.favorited);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update favorites.');
    } finally {
      setFavLoading(false);
    }
  };

  const handleOpenInviteModal = async () => {
    setShowInviteModal(true);
    setCampaignsLoading(true);
    try {
      const res = await api.getBrandCampaigns();
      if (res.success) {
        setBrandCampaigns(res.campaigns.filter((c) => c.status === 'published'));
      }
    } catch {
      // Ignore
    } finally {
      setCampaignsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-sm font-semibold">Loading verified creator dossier...</p>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="p-8 bg-rose-500/10 border border-rose-500/30 rounded-3xl text-rose-300">
          <h2 className="text-xl font-bold mb-2">Creator Not Found</h2>
          <p className="text-sm">{error || 'This creator profile may have been deactivated or removed.'}</p>
        </div>
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Creator Marketplace
        </Link>
      </div>
    );
  }

  const availabilityLabels: Record<string, { label: string; color: string }> = {
    available: { label: 'Available for Work', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
    busy: { label: 'Limited Capacity', color: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
    not_taking_clients: { label: 'Not Taking Clients', color: 'bg-rose-500/10 border-rose-500/30 text-rose-400' },
  };

  const currentAvail = availabilityLabels[creator.availability] || availabilityLabels.available;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <Link
        to="/marketplace"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Creator Directory
      </Link>

      {/* Hero Profile Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-8 sm:p-10 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {creator.avatarUrl ? (
              <img
                src={creator.avatarUrl}
                alt={creator.displayName}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-brand-500/40 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 text-white font-extrabold text-3xl flex items-center justify-center shadow-xl shadow-brand-600/20">
                {creator.displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {creator.displayName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-300 text-xs font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Verified Creator
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${currentAvail.color}`}>
                  <Clock className="w-3.5 h-3.5" />
                  {currentAvail.label}
                </span>
              </div>

              <p className="text-slate-300 text-sm font-medium">
                {creator.tagline || 'AI Content Producer & Generative Media Artist'}
              </p>

              {creator.experienceYears && (
                <div className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">{creator.experienceYears} Years</span> Creative Industry Experience
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleToggleFavorite}
              disabled={favLoading}
              className={`p-3 rounded-2xl border transition flex items-center justify-center gap-2 text-xs font-semibold ${
                isFavorited
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-400' : ''}`} />
              <span>{isFavorited ? 'Saved' : 'Favorite'}</span>
            </button>

            {user?.id !== creator.userId && (
              <button
                onClick={handleStartConversation}
                disabled={startingChat}
                className="p-3 rounded-2xl border bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition flex items-center justify-center gap-2 text-xs font-semibold"
                title="Direct message creator"
              >
                <MessageSquare className="w-4 h-4 text-sky-400" />
                <span>{startingChat ? 'Connecting...' : 'Message'}</span>
              </button>
            )}

            {user?.role === 'brand' && (
              <button
                onClick={handleOpenInviteModal}
                className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-600/30 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Briefcase className="w-4 h-4" />
                Invite to Campaign
              </button>
            )}
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase mb-1">
              <Zap className="w-4 h-4" />
              Craft Score
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {creator.craftScore || 85}
              <span className="text-xs text-slate-400 font-normal"> / 100</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold uppercase mb-1">
              <Star className="w-4 h-4 fill-yellow-400" />
              Client Rating
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {creator.rating > 0 ? creator.rating.toFixed(1) : '5.0'}
              <span className="text-xs text-slate-400 font-normal"> ({creator.reviewCount} reviews)</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase mb-1">
              <Award className="w-4 h-4" />
              Completed Collabs
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {creator.completedCollaborationsCount || 0}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase mb-1">
              <Briefcase className="w-4 h-4" />
              Standard Rates
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {creator.pricing?.hourlyRate ? (
                `$${creator.pricing.hourlyRate}/hr`
              ) : creator.pricing?.projectMinimum ? (
                `$${creator.pricing.projectMinimum} min`
              ) : (
                'Flexible'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Details + Portfolio + Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Bio & Skills */}
        <div className="space-y-6">
          {/* Bio Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">About Creator</h3>
            <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">
              {creator.bio || 'No creator bio provided yet.'}
            </p>

            {/* Social Links */}
            {creator.socialLinks && Object.values(creator.socialLinks).some(Boolean) && (
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Verified Channels</h4>
                <div className="flex flex-wrap gap-2">
                  {creator.socialLinks.website && (
                    <a
                      href={creator.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-brand-500/50 transition flex items-center gap-1.5 text-xs"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Website</span>
                    </a>
                  )}
                  {creator.socialLinks.youtube && (
                    <a
                      href={creator.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-red-400 transition flex items-center gap-1.5 text-xs"
                    >
                      <Youtube className="w-3.5 h-3.5" />
                      <span>YouTube</span>
                    </a>
                  )}
                  {creator.socialLinks.instagram && (
                    <a
                      href={creator.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-pink-400 transition flex items-center gap-1.5 text-xs"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      <span>Instagram</span>
                    </a>
                  )}
                  {creator.socialLinks.twitter && (
                    <a
                      href={creator.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-sky-400 transition flex items-center gap-1.5 text-xs"
                    >
                      <Twitter className="w-3.5 h-3.5" />
                      <span>Twitter / X</span>
                    </a>
                  )}
                  {creator.socialLinks.linkedin && (
                    <a
                      href={creator.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-indigo-400 transition flex items-center gap-1.5 text-xs"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* AI Tools & Workflows */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              AI Tools & Models
            </h3>
            <div className="flex flex-wrap gap-2">
              {creator.tools && creator.tools.length > 0 ? (
                creator.tools.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-medium"
                  >
                    {t}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">No tools specified</span>
              )}
            </div>
          </div>

          {/* Creative Niches & Skills */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Content Niches</h3>
              <div className="flex flex-wrap gap-2">
                {creator.niches && creator.niches.length > 0 ? (
                  creator.niches.map((n) => (
                    <span
                      key={n}
                      className="text-xs px-3 py-1 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-300 font-medium"
                    >
                      {n}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">No niches specified</span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Skills & Disciplines</h3>
              <div className="flex flex-wrap gap-2">
                {creator.skills && creator.skills.length > 0 ? (
                  creator.skills.map((s) => (
                    <span
                      key={s}
                      className="text-xs px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-medium"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">No skills specified</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Portfolio + Verified Client Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* Portfolio Showcase */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Verified Portfolio Gallery</h2>
                <p className="text-xs text-slate-400">Authentic deliverables and creative artifacts from past campaigns</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-bold text-brand-400">
                {creator.portfolio ? creator.portfolio.length : 0} Items
              </span>
            </div>

            {creator.portfolio && creator.portfolio.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {creator.portfolio.map((item, index) => (
                  <div
                    key={item._id || index}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-brand-500/40 transition space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-brand-300">
                          {item.mediaType}
                        </span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-white transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                      )}
                    </div>

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2">
                <Briefcase className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No public portfolio items uploaded yet.</p>
              </div>
            )}
          </div>

          {/* Verified Client Reviews */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Verified Brand Reviews
                </h2>
                <p className="text-xs text-slate-400">Only brands from completed collaborations can post verified feedback</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold text-xs">
                <Star className="w-3.5 h-3.5 fill-yellow-400" />
                <span>{creator.rating > 0 ? creator.rating.toFixed(1) : '5.0'} / 5.0</span>
              </div>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? 'fill-yellow-400' : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-white">{rev.rating}.0</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      "{rev.reviewText}"
                    </p>

                    {(rev.communicationRating || rev.qualityRating || rev.timelinessRating) && (
                      <div className="flex flex-wrap gap-3 pt-2 text-[10px] text-slate-400 border-t border-slate-900">
                        {rev.communicationRating && (
                          <span>Communication: <strong className="text-white">{rev.communicationRating}/5</strong></span>
                        )}
                        {rev.qualityRating && (
                          <span>Quality: <strong className="text-white">{rev.qualityRating}/5</strong></span>
                        )}
                        {rev.timelinessRating && (
                          <span>Timeliness: <strong className="text-white">{rev.timelinessRating}/5</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 px-4 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2">
                <Star className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No client reviews submitted yet for completed collaborations.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Brand Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Invite {creator.displayName}</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Select one of your active campaigns to invite this creator to apply directly.
            </p>

            {campaignsLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading your campaigns...</div>
            ) : brandCampaigns.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {brandCampaigns.map((camp) => (
                  <Link
                    key={camp._id}
                    to={`/campaigns/${camp._id}`}
                    className="block p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-brand-500/50 transition group"
                  >
                    <div className="text-xs font-bold text-white group-hover:text-brand-300 transition">
                      {camp.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Budget: ${camp.budget.min} - ${camp.budget.max} {camp.budget.currency}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-400">You don't have any published campaigns yet.</p>
                <Link
                  to="/campaigns/new"
                  className="inline-block text-xs text-brand-400 hover:text-brand-300 font-semibold"
                >
                  Create a New Campaign Brief &rarr;
                </Link>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
