import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  ChevronRight, 
  ArrowLeft,
  Filter,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { ALL_TEMPLATES, Template } from '../../constants/templates';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
  onCreateNew: () => void;
}

export default function TemplatesModal({ isOpen, onClose, onSelect, onCreateNew }: TemplatesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const categories = ['All', 'Recommended', 'Grow your followers', 'Engage your audience', 'Drive traffic'];

  const filteredTemplates = ALL_TEMPLATES.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 md:p-10">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-400 transition-colors sm:hidden"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-2xl font-bold text-neutral-900">Automation Library</h2>
              </div>
              <p className="text-neutral-500 text-sm">Choose a template to jumpstart your growth or create from scratch.</p>
            </div>
            
            <div className="flex items-center gap-2 flex-1 sm:flex-none">
              <div className="relative flex-1 sm:w-64 md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                />
              </div>
              
              {/* Mobile Filter Button */}
              <div className="relative lg:hidden">
                <button 
                  onClick={() => setShowMobileFilter(!showMobileFilter)}
                  className={cn(
                    "p-3 rounded-2xl border transition-all",
                    showMobileFilter 
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200" 
                      : "bg-neutral-50 border-neutral-200 text-neutral-500"
                  )}
                >
                  <Filter size={18} />
                </button>
                
                <AnimatePresence>
                  {showMobileFilter && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-neutral-200 shadow-2xl p-2 z-[60]"
                    >
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setShowMobileFilter(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all",
                            selectedCategory === cat 
                              ? "bg-blue-50 text-blue-700" 
                              : "text-neutral-600 hover:bg-neutral-50"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={onClose}
                className="hidden sm:flex p-2 hover:bg-neutral-100 rounded-xl text-neutral-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {/* Sidebar Categories - Hidden on mobile/tablet because we have the filter button now */}
            <div className="hidden lg:block w-64 p-6 border-r border-neutral-100 bg-neutral-50/30 overflow-y-auto">
              <div className="flex lg:flex-col gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setShowMobileFilter(false);
                    }}
                    className={cn(
                      "whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold transition-all text-left",
                      selectedCategory === cat 
                        ? "bg-neutral-900 text-white shadow-lg shadow-neutral-200" 
                        : "text-neutral-500 hover:bg-white hover:text-neutral-900"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="mt-8 hidden lg:block">
                <div className="p-4 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-100">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 mb-4 transition-transform hover:scale-110">
                    <Plus size={24} />
                  </div>
                  <h4 className="font-bold text-sm">Custom Flow</h4>
                  <p className="text-[10px] opacity-80 mt-1 mb-4 leading-relaxed">Need something unique? Start with a blank canvas.</p>
                  <button 
                    onClick={onCreateNew}
                    className="w-full py-2 bg-white text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors active:scale-95"
                  >
                    Create from scratch
                  </button>
                </div>
              </div>
            </div>

            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-hide">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {/* Create New Mobile Card */}
                <div 
                  onClick={onCreateNew}
                  className="lg:hidden p-4 rounded-3xl border-2 border-dashed border-neutral-100 flex flex-col items-center justify-center text-center gap-2 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group aspect-square"
                >
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-[11px] sm:text-sm">Custom</h4>
                    <p className="text-[9px] text-neutral-500 mt-0.5">Start zero</p>
                  </div>
                </div>

                {filteredTemplates.map((t, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={t.id}
                    onClick={() => onSelect(t.id)}
                    className={cn(
                      "group p-4 sm:p-6 rounded-3xl border transition-all hover:shadow-2xl hover:translate-y-[-4px] cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[160px] aspect-square lg:aspect-auto lg:min-h-[220px]",
                      t.color
                    )}
                  >
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/20 blur-2xl group-hover:blur-3xl transition-all" />
                    
                    <div>
                      <div className="flex justify-between items-start mb-2 sm:mb-4">
                        <div className="p-2 sm:p-3 bg-white rounded-xl sm:rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                          <t.icon size={16} className="sm:w-5 sm:h-5" />
                        </div>
                        <span className="text-[8px] sm:text-[10px] font-bold opacity-60 uppercase tracking-widest">{t.platform}</span>
                      </div>
                      <h4 className="text-[11px] sm:text-base font-bold text-neutral-900 leading-tight mb-1 sm:mb-2 pr-2 sm:pr-4 line-clamp-2">{t.title}</h4>
                      <p className="hidden sm:line-clamp-2 text-xs opacity-70 leading-relaxed font-medium">{t.desc}</p>
                    </div>

                    <div className="mt-2 sm:mt-6 flex items-center justify-between pt-2 sm:pt-4 border-t border-black/5">
                      <div className="flex items-center gap-1 sm:gap-1.5 overflow-hidden">
                        <Sparkles size={10} className="shrink-0 sm:w-3 sm:h-3" />
                        <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider truncate">{t.count}</span>
                      </div>
                      <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl bg-white shadow-sm border border-neutral-100 group-hover:bg-neutral-900 group-hover:text-white group-hover:border-neutral-900 transition-all">
                        <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                      </div>
                    </div>
                  </motion.div>
                ))}

                {filteredTemplates.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <div className="h-16 w-16 bg-neutral-100 text-neutral-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Search size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900">No templates found</h3>
                    <p className="text-sm text-neutral-500 mt-1">Try adjusting your search or category filters.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
