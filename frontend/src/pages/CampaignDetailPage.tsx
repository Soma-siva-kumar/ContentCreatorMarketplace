import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle, 
  Send, 
  Edit,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { CampaignData, ApplicationData, BrandProfileData } from '../types';

export const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // If brand owner: applicant proposals
  const [applicants, setApplicants] = useState<ApplicationData[]>([]);

  const handleMessageUser = async (targetUserId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.getOrCreateConversation({ targetUserId });
      if (res.success) {
        navigate(`/messages?conversationId=${res.conversation._id}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to open conversation.');
    }
  };
  const [applicantsLoading, setApplicantsLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // If creator: application state
  const [myApplication, setMyApplication] = useState<ApplicationData | null>(null);
  const [pitch, setPitch] = useState('');
  const [proposedRate, setProposedRate] = useState<number | ''>('');
  const [estimatedDays, setEstimatedDays] = useState<number | ''>(7);
  const [milestonesProposal, setMilestonesProposal] = useState('');
  const [portfolioSamples, setPortfolioSamples] = useState('');
  const [submittingProposal, setSubmittingProposal] = useState(false);

  const fetchCampaign = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCampaignById(id);
      if (res.success && res.campaign) {
        setCampaign(res.campaign);
        if (res.brandProfile) setBrandProfile(res.brandProfile);

        // Pre-fill proposed rate with campaign minimum budget
        if (res.campaign.budget?.min) {
          setProposedRate(res.campaign.budget.min);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load campaign.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  // Check if owning brand or check creator's existing application
  useEffect(() => {
    if (!id || !user || !campaign) return;

    const brandUserId = typeof campaign.brandId === 'object' && campaign.brandId !== null
      ? (campaign.brandId as any)._id
      : campaign.brandId;

    const isOwner = brandUserId === user.id;

    if (isOwner) {
      setApplicantsLoading(true);
      api.getCampaignApplications(id)
        .then((res) => {
          if (res.success) setApplicants(res.applications);
        })
        .catch(() => {})
        .finally(() => setApplicantsLoading(false));
    } else if (user.role === 'creator') {
      api.getMyApplications()
        .then((res) => {
          if (res.success && res.applications) {
            const found = res.applications.find((app) => {
              const campId = typeof app.campaignId === 'object' ? (app.campaignId as any)._id : app.campaignId;
              return campId === id;
            });
            if (found) {
              setMyApplication(found);
            }
          }
        })
        .catch(() => {});
    }
  }, [id, user, campaign]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!pitch.trim() || pitch.length < 20) {
      alert('Please provide a pitch of at least 20 characters explaining your vision and suitability.');
      return;
    }
    if (!proposedRate || Number(proposedRate) <= 0) {
      alert('Please provide a valid proposed rate.');
      return;
    }

    setSubmittingProposal(true);
    try {
      const samples = portfolioSamples
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.applyToCampaign(id, {
        pitch: pitch.trim(),
        proposedRate: Number(proposedRate),
        estimatedDays: Number(estimatedDays) || 7,
        milestonesProposal: milestonesProposal.trim(),
        portfolioSamples: samples,
      });

      if (res.success) {
        setMyApplication(res.application);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit proposal.');
    } finally {
      setSubmittingProposal(false);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, newStatus: 'shortlisted' | 'accepted' | 'rejected') => {
    setActionLoading(applicationId);
    try {
      const res = await api.updateApplicationStatus(applicationId, { status: newStatus });
      if (res.success) {
        // Refresh applicants
        setApplicants((prev) =>
          prev.map((a) => (a._id === applicationId ? res.application : a))
        );

        if (newStatus === 'accepted' && res.collaboration) {
          navigate(`/collaborations/${res.collaboration._id}`);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update application status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (targetStatus: string) => {
    if (!id) return;
    try {
      const res = await api.updateCampaignStatus(id, targetStatus);
      if (res.success) {
        setCampaign(res.campaign);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update campaign status.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-xs font-semibold">Loading campaign brief...</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="p-8 bg-rose-500/10 border border-rose-500/30 rounded-3xl text-rose-300">
          <h2 className="text-xl font-bold mb-2">Campaign Unavailable</h2>
          <p className="text-sm">{error || 'This campaign may be in draft mode or no longer exists.'}</p>
        </div>
        <Link to="/campaigns" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-bold">
          <ArrowLeft className="w-4 h-4" /> Back to Campaigns
        </Link>
      </div>
    );
  }

  const brandUserId = typeof campaign.brandId === 'object' && campaign.brandId !== null
    ? (campaign.brandId as any)._id
    : campaign.brandId;
  const isOwner = user?.id === brandUserId;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/campaigns"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Link>

        {isOwner && (
          <div className="flex items-center gap-2">
            <Link
              to={`/campaigns/${campaign._id}/edit`}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit Brief
            </Link>
          </div>
        )}
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-bold uppercase tracking-wider">
                {campaign.category}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                campaign.status === 'published'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : campaign.status === 'draft'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {campaign.status}
              </span>
            </div>

            {brandProfile && (
              <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/60 border border-slate-800/80 px-3 py-1.5 rounded-xl">
                <span className="text-slate-400">Client:</span>
                <strong className="text-white">{brandProfile.companyName}</strong>
                {brandProfile.isVerified && <CheckCircle className="w-3.5 h-3.5 text-sky-400" />}
                {!isOwner && (
                  <button
                    onClick={() => {
                      const brandUid =
                        typeof campaign.brandId === 'object' && campaign.brandId !== null
                          ? campaign.brandId._id
                          : (campaign.brandId as string);
                      handleMessageUser(brandUid);
                    }}
                    className="ml-1 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px]"
                    title="Message Client Brand"
                  >
                    <MessageSquare className="w-3 h-3 text-sky-400" />
                    <span>Chat</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {campaign.title}
          </h1>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Compensation Budget</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">
                ${campaign.budget.min} - ${campaign.budget.max} {campaign.budget.currency}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Deliverables</div>
              <div className="text-sm font-bold text-white font-mono">
                {campaign.deliverables ? campaign.deliverables.length : 1} Specified
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Applicants</div>
              <div className="text-sm font-bold text-white font-mono">
                {campaign.applicationsCount || 0} Proposals
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Application Deadline</div>
              <div className="text-sm font-bold text-slate-200">
                {campaign.applicationDeadline
                  ? new Date(campaign.applicationDeadline).toLocaleDateString()
                  : 'Open rolling'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Brief & Specs + Application/Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Full Campaign Brief & Deliverables */}
        <div className="lg:col-span-2 space-y-6">
          {/* Brief Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Creative Brief & Objectives
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {campaign.description}
            </p>

            {campaign.targetAudience && (
              <div className="pt-4 border-t border-slate-800 space-y-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Audience</h3>
                <p className="text-xs text-slate-300">{campaign.targetAudience}</p>
              </div>
            )}

            {campaign.brandGuidelines && (
              <div className="pt-4 border-t border-slate-800 space-y-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brand Guidelines & Rules</h3>
                <p className="text-xs text-slate-300">{campaign.brandGuidelines}</p>
              </div>
            )}
          </div>

          {/* Deliverables Breakdown */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Deliverables & Technical Requirements
            </h2>

            {campaign.deliverables && campaign.deliverables.length > 0 ? (
              <div className="space-y-3">
                {campaign.deliverables.map((del, i) => (
                  <div
                    key={del._id || i}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{del.title}</h4>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-brand-300">
                        {del.format}
                      </span>
                    </div>
                    {del.guidelines && (
                      <p className="text-xs text-slate-400">{del.guidelines}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Standard single campaign deliverable package.</p>
            )}
          </div>

          {/* Required Skills & Tools */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Required Disciplines</h2>
            <div className="flex flex-wrap gap-2">
              {campaign.requiredSkills?.map((s) => (
                <span
                  key={s}
                  className="text-xs px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-medium"
                >
                  {s}
                </span>
              ))}
              {campaign.requiredTools?.map((t) => (
                <span
                  key={t}
                  className="text-xs px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Action (Creator Apply vs Brand Manager) */}
        <div className="space-y-6">
          {/* SCENARIO A: BRAND OWNER CAMPAIGN MANAGER */}
          {isOwner && (
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Brand Campaign Controls</h3>
                <p className="text-xs text-slate-400">Manage campaign visibility and status</p>
              </div>

              <div className="flex flex-col gap-2">
                {campaign.status === 'draft' && (
                  <button
                    onClick={() => handleStatusChange('published')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
                  >
                    Publish Campaign Brief
                  </button>
                )}
                {campaign.status === 'published' && (
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
                  >
                    Close / Archive Campaign
                  </button>
                )}
              </div>

              {/* Applicants List */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Applicant Proposals ({applicants.length})
                  </h4>
                </div>

                {applicantsLoading ? (
                  <div className="py-6 text-center text-xs text-slate-400">Loading proposals...</div>
                ) : applicants.length > 0 ? (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {applicants.map((app) => (
                      <div
                        key={app._id}
                        className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              {app.creatorProfile?.displayName || 'Creator'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const creatorUid =
                                  typeof app.creatorId === 'object' && app.creatorId !== null
                                    ? app.creatorId._id
                                    : (app.creatorId as string);
                                handleMessageUser(creatorUid);
                              }}
                              className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-sky-400 hover:border-slate-700 transition"
                              title="Direct message creator"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </button>
                          </div>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            app.status === 'accepted'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : app.status === 'shortlisted'
                              ? 'bg-amber-500/20 text-amber-400'
                              : app.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-sky-500/20 text-sky-400'
                          }`}>
                            {app.status}
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl italic">
                          "{app.pitch}"
                        </div>

                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <span>Rate: <strong className="text-emerald-400">${app.proposedRate}</strong></span>
                          <span>Timeline: {app.estimatedDays} days</span>
                        </div>

                        {app.portfolioSamples && app.portfolioSamples.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Samples:</span>
                            {app.portfolioSamples.map((s, idx) => (
                              <a
                                key={idx}
                                href={s}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs text-sky-400 hover:underline truncate"
                              >
                                {s}
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Status Action Buttons */}
                        {app.status !== 'accepted' && (
                          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-900">
                            <button
                              disabled={actionLoading === app._id || app.status === 'shortlisted'}
                              onClick={() => handleUpdateApplicationStatus(app._id, 'shortlisted')}
                              className="py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-[10px] rounded-lg transition"
                            >
                              Shortlist
                            </button>
                            <button
                              disabled={actionLoading === app._id || app.status === 'rejected'}
                              onClick={() => handleUpdateApplicationStatus(app._id, 'rejected')}
                              className="py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-[10px] rounded-lg transition"
                            >
                              Reject
                            </button>
                            <button
                              disabled={actionLoading === app._id}
                              onClick={() => handleUpdateApplicationStatus(app._id, 'accepted')}
                              className="py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg transition shadow-md"
                            >
                              Accept & Start
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">No proposals submitted yet.</p>
                )}
              </div>
            </div>
          )}

          {/* SCENARIO B: CREATOR PROPOSAL SUBMISSION */}
          {!isOwner && user?.role === 'creator' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Send className="w-4 h-4 text-brand-400" />
                  Submit Campaign Proposal
                </h3>
                <p className="text-xs text-slate-400">
                  Present your pitch, compensation rate, and turnaround schedule.
                </p>
              </div>

              {/* Already submitted proposal card */}
              {myApplication ? (
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Your Proposal Status</span>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      myApplication.status === 'accepted'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : myApplication.status === 'shortlisted'
                        ? 'bg-amber-500/20 text-amber-400'
                        : myApplication.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-sky-500/20 text-sky-400'
                    }`}>
                      {myApplication.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 leading-relaxed italic bg-slate-900/50 p-3 rounded-xl">
                    "{myApplication.pitch}"
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-300 pt-2 border-t border-slate-900">
                    <span>Proposed Rate: <strong className="text-emerald-400">${myApplication.proposedRate}</strong></span>
                    <span>Turnaround: {myApplication.estimatedDays} days</span>
                  </div>

                  {myApplication.status === 'accepted' && (
                    <Link
                      to="/collaborations"
                      className="block w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl text-center shadow-lg transition"
                    >
                      Open Collaboration Workspace &rarr;
                    </Link>
                  )}
                </div>
              ) : campaign.status !== 'published' ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  This campaign is currently {campaign.status} and not accepting new proposals.
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Your Creative Pitch *</label>
                    <textarea
                      rows={4}
                      placeholder="Explain your concept, AI tool pipeline, and why your style fits this campaign..."
                      value={pitch}
                      onChange={(e) => setPitch(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Proposed Rate ($) *</label>
                      <input
                        type="number"
                        placeholder="e.g. 1200"
                        value={proposedRate}
                        onChange={(e) => setProposedRate(e.target.value ? Number(e.target.value) : '')}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Days to Deliver *</label>
                      <input
                        type="number"
                        placeholder="e.g. 7"
                        value={estimatedDays}
                        onChange={(e) => setEstimatedDays(e.target.value ? Number(e.target.value) : '')}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Milestone Outline (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Day 2: Storyboard & Prompts; Day 5: Draft Video; Day 7: Final Polish"
                      value={milestonesProposal}
                      onChange={(e) => setMilestonesProposal(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Relevant Portfolio URLs (one per line)</label>
                    <textarea
                      rows={2}
                      placeholder="https://vimeo.com/... or https://youtube.com/..."
                      value={portfolioSamples}
                      onChange={(e) => setPortfolioSamples(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingProposal}
                    className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-600/30 transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {submittingProposal ? 'Submitting...' : 'Send Proposal to Brand'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* SCENARIO C: GUEST / UNAUTHENTICATED VISITOR */}
          {!isAuthenticated && (
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
              <Sparkles className="w-8 h-8 text-brand-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">Interested in Applying?</h3>
              <p className="text-xs text-slate-400">
                Sign in with your Creator account or register today to submit verified proposals for funded brand campaigns.
              </p>
              <Link
                to="/register"
                className="inline-block px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Join Marketplace
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
