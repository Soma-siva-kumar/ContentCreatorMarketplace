import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { CreatorProfileData, BrandProfileData, PortfolioItem } from '../types';
import { 
  User, 
  Building2, 
  Sparkles, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Save, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Sliders,
  Activity,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, profile, updateProfile, refreshUser } = useAuth();

  // Local form state
  const isCreator = user?.role === 'creator';

  // Creator state
  const creatorData = (profile as CreatorProfileData) || {};
  const [displayName, setDisplayName] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [skillsStr, setSkillsStr] = useState('');
  const [nichesStr, setNichesStr] = useState('');
  const [toolsStr, setToolsStr] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number>(50);
  const [projectMin, setProjectMin] = useState<number>(200);
  const [availability, setAvailability] = useState<'available' | 'busy' | 'not_taking_clients'>('available');
  const [experienceYears, setExperienceYears] = useState<number>(2);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [newPortfolioTitle, setNewPortfolioTitle] = useState('');
  const [newPortfolioUrl, setNewPortfolioUrl] = useState('');
  const [newPortfolioType, setNewPortfolioType] = useState<'video' | 'image' | 'audio' | 'article'>('video');

  // Brand state
  const brandData = (profile as BrandProfileData) || {};
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [brandTagline, setBrandTagline] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [companySize, setCompanySize] = useState('11-50 employees');
  const [campaignInterestsStr, setCampaignInterestsStr] = useState('');

  // UI state
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync profile data to local state
  useEffect(() => {
    if (isCreator && creatorData) {
      setDisplayName(creatorData.displayName || '');
      setTagline(creatorData.tagline || '');
      setBio(creatorData.bio || '');
      setAvatarUrl(creatorData.avatarUrl || '');
      setSkillsStr((creatorData.skills || []).join(', '));
      setNichesStr((creatorData.niches || []).join(', '));
      setToolsStr((creatorData.tools || []).join(', '));
      setHourlyRate(creatorData.pricing?.hourlyRate || 50);
      setProjectMin(creatorData.pricing?.projectMinimum || 200);
      setAvailability(creatorData.availability || 'available');
      setExperienceYears(creatorData.experienceYears || 2);
      setPortfolio(creatorData.portfolio || []);
    } else if (!isCreator && brandData) {
      setCompanyName(brandData.companyName || '');
      setLogoUrl(brandData.logoUrl || '');
      setBrandTagline(brandData.tagline || '');
      setDescription(brandData.description || '');
      setIndustry(brandData.industry || 'Technology');
      setWebsiteUrl(brandData.websiteUrl || '');
      setCompanySize(brandData.companySize || '11-50 employees');
      setCampaignInterestsStr((brandData.campaignInterests || []).join(', '));
    }
  }, [profile, isCreator]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      if (isCreator) {
        const skills = skillsStr.split(',').map((s) => s.trim()).filter(Boolean);
        const niches = nichesStr.split(',').map((s) => s.trim()).filter(Boolean);
        const tools = toolsStr.split(',').map((s) => s.trim()).filter(Boolean);

        await updateProfile({
          displayName,
          tagline,
          bio,
          avatarUrl,
          skills,
          niches,
          tools,
          pricing: {
            hourlyRate: Number(hourlyRate),
            projectMinimum: Number(projectMin),
            currency: 'USD',
          },
          availability,
          experienceYears: Number(experienceYears),
          portfolio,
        });
      } else {
        const campaignInterests = campaignInterestsStr
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        await updateProfile({
          companyName,
          logoUrl,
          tagline: brandTagline,
          description,
          industry,
          websiteUrl,
          companySize,
          campaignInterests,
        });
      }

      setStatusMessage({ type: 'success', text: 'Profile updated successfully in MongoDB.' });
      await refreshUser();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const addPortfolioItem = () => {
    if (!newPortfolioTitle || !newPortfolioUrl) return;
    const newItem: PortfolioItem = {
      title: newPortfolioTitle,
      url: newPortfolioUrl,
      mediaType: newPortfolioType,
      tags: [],
      createdAt: new Date().toISOString(),
    };
    setPortfolio([...portfolio, newItem]);
    setNewPortfolioTitle('');
    setNewPortfolioUrl('');
  };

  const removePortfolioItem = (index: number) => {
    setPortfolio(portfolio.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 p-0.5 shadow-xl">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              {isCreator ? (
                <User className="w-7 h-7 text-brand-400" />
              ) : (
                <Building2 className="w-7 h-7 text-indigo-400" />
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">
                {isCreator ? displayName || 'Creator Profile' : companyName || 'Brand Profile'}
              </h1>
              {user?.isVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-800 text-emerald-400">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              ) : (
                <Link
                  to="/verify-email"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 border border-amber-800 text-amber-300 hover:text-white transition"
                >
                  Verify Email
                </Link>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Role: <span className="font-semibold text-slate-300 capitalize">{user?.role}</span> • Email: <span className="font-mono text-slate-400">{user?.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/settings"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition"
          >
            Account Settings
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 font-semibold text-xs text-white flex items-center gap-2 shadow-lg shadow-brand-600/30 transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-200'
              : 'bg-rose-950/40 border border-rose-800/50 text-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Creator Form */}
      {isCreator ? (
        <form onSubmit={handleSave} className="space-y-8">
          {/* Reputation & Craft Score Banner */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-950 border border-brand-800 text-brand-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400">Craft Score</span>
                <p className="text-xl font-black text-white">{creatorData.craftScore || 70} / 100</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400">Rating</span>
                <p className="text-xl font-black text-white">{creatorData.rating || 5.0} ★ ({creatorData.reviewCount || 0} reviews)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400">Completed Projects</span>
                <p className="text-xl font-black text-white">{creatorData.completedCollaborationsCount || 0}</p>
              </div>
            </div>
          </div>

          {/* General Information */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-400" />
              Creator Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 text-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Tagline / Catchphrase
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Visual Storyteller & Tech Reviewer"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 text-white text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Biography
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your creative background, audience focus, and signature style..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 text-white text-xs outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Niches (comma-separated)
                </label>
                <input
                  type="text"
                  value={nichesStr}
                  onChange={(e) => setNichesStr(e.target.value)}
                  placeholder="Tech, Gaming, AI, Design"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 text-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="Short Video, Scriptwriting, 3D"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 text-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Tools & Software (comma-separated)
                </label>
                <input
                  type="text"
                  value={toolsStr}
                  onChange={(e) => setToolsStr(e.target.value)}
                  placeholder="Premiere, DaVinci, Midjourney"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 text-white text-xs outline-none"
                />
              </div>
            </div>

            {/* Pricing, Availability, Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Hourly Rate (USD)
                </label>
                <input
                  type="number"
                  min={0}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 text-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Project Minimum (USD)
                </label>
                <input
                  type="number"
                  min={0}
                  value={projectMin}
                  onChange={(e) => setProjectMin(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 text-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Availability Status
                </label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 text-white text-xs outline-none"
                >
                  <option value="available">Available for Work</option>
                  <option value="busy">Busy / Limited</option>
                  <option value="not_taking_clients">Not Taking Clients</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-brand-500 text-white text-xs outline-none"
                />
              </div>
            </div>
          </div>

          {/* Portfolio Management */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                Featured Portfolio Samples ({portfolio.length})
              </h2>
            </div>

            {/* Existing Portfolio Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {portfolio.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-950 border border-brand-800 text-brand-300">
                      {item.mediaType}
                    </span>
                    <h3 className="font-bold text-xs text-white">{item.title}</h3>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-slate-400 hover:text-brand-300 flex items-center gap-1 truncate max-w-xs transition"
                    >
                      {item.url} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => removePortfolioItem(idx)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Portfolio Item */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-300">Add New Portfolio Sample</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Sample Title (e.g. 4K Brand Reel)"
                  value={newPortfolioTitle}
                  onChange={(e) => setNewPortfolioTitle(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                />
                <input
                  type="url"
                  placeholder="URL (YouTube, Vimeo, Drive, Behance)"
                  value={newPortfolioUrl}
                  onChange={(e) => setNewPortfolioUrl(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                />
                <div className="flex gap-2">
                  <select
                    value={newPortfolioType}
                    onChange={(e) => setNewPortfolioType(e.target.value as any)}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none flex-1"
                  >
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                    <option value="audio">Audio</option>
                    <option value="article">Article</option>
                  </select>
                  <button
                    type="button"
                    onClick={addPortfolioItem}
                    className="px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* Brand Profile Form */
        <form onSubmit={handleSave} className="space-y-8">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Brand & Company Profile
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Tagline
                </label>
                <input
                  type="text"
                  value={brandTagline}
                  onChange={(e) => setBrandTagline(e.target.value)}
                  placeholder="e.g. Next-Gen Consumer Electronics"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Brand Description & Mission
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what your brand stands for, your target customer profile, and what type of creator partnerships you look for..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Industry Sector
                </label>
                <input
                  type="text"
                  required
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Website URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Company Size
                </label>
                <select
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none"
                >
                  <option value="1-10 employees">1-10 employees</option>
                  <option value="11-50 employees">11-50 employees</option>
                  <option value="51-200 employees">51-200 employees</option>
                  <option value="201-1000 employees">201-1000 employees</option>
                  <option value="1000+ employees">1000+ employees</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Campaign Interests & Target Niches (comma-separated)
              </label>
              <input
                type="text"
                value={campaignInterestsStr}
                onChange={(e) => setCampaignInterestsStr(e.target.value)}
                placeholder="Product Launch, AI Tools, Sponsored Reels, UGC, YouTube Reviews"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs outline-none"
              />
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
