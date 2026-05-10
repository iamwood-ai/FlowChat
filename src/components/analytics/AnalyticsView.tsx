import React, { useState, useMemo } from 'react';
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
  ChevronDown,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Data maps for different ranges
const DAILY_DATA_VARIANTS: Record<string, any[]> = {
  '24hrs': [
    { name: '00:00', sent: 400, read: 240, clicked: 80 },
    { name: '04:00', sent: 300, read: 139, clicked: 60 },
    { name: '08:00', sent: 2000, read: 980, clicked: 240 },
    { name: '12:00', sent: 2780, read: 1908, clicked: 120 },
    { name: '16:00', sent: 1890, read: 1480, clicked: 150 },
    { name: '20:00', sent: 2390, read: 1380, clicked: 90 },
    { name: '23:59', sent: 3490, read: 2430, clicked: 110 },
  ],
  '7 days': [
    { name: 'Mon', sent: 4000, read: 2400, clicked: 800 },
    { name: 'Tue', sent: 3000, read: 1398, clicked: 600 },
    { name: 'Wed', sent: 2000, read: 9800, clicked: 2400 },
    { name: 'Thu', sent: 2780, read: 3908, clicked: 1200 },
    { name: 'Fri', sent: 1890, read: 4800, clicked: 1500 },
    { name: 'Sat', sent: 2390, read: 3800, clicked: 900 },
    { name: 'Sun', sent: 3490, read: 4300, clicked: 1100 },
  ],
  '30 days': [
    { name: 'Week 1', sent: 24000, read: 12400, clicked: 4800 },
    { name: 'Week 2', sent: 33000, read: 21398, clicked: 6600 },
    { name: 'Week 3', sent: 22000, read: 19800, clicked: 5400 },
    { name: 'Week 4', sent: 27800, read: 23908, clicked: 6200 },
  ],
  'default': [
    { name: 'Month 1', sent: 94000, read: 52400, clicked: 14800 },
    { name: 'Month 2', sent: 133000, read: 81398, clicked: 26600 },
    { name: 'Month 3', sent: 122000, read: 79800, clicked: 25400 },
    { name: 'Month 4', sent: 127800, read: 93908, clicked: 36200 },
  ]
};

const GROWTH_DATA_VARIANTS: Record<string, any[]> = {
  '24hrs': [
    { name: '00:00', users: 12 },
    { name: '06:00', users: 45 },
    { name: '12:00', users: 89 },
    { name: '18:00', users: 134 },
    { name: '23:00', users: 156 },
  ],
  '7 days': [
    { name: 'Mon', users: 120 },
    { name: 'Tue', users: 210 },
    { name: 'Wed', users: 180 },
    { name: 'Thu', users: 280 },
    { name: 'Fri', users: 340 },
    { name: 'Sat', users: 410 },
    { name: 'Sun', users: 450 },
  ],
  '30 days': [
    { name: 'W1', users: 1200 },
    { name: 'W2', users: 2100 },
    { name: 'W3', users: 1800 },
    { name: 'W4', users: 2800 },
  ],
  'default': [
    { name: 'Jan', users: 12000 },
    { name: 'Feb', users: 21000 },
    { name: 'Mar', users: 18000 },
    { name: 'Apr', users: 28000 },
    { name: 'May', users: 34000 },
    { name: 'Jun', users: 41000 },
  ]
};

export default function AnalyticsView() {
  const [selectedRange, setSelectedRange] = useState('30 days');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customDates, setCustomDates] = useState({ start: '', end: '' });

  const activeDailyData = useMemo(() => {
    return DAILY_DATA_VARIANTS[selectedRange] || DAILY_DATA_VARIANTS['default'];
  }, [selectedRange]);

  const activeGrowthData = useMemo(() => {
    return GROWTH_DATA_VARIANTS[selectedRange] || GROWTH_DATA_VARIANTS['default'];
  }, [selectedRange]);

  const ranges = [
    '24hrs',
    '7 days',
    '30 days',
    '90 days',
    '6 months',
    '1 year',
    'all time',
    'custom'
  ];

  const handleRangeSelect = (range: string) => {
    if (range === 'custom') {
      setShowCustomPicker(true);
    } else {
      setSelectedRange(range);
    }
    setIsDropdownOpen(false);
  };

  const handleApplyCustom = () => {
    if (customDates.start && customDates.end) {
      setSelectedRange(`${customDates.start} - ${customDates.end}`);
      setShowCustomPicker(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden scroll-smooth">
      <div className="p-4 sm:p-8 space-y-8 max-w-[1400px] mx-auto pb-32">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Campaign Analytics</h1>
          <p className="text-neutral-500 text-sm mt-1">Deep dive into your automation performance and growth.</p>
        </div>
        
        <div className="relative w-full sm:w-fit">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-fit rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all"
          >
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              <span className="whitespace-nowrap capitalize">Last {selectedRange}</span>
            </div>
            <ChevronDown size={14} className={cn("text-neutral-400 ml-1 transition-transform", isDropdownOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsDropdownOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-full sm:w-48 bg-white rounded-2xl border border-neutral-200 shadow-2xl z-50 p-2"
                >
                  {ranges.map((range) => (
                    <button 
                      key={range} 
                      onClick={() => handleRangeSelect(range)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg text-[10px] font-bold transition-colors uppercase tracking-wider",
                        selectedRange === range ? "bg-blue-50 text-blue-600" : "text-neutral-500 hover:bg-neutral-50 hover:text-blue-600"
                      )}
                    >
                      {range}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Custom Picker Overlay */}
      <AnimatePresence>
        {showCustomPicker && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm border border-neutral-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-neutral-900">Custom Date Range</h3>
                <button onClick={() => setShowCustomPicker(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                  <X size={20} className="text-neutral-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 block">Start Date</label>
                  <input 
                    type="date" 
                    value={customDates.start}
                    onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full rounded-xl border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 block">End Date</label>
                  <input 
                    type="date" 
                    value={customDates.end}
                    onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full rounded-xl border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setShowCustomPicker(false)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleApplyCustom}
                    disabled={!customDates.start || !customDates.end}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50"
                  >
                    Apply Range
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {[
          { label: 'Impressions', fullLabel: 'Total Impressions', value: '1,248K', change: '+14%', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Read', fullLabel: 'Messages Read', value: '84.5%', change: '+2%', icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Clicks', fullLabel: 'Click Through', value: '18.4%', change: '+5%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Subscribers', fullLabel: 'New Subscribers', value: '2,482', change: '+8%', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat) => (
          <div key={stat.fullLabel} className="bg-white p-3 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={cn("p-1.5 sm:p-2 rounded-lg shrink-0", stat.bg)}>
                <stat.icon className={cn(stat.color, "sm:w-5 sm:h-5")} size={16} />
              </div>
              <span className="text-[9px] sm:text-xs font-semibold text-neutral-400 uppercase tracking-wider truncate">{stat.label}</span>
            </div>
            <div className="mt-2 sm:mt-4 flex items-baseline sm:items-end justify-between gap-1">
              <h3 className="text-base sm:text-2xl font-black text-neutral-900 truncate">{stat.value}</h3>
              <span className="text-[8px] sm:text-xs font-bold text-emerald-600 shrink-0">{stat.change}</span>
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
              <BarChart data={activeDailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
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
              <AreaChart data={activeGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
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
