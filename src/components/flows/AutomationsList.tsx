import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Play, 
  Pause, 
  Edit2, 
  Trash2, 
  Zap,
  TrendingUp,
  MessageSquare,
  Instagram,
  Facebook,
  Music2,
  ChevronRight,
  Sparkles,
  Smartphone,
  Mail,
  UserPlus,
  Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

import { ALL_TEMPLATES } from '../../constants/templates';

interface Automation {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused';
  createdAt: any;
  platform?: string;
  triggerType?: string;
}

interface AutomationsListProps {
  onEdit: (id: string) => void;
  onAnalytics: (flow: Automation) => void;
  onCreateNew: (templateId?: string) => void;
}

export default function AutomationsList({ onEdit, onAnalytics, onCreateNew }: AutomationsListProps) {
  const { activeWorkspace } = useAuth();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  useEffect(() => {
    if (!activeWorkspace) return;
    
    // Set loading only if we have no automations and it's truly empty
    // We don't use a separate loading state initially to make it feel instant
    const q = query(collection(db, 'workspaces', activeWorkspace.id, 'flows'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Automation));
      
      if (docs.length === 0) {
        // Add 3 ready-to-use templates if the list is empty
        const indices = [0, 5, 8]; 
        const defaultTemplates: Automation[] = indices.map(idx => {
          const t = ALL_TEMPLATES[idx] || ALL_TEMPLATES[0];
          return {
            id: `template-${t.id}-${Date.now()}-${idx}`,
            name: t.title,
            status: 'draft',
            createdAt: { seconds: Date.now() / 1000 },
            platform: t.platform,
            triggerType: t.platform === 'Instagram' ? 'Comment' : 'Messenger'
          };
        });
        setAutomations(defaultTemplates);
      } else {
        setAutomations(docs);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `workspaces/${activeWorkspace.id}/flows`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeWorkspace.id]); // Use activeWorkspace.id for more stable trigger

  const toggleStatus = async (id: string, currentStatus: string) => {
    if (!activeWorkspace) return;
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const flowRef = doc(db, 'workspaces', activeWorkspace.id, 'flows', id);
      await updateDoc(flowRef, { status: newStatus, updatedAt: serverTimestamp() });
      setAutomations(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `workspaces/${activeWorkspace.id}/flows/${id}`);
    }
  };

  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string, timer: any } | null>(null);

  const confirmDelete = (id: string) => {
    if (deleteConfirmation?.id === id) {
      // Second click: perform actual deletion
      performDeletion(id);
      return;
    }

    // First click: show confirmation
    if (deleteConfirmation?.timer) clearTimeout(deleteConfirmation.timer);
    
    const timer = setTimeout(() => {
      setDeleteConfirmation(null);
    }, 3000);

    setDeleteConfirmation({ id, timer });
  };

  const performDeletion = async (id: string) => {
    if (!activeWorkspace) return;
    
    // Clear confirmation state
    if (deleteConfirmation?.timer) clearTimeout(deleteConfirmation.timer);
    setDeleteConfirmation(null);

    // If it's a virtual template, just remove from state
    if (id.startsWith('template-')) {
      setAutomations(prev => prev.filter(a => a.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, 'workspaces', activeWorkspace.id, 'flows', id));
      setAutomations(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `workspaces/${activeWorkspace.id}/flows/${id}`);
    }
  };

  const cancelDelete = () => {
    if (deleteConfirmation?.timer) clearTimeout(deleteConfirmation.timer);
    setDeleteConfirmation(null);
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleStartRename = (e: React.MouseEvent, automation: Automation) => {
    e.stopPropagation();
    setEditingId(automation.id);
    setEditingName(automation.name);
  };

  const handleSaveRename = async (automation: Automation) => {
    if (!activeWorkspace || !editingName.trim() || editingName === automation.name) {
      setEditingId(null);
      return;
    }
    try {
      const flowRef = doc(db, 'workspaces', activeWorkspace.id, 'flows', automation.id);
      await updateDoc(flowRef, { name: editingName.trim(), updatedAt: serverTimestamp() });
      setAutomations(prev => prev.map(a => a.id === automation.id ? { ...a, name: editingName.trim() } : a));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `workspaces/${activeWorkspace.id}/flows/${automation.id}`);
    } finally {
      setEditingId(null);
    }
  };

  const filteredAutomations = React.useMemo(() => {
    return automations.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || a.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [automations, search, filter]);

  const pickerTemplates = [
    { 
      id: 'blank', 
      name: 'Start from Scratch', 
      desc: 'Build your custom flow using our drag & drop builder.',
      icon: Plus,
      color: 'bg-neutral-100 text-neutral-600'
    },
    ...ALL_TEMPLATES.slice(0, 5).map(t => ({
      id: t.id,
      name: t.title,
      desc: t.desc,
      icon: t.icon,
      color: t.color
    }))
  ];

  if (showTemplatePicker) {
    return (
      <div className="p-8 max-w-[1000px] mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Choose a Template</h1>
            <p className="text-neutral-500 mt-1">Start with a pre-built automation or build your own.</p>
          </div>
          <button 
            onClick={() => setShowTemplatePicker(false)}
            className="text-sm font-bold text-neutral-400 hover:text-neutral-600"
          >
            Cancel
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pickerTemplates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => {
                setShowTemplatePicker(false);
                onCreateNew(tpl.id === 'blank' ? undefined : tpl.id);
              }}
              className="flex items-center gap-4 p-5 rounded-2xl border border-neutral-200 bg-white hover:border-blue-600 hover:shadow-xl transition-all text-left group"
            >
              <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-xl", tpl.color)}>
                <tpl.icon size={28} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">{tpl.name}</h3>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed line-clamp-2">{tpl.desc}</p>
              </div>
              <ChevronRight size={18} className="text-neutral-300 group-hover:text-blue-600 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-8 max-w-[1400px] mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 truncate">Automate</h1>
          <p className="text-neutral-500 text-[11px] sm:text-sm mt-0.5 mt-1 font-medium truncate">Manage your active and draft automation flows.</p>
        </div>
        <button 
          onClick={() => setShowTemplatePicker(true)}
          className="flex h-11 w-11 sm:h-auto sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 sm:px-6 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 shrink-0"
          title="New Automation"
        >
          <Plus size={20} className="sm:w-[18px] sm:h-[18px]" strokeWidth={3} />
          <span className="hidden sm:inline">New Automation</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 sm:w-[18px] sm:h-[18px]" size={16} />
          <input 
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-blue-500 bg-white transition-all text-xs sm:text-sm h-11"
          />
        </div>
        
        <div className="relative flex items-center gap-2">
          {/* Mobile Filter Icon */}
          <div className="sm:hidden relative group">
            <button 
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 shadow-sm"
              title="Filter"
            >
              <Filter size={18} />
            </button>
            <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl border border-neutral-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-1">
               {['all', 'active', 'paused', 'draft'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                    filter === status ? "bg-blue-50 text-blue-600" : "text-neutral-500 hover:bg-neutral-50"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Tablet/Desktop Filters */}
          <div className="hidden sm:flex gap-2">
            {['all', 'active', 'paused', 'draft'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border h-11 flex items-center",
                  filter === status 
                    ? "bg-neutral-900 border-neutral-900 text-white shadow-lg" 
                    : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : filteredAutomations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-neutral-200 border-dashed">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-50 text-neutral-400 mb-4">
            <Zap size={32} />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">No automations found</h3>
          <p className="text-neutral-500 text-sm mt-1">Start by creating your first automation flow.</p>
          <button 
            onClick={() => setShowTemplatePicker(true)}
            className="mt-6 text-blue-600 font-bold hover:underline"
          >
            Create your first flow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredAutomations.map((automation) => (
              <motion.div
                key={automation.id}
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-neutral-200 bg-white p-3.5 sm:p-5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={cn(
                    "flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                    automation.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-400"
                  )}>
                    <Zap size={20} className="sm:w-6 sm:h-6" fill={automation.status === 'active' ? "currentColor" : "none"} />
                  </div>
                  <div className="min-w-0 flex-1">
                    {editingId === automation.id ? (
                      <input 
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleSaveRename(automation)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(automation);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="font-bold text-neutral-900 bg-neutral-50 px-2 py-0.5 rounded border border-blue-200 outline-none w-full max-w-[200px] text-sm"
                      />
                    ) : (
                      <h3 
                        className="font-bold text-neutral-900 hover:text-blue-600 cursor-pointer transition-colors text-sm sm:text-base truncate"
                        onClick={(e) => handleStartRename(e, automation)}
                      >
                        {automation.name}
                      </h3>
                    )}
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                      <span className={cn(
                        "text-[8px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full border",
                        automation.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                        automation.status === 'paused' ? "bg-amber-50 text-amber-600 border-amber-100" :
                        "bg-neutral-50 text-neutral-500 border-neutral-100"
                      )}>
                        {automation.status}
                      </span>
                      <span className="text-[10px] text-neutral-300 font-medium sm:hidden">•</span>
                      <span className="text-[8px] sm:text-[10px] text-neutral-400 font-bold uppercase tracking-widest sm:capitalize">{automation.platform || 'Instagram'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 justify-end sm:justify-start">
                  <button 
                    onClick={() => toggleStatus(automation.id, automation.status)}
                    className={cn(
                      "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl transition-all",
                      automation.status === 'active' ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                    )}
                    title={automation.status === 'active' ? "Pause" : "Start"}
                  >
                    {automation.status === 'active' ? <Pause size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Play size={16} className="sm:w-[18px] sm:h-[18px]" />}
                  </button>
                  <button 
                    onClick={() => onAnalytics(automation)}
                    className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-50 hover:text-blue-600 transition-all"
                    title="Insights"
                  >
                    <TrendingUp size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                  <button 
                    onClick={() => onEdit(automation.id)}
                    className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 transition-all"
                    title="Edit"
                  >
                    <Edit2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => confirmDelete(automation.id)}
                      className={cn(
                        "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl transition-all",
                        deleteConfirmation?.id === automation.id ? "bg-red-600 text-white animate-pulse" : "text-neutral-400 hover:bg-red-50 hover:text-red-600"
                      )}
                      title="Delete"
                    >
                      <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>

                    <AnimatePresence>
                      {deleteConfirmation?.id === automation.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          className="absolute bottom-full right-0 mb-2 w-48 bg-neutral-900 text-white rounded-2xl shadow-2xl p-2 z-[100]"
                        >
                          <p className="text-[10px] font-black uppercase text-center py-1 opacity-60">Delete this flow?</p>
                          <div className="flex gap-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); cancelDelete(); }}
                              className="flex-1 py-2 bg-neutral-800 rounded-xl text-[10px] font-black uppercase hover:bg-neutral-700 transition-colors"
                            >
                              Undo
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); performDeletion(automation.id); }}
                              className="flex-1 py-2 bg-red-600 rounded-xl text-[10px] font-black uppercase hover:bg-red-700 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
