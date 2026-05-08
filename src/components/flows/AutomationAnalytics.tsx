import React from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  MousePointer2,
  Calendar,
  Download,
  Share2,
  Zap,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface AnalyticsProps {
  flow: any;
  onBack: () => void;
}

const mockData = [
  { name: 'May 1', sends: 400, clicks: 240, convs: 120 },
  { name: 'May 2', sends: 600, clicks: 380, convs: 180 },
  { name: 'May 3', sends: 500, clicks: 290, convs: 150 },
  { name: 'May 4', sends: 800, clicks: 520, convs: 310 },
  { name: 'May 5', sends: 700, clicks: 450, convs: 260 },
  { name: 'May 6', sends: 900, clicks: 610, convs: 410 },
  { name: 'May 7', sends: 1100, clicks: 780, convs: 520 },
];

export default function AutomationAnalytics({ flow, onBack }: AnalyticsProps) {
  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-neutral-200 transition-all text-neutral-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{flow.name} Insights</h1>
            <p className="text-sm text-neutral-500">Live performance and engagement metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group w-full sm:w-fit">
            <button className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-fit rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                <span className="whitespace-nowrap">Last 30 days</span>
              </div>
              <ChevronRight size={14} className="rotate-90 text-neutral-400 ml-1" />
            </button>
            <div className="absolute right-0 top-full mt-2 w-full sm:w-48 bg-white rounded-2xl border border-neutral-200 shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all z-50 p-2">
              {[
                '24hrs',
                '7 day',
                '30 days',
                '90 day',
                '6 months',
                '1 year',
                'all time',
                'custom'
              ].map((range) => (
                <button key={range} className="w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold text-neutral-500 hover:bg-neutral-50 hover:text-blue-600 transition-colors uppercase tracking-wider">
                  {range}
                </button>
              ))}
            </div>
          </div>
          <button className="p-2 bg-white border border-neutral-200 rounded-xl text-neutral-600 hover:bg-neutral-50 hidden sm:block">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sends', value: '4,520', change: '+12.5%', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Unique Users', value: '3,842', change: '+8.2%', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Total Clicks', value: '2,910', change: '+15.4%', icon: MousePointer2, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Conversion Rate', value: '18.4%', change: '+2.1%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-3 rounded-xl", stat.bg)}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">
                {stat.change}
              </span>
            </div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-bold text-neutral-900 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-bold text-neutral-900">Engagement Over Time</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-600" />
              <span className="text-xs font-bold text-neutral-500">Sends</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-200" />
              <span className="text-xs font-bold text-neutral-500">Clicks</span>
            </div>
          </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockData}>
              <defs>
                <linearGradient id="colorSends" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#A3A3A3', fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#A3A3A3', fontWeight: 600 }}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  padding: '12px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="sends" 
                stroke="#2563eb" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSends)" 
              />
              <Area 
                type="monotone" 
                dataKey="clicks" 
                stroke="#93c5fd" 
                strokeWidth={2}
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
          <h3 className="font-bold text-neutral-900 mb-6">Trigger Performance</h3>
          <div className="space-y-4">
            {[
              { type: 'Post Comment', count: '1,240', rate: '85%', color: 'text-blue-600' },
              { type: 'Story Mention', count: '840', rate: '92%', color: 'text-pink-600' },
              { type: 'Keyword DM', count: '420', rate: '78%', color: 'text-emerald-600' },
            ].map((trigger) => (
              <div key={trigger.type} className="flex items-center justify-between p-4 rounded-2xl border border-neutral-50 bg-neutral-50/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-neutral-100 shadow-sm shadow-black/5">
                    <Zap size={18} className={trigger.color} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-800">{trigger.type}</p>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{trigger.count} Triggers</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-neutral-900">{trigger.rate}</p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Success</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
          <h3 className="font-bold text-neutral-900 mb-6">Top Performing Nodes</h3>
          <div className="space-y-4">
            {[
              { name: 'Initial DM', type: 'Message', clicks: '2,100', ctr: '12%' },
              { name: 'Follow-up 1', type: 'Wait', clicks: '450', ctr: '4%' },
              { name: 'Resource Link', type: 'Action', clicks: '1,850', ctr: '24%' },
            ].map((node) => (
              <div key={node.name} className="flex items-center justify-between p-4 rounded-2xl border border-neutral-50 bg-neutral-50/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-neutral-100 shadow-sm shadow-black/5">
                    <MessageSquare size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-800">{node.name}</p>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{node.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-neutral-900">{node.clicks}</p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{node.ctr} CTR</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
