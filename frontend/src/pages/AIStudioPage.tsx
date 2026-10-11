import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Zap,
  Copy,
  Check,
  Download,
  Bookmark,
  BookmarkCheck,
  History,
  RotateCcw,
  Minimize2,
  Maximize2,
  FileText,
  Calendar,
  Video,
  Image as ImageIcon,
  Layers,
  Search,
  Trash2,
  ShieldAlert,
  Sliders,
  X,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  AIContentType,
  AIPlatform,
  AIProviderStatus,
  AIUsageStats,
  GeneratedResult,
  ContentDraftData,
  CampaignData,
} from '../types';

export const AIStudioPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // State: AI Provider & Usage
  const [providerStatus, setProviderStatus] = useState<AIProviderStatus | null>(null);
  const [usageStats, setUsageStats] = useState<AIUsageStats | null>(null);

  // State: Generator Input Form
  const [contentType, setContentType] = useState<AIContentType>('idea');
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState<AIPlatform>('instagram');
  const [tone, setTone] = useState('authentic');
  const [brandVoice, setBrandVoice] = useState('creator-native');
  const [targetAudience, setTargetAudience] = useState('');
  const [language, setLanguage] = useState('English');
  const [brandGuidelines, setBrandGuidelines] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('');

  // State: Output & Editor
  const [generating, setGenerating] = useState(false);
  const [transforming, setTransforming] = useState(false);
  const [currentResult, setCurrentResult] = useState<GeneratedResult | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // State: Drafts & Revisions
  const [drafts, setDrafts] = useState<ContentDraftData[]>([]);
  const [activeDraft, setActiveDraft] = useState<ContentDraftData | null>(null);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [draftSearchQuery, setDraftSearchQuery] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'drafts' | 'revisions'>('drafts');
  const [savingDraft, setSavingDraft] = useState(false);

  // State: Campaign Import Modal
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [myCampaigns, setMyCampaigns] = useState<CampaignData[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // 1. Fetch AI Status & Usage
  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.getAIStatus();
      if (res.success) {
        setProviderStatus(res.status);
        setUsageStats(res.usage);
      }
    } catch {
      // Ignore
    }
  }, []);

  // 2. Fetch User's Saved Drafts
  const fetchDrafts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingDrafts(true);
      const res = await api.getAIDrafts({ limit: 50 });
      if (res.success) {
        setDrafts(res.drafts);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingDrafts(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchStatus();
    fetchDrafts();
  }, [fetchStatus, fetchDrafts]);

  // Load user campaigns for import
  const handleOpenCampaignModal = async () => {
    setShowCampaignModal(true);
    try {
      setLoadingCampaigns(true);
      const res = await api.getBrandCampaigns();
      if (res.success) {
        setMyCampaigns(res.campaigns);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleSelectCampaign = (c: CampaignData) => {
    setCampaignTitle(c.title);
    setBrandGuidelines(c.brandGuidelines || '');
    if (c.targetAudience) setTargetAudience(c.targetAudience);
    setShowCampaignModal(false);
    showNotice(`Imported brief guidelines from "${c.title}"`);
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // 3. Generate Action
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) {
      showNotice('Please enter a creative topic or brief description.');
      return;
    }

    setGenerating(true);
    try {
      const res = await api.generateAIContent({
        contentType,
        prompt: prompt.trim(),
        platform,
        tone,
        brandVoice: brandVoice.trim(),
        targetAudience: targetAudience.trim(),
        language,
        campaignTitle: campaignTitle.trim(),
        brandGuidelines: brandGuidelines.trim(),
      });

      if (res.success) {
        setCurrentResult(res.result);
        setEditorContent(res.result.content);
        setActiveDraft(null); // Fresh generation
        fetchStatus();
        showNotice('Content generated successfully!');
      }
    } catch (err: any) {
      showNotice(err.message || 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  // 4. Transformation Actions (Shorten, Expand, Regenerate)
  const handleTransform = async (action: 'shorten' | 'expand' | 'regenerate') => {
    if (!editorContent.trim()) return;

    if (action === 'regenerate') {
      handleGenerate();
      return;
    }

    setTransforming(true);
    try {
      const res = await api.transformAIContent({
        content: editorContent,
        action,
        platform,
      });

      if (res.success) {
        setEditorContent(res.transformed.content);
        showNotice(action === 'shorten' ? 'Shortened content.' : 'Expanded content with key details.');

        // If an active draft is being edited, record the revision
        if (activeDraft) {
          await api.saveAIDraft({
            draftId: activeDraft._id,
            currentContent: res.transformed.content,
            revisionAction: action,
            revisionNote: action === 'shorten' ? 'Condense length' : 'Elaborate depth',
          });
          // Refresh active draft
          const refreshed = await api.getAIDraftById(activeDraft._id);
          if (refreshed.success) setActiveDraft(refreshed.draft);
        }
      }
    } catch (err: any) {
      showNotice(err.message || 'Transformation failed.');
    } finally {
      setTransforming(false);
    }
  };

  // 5. Copy to Clipboard
  const handleCopy = () => {
    if (!editorContent) return;
    navigator.clipboard.writeText(editorContent);
    setCopied(true);
    showNotice('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // 6. Export Options
  const handleExport = (format: 'markdown' | 'txt' | 'json') => {
    if (!editorContent) return;
    let fileContent = editorContent;
    let mimeType = 'text/plain';
    let ext = 'txt';

    if (format === 'markdown') {
      mimeType = 'text/markdown';
      ext = 'md';
    } else if (format === 'json') {
      mimeType = 'application/json';
      ext = 'json';
      fileContent = JSON.stringify(
        {
          title: currentResult?.title || 'Generated Content',
          contentType,
          platform,
          tone,
          content: editorContent,
          metadata: currentResult?.metadata || {},
          disclosure: currentResult?.disclosureGuidance || {},
          exportedAt: new Date().toISOString(),
        },
        null,
        2
      );
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hacxlerate_${contentType}_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice(`Exported as .${ext}`);
  };

  // 7. Save to Drafts
  const handleSaveDraft = async () => {
    if (!editorContent.trim()) return;

    setSavingDraft(true);
    try {
      const defaultTitle =
        currentResult?.title || `${contentType.toUpperCase()}: ${prompt.slice(0, 40) || 'Untitled Draft'}`;

      const res = await api.saveAIDraft({
        draftId: activeDraft?._id,
        title: defaultTitle,
        contentType,
        platform,
        tone,
        brandVoice,
        targetAudience,
        language,
        inputPrompt: prompt || 'Direct Studio Creation',
        currentContent: editorContent,
        metadata: currentResult?.metadata || {},
        revisionAction: activeDraft ? 'edit' : 'initial',
        revisionNote: activeDraft ? 'Updated draft in studio' : 'Initial save',
      });

      if (res.success) {
        setActiveDraft(res.draft);
        fetchDrafts();
        showNotice('Draft and revision saved to database!');
      }
    } catch (err: any) {
      showNotice(err.message || 'Failed to save draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  // 8. Load a Draft into the Editor
  const handleSelectDraft = async (d: ContentDraftData) => {
    try {
      const res = await api.getAIDraftById(d._id);
      if (res.success) {
        setActiveDraft(res.draft);
        setEditorContent(res.draft.currentContent);
        setContentType(res.draft.contentType);
        setPlatform(res.draft.platform);
        setPrompt(res.draft.inputPrompt || '');
        if (res.draft.tone) setTone(res.draft.tone);
        if (res.draft.brandVoice) setBrandVoice(res.draft.brandVoice);
        if (res.draft.targetAudience) setTargetAudience(res.draft.targetAudience);
        setShowDrawer(false);
        showNotice(`Loaded draft: "${res.draft.title}"`);
      }
    } catch {
      showNotice('Could not open draft.');
    }
  };

  // 9. Restore an earlier Revision
  const handleRestoreRevision = async (revContent: string, revNote?: string) => {
    setEditorContent(revContent);
    if (activeDraft) {
      await api.saveAIDraft({
        draftId: activeDraft._id,
        currentContent: revContent,
        revisionAction: 'edit',
        revisionNote: `Restored version: ${revNote || 'Previous revision'}`,
      });
      const refreshed = await api.getAIDraftById(activeDraft._id);
      if (refreshed.success) setActiveDraft(refreshed.draft);
    }
    showNotice('Restored revision version.');
  };

  // 10. Toggle Favorite Draft
  const handleToggleFavorite = async (e: React.MouseEvent, draftId: string) => {
    e.stopPropagation();
    try {
      const res = await api.toggleAIDraftFavorite(draftId);
      if (res.success) {
        setDrafts((prev) =>
          prev.map((d) => (d._id === draftId ? { ...d, isFavorite: res.isFavorite } : d))
        );
        if (activeDraft?._id === draftId) {
          setActiveDraft((prev) => (prev ? { ...prev, isFavorite: res.isFavorite } : null));
        }
      }
    } catch {
      // Ignore
    }
  };

  // 11. Delete Draft
  const handleDeleteDraft = async (e: React.MouseEvent, draftId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this saved draft?')) return;
    try {
      const res = await api.deleteAIDraft(draftId);
      if (res.success) {
        setDrafts((prev) => prev.filter((d) => d._id !== draftId));
        if (activeDraft?._id === draftId) setActiveDraft(null);
        showNotice('Draft removed.');
      }
    } catch {
      // Ignore
    }
  };

  // Content type navigation categories
  const contentTypes: Array<{ id: AIContentType; label: string; icon: React.ReactNode }> = [
    { id: 'idea', label: 'Ideas & Hooks', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
    { id: 'caption', label: 'Social Captions', icon: <FileText className="w-4 h-4 text-sky-400" /> },
    { id: 'script', label: 'Video Script', icon: <Video className="w-4 h-4 text-rose-400" /> },
    { id: 'reel_outline', label: 'Reel Storyboard', icon: <Layers className="w-4 h-4 text-purple-400" /> },
    { id: 'campaign_concept', label: 'Campaign Brief', icon: <Sliders className="w-4 h-4 text-indigo-400" /> },
    { id: 'blog_outline', label: 'Blog Outline', icon: <FileText className="w-4 h-4 text-emerald-400" /> },
    { id: 'calendar', label: 'Content Calendar', icon: <Calendar className="w-4 h-4 text-teal-400" /> },
    { id: 'headline_cta', label: 'Headlines & CTAs', icon: <Zap className="w-4 h-4 text-yellow-400" /> },
    { id: 'image_prompt', label: 'Image Prompts', icon: <ImageIcon className="w-4 h-4 text-cyan-400" /> },
  ];

  const filteredDrafts = drafts.filter((d) => {
    const q = draftSearchQuery.toLowerCase();
    return d.title.toLowerCase().includes(q) || d.inputPrompt.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Alert */}
      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-slate-900 border border-brand-500/50 rounded-2xl text-xs text-brand-300 flex items-center gap-3 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header & AI Engine Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-md shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">AI Content Studio</h1>
          </div>
          <p className="text-xs text-slate-400">
            Generate high-converting scripts, hooks, campaign concepts, and media prompts tailored to your brand voice.
          </p>
        </div>

        {/* Live Engine & Quota Status Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                providerStatus?.isLiveKeyConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300 font-medium font-mono">
              {providerStatus?.isLiveKeyConfigured ? 'Gemini 1.5 Flash' : 'Local Heuristic v1'}
            </span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              {providerStatus?.mode}
            </span>
          </div>

          {usageStats && (
            <div className="text-[11px] font-mono text-slate-400 px-3 py-1.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
              Quota: <strong className="text-emerald-400">{usageStats.minuteRemaining}</strong>/min remaining
            </div>
          )}

          {/* Drawer Trigger for Saved Drafts */}
          <button
            onClick={() => {
              setShowDrawer(true);
              fetchDrafts();
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-brand-400" />
            <span>Drafts ({drafts.length})</span>
          </button>
        </div>
      </div>

      {/* Main Studio Workspace: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Configuration & Generation Inputs (col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Content Type Selector */}
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Select Content Format</span>
              <span className="text-[10px] text-slate-500 font-mono">9 Templates</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {contentTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setContentType(t.id)}
                  className={`p-2.5 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition text-center ${
                    contentType === t.id
                      ? 'bg-brand-600/20 border-brand-500/50 text-white shadow-lg shadow-brand-500/10'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {t.icon}
                  <span className="leading-tight text-[11px]">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt & Context Form */}
          <form
            onSubmit={handleGenerate}
            className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Creative Topic / Brief *
              </label>

              <button
                type="button"
                onClick={handleOpenCampaignModal}
                className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition"
              >
                <Sliders className="w-3 h-3" />
                Import Campaign Brief
              </button>
            </div>

            <textarea
              rows={4}
              placeholder="e.g. 3 high-impact hooks and a script for showcasing our wireless noise-canceling headphones..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 leading-relaxed"
            />

            {/* Campaign Pre-fill indicators */}
            {campaignTitle && (
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                <span>
                  Linked Campaign: <strong className="text-brand-400">{campaignTitle}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCampaignTitle('');
                    setBrandGuidelines('');
                  }}
                  className="text-slate-500 hover:text-rose-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Advanced Parameter Controls */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Target Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as AIPlatform)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter / X</option>
                    <option value="blog">Blog / Article</option>
                    <option value="general">Multi-Platform</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                  >
                    <option value="authentic">Authentic & Relatable</option>
                    <option value="authoritative">Authoritative & Expert</option>
                    <option value="casual">Casual & Conversational</option>
                    <option value="humorous">Humorous & Witty</option>
                    <option value="cinematic">Cinematic & Atmospheric</option>
                    <option value="direct_response">Direct Response & Punchy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Brand Voice</label>
                  <input
                    type="text"
                    placeholder="e.g. Visionary, minimalist"
                    value={brandVoice}
                    onChange={(e) => setBrandVoice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Portuguese">Portuguese</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Japanese">Japanese</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Target Audience</label>
                <input
                  type="text"
                  placeholder="e.g. Tech professionals, Gen Z fashion enthusiasts"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Brand Guidelines / Mandatories</label>
                <textarea
                  rows={2}
                  placeholder="Mandatory keywords, hashtags, or legal exclusions..."
                  value={brandGuidelines}
                  onChange={(e) => setBrandGuidelines(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={generating || !prompt.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              <span>{generating ? 'Generating Content...' : 'Generate with Studio AI'}</span>
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Output Canvas, Transformations & Editor (col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-4">
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {currentResult ? currentResult.title : 'Studio Editor'}
                </span>
                {activeDraft && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-mono">
                    Rev {activeDraft.revisions?.length || 1}
                  </span>
                )}
              </div>

              {/* Actions: Copy, Export, Save */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!editorContent}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition flex items-center gap-1 text-xs"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">Copy</span>
                </button>

                {/* Export Dropdown */}
                <div className="relative group">
                  <button
                    type="button"
                    disabled={!editorContent}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition flex items-center gap-1 text-xs"
                    title="Export file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                  <div className="absolute right-0 mt-1 w-32 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-20 hidden group-hover:block p-1">
                    <button
                      onClick={() => handleExport('markdown')}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                    >
                      Markdown (.md)
                    </button>
                    <button
                      onClick={() => handleExport('txt')}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                    >
                      Plain Text (.txt)
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                    >
                      JSON Data (.json)
                    </button>
                  </div>
                </div>

                {/* Save to Drafts */}
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={savingDraft || !editorContent}
                  className="px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-brand-600/20"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{savingDraft ? 'Saving...' : activeDraft ? 'Update Draft' : 'Save Draft'}</span>
                </button>
              </div>
            </div>

            {/* Quick Transformation Toolbar */}
            {editorContent && (
              <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-950/80 border border-slate-800/80 rounded-2xl text-xs">
                <span className="text-[10px] text-slate-500 uppercase font-bold px-2">Refine:</span>
                <button
                  type="button"
                  disabled={transforming}
                  onClick={() => handleTransform('regenerate')}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3 h-3 text-brand-400" />
                  Regenerate
                </button>
                <button
                  type="button"
                  disabled={transforming}
                  onClick={() => handleTransform('shorten')}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1 transition"
                >
                  <Minimize2 className="w-3 h-3 text-sky-400" />
                  Shorten
                </button>
                <button
                  type="button"
                  disabled={transforming}
                  onClick={() => handleTransform('expand')}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1 transition"
                >
                  <Maximize2 className="w-3 h-3 text-emerald-400" />
                  Expand
                </button>
              </div>
            )}

            {/* Live Editor Area */}
            <div className="relative">
              {generating ? (
                <div className="h-96 flex flex-col items-center justify-center space-y-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                  <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-semibold animate-pulse">
                    Synthesizing creative draft with {providerStatus?.model || 'AI engine'}...
                  </p>
                </div>
              ) : (
                <textarea
                  rows={16}
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  placeholder="Generated creative output will appear here. You can edit, rewrite, or expand in real-time..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-mono leading-relaxed"
                />
              )}
            </div>

            {/* Metadata Showcase Cards */}
            {currentResult?.metadata && (
              <div className="space-y-3 pt-2">
                {/* 1. Viral Hooks */}
                {currentResult.metadata.hooks && currentResult.metadata.hooks.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Alternative Hooks
                    </span>
                    <div className="space-y-1.5">
                      {currentResult.metadata.hooks.map((h, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            navigator.clipboard.writeText(h);
                            showNotice('Hook copied!');
                          }}
                          className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 text-xs text-slate-300 cursor-pointer flex items-center justify-between group transition"
                        >
                          <span className="italic">{h}</span>
                          <Copy className="w-3 h-3 text-slate-500 group-hover:text-white" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Suggested Hashtags */}
                {currentResult.metadata.suggestedHashtags && currentResult.metadata.suggestedHashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {currentResult.metadata.suggestedHashtags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-sky-400 font-mono text-[11px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Synthetic Media & Disclosure Guidance Card */}
            {currentResult?.disclosureGuidance && (
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 text-indigo-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-white">
                  <ShieldAlert className="w-4 h-4 text-indigo-400" />
                  <span>Platform Synthetic Media & Disclosure Notice</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  When publishing AI-assisted creative assets, adhere to platform transparency guidelines.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {currentResult.disclosureGuidance.recommendedLabels.map((lbl, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-[10px] font-semibold"
                    >
                      {lbl}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DRAWER: Saved Drafts & Revisions (Modal / Side Drawer) */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-brand-400" />
                <h3 className="text-sm font-bold text-white">Saved Drafts & Revisions</h3>
              </div>
              <button onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs: Drafts vs Active Revisions */}
            <div className="flex border-b border-slate-800 bg-slate-950/60">
              <button
                onClick={() => setActiveDrawerTab('drafts')}
                className={`flex-1 py-2.5 text-xs font-bold transition ${
                  activeDrawerTab === 'drafts'
                    ? 'border-b-2 border-brand-500 text-white bg-slate-900/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Drafts ({drafts.length})
              </button>
              {activeDraft && (
                <button
                  onClick={() => setActiveDrawerTab('revisions')}
                  className={`flex-1 py-2.5 text-xs font-bold transition ${
                    activeDrawerTab === 'revisions'
                      ? 'border-b-2 border-brand-500 text-white bg-slate-900/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Revision History ({activeDraft.revisions?.length || 1})
                </button>
              )}
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeDrawerTab === 'drafts' ? (
                <>
                  {/* Search drafts */}
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search saved drafts..."
                      value={draftSearchQuery}
                      onChange={(e) => setDraftSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                    />
                  </div>

                  {loadingDrafts ? (
                    <div className="py-12 text-center text-xs text-slate-500">Loading drafts...</div>
                  ) : filteredDrafts.length === 0 ? (
                    <div className="py-16 text-center space-y-2">
                      <Bookmark className="w-8 h-8 text-slate-700 mx-auto" />
                      <p className="text-xs font-semibold text-slate-400">No saved drafts yet</p>
                      <p className="text-[11px] text-slate-600">
                        Generate and save content concepts to track your creative history.
                      </p>
                    </div>
                  ) : (
                    filteredDrafts.map((d) => (
                      <div
                        key={d._id}
                        onClick={() => handleSelectDraft(d)}
                        className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 cursor-pointer ${
                          activeDraft?._id === d._id
                            ? 'bg-brand-950/30 border-brand-500/50'
                            : 'bg-slate-950 border-slate-800/80 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">{d.title}</span>
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                              {d.contentType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2">{d.currentContent}</p>
                          <span className="text-[10px] text-slate-500 block">
                            {new Date(d.updatedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => handleToggleFavorite(e, d._id)}
                            className="p-1 text-slate-500 hover:text-amber-400"
                            title="Favorite"
                          >
                            {d.isFavorite ? (
                              <BookmarkCheck className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={(e) => handleDeleteDraft(e, d._id)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </>
              ) : (
                /* Revision History Timeline */
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Review and restore previous versions of <strong>{activeDraft?.title}</strong>:
                  </p>

                  {activeDraft?.revisions && activeDraft.revisions.length > 0 ? (
                    activeDraft.revisions.map((rev, idx) => (
                      <div
                        key={rev.revisionId || idx}
                        className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-brand-400" />
                            Version {idx + 1} ({rev.action})
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(rev.createdAt).toLocaleTimeString()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl line-clamp-3 font-mono">
                          {rev.content}
                        </p>

                        <button
                          type="button"
                          onClick={() => handleRestoreRevision(rev.content, rev.note)}
                          className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition text-center"
                        >
                          Restore This Version &rarr;
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-500">No revisions recorded yet.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Import Campaign Brief */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-400" />
                Select Campaign Brief to Pre-fill
              </h3>
              <button onClick={() => setShowCampaignModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select one of your existing campaigns to automatically inject audience personas and brand guidelines.
            </p>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {loadingCampaigns ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading campaigns...</div>
              ) : myCampaigns.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No published campaigns available.</div>
              ) : (
                myCampaigns.map((c) => (
                  <div
                    key={c._id}
                    onClick={() => handleSelectCampaign(c)}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-brand-500/50 cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{c.title}</h4>
                      <span className="text-[10px] text-slate-400">{c.category} &bull; ${c.budget.min} - ${c.budget.max}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
