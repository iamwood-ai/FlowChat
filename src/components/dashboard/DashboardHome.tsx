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
  ChevronRight,
  Globe
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { useAI } from '../../hooks/useAI';
import { useAuth } from '../../context/AuthContext';
import { ALL_TEMPLATES } from '../../constants/templates';
import TemplatesModal from './TemplatesModal';
import EcosystemSyncModal from './EcosystemSyncModal';

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
  const [isEcosystemModalOpen, setIsEcosystemModalOpen] = useState(false);
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
    <div className="h-full overflow-y-auto overflow-x-hidden scroll-smooth">
      <div className="p-3 sm:p-8 space-y-4 sm:space-y-8 max-w-[1400px] mx-auto pb-32">
      {/* Welcome Section */}
        <div className="flex flex-row justify-between items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight truncate">Welcome back, {activeWorkspace?.name || user?.displayName || user?.email?.split('@')[0] || 'User'}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => onNavigate('flows')}
              className="flex h-10 w-10 sm:h-auto sm:w-auto items-center justify-center gap-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-xl text-[10px] sm:text-xs md:text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 whitespace-nowrap"
              title="Create New Flow"
            >
              <Plus size={18} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Create New Flow</span>
            </button>
            <button 
              onClick={() => setIsCustomizing(!isCustomizing)}
              className={cn(
                "flex h-10 w-10 sm:h-auto sm:w-auto items-center justify-center px-0 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider transition-all border whitespace-nowrap",
                isCustomizing ? "bg-blue-600 text-white border-blue-600" : "bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100"
              )}
              title="Edit Layout"
            >
              <Zap size={18} className={cn("sm:hidden", isCustomizing ? "text-white" : "text-neutral-400")} />
              <span className="hidden sm:inline">{isCustomizing ? "Done" : "Edit Layout"}</span>
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
        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              key={stat.label}
              className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm cursor-pointer hover:border-blue-200 transition-all group"
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

      {/* Automations Library - Now as a separate full-width section */}
      {visibleSections.library && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-4 sm:mb-8">
            <div className="flex flex-col min-w-0">
              <h3 className="font-black text-neutral-900 text-sm sm:text-base tracking-tight truncate">Automations Library</h3>
              <p className="text-[10px] sm:text-xs text-neutral-400 mt-0.5 sm:mt-1 font-medium truncate">One-click deployment for your business.</p>
            </div>
            <button 
              onClick={() => setIsTemplatesModalOpen(true)}
              className="text-blue-600 text-[10px] font-bold uppercase tracking-widest hover:underline px-2.5 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors shrink-0 shrink-0"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {ALL_TEMPLATES.slice(0, 8).map((flow, idx) => (
              <div 
                key={flow.id} 
                onClick={() => onNavigate('flows', { templateId: flow.id })}
                className={cn(
                  "p-3 sm:p-5 rounded-xl border transition-all hover:shadow-lg cursor-pointer group flex flex-col justify-between min-h-[140px] sm:min-h-[160px] relative overflow-hidden", 
                  flow.color,
                  idx >= 6 ? "hidden lg:flex" : "flex" // Show 6 for mobile/tablet, 8 for desktop LG
                )}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest bg-white/50 px-1.5 py-0.5 rounded border border-white/20 truncate max-w-[60px]">{flow.platform}</span>
                    <div className="bg-blue-600 text-white rounded-lg p-1 shadow-lg shadow-blue-200 transition-all sm:scale-75 group-hover:scale-100">
                      <Plus size={12} />
                    </div>
                  </div>
                  <h4 className="font-black text-neutral-900 text-[11px] sm:text-base leading-tight group-hover:text-blue-700 transition-colors line-clamp-2">{flow.title}</h4>
                </div>
                <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-neutral-100/50">
                   <span className="text-[8px] sm:text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{flow.count} users</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-8 lg:grid-cols-3">
        {/* Row 2 split in 1/3 and 2/3 on desktop */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          {/* AI Generator - 2nd row, left */}
          {visibleSections.ai && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:p-6 shadow-sm overflow-hidden relative">
              <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-blue-100 blur-3xl opacity-50" />
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-200">
                  <Sparkles size={18} fill="white" />
                </div>
                <h3 className="font-bold text-blue-900 text-sm">AI Flow Draftsman</h3>
              </div>
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
        </div>

        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {visibleSections.channels && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm h-full">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="font-bold text-neutral-900 text-sm">Active Channels</h3>
                <button 
                  onClick={() => onNavigate('settings')}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 hover:bg-neutral-50 rounded-md"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {channels.map((channel) => (
                  <div key={channel.name} className="flex items-center gap-4 group">
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover:scale-105", channel.color)}>
                      <channel.icon size={18} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold text-neutral-800">
                        <span className="sm:hidden">{channel.name === 'Messenger' ? 'FB' : channel.name === 'Instagram' ? 'IG' : channel.name}</span>
                        <span className="hidden sm:inline">{channel.name}</span>
                      </p>
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
      </div>

      {/* CRM Sync now at the very bottom */}
      {visibleSections.crm && (
        <div className="rounded-xl bg-neutral-900 p-4 sm:p-8 shadow-lg shadow-neutral-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
              <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/10 text-white backdrop-blur-md">
                <Zap size={24} className="sm:w-8 sm:h-8" fill="currentColor" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-black text-white italic tracking-tight">Advanced CRM Sync</p>
                <p className="text-xs sm:text-base text-neutral-400 font-medium italic mt-1">Sync all profile data with HubSpot, Shopify, or Klaviyo instantly.</p>
              </div>
            </div>
            <button 
              onClick={() => setIsEcosystemModalOpen(true)}
              className="whitespace-nowrap px-8 py-3 sm:py-4 bg-blue-600 text-white rounded-xl text-xs sm:text-base font-black shadow-lg shadow-blue-900/40 hover:bg-blue-700 transition-all active:scale-95 w-full md:w-auto uppercase tracking-widest"
            >
              Connect Ecosystem
            </button>
          </div>
        </div>
      )}

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
      <EcosystemSyncModal 
        isOpen={isEcosystemModalOpen}
        onClose={() => setIsEcosystemModalOpen(false)}
      />
    </div>
    </div>
  );
}

