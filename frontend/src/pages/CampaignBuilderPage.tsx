import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  ArrowLeft, 
  CheckCircle, 
  Sparkles, 
  DollarSign, 
  Layers, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { DeliverableItem, CampaignData } from '../types';

const CATEGORIES = [
  'AI Video Ad',
  'Product Launch',
  'Social Media UGC',
  '3D Product Animation',
  'Brand Storytelling',
  'Tech Demo & Tutorial',
  'Creative Campaign'
];

const DELIVERABLE_FORMATS: { value: DeliverableItem['format']; label: string }[] = [
  { value: 'short_video', label: 'Short-Form Video (TikTok / Reels / Shorts)' },
  { value: 'long_video', label: 'Long-Form Video (YouTube / Explainer)' },
  { value: 'static_post', label: 'Static Post / Key Visual' },
  { value: 'carousel', label: 'Multi-slide Carousel' },
  { value: 'story', label: 'Ephemeral Story' },
  { value: 'audio', label: 'Audio / Voiceover / Podcast Ad' },
  { value: 'article', label: 'Written Article / Script' },
  { value: 'other', label: 'Other Custom Format' },
];

export const CampaignBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [brandGuidelines, setBrandGuidelines] = useState('');
  const [budgetMin, setBudgetMin] = useState<number | ''>(500);
  const [budgetMax, setBudgetMax] = useState<number | ''>(2500);
  const [currency, setCurrency] = useState('USD');
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [skillsString, setSkillsString] = useState('AI Video, Motion Design, Prompting');
  const [toolsString, setToolsString] = useState('Runway Gen-3, Midjourney');

  const [deliverables, setDeliverables] = useState<DeliverableItem[]>([
    {
      title: 'Hero Teaser Video',
      format: 'short_video',
      quantity: 1,
      guidelines: '15-30s high-energy AI video showcasing product concept',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);

  // If editing, fetch initial campaign data
  useEffect(() => {
    if (isEditing && id) {
      setFetching(true);
      api.getCampaignById(id)
        .then((res) => {
          if (res.success && res.campaign) {
            const camp = res.campaign;
            setTitle(camp.title);
            setCategory(camp.category);
            setDescription(camp.description);
            setTargetAudience(camp.targetAudience || '');
            setBrandGuidelines(camp.brandGuidelines || '');
            setBudgetMin(camp.budget.min);
            setBudgetMax(camp.budget.max);
            setCurrency(camp.budget.currency || 'USD');
            if (camp.applicationDeadline) {
              setApplicationDeadline(camp.applicationDeadline.split('T')[0]);
            }
            setSkillsString(camp.requiredSkills ? camp.requiredSkills.join(', ') : '');
            setToolsString(camp.requiredTools ? camp.requiredTools.join(', ') : '');
            if (camp.deliverables && camp.deliverables.length > 0) {
              setDeliverables(camp.deliverables);
            }
          }
        })
        .catch((err: any) => setError(err.message || 'Failed to load campaign for editing.'))
        .finally(() => setFetching(false));
    }
  }, [isEditing, id]);

  const handleAddDeliverable = () => {
    setDeliverables((prev) => [
      ...prev,
      {
        title: `Deliverable ${prev.length + 1}`,
        format: 'short_video',
        quantity: 1,
        guidelines: '',
      },
    ]);
  };

  const handleRemoveDeliverable = (index: number) => {
    if (deliverables.length === 1) return;
    setDeliverables((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeliverableChange = (index: number, field: keyof DeliverableItem, value: any) => {
    setDeliverables((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (targetStatus: 'draft' | 'published') => {
    setError(null);

    if (!title.trim() || title.length < 5) {
      setError('Please provide a campaign title of at least 5 characters.');
      return;
    }
    if (!description.trim() || description.length < 20) {
      setError('Please provide a detailed campaign brief of at least 20 characters.');
      return;
    }
    if (budgetMin === '' || budgetMax === '' || Number(budgetMin) > Number(budgetMax)) {
      setError('Please provide a valid budget range where minimum is less than or equal to maximum.');
      return;
    }

    const payload: Partial<CampaignData> = {
      title: title.trim(),
      category,
      description: description.trim(),
      targetAudience: targetAudience.trim() || undefined,
      brandGuidelines: brandGuidelines.trim() || undefined,
      budget: {
        min: Number(budgetMin),
        max: Number(budgetMax),
        currency,
      },
      deliverables,
      requiredSkills: skillsString
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      requiredTools: toolsString
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      status: targetStatus,
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline).toISOString() : undefined,
    };

    setLoading(true);
    try {
      if (isEditing && id) {
        const res = await api.updateCampaign(id, payload);
        if (res.success) {
          navigate(`/campaigns/${id}`);
        }
      } else {
        const res = await api.createCampaign(payload);
        if (res.success && res.campaign) {
          navigate(`/campaigns/${res.campaign._id}`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save campaign brief.');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'brand') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Brand Access Required</h2>
        <p className="text-slate-400 text-sm">Only brand accounts are authorized to create and publish campaign briefs.</p>
        <Link to="/campaigns" className="inline-block px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">
          Explore Campaigns
        </Link>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-xs font-semibold mt-4">Loading campaign details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation */}
      <Link
        to="/campaigns"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Campaigns
      </Link>

      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-md">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            {isEditing ? 'Edit Campaign Brief' : 'New Creator Campaign Brief'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {isEditing ? 'Modify Campaign Specifications' : 'Launch a New Creative Campaign'}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            Define your campaign objectives, required deliverables, creator requirements, and funded compensation.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-8 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8">
        {/* Basic Campaign Info */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            1. Campaign Overview
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Campaign Title *</label>
              <input
                type="text"
                placeholder="e.g. Next-Gen Wireless Earbuds Launch Video"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Detailed Creative Brief *</label>
            <textarea
              rows={5}
              placeholder="Explain the background, core message, aesthetic direction, desired mood, and what problem your campaign addresses..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Audience</label>
              <input
                type="text"
                placeholder="e.g. Gen Z tech enthusiasts, gamers, and audiophiles"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Brand Guidelines / Do's & Don'ts</label>
              <input
                type="text"
                placeholder="e.g. Modern minimal tone, no explicit lyrics, neon accents"
                value={brandGuidelines}
                onChange={(e) => setBrandGuidelines(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
          </div>
        </div>

        {/* Budget & Timeline */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            2. Budget & Timeline
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Min Budget ($) *</label>
              <input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Max Budget ($) *</label>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Application Deadline</label>
              <input
                type="date"
                value={applicationDeadline}
                onChange={(e) => setApplicationDeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
          </div>
        </div>

        {/* Deliverables Builder */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-sky-400" />
              3. Deliverables & Specifications
            </h2>
            <button
              type="button"
              onClick={handleAddDeliverable}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Deliverable
            </button>
          </div>

          <div className="space-y-4">
            {deliverables.map((del, index) => (
              <div
                key={index}
                className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-400">
                    Deliverable #{index + 1}
                  </span>
                  {deliverables.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDeliverable(index)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition"
                      title="Remove deliverable"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Deliverable Title</label>
                    <input
                      type="text"
                      placeholder="e.g. 30s TikTok Video or 3 Carousel Slides"
                      value={del.title}
                      onChange={(e) => handleDeliverableChange(index, 'title', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Media Format</label>
                    <select
                      value={del.format}
                      onChange={(e) => handleDeliverableChange(index, 'format', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    >
                      {DELIVERABLE_FORMATS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">Deliverable Guidelines</label>
                  <input
                    type="text"
                    placeholder="Specific resolution, aspect ratio (9:16), format notes, or tone guidance"
                    value={del.guidelines || ''}
                    onChange={(e) => handleDeliverableChange(index, 'guidelines', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Required Skills & AI Tools */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            4. Creator Requirements
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Required Skills (comma separated)</label>
              <input
                type="text"
                placeholder="Motion Graphics, Sound Design, Prompting"
                value={skillsString}
                onChange={(e) => setSkillsString(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Preferred AI Tools (comma separated)</label>
              <input
                type="text"
                placeholder="Runway Gen-3, Midjourney, Kling, ElevenLabs"
                value={toolsString}
                onChange={(e) => setToolsString(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
          </div>
        </div>

        {/* Submission Actions */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('draft')}
            className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition"
          >
            {loading ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('published')}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-600/30 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Publishing...' : 'Publish Campaign Brief'}
          </button>
        </div>
      </div>
    </div>
  );
};
