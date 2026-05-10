import React, { useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  Zap, 
  TrendingUp,
  ArrowUpRight,
  Facebook,
  Instagram,
  Plus,
  Sparkles,
  Loader2,
  Send,
  Music2,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { useAI } from '../../hooks/useAI';
import { useAuth } from '../../context/AuthContext';
import { ALL_TEMPLATES } from '../../constants/templates';
import TemplatesModal from './TemplatesModal';

const stats = [
  { label: 'Total Contacts', value: '12,482', change: '+12%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Active Flows', value: '42', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Messages Sent', value: '284.5K', change: '+8%', icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Engagement Rate', value: '24.8%', change: '+3%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
];

const channels = [
  { name: 'Messenger', icon: Facebook, color: 'bg-blue-600', status: 'Active', count: '8.2K' },
  { name: 'Instagram', icon: Instagram, color: 'bg-pink-600', status: 'Active', count: '4.2K' },
  { name: 'TikTok', icon: Music2, color: 'bg-black', status: 'Active', count: '1.5K' },
  { name: 'WhatsApp', icon: MessageSquare, color: 'bg-emerald-600', status: 'Inactive', count: '-' },
  { name: 'SMS', icon: Send, color: 'bg-neutral-600', status: 'Inactive', count: '-' },
  { name: 'Telegram', icon: Send, color: 'bg-sky-500', status: 'Inactive', count: '-' },
];

export default function DashboardHome({ onNavigate }: { onNavigate: (view: 'dashboard' | 'flows' | 'audience' | 'analytics' | 'settings', params?: any) => void }) {
  const { user, userProfile, activeWorkspace } = useAuth();
  const { generateResponse, loading } = useAI();
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [visibleSections, setVisibleSections] = useState({
    stats: true,
    ai: true,
    channels: true,
    library: true,
    crm: true
  });
  const [isCustomizing, setIsCustomizing] = useState(false);

  const handleAiApply = async () => {
    if (!aiPrompt) return;
    const res = await generateResponse(`Generate a sample automation flow for: ${aiPrompt}. Include trigger and message content.`);
    if (res) setAiResponse(res);
  };

  const toggleSection = (section: keyof typeof visibleSections) => {
    setVisibleSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-[1400px] mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Welcome back, {activeWorkspace?.name || user?.displayName || user?.email?.split('@')[0] || 'User'}</h1>
          <p className="text-neutral-500 mt-1 text-xs sm:text-sm">Here's what's happening with your multi-channel automations today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('flows')}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={16} />
            Create New Flow
          </button>
          <button 
            onClick={() => setIsCustomizing(!isCustomizing)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
              isCustomizing ? "bg-blue-600 text-white" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
            )}
          >
            {isCustomizing ? "Done Customizing" : "Edit Layout"}
          </button>
        </div>
      </div>

      {isCustomizing && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 p-4 bg-white rounded-2xl border border-blue-100 shadow-sm"
        >
          {Object.entries(visibleSections).map(([key, val]) => (
            <button
              key={key}
              onClick={() => toggleSection(key as any)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
                val ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-neutral-50 border-neutral-200 text-neutral-400"
              )}
            >
              {val ? "Hide" : "Show"} {key}
            </button>
          ))}
        </motion.div>
      )}

      {/* Stats Grid */}
      {visibleSections.stats && (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={stat.label}
              className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm cursor-pointer hover:border-blue-200 transition-all group"
              onClick={() => onNavigate('analytics')}
            >
              <div className="flex items-center justify-between">
                <div className={cn("flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl transition-all group-hover:scale-110", stat.bg)}>
                  <stat.icon className={stat.color} size={20} />
                </div>
                {stat.change && (
                  <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 sm:px-2.5 py-1 rounded-full uppercase tracking-wider">
                    <ArrowUpRight size={10} />
                    {stat.change}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">{stat.value}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
        {/* Left Column: Channels and AI Generator */}
        <div className="lg:col-span-1 space-y-6">
          {/* AI Generator */}
          {visibleSections.ai && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 shadow-sm overflow-hidden relative">
              <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-blue-100 blur-3xl opacity-50" />
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-200">
                  <Sparkles size={18} fill="white" />
                </div>
                <h3 className="font-bold text-blue-900 text-sm">AI Flow Draftsman</h3>
              </div>
              <p className="text-[11px] text-blue-700 font-medium mb-4 leading-relaxed opacity-80">
                Transform any campaign goal into a functional automation flow using Gemini.
              </p>
              <div className="relative group">
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. TikTok giveaway flow..."
                  className="w-full rounded-xl border-neutral-200 bg-white p-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all resize-none h-24 shadow-inner"
                />
                <button 
                  onClick={handleAiApply}
                  disabled={loading || !aiPrompt}
                  className="absolute bottom-3 right-3 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-200 group-hover:scale-110 active:scale-95"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                </button>
              </div>
              {aiResponse && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 rounded-xl bg-white border border-blue-100 text-[11px] text-neutral-600 overflow-hidden shadow-sm"
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{aiResponse}</div>
                  <div className="mt-3 flex gap-2">
                    <button 
                      onClick={() => onNavigate('flows', { prompt: aiPrompt })}
                      className="text-blue-600 font-bold hover:underline font-sans"
                    >
                      Apply
                    </button>
                    <span className="text-neutral-300">|</span>
                    <button 
                      onClick={() => setAiResponse('')}
                      className="text-neutral-400 font-medium hover:text-neutral-600"
                    >
                      Clear
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {visibleSections.channels && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-neutral-900 text-sm">Active Channels</h3>
                <button 
                  onClick={() => onNavigate('settings')}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 hover:bg-neutral-50 rounded-md"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-4">
                {channels.map((channel) => (
                  <div key={channel.name} className="flex items-center gap-4 group">
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover:scale-105", channel.color)}>
                      <channel.icon size={18} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold text-neutral-800">{channel.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={cn("h-1.5 w-1.5 rounded-full", channel.status === 'Active' ? "bg-emerald-500" : "bg-neutral-300")} />
                        <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">{channel.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-neutral-600">{channel.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          {visibleSections.library && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="font-bold text-neutral-900">Ready Automations Library</h3>
                  <p className="text-xs text-neutral-400 mt-1 font-medium">One-click deployment for your profiles.</p>
                </div>
                <button 
                  onClick={() => setIsTemplatesModalOpen(true)}
                  className="text-blue-600 text-[11px] font-bold uppercase tracking-widest hover:underline px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors w-fit"
                >
                  Explore All Templates
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ALL_TEMPLATES.slice(0, 3).map((flow) => (
                  <div 
                    key={flow.id} 
                    onClick={() => onNavigate('flows', { templateId: flow.id })}
                    className={cn("p-6 rounded-2xl border transition-all hover:shadow-2xl hover:translate-y-[-4px] cursor-pointer group flex flex-col justify-between min-h-[220px] relative overflow-hidden", flow.color)}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 flex items-center gap-1">
                      <Sparkles size={40} />
                    </div>
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="px-2 py-1 bg-white/50 backdrop-blur-sm rounded-md border border-white/20">
                          <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">{flow.platform}</span>
                        </div>
                        <div className="bg-blue-600 text-white rounded-lg p-1.5 shadow-lg shadow-blue-200 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                          <Plus size={14} />
                        </div>
                      </div>
                      <h4 className="font-black text-neutral-900 text-lg leading-tight group-hover:text-blue-700 transition-colors">{flow.title}</h4>
                      <p className="text-xs text-neutral-500 mt-3 leading-relaxed font-medium line-clamp-3">{flow.desc}</p>
                    </div>
                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-neutral-100/50">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center border border-neutral-100 overflow-hidden">
                          <img src={userProfile?.photoURL || user?.photoURL} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{flow.count} uses</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {visibleSections.crm && (
            <div className="rounded-xl bg-neutral-900 p-6 shadow-lg shadow-neutral-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md">
                    <Zap size={28} fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-base sm:text-lg font-bold text-white">Advanced CRM Sync</p>
                    <p className="text-xs sm:text-sm text-neutral-400">Sync all profile data with HubSpot, or Klaviyo.</p>
                  </div>
                </div>
                <button className="whitespace-nowrap px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-95 w-full sm:w-auto">Connect Ecosystem</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <TemplatesModal 
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onSelect={(id) => {
          setIsTemplatesModalOpen(false);
          onNavigate('flows', { templateId: id });
        }}
        onCreateNew={() => {
          setIsTemplatesModalOpen(false);
          onNavigate('flows');
        }}
      />
    </div>
  );
}

