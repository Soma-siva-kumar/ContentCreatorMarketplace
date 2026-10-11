import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  CheckCircle, 
  Clock, 
  UploadCloud, 
  FileCheck, 
  Star, 
  ArrowLeft, 
  ShieldCheck, 
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { 
  CollaborationData, 
  BrandProfileData, 
  CreatorProfileData, 
  ReviewData 
} from '../types';

export const CollaborationsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // If no ID is present, we show the list of all user's collaborations
  const [collabList, setCollabList] = useState<CollaborationData[]>([]);
  const [listLoading, setListLoading] = useState<boolean>(!id);

  // If ID is present, we show the workspace for this specific collaboration
  const [collab, setCollab] = useState<CollaborationData | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfileData | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfileData | null>(null);
  const [isBrand, setIsBrand] = useState<boolean>(false);
  const [isCreator, setIsCreator] = useState<boolean>(false);
  const [hasReviewed, setHasReviewed] = useState<boolean>(false);
  const [existingReview, setExistingReview] = useState<ReviewData | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState<boolean>(Boolean(id));
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  const handleOpenMessages = async () => {
    if (!collab) return;
    const targetUserId = isCreator ? collab.brandId._id : collab.creatorId._id;
    try {
      const res = await api.getOrCreateConversation({
        targetUserId,
        collaborationId: collab._id,
      });
      if (res.success) {
        navigate(`/messages?conversationId=${res.conversation._id}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to open messages.');
    }
  };

  // Deliverable Submission Form State (Creator)
  const [activeMilestoneId, setActiveMilestoneId] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [caption, setCaption] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingDeliverable, setSubmittingDeliverable] = useState(false);

  // Deliverable Review State (Brand)
  const [reviewMilestoneId, setReviewMilestoneId] = useState<string | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [reviewingAction, setReviewingAction] = useState<string | null>(null);

  // Review Form State (Brand after completion)
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState('');
  const [commRating, setCommRating] = useState<number>(5);
  const [qualityRating, setQualityRating] = useState<number>(5);
  const [timelinessRating, setTimelinessRating] = useState<number>(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Load List
  useEffect(() => {
    if (!id) {
      setListLoading(true);
      api.getMyCollaborations()
        .then((res) => {
          if (res.success) setCollabList(res.collaborations);
        })
        .catch(() => {})
        .finally(() => setListLoading(false));
    }
  }, [id]);

  // Load Single Workspace
  const fetchWorkspace = useCallback(async () => {
    if (!id) return;
    setWorkspaceLoading(true);
    setWorkspaceError(null);
    try {
      const res = await api.getCollaborationById(id);
      if (res.success) {
        setCollab(res.collaboration);
        if (res.brandProfile) setBrandProfile(res.brandProfile);
        if (res.creatorProfile) setCreatorProfile(res.creatorProfile);
        setIsBrand(res.isBrand);
        setIsCreator(res.isCreator);
        setHasReviewed(res.hasReviewed);
        setExistingReview(res.review || null);
      }
    } catch (err: any) {
      setWorkspaceError(err.message || 'Failed to load collaboration workspace.');
    } finally {
      setWorkspaceLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchWorkspace();
    }
  }, [id, fetchWorkspace]);

  // Submit deliverable handler
  const handleSubmitDeliverable = async (milestoneId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !fileUrl.trim()) {
      alert('Please provide a valid deliverable file or preview URL.');
      return;
    }

    setSubmittingDeliverable(true);
    try {
      const res = await api.submitMilestoneDeliverable(id, milestoneId, {
        fileUrl: fileUrl.trim(),
        fileName: fileName.trim() || 'Deliverable Submission',
        caption: caption.trim(),
        notes: notes.trim(),
      });

      if (res.success) {
        setCollab(res.collaboration);
        setActiveMilestoneId(null);
        setFileUrl('');
        setFileName('');
        setCaption('');
        setNotes('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit milestone deliverable.');
    } finally {
      setSubmittingDeliverable(false);
    }
  };

  // Review deliverable handler (Brand)
  const handleReviewDeliverable = async (
    milestoneId: string,
    action: 'approve' | 'request_revision'
  ) => {
    if (!id) return;
    if (action === 'request_revision' && !revisionNotes.trim()) {
      alert('Please provide specific revision instructions.');
      return;
    }

    setReviewingAction(`${milestoneId}-${action}`);
    try {
      const res = await api.reviewMilestoneDeliverable(id, milestoneId, {
        action,
        revisionNotes: action === 'request_revision' ? revisionNotes.trim() : undefined,
      });

      if (res.success) {
        setCollab(res.collaboration);
        setReviewMilestoneId(null);
        setRevisionNotes('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to review deliverable.');
    } finally {
      setReviewingAction(null);
    }
  };

  // Submit verified review handler (Brand)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !reviewText.trim()) {
      alert('Please enter your written review feedback.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await api.submitReview(id, {
        rating,
        reviewText: reviewText.trim(),
        communicationRating: commRating,
        qualityRating,
        timelinessRating,
      });

      if (res.success) {
        setHasReviewed(true);
        setExistingReview(res.review);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // VIEW 1: COLLABORATIONS DIRECTORY / LIST
  if (!id) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
                <Briefcase className="w-3.5 h-3.5" />
                Collaboration Hub
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Active & Completed Collaborations
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Manage deliverables, milestone approvals, and contract completions.
              </p>
            </div>
          </div>
        </div>

        {listLoading ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 text-xs font-semibold">Loading your collaborations...</p>
          </div>
        ) : collabList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {collabList.map((c) => {
              const approvedCount = c.milestones?.filter((m) => m.status === 'approved').length || 0;
              const totalMilestones = c.milestones?.length || 1;

              return (
                <div
                  key={c._id}
                  className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 transition flex flex-col justify-between shadow-lg space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        c.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : c.status === 'active'
                          ? 'bg-indigo-500/20 text-indigo-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {c.status}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        ${c.totalAmount} {c.currency}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white line-clamp-1">
                      {c.campaignId?.title || 'Creative Campaign'}
                    </h3>

                    <div className="space-y-1 text-xs text-slate-400">
                      <div>
                        Progress: <strong className="text-white">{approvedCount} / {totalMilestones}</strong> Milestones Approved
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-brand-500 h-full rounded-full transition-all"
                          style={{ width: `${(approvedCount / totalMilestones) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/collaborations/${c._id}`}
                    className="w-full py-2.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 font-bold text-xs rounded-xl text-center transition"
                  >
                    Open Workspace &rarr;
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900/30 border border-slate-800 rounded-3xl space-y-4">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No active collaborations</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Collaborations are automatically created once a Brand accepts a Creator's campaign proposal.
            </p>
            <Link
              to="/campaigns"
              className="inline-block px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition"
            >
              Browse Campaigns
            </Link>
          </div>
        )}
      </div>
    );
  }

  // VIEW 2: SINGLE COLLABORATION WORKSPACE
  if (workspaceLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-xs font-semibold">Opening collaboration workspace...</p>
      </div>
    );
  }

  if (workspaceError || !collab) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="p-8 bg-rose-500/10 border border-rose-500/30 rounded-3xl text-rose-300">
          <h2 className="text-xl font-bold mb-2">Access Forbidden or Workspace Not Found</h2>
          <p className="text-sm">{workspaceError || 'You do not have permission to view this collaboration.'}</p>
        </div>
        <Link to="/collaborations" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-bold">
          <ArrowLeft className="w-4 h-4" /> Back to Collaborations
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Back Link */}
      <Link
        to="/collaborations"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to All Collaborations
      </Link>

      {/* Workspace Header */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-8 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              collab.status === 'completed'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
            }`}>
              {collab.status}
            </span>
            <span className="text-xs text-slate-400">Collaboration Workspace</span>
          </div>

          <div className="text-sm font-bold text-emerald-400 font-mono bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800">
            Total Compensation: ${collab.totalAmount} {collab.currency}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          {collab.campaignId?.title || 'Creative Campaign Workspace'}
        </h1>

        {/* Counterpart info */}
        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-800/80 text-xs">
          {isCreator && brandProfile && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Client Brand:</span>
              <strong className="text-white">{brandProfile.companyName}</strong>
              {brandProfile.isVerified && <CheckCircle className="w-3.5 h-3.5 text-sky-400" />}
            </div>
          )}

          {isBrand && creatorProfile && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Assigned Creator:</span>
              <strong className="text-white">{creatorProfile.displayName}</strong>
              <span className="text-amber-400 font-mono font-bold">Craft: {creatorProfile.craftScore || 85}/100</span>
            </div>
          )}

          <button
            onClick={handleOpenMessages}
            className="ml-auto px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-sky-400 hover:text-sky-300 hover:border-slate-700 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Open direct messages with counterpart"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Direct Chat</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout: Milestones Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Milestones and Submissions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Milestones & Deliverables Tracker</h2>
                <p className="text-xs text-slate-400">Track progress, submit media assets, and approve milestones</p>
              </div>
              <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs font-bold text-indigo-400">
                {collab.milestones.filter((m) => m.status === 'approved').length} / {collab.milestones.length} Approved
              </span>
            </div>

            <div className="space-y-6">
              {collab.milestones.map((m, index) => {
                const isCurrentActive = activeMilestoneId === m._id;
                const isCurrentReview = reviewMilestoneId === m._id;

                const statusBadges: Record<string, { label: string; color: string }> = {
                  pending: { label: 'Pending Submission', color: 'bg-slate-800 text-slate-400' },
                  submitted: { label: 'In Brand Review', color: 'bg-sky-500/20 text-sky-400 border border-sky-500/30' },
                  revision_requested: { label: 'Revision Requested', color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
                  approved: { label: 'Milestone Approved', color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
                };

                const currentBadge = statusBadges[m.status] || statusBadges.pending;

                return (
                  <div
                    key={m._id || index}
                    className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            Milestone #{index + 1}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${currentBadge.color}`}>
                            {currentBadge.label}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white">{m.title}</h3>
                        {m.description && (
                          <p className="text-xs text-slate-400 mt-0.5">{m.description}</p>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-emerald-400">
                          ${m.amount} {collab.currency}
                        </div>
                        {m.dueDate && (
                          <div className="text-[10px] text-slate-500">
                            Due: {new Date(m.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Revision notes if any */}
                    {m.status === 'revision_requested' && m.revisionNotes && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                        <strong className="block text-[10px] uppercase font-bold text-amber-400">Client Feedback:</strong>
                        <p>{m.revisionNotes}</p>
                      </div>
                    )}

                    {/* Submitted deliverable details if present */}
                    {m.deliverable && (
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-300">Submitted Asset:</span>
                          <a
                            href={m.deliverable.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <span>Open Asset</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        {m.deliverable.caption && (
                          <p className="text-xs text-slate-300 italic">"{m.deliverable.caption}"</p>
                        )}
                        {m.deliverable.notes && (
                          <p className="text-[11px] text-slate-400">{m.deliverable.notes}</p>
                        )}
                      </div>
                    )}

                    {/* CREATOR ACTION: Submit Deliverable Form Toggle */}
                    {isCreator && (m.status === 'pending' || m.status === 'revision_requested') && (
                      <div className="pt-2">
                        {!isCurrentActive ? (
                          <button
                            onClick={() => setActiveMilestoneId(m._id)}
                            className="px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                          >
                            <UploadCloud className="w-4 h-4" />
                            {m.status === 'revision_requested' ? 'Submit Revised Deliverable' : 'Submit Deliverable'}
                          </button>
                        ) : (
                          <form onSubmit={(e) => handleSubmitDeliverable(m._id, e)} className="space-y-3 p-4 rounded-xl bg-slate-900 border border-brand-500/40">
                            <h4 className="text-xs font-bold text-white uppercase">Deliverable Asset Submission</h4>
                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-300">File / Cloud Asset URL *</label>
                              <input
                                type="url"
                                placeholder="https://drive.google.com/... or https://dropbox.com/..."
                                value={fileUrl}
                                onChange={(e) => setFileUrl(e.target.value)}
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[11px] text-slate-300">File Name</label>
                                <input
                                  type="text"
                                  placeholder="e.g. final-cut-4k.mp4"
                                  value={fileName}
                                  onChange={(e) => setFileName(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] text-slate-300">Caption / Heading</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Version 2 with audio remaster"
                                  value={caption}
                                  onChange={(e) => setCaption(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-300">Submission Notes</label>
                              <textarea
                                rows={2}
                                placeholder="Any details on AI tool settings, aspect ratio, or render specifics..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                              <button
                                type="submit"
                                disabled={submittingDeliverable}
                                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                              >
                                {submittingDeliverable ? 'Uploading...' : 'Send to Brand for Review'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveMilestoneId(null)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}

                    {/* BRAND ACTION: Review Milestone (Approve vs Request Revision) */}
                    {isBrand && m.status === 'submitted' && (
                      <div className="pt-2 border-t border-slate-900 space-y-3">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={Boolean(reviewingAction)}
                            onClick={() => handleReviewDeliverable(m._id, 'approve')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                          >
                            <FileCheck className="w-4 h-4" />
                            Approve Milestone Deliverable
                          </button>
                          <button
                            onClick={() => setReviewMilestoneId(isCurrentReview ? null : m._id)}
                            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl transition"
                          >
                            Request Revision
                          </button>
                        </div>

                        {isCurrentReview && (
                          <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 space-y-3">
                            <label className="text-xs font-bold text-amber-300 uppercase block">Revision Feedback</label>
                            <textarea
                              rows={3}
                              placeholder="Describe exact adjustments requested (e.g. pace change, subtitle adjustments, color tweak)..."
                              value={revisionNotes}
                              onChange={(e) => setRevisionNotes(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                disabled={Boolean(reviewingAction)}
                                onClick={() => handleReviewDeliverable(m._id, 'request_revision')}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition"
                              >
                                Submit Revision Request
                              </button>
                              <button
                                onClick={() => setReviewMilestoneId(null)}
                                className="px-3 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Verified Review Section (Brand Review Post-Completion) */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified Client Evaluation
              </h3>
              <p className="text-xs text-slate-400">
                Official reputation feedback recorded permanently in MongoDB upon collaboration completion.
              </p>
            </div>

            {/* If completed and review exists */}
            {hasReviewed && existingReview ? (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Review Submitted
                  </span>
                  <div className="flex items-center gap-1 text-yellow-400 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-yellow-400" />
                    <span>{existingReview.rating}.0</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 italic leading-relaxed">
                  "{existingReview.reviewText}"
                </p>

                <div className="pt-2 border-t border-slate-900 text-[10px] text-slate-500">
                  Recorded on {new Date(existingReview.createdAt).toLocaleDateString()}
                </div>
              </div>
            ) : isBrand && collab.status === 'completed' && !hasReviewed ? (
              /* Review submission form for brand */
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Overall Rating (1 - 5 Stars) *</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-white ml-2">{rating}.0 / 5.0</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Communication</label>
                    <select
                      value={commRating}
                      onChange={(e) => setCommRating(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>{n} Stars</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Quality</label>
                    <select
                      value={qualityRating}
                      onChange={(e) => setQualityRating(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>{n} Stars</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Timeliness</label>
                    <select
                      value={timelinessRating}
                      onChange={(e) => setTimelinessRating(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>{n} Stars</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Written Client Testimonial *</label>
                  <textarea
                    rows={4}
                    placeholder="Describe your collaboration experience, creative craft, and result..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {submittingReview ? 'Submitting Review...' : 'Publish Verified Review'}
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                <Clock className="w-6 h-6 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">
                  {collab.status !== 'completed'
                    ? 'Review evaluation unlocks automatically once all milestone deliverables are approved.'
                    : 'Awaiting client review submission.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
