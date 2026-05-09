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
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
    
    const fetchAutomations = async () => {
      try {
        const q = query(collection(db, 'workspaces', activeWorkspace.id, 'flows'));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Automation));
        
        // Add 3 ready-to-use templates if the list is empty
        if (docs.length === 0) {
          const defaultTemplates: Automation[] = ALL_TEMPLATES.slice(0, 3).map(t => ({
            id: `template-${t.id}`,
            name: t.title,
            status: 'draft',
            createdAt: { seconds: Date.now() / 1000 },
            platform: t.platform,
            triggerType: t.platform === 'Instagram' ? 'Comment' : 'Messenger'
          }));
          setAutomations(defaultTemplates);
        } else {
          setAutomations(docs);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, `workspaces/${activeWorkspace.id}/flows`);
      } finally {
        setLoading(false);
      }
    };

    fetchAutomations();
  }, [activeWorkspace]);

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

  const deleteAutomation = async (id: string) => {
    if (!activeWorkspace) return;
    if (!confirm('Are you sure you want to delete this automation?')) return;
    
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

  const filteredAutomations = automations.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || a.status === filter;
    return matchesSearch && matchesFilter;
  });

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
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Automations</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage all your active and draft automation flows.</p>
        </div>
        <button 
          onClick={() => setShowTemplatePicker(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus size={18} strokeWidth={3} />
          New Automation
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input 
            type="text"
            placeholder="Search automations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-blue-500 bg-white transition-all text-sm"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'paused', 'draft'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                filter === status 
                  ? "bg-neutral-900 text-white shadow-lg" 
                  : "bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
              )}
            >
              {status}
            </button>
          ))}
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                    automation.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-400"
                  )}>
                    <Zap size={24} fill={automation.status === 'active' ? "currentColor" : "none"} />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900">{automation.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                        automation.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                        automation.status === 'paused' ? "bg-amber-50 text-amber-600 border-amber-100" :
                        "bg-neutral-50 text-neutral-500 border-neutral-100"
                      )}>
                        {automation.status}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-medium">•</span>
                      <span className="text-[10px] text-neutral-400 font-medium capitalize">{automation.platform || 'Instagram'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleStatus(automation.id, automation.status)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                      automation.status === 'active' ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                    )}
                    title={automation.status === 'active' ? "Pause" : "Start"}
                  >
                    {automation.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button 
                    onClick={() => onAnalytics(automation)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-50 hover:text-blue-600 transition-all"
                    title="Insights"
                  >
                    <TrendingUp size={18} />
                  </button>
                  <button 
                    onClick={() => onEdit(automation.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 transition-all"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => deleteAutomation(automation.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
