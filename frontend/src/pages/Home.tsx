import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Compass, 
  FileCheck2, 
  Activity, 
  BookOpen, 
  Send,
  ArrowRight
} from 'lucide-react';
import { HealthStatusCard } from '../components/HealthStatusCard';

export const Home: React.FC = () => {
  const lifecycleStages = [
    {
      step: '01',
      title: 'Learn',
      icon: BookOpen,
      desc: 'Creator Academy: verified courses, quiz assessments, skill credentials & portfolio badges.',
      color: 'from-pink-500/20 to-rose-500/10 text-pink-400 border-pink-500/30',
      path: '/academy',
    },
    {
      step: '02',
      title: 'Create',
      icon: Sparkles,
      desc: 'AI Content Studio: multi-platform hook generation, scripts, caption outlines & prompt workflows.',
      color: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30',
      path: '/ai-studio',
    },
    {
      step: '03',
      title: 'Discover Opportunities',
      icon: Compass,
      desc: 'Creator Marketplace & Campaigns: search by niche, reach, skills, budget & verified reviews.',
      color: 'from-indigo-500/20 to-brand-500/10 text-brand-400 border-brand-500/30',
      path: '/marketplace',
    },
    {
      step: '04',
      title: 'Apply',
      icon: Send,
      desc: 'Creator Proposals: custom pitches, proposed milestone timelines & portfolio attachments.',
      color: 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30',
      path: '/campaigns',
    },
    {
      step: '05',
      title: 'Collaborate',
      icon: Layers,
      desc: 'Milestone Workspaces: deliverable submissions, real-time Socket.IO chat & review iterations.',
      color: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/30',
      path: '/collaborations',
    },
    {
      step: '06',
      title: 'Review Content',
      icon: ShieldCheck,
      desc: 'AI Content Guardian: brand guideline verification, FTC endorsement compliance & human review appeals.',
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
      path: '/guardian',
    },
    {
      step: '07',
      title: 'Manage Rights',
      icon: FileCheck2,
      desc: 'Agreements & Copyright Registry: digital terms, e-signatures & SHA-256 asset provenance.',
      color: 'from-violet-500/20 to-purple-500/10 text-violet-400 border-violet-500/30',
      path: '/agreements',
    },
    {
      step: '08',
      title: 'Build Reputation',
      icon: Activity,
      desc: 'Explainable Craft Score: mathematically grounded quality metrics & verified client ratings.',
      color: 'from-teal-500/20 to-emerald-500/10 text-teal-400 border-teal-500/30',
      path: '/reputation',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300">
          <span className="text-brand-400">Enterprise AI Engine</span>
          <span className="text-slate-600">•</span>
          <span>Zero-Mock Architecture</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400">Full Lifecycle MERN</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Where Top Creators & Brands{' '}
          <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            Collaborate & Scale
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
          HacXLerate — Kampus.VC connects content creators with forward-thinking brands across the entire creative journey: from learning and AI ideation to contracts, copyright management, and reputation.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/register"
            className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/30 hover:shadow-brand-600/50 transition active:scale-95 flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/marketplace"
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-sm transition"
          >
            Explore Marketplace
          </Link>
        </div>
      </section>

      {/* Live System Connectivity Card */}
      <section>
        <HealthStatusCard />
      </section>

      {/* Complete Creator Lifecycle Pipeline */}
      <section id="lifecycle" className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            The Complete End-to-End Creator Lifecycle
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Every step is database-backed in MongoDB with Mongoose schemas, role-guarded permissions, and real-time execution.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {lifecycleStages.map((stage) => {
            const IconComponent = stage.icon;
            return (
              <Link
                key={stage.title}
                to={stage.path}
                className="group bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 hover:border-brand-500/50 rounded-2xl p-5 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${stage.color} flex items-center justify-center border`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-600 group-hover:text-brand-400 transition">
                      {stage.step}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base group-hover:text-brand-300 transition flex items-center gap-1.5">
                    {stage.title}
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition -translate-x-1 group-hover:translate-x-0" />
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {stage.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-medium text-slate-500 group-hover:text-slate-300 transition">
                  <span>Explore module</span>
                  <span className="text-brand-400 font-mono">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};
