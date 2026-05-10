import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Eye,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../lib/utils';

const dailyData = [
  { name: 'Mon', sent: 4000, read: 2400, clicked: 800 },
  { name: 'Tue', sent: 3000, read: 1398, clicked: 600 },
  { name: 'Wed', sent: 2000, read: 9800, clicked: 2400 },
  { name: 'Thu', sent: 2780, read: 3908, clicked: 1200 },
  { name: 'Fri', sent: 1890, read: 4800, clicked: 1500 },
  { name: 'Sat', sent: 2390, read: 3800, clicked: 900 },
  { name: 'Sun', sent: 3490, read: 4300, clicked: 1100 },
];

const growthData = [
  { name: 'Week 1', users: 1200 },
  { name: 'Week 2', users: 2100 },
  { name: 'Week 3', users: 1800 },
  { name: 'Week 4', users: 2800 },
  { name: 'Week 5', users: 3400 },
  { name: 'Week 6', users: 4100 },
];

export default function AnalyticsView() {
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden scroll-smooth">
      <div className="p-4 sm:p-8 space-y-8 max-w-[1400px] mx-auto pb-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Campaign Analytics</h1>
          <p className="text-neutral-500 text-sm mt-1">Deep dive into your automation performance and growth.</p>
        </div>
        <div className="relative group w-full sm:w-fit">
          <button className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-fit rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              <span className="whitespace-nowrap">Last 30 days</span>
            </div>
            <ChevronDown size={14} className="text-neutral-400 ml-1" />
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
      </div>

      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Impressions', value: '1,248,390', change: '+14.2%', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Messages Read', value: '84.5%', change: '+2.1%', icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Click Through', value: '18.4%', change: '+5.4%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'New Subscribers', value: '2,482', change: '+8.7%', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon className={stat.color} size={20} />
              </div>
              <span className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <h3 className="text-2xl font-bold text-neutral-900">{stat.value}</h3>
              <span className="text-xs font-bold text-emerald-600 mb-1">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Engagement Chart */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="mb-6">
            <h3 className="font-bold text-neutral-900">Engagement Over Time</h3>
            <p className="text-xs text-neutral-500">Comparison between sent, read, and clicked messages</p>
          </div>
          <div className="h-[250px] sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sent" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="read" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicked" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Area Chart */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="mb-6">
            <h3 className="font-bold text-neutral-900">Audience Growth</h3>
            <p className="text-xs text-neutral-500">New subscribers per week across all platforms</p>
          </div>
          <div className="h-[250px] sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
