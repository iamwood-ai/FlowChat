import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  reconnectEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  Panel,
  NodeResizer,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant
} from '@xyflow/react';

import { motion, AnimatePresence } from 'motion/react';
import '@xyflow/react/dist/style.css';

import {
  MessageSquare,
  Zap,
  Clock,
  Save,
  Play,
  Plus,
  Minus,
  Trash2,
  ChevronLeft,
  CheckCircle2,
  Settings2,
  X,
  Layers,
  Loader2,
  ExternalLink,
  Mail,
  UserPlus,
  Link as LinkIcon,
  Languages,
  Repeat,
  ChevronRight
} from 'lucide-react';

import { cn } from '../../lib/utils';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { ALL_TEMPLATES } from '../../constants/templates';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ButtonData {
  label: string;
  type: 'next_step' | 'external_link';
  link?: string;
}

interface FlowBuilderProps {
  flowId?: string | null;
  templateId?: string | null;
  prompt?: string | null;
  onBack: () => void;
}

// ─── Node Components ──────────────────────────────────────────────────────────

const MessageNode = ({ data, selected }: any) => (
  <div className={cn(
    "w-full h-full shadow-xl rounded-2xl border bg-white overflow-hidden flex flex-col min-h-[80px] min-w-[150px]",
    selected ? "border-blue-500 ring-4 ring-blue-500/10" : "border-neutral-200"
  )}>
    <NodeResizer minWidth={150} minHeight={80} isVisible={selected} lineClassName="border-blue-400" handleClassName="h-3 w-3 bg-white border-2 border-blue-400 rounded-full shadow-lg" />
    <div className="bg-blue-600 px-3 py-2 flex items-center gap-2 text-white shrink-0">
      <MessageSquare size={12} className="fill-white/20" />
      <span className="text-[10px] font-black uppercase tracking-wider">Message</span>
    </div>
    <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-2">
      <p className="text-xs text-neutral-600 leading-relaxed font-medium">
        {data.label || 'Enter your message here...'}
      </p>
      {data.buttons?.length > 0 && (
        <div className="space-y-1">
          {data.buttons.map((btn: any, i: number) => (
            <div key={i} className="w-full py-1.5 px-3 bg-neutral-50 border border-neutral-100 rounded-lg text-[10px] font-bold text-neutral-500 flex items-center justify-between">
              <span className="truncate max-w-[120px]">{btn.label}</span>
              {btn.type === 'external_link' ? <ExternalLink size={9} /> : <ChevronRight size={9} />}
            </div>
          ))}
        </div>
      )}
      {data.type === 'email_capture' && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-1.5 flex items-center gap-2">
          <Mail size={11} className="text-emerald-500" />
          <span className="text-[10px] text-emerald-600 font-bold">Email Capture Active</span>
        </div>
      )}
      <div className="mt-auto pt-1">
        <div className={cn(
          "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider inline-block",
          data.type === 'follow_check' ? "bg-purple-100 text-purple-600" :
          data.type === 'email_capture' ? "bg-teal-100 text-teal-600" :
          "bg-blue-100 text-blue-600"
        )}>
          {data.type?.replace('_', ' ') || 'standard dm'}
        </div>
      </div>
    </div>
    <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white" />
    <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white" />
  </div>
);

const TriggerNode = ({ data, selected }: any) => (
  <div className={cn(
    "w-full h-full shadow-xl rounded-2xl border bg-white overflow-hidden flex flex-col min-h-[80px] min-w-[150px]",
    selected ? "border-amber-500 ring-4 ring-amber-500/10" : "border-neutral-200"
  )}>
    <NodeResizer minWidth={150} minHeight={80} isVisible={selected} lineClassName="border-amber-400" handleClassName="h-3 w-3 bg-white border-2 border-amber-400 rounded-full shadow-lg" />
    <div className="bg-amber-500 px-3 py-2 flex items-center gap-2 text-white shrink-0">
      <Zap size={12} fill="currentColor" />
      <span className="text-[10px] font-black uppercase tracking-wider">Trigger</span>
    </div>
    <div className="p-3 flex-1 overflow-y-auto space-y-2">
      <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
        <p className="text-[9px] text-neutral-400 font-black uppercase tracking-widest mb-0.5">
          On {data.type === 'comment' ? 'Comment' : 'Interaction'}
        </p>
        <p className="text-xs font-bold text-amber-900 leading-tight">
          {data.postType === 'specific' ? 'SPECIFIC' : data.postType === 'next' ? 'NEXT' : 'ANY'}
        </p>
      </div>
      {data.keywords?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.keywords.map((kw: string, i: number) => (
            <span key={i} className="px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded text-[9px] font-mono border border-neutral-200">{kw}</span>
          ))}
        </div>
      )}
      {data.replyToComment && (
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">
          <Repeat size={9} /><span>Auto-reply active</span>
        </div>
      )}
    </div>
    <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white" />
  </div>
);

const DelayNode = ({ data, selected }: any) => (
  <div className={cn(
    "w-full h-full shadow-xl rounded-2xl border bg-white overflow-hidden flex flex-col min-h-[80px] min-w-[150px]",
    selected ? "border-purple-500 ring-4 ring-purple-500/10" : "border-neutral-200"
  )}>
    <NodeResizer minWidth={150} minHeight={80} isVisible={selected} lineClassName="border-purple-400" handleClassName="h-3 w-3 bg-white border-2 border-purple-400 rounded-full shadow-lg" />
    <div className="bg-purple-600 px-3 py-2 flex items-center gap-2 text-white shrink-0">
      <Clock size={12} />
      <span className="text-[10px] font-black uppercase tracking-wider">Delay</span>
    </div>
    <div className="p-3 flex-1 flex items-center justify-center">
      <div className="bg-purple-50 px-4 py-2 rounded-xl border border-purple-100 text-center">
        <p className="text-base font-black text-purple-700">{data.duration || '24 hrs'}</p>
        <p className="text-[9px] text-purple-400 font-bold uppercase tracking-widest">Wait Time</p>
      </div>
    </div>
    <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white" />
    <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white" />
  </div>
);

const AINode = ({ data, selected }: any) => (
  <div className={cn(
    "w-full h-full shadow-xl rounded-2xl border bg-white overflow-hidden flex flex-col min-h-[80px] min-w-[150px]",
    selected ? "border-fuchsia-500 ring-4 ring-fuchsia-500/10" : "border-neutral-200"
  )}>
    <NodeResizer minWidth={150} minHeight={80} isVisible={selected} lineClassName="border-fuchsia-400" handleClassName="h-3 w-3 bg-white border-2 border-fuchsia-400 rounded-full shadow-lg" />
    <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 px-3 py-2 flex items-center gap-2 text-white shrink-0">
      <Zap size={12} fill="white" />
      <span className="text-[10px] font-black uppercase tracking-wider">AI Intent</span>
    </div>
    <div className="p-3 flex-1 overflow-y-auto">
      <div className="bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-100">
        <p className="text-xs text-neutral-500 leading-relaxed font-medium italic">
          "{data.prompt || 'Analyze intent and reply accordingly...'}"
        </p>
      </div>
    </div>
    <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-fuchsia-500 !border-2 !border-white" />
    <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-fuchsia-500 !border-2 !border-white" />
  </div>
);

const MOCK_POSTS = [
  { id: 'p1', thumbnail: 'https://images.unsplash.com/photo-1621609764095-b32bbe35cf3a?q=80&w=400&h=533&auto=format&fit=crop', timestamp: '14 hours ago', caption: "Comment 'REMEDIES' to get the list!" },
  { id: 'p2', thumbnail: 'https://images.unsplash.com/photo-1633533402095-2313d4218a4d?q=80&w=400&h=533&auto=format&fit=crop', timestamp: '17 hours ago', caption: "New collection dropping tonight. Comment 'START'." },
  { id: 'p3', thumbnail: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=400&h=533&auto=format&fit=crop', timestamp: '20 hours ago', caption: "The best ingredients for health. Tag a friend!" },
  { id: 'p4', thumbnail: 'https://images.unsplash.com/photo-1611262588019-db6cc2032da3?q=80&w=400&h=533&auto=format&fit=crop', timestamp: '2 days ago', caption: "Comment REMEDY below for our free guide." },
  { id: 'p5', thumbnail: 'https://images.unsplash.com/photo-1611162617263-4ec3060a058e?q=80&w=400&h=533&auto=format&fit=crop', timestamp: '3 days ago', caption: "Weekly wrap up! Who's ready for Monday?" },
  { id: 'p6', thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&h=533&auto=format&fit=crop', timestamp: '4 days ago', caption: "Business tips for creators. DM for more." },
  { id: 'p7', thumbnail: 'https://images.unsplash.com/photo-1611162616475-46b635cbca35?q=80&w=400&h=533&auto=format&fit=crop', timestamp: '1 week ago', caption: "Join our masterclass!" },
  { id: 'p8', thumbnail: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?q=80&w=400&h=533&auto=format&fit=crop', timestamp: '1 week ago', caption: "Weekend vibes." },
];

const nodeTypes = { messageNode: MessageNode, triggerNode: TriggerNode, delayNode: DelayNode, aiNode: AINode };

// ─── Container ────────────────────────────────────────────────────────────────

export default function FlowBuilderContainer(props: FlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowBuilder {...props} />
    </ReactFlowProvider>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function FlowBuilder({ flowId: initialFlowId, templateId, onBack }: FlowBuilderProps) {
  const { activeWorkspace } = useAuth();
  const [flowId, setFlowId] = useState<string | null>(initialFlowId || null);
  const [flowName, setFlowName] = useState('New Automation Flow');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeTab, setActiveTab] = useState<'nodes' | 'templates' | 'properties'>('nodes');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isPanelOpen, setIsPanelOpen] = useState(window.innerWidth >= 1024);
  const [showPostModal, setShowPostModal] = useState(false);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < 1024
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);

  // ── Template data ──
  const getTemplateData = (id: string) => {
    const base = (nodes: any[], edges: any[]) => ({ nodes, edges });
    switch (id) {
      case 'grow-email-list': return base(
        [
          { id: 't1', type: 'triggerNode', data: { type: 'comment', postType: 'any', keywords: ['EMAIL'], trigger: 'Keyword: EMAIL' }, position: { x: 400, y: 50 }, style: { width: 180, height: 130 } },
          { id: 'm1', type: 'messageNode', data: { type: 'email_capture', label: "I'd love to send you the guide! What's your best email address?", buttons: [] }, position: { x: 400, y: 200 }, style: { width: 200, height: 140 } },
          { id: 'd1', type: 'delayNode', data: { duration: '5 min' }, position: { x: 400, y: 360 }, style: { width: 150, height: 100 } },
          { id: 'm2', type: 'messageNode', data: { type: 'dm', label: "Just checking in, did you get a chance to type your email?", buttons: [] }, position: { x: 400, y: 480 }, style: { width: 200, height: 140 } }
        ],
        [{ id: 'e1', source: 't1', target: 'm1', animated: true }, { id: 'e2', source: 'm1', target: 'd1' }, { id: 'e3', source: 'd1', target: 'm2' }]
      );
      case 'auto-dm-comments': return base(
        [
          { id: 't1', type: 'triggerNode', data: { type: 'comment', postType: 'any', keywords: ['LINK'], trigger: 'Comment: LINK' }, position: { x: 400, y: 50 }, style: { width: 180, height: 130 } },
          { id: 'm1', type: 'messageNode', data: { type: 'link_delivery', label: "Here is the exclusive link you requested!", buttons: [{ label: 'Get Link', type: 'external_link', link: 'https://example.com' }] }, position: { x: 400, y: 200 }, style: { width: 200, height: 160 } }
        ],
        [{ id: 'e1', source: 't1', target: 'm1', animated: true }]
      );
      case 'respond-dms': return base(
        [
          { id: 't1', type: 'triggerNode', data: { type: 'dm', trigger: 'Any DM' }, position: { x: 400, y: 50 }, style: { width: 180, height: 90 } },
          { id: 'm1', type: 'messageNode', data: { type: 'dm', label: "Thanks for reaching out! A member of our team will get back to you soon.", buttons: [] }, position: { x: 400, y: 200 }, style: { width: 200, height: 140 } }
        ],
        [{ id: 'e1', source: 't1', target: 'm1', animated: true }]
      );
      case 'automate-ai': return base(
        [
          { id: 't1', type: 'triggerNode', data: { type: 'dm', trigger: 'Customer Query' }, position: { x: 400, y: 50 }, style: { width: 180, height: 90 } },
          { id: 'ai1', type: 'aiNode', data: { prompt: 'You are a helpful customer support agent. Answer common questions about shipping, returns, and product availability.' }, position: { x: 400, y: 200 }, style: { width: 200, height: 140 } },
          { id: 'm1', type: 'messageNode', data: { type: 'dm', label: "I've analyzed your request. Here's what I found...", buttons: [] }, position: { x: 400, y: 360 }, style: { width: 200, height: 140 } }
        ],
        [{ id: 'e1', source: 't1', target: 'ai1' }, { id: 'e2', source: 'ai1', target: 'm1' }]
      );
      default: return base(
        [
          { id: 't1', type: 'triggerNode', data: { type: 'comment', postType: 'any', keywords: ['START'], trigger: 'Trigger' }, position: { x: 400, y: 50 }, style: { width: 180, height: 130 } },
          { id: 'm1', type: 'messageNode', data: { type: 'dm', label: 'Hello! This is your custom automation.', buttons: [] }, position: { x: 400, y: 250 }, style: { width: 200, height: 140 } }
        ],
        [{ id: 'e1', source: 't1', target: 'm1', animated: true }]
      );
    }
  };

  // ── Init flow ──
  useEffect(() => {
    if (!activeWorkspace) return;
    const init = async () => {
      if (flowId) {
        try {
          const snap = await getDoc(doc(db, 'workspaces', activeWorkspace.id, 'flows', flowId));
          if (snap.exists()) {
            const d = snap.data();
            if (d.nodes) setNodes(d.nodes);
            if (d.edges) setEdges(d.edges);
            if (d.name) setFlowName(d.name);
          }
        } catch (e) { console.warn('Error loading flow', e); }
      } else if (templateId) {
        const d = getTemplateData(templateId);
        setNodes(d.nodes);
        setEdges(d.edges);
        const tpl = ALL_TEMPLATES.find(t => t.id === templateId);
        setFlowName(tpl ? `Flow: ${tpl.title}` : `Flow: ${templateId}`);
      }
    };
    init();
  }, [activeWorkspace, flowId, templateId]);

  // ── fitView after load ──
  useEffect(() => {
    if (nodes.length > 0) {
      const t = setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 500);
      return () => clearTimeout(t);
    }
  }, [flowId, templateId]);

  // ── Auto-save ──
  useEffect(() => {
    if (!activeWorkspace) return;
    if (nodes.length <= 1 && edges.length === 0 && flowName === 'New Automation Flow') return;
    setSaveStatus('saving');
    const t = setTimeout(() => saveFlow('draft'), 2000);
    return () => clearTimeout(t);
  }, [nodes, edges, flowName]);

  // Aggressively remove ReactFlow attribution from DOM
  useEffect(() => {
    const removeAttribution = () => {
      document.querySelectorAll(
        '.react-flow__attribution, a[href*="reactflow.dev"], a[href*="xyflow.com"]'
      ).forEach(el => (el as HTMLElement).remove());
    };

    removeAttribution();

    const observer = new MutationObserver(removeAttribution);
    const container = document.querySelector('.react-flow');
    if (container) {
      observer.observe(container, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, []); // runs once on mount, observer handles any re-injection

  // ── Handlers ──
  const onConnect = useCallback((params: Connection) => {
    if (params.source === params.target) return;
    setEdges(eds => addEdge({ ...params, animated: true }, eds));
  }, [setEdges]);

  const isValidConnection = useCallback((c: Connection) => c.source !== c.target, []);
  const onEdgeReconnect = useCallback((old: any, next: any) => setEdges(els => reconnectEdge(old, next, els)), []);
  const onNodeClick = useCallback((_: any, node: Node) => { 
    setSelectedNodeId(node.id); 
    setSelectedEdgeId(null);
  }, []);
  const onNodeDoubleClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
    setActiveTab('properties'); 
    setIsPanelOpen(true);
  }, []);
  const onEdgeClick = useCallback((_: any, edge: Edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  }, []);
  const onPaneClick = useCallback(() => { 
    setSelectedNodeId(null); 
    setSelectedEdgeId(null);
    if (activeTab === 'properties') setActiveTab('nodes'); 
  }, [activeTab]);

  const deleteSelectedEdge = () => {
    if (!selectedEdgeId) return;
    setEdges(eds => eds.filter(e => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  };

  const updateNodeData = (newData: any) => {
    if (!selectedNodeId) return;
    setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, ...newData } } : n));
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setNodes(nds => nds.filter(n => n.id !== selectedNodeId));
    setEdges(eds => eds.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
    setActiveTab('nodes');
  };

  const saveFlow = async (status: 'draft' | 'active' = 'draft') => {
    if (!activeWorkspace) { setSaveStatus('error'); return; }
    if (status === 'active') setPublishing(true); else setSaving(true);
    setSaveStatus('saving');
    const currentFlowId = flowId || `flow-${Date.now()}`;
    const path = `workspaces/${activeWorkspace.id}/flows/${currentFlowId}`;
    try {
      await setDoc(doc(db, path), { id: currentFlowId, workspaceId: activeWorkspace.id, name: flowName, nodes, edges, status, updatedAt: serverTimestamp() }, { merge: true });
      if (!flowId) setFlowId(currentFlowId);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      setSaveStatus('error');
      handleFirestoreError(e, OperationType.WRITE, path);
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  const addNode = (type: string, data: any = {}) => {
    const id = Date.now().toString();
    const last = nodes[nodes.length - 1];
    
    // Auto-sizing logic: don't force height so content renders fully
    const style = type === 'triggerNode' ? { width: 180 } : type === 'delayNode' ? { width: 150 } : { width: 220 };
    
    const x = last ? last.position.x : 300;
    const y = last ? last.position.y + 200 : 100;
    setNodes(nds => [...nds, { id, type, position: { x, y }, data, style }]);
    if (window.innerWidth < 1024) setIsPanelOpen(false);
    
    // Focus on new node
    setTimeout(() => {
      setSelectedNodeId(id);
      setActiveTab('properties');
      setIsPanelOpen(true);
    }, 100);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  // Shared top bar button height
  const TOP_BTN = "h-10 rounded-2xl flex items-center justify-center font-black uppercase text-[10px] transition-all shadow-lg";

  return (
    <div className="h-full w-full flex overflow-hidden relative bg-[#F8F9FA]">

      {/* ── Side Panel ── */}
      <div className={cn(
        "h-full border-r border-neutral-200 bg-white flex flex-col overflow-hidden shadow-2xl transition-all duration-300",
        isPanelOpen
          ? (isMobile ? "fixed inset-0 w-full z-[100]" : "relative w-96 z-40")
          : "w-0 opacity-0 pointer-events-none overflow-hidden"
      )}>
        {/* Panel Tabs */}
        <div className="flex border-b border-neutral-100 h-14 shrink-0 px-2">
          {(['nodes', 'templates', ...(selectedNodeId ? ['properties'] : [])] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)}
              className={cn("flex-1 text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab ? "text-blue-600 border-b-2 border-blue-600" : "text-neutral-400 hover:text-neutral-600")}>
              {tab === 'nodes' ? 'Steps' : tab === 'templates' ? 'Library' : 'Config'}
            </button>
          ))}
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* STEPS TAB */}
          {activeTab === 'nodes' && (
            <div className="space-y-6">
              <div>
                <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest mb-3 text-center">Primary Actions</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: 'Send Message', sub: 'DMs, Replies, Buttons', type: 'messageNode', data: { label: 'Hello! I am your automation assistant.', type: 'dm', buttons: [] }, color: 'bg-blue-100 text-blue-600', icon: MessageSquare },
                    { label: 'Smart Delay', sub: 'Custom wait time', type: 'delayNode', data: { duration: '24 hrs' }, color: 'bg-purple-100 text-purple-600', icon: Clock },
                    { label: 'AI Response', sub: 'Intent analysis', type: 'aiNode', data: { prompt: 'Analyze intent and reply' }, color: 'bg-fuchsia-100 text-fuchsia-600', icon: Zap },
                  ].map(item => (
                    <button key={item.label} onClick={() => addNode(item.type, item.data)}
                      className="flex items-center gap-3 p-3.5 rounded-2xl border border-neutral-100 bg-neutral-50/50 hover:bg-white hover:shadow-lg transition-all group">
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform", item.color)}>
                        <item.icon size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-neutral-800">{item.label}</p>
                        <p className="text-[10px] text-neutral-400">{item.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest mb-3 text-center">Triggers</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'DM', icon: MessageSquare, type: 'dm' },
                    { label: 'Story Reply', icon: Zap, type: 'story_reply' },
                    { label: 'Comments', icon: MessageSquare, type: 'comment' },
                  ].map(t => (
                    <button key={t.label}
                      onClick={() => addNode('triggerNode', { type: t.type, postType: 'any', keywords: ['START'], trigger: `${t.label} Trigger` })}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-neutral-200 hover:border-amber-400 hover:shadow-lg transition-all">
                      <div className="p-2 bg-amber-50 text-amber-500 rounded-lg"><t.icon size={18} /></div>
                      <span className="text-[10px] font-black uppercase text-neutral-600">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LIBRARY TAB */}
          {activeTab === 'templates' && (
            <div className="space-y-3">
              {ALL_TEMPLATES.map(tpl => (
                <button key={tpl.id}
                  onClick={() => { const d = getTemplateData(tpl.id); setNodes(d.nodes); setEdges(d.edges); setFlowName(`Template: ${tpl.title}`); }}
                  className="w-full text-left p-4 rounded-2xl border border-neutral-200 bg-white hover:border-blue-600 hover:shadow-xl transition-all">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", tpl.color)}>
                      <tpl.icon size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-neutral-900">{tpl.title}</h4>
                      <p className="text-[10px] text-neutral-400 line-clamp-1">{tpl.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* CONFIG TAB */}
          {activeTab === 'properties' && selectedNode && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-neutral-900 text-white rounded-xl flex items-center justify-center">
                    <Settings2 size={18} />
                  </div>
                  <h3 className="text-base font-black text-neutral-900">Configuration</h3>
                </div>
                <button onClick={deleteSelectedNode} className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                  <Trash2 size={18} />
                </button>
              </div>

              {/* TRIGGER CONFIG */}
              {selectedNode.type === 'triggerNode' && (
                <div className="space-y-5">
                  <div>
                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2 block">Post Targeting</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'any', label: 'ANY' },
                        { id: 'specific', label: 'SPECIFIC' },
                        { id: 'next', label: 'NEXT' }
                      ].map(pt => (
                        <button key={pt.id} onClick={() => updateNodeData({ postType: pt.id })}
                          className={cn("py-2.5 rounded-xl border text-[9px] px-1 font-black uppercase transition-all flex items-center justify-center text-center leading-none h-10",
                            selectedNode.data.postType === pt.id ? "bg-amber-500 border-amber-600 text-white" : "bg-white border-neutral-200 text-neutral-400")}>
                          {pt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedNode.data.postType === 'specific' && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Select Post</label>
                        <button onClick={() => setShowPostModal(true)} className="text-[10px] font-black text-blue-600 uppercase hover:underline">Show All</button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {MOCK_POSTS.slice(0, 4).map(post => (
                          <button key={post.id} 
                            onClick={() => updateNodeData({ selectedPostId: post.id })}
                            className={cn(
                              "aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all relative group",
                              selectedNode.data.selectedPostId === post.id ? "border-blue-500 ring-2 ring-blue-500/10 scale-105" : "border-transparent opacity-60 hover:opacity-100"
                            )}
                          >
                            <img src={post.thumbnail} className="w-full h-full object-cover" alt="" />
                            {selectedNode.data.selectedPostId === post.id && (
                              <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                <div className="h-4 w-4 bg-blue-500 rounded-full border-2 border-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2 block">Keywords (Max 10)</label>
                    <div className="space-y-2">
                      {selectedNode.data.keywords?.map((kw: string, idx: number) => (
                        <div key={idx} className="flex gap-2">
                          <input type="text" value={kw}
                            onChange={e => { const k = [...(selectedNode.data.keywords || [])]; k[idx] = e.target.value; updateNodeData({ keywords: k }); }}
                            className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none" />
                          <button onClick={() => updateNodeData({ keywords: selectedNode.data.keywords.filter((_: any, i: number) => i !== idx) })}
                            className="p-2 text-neutral-300 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      ))}
                      {(selectedNode.data.keywords?.length || 0) < 10 && (
                        <button onClick={() => updateNodeData({ keywords: [...(selectedNode.data.keywords || []), 'KEYWORD'] })}
                          className="w-full py-2.5 border-2 border-dashed border-neutral-100 rounded-xl text-neutral-400 text-xs font-bold hover:border-amber-200 flex items-center justify-center gap-2">
                          <Plus size={13} /> Add Keyword
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-neutral-800">Auto-reply to comment</p>
                        <p className="text-[10px] text-neutral-400">Reply publicly under their post</p>
                      </div>
                      <button onClick={() => updateNodeData({ replyToComment: !selectedNode.data.replyToComment })}
                        className={cn("w-11 h-6 rounded-full transition-all relative flex items-center px-1",
                          selectedNode.data.replyToComment ? "bg-emerald-500" : "bg-neutral-200")}>
                        <div className={cn("w-4 h-4 bg-white rounded-full transition-all shadow-sm", selectedNode.data.replyToComment ? "translate-x-5" : "translate-x-0")} />
                      </button>
                    </div>
                    {selectedNode.data.replyToComment && (
                      <div className="mt-3 space-y-2">
                        {selectedNode.data.replies?.map((r: string, idx: number) => (
                          <div key={idx} className="relative">
                            <textarea value={r}
                              onChange={e => { const nr = [...(selectedNode.data.replies || [])]; nr[idx] = e.target.value; updateNodeData({ replies: nr }); }}
                              placeholder={`Variant ${idx + 1}...`}
                              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 pr-9 text-xs outline-none" />
                            <button onClick={() => { const nr = [...(selectedNode.data.replies || [])]; nr.splice(idx, 1); updateNodeData({ replies: nr }); }}
                              className="absolute right-2 top-2 text-neutral-300 hover:text-red-500"><Trash2 size={13} /></button>
                          </div>
                        ))}
                        {(selectedNode.data.replies?.length || 0) < 5 && (
                          <button onClick={() => updateNodeData({ replies: [...(selectedNode.data.replies || []), ''] })}
                            className="w-full py-2 border border-emerald-100 rounded-xl text-emerald-600 text-[10px] font-black uppercase hover:bg-emerald-50">
                            + Add Variant
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MESSAGE CONFIG */}
              {selectedNode.type === 'messageNode' && (
                <div className="space-y-5">
                  <div>
                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2 block">Message Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'dm', label: 'Standard DM', icon: MessageSquare, content: "Hello! How can we help you today?" },
                        { id: 'follow_check', label: 'Follow Guard', icon: UserPlus, content: "Please make sure you're following our profile." },
                        { id: 'email_capture', label: 'Email Opt-in', icon: Mail, content: "Please reply with your email address." },
                        { id: 'link_delivery', label: 'Link Send', icon: LinkIcon, content: "Here is the exclusive link I promised!" }
                      ].map(t => (
                        <button key={t.id}
                          onClick={() => { const u: any = { type: t.id, label: t.content }; if (t.id === 'follow_check' && !selectedNode.data.buttons?.length) u.buttons = [{ label: 'Follow Profile', type: 'external_link', link: `https://instagram.com/${activeWorkspace?.name || 'profile'}` }]; updateNodeData(u); }}
                          className={cn("flex items-center gap-2 p-3 rounded-xl border text-[10px] font-bold transition-all",
                            selectedNode.data.type === t.id ? "bg-blue-600 border-blue-700 text-white" : "bg-white border-neutral-200 text-neutral-400")}>
                          <t.icon size={13} />{t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2 block">Message Content</label>
                    <textarea value={selectedNode.data.label}
                      onChange={e => updateNodeData({ label: e.target.value })}
                      placeholder="Type your message..."
                      className="w-full h-28 bg-neutral-50 border border-neutral-200 rounded-2xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Buttons</label>
                      <span className="text-[9px] text-neutral-300 font-mono">Max 3</span>
                    </div>
                    <div className="space-y-3">
                      {selectedNode.data.buttons?.map((btn: any, idx: number) => (
                        <div key={idx} className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase text-neutral-300">Button #{idx + 1}</span>
                            <button onClick={() => updateNodeData({ buttons: selectedNode.data.buttons.filter((_: any, i: number) => i !== idx) })}
                              className="text-neutral-300 hover:text-red-500"><Trash2 size={13} /></button>
                          </div>
                          <input type="text" maxLength={25} value={btn.label} placeholder="Button Label"
                            onChange={e => { const b = [...selectedNode.data.buttons]; b[idx].label = e.target.value; updateNodeData({ buttons: b }); }}
                            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-bold outline-none" />
                          <div className="flex gap-2">
                            {['next_step', 'external_link'].map(t => (
                              <button key={t}
                                onClick={() => { const b = [...selectedNode.data.buttons]; b[idx].type = t; updateNodeData({ buttons: b }); }}
                                className={cn("flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                                  btn.type === t ? (t === 'next_step' ? "bg-neutral-900 border-neutral-900 text-white" : "bg-blue-600 border-blue-600 text-white") : "bg-white border-neutral-200 text-neutral-400")}>
                                {t === 'next_step' ? 'Next Step' : 'Website'}
                              </button>
                            ))}
                          </div>
                          {btn.type === 'external_link' && (
                            <input type="url" value={btn.link} placeholder="https://..."
                              onChange={e => { const b = [...selectedNode.data.buttons]; b[idx].link = e.target.value; updateNodeData({ buttons: b }); }}
                              className="w-full px-3 py-2 bg-white border border-blue-100 rounded-lg text-xs outline-none" />
                          )}
                        </div>
                      ))}
                      {(selectedNode.data.buttons?.length || 0) < 3 && (
                        <button onClick={() => updateNodeData({ buttons: [...(selectedNode.data.buttons || []), { label: 'New Button', type: 'next_step' }] })}
                          className="w-full py-3 border-2 border-dashed border-neutral-100 rounded-2xl text-neutral-400 text-xs font-black uppercase hover:border-blue-200 transition-all">
                          + Add Button
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* DELAY CONFIG */}
              {selectedNode.type === 'delayNode' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {['Instant', '5 min', '30 min', '1 hr', '24 hrs', 'Next Day'].map(d => (
                      <button key={d} onClick={() => updateNodeData({ duration: d })}
                        className={cn("p-3.5 rounded-2xl border text-xs font-black transition-all",
                          selectedNode.data.duration === d ? "bg-purple-600 border-purple-700 text-white shadow-lg" : "bg-neutral-50 border-neutral-100 text-neutral-400 hover:border-purple-200")}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel Footer */}
        <div className="p-4 border-t border-neutral-100 flex gap-3 shrink-0">
          <button onClick={() => setIsPanelOpen(false)}
            className="flex-1 h-12 flex items-center justify-center gap-2 bg-white border border-neutral-200 rounded-xl text-[11px] font-black uppercase text-neutral-700 hover:border-neutral-400 transition-all">
            Close
          </button>
          <button onClick={() => saveFlow('active')} disabled={publishing}
            className={cn("flex-1 h-12 flex items-center justify-center gap-2 text-white rounded-xl text-[11px] font-black uppercase shadow-lg transition-all",
              saveStatus === 'saved' && !publishing ? "bg-emerald-600" : "bg-blue-600 hover:bg-blue-700")}>
            {publishing ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} fill="white" />}
            {saveStatus === 'saved' && !publishing ? 'Active ✨' : 'Publish'}
          </button>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div className="flex-1 relative overflow-hidden bg-[#F8F9FA]">
        <style>{`
          .react-flow__attribution { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; position: absolute !important; z-index: -9999 !important; height: 0 !important; width: 0 !important; overflow: hidden !important; }
          .react-flow__attribution * { display: none !important; }
          a[href*="reactflow.dev"], a[href*="xyflow.com"], [class*="attribution"] { display: none !important; opacity: 0 !important; pointer-events: none !important; }
          .react-flow__edge.selected .react-flow__edge-path { stroke: #3b82f6 !important; stroke-width: 4px !important; }
          .react-flow__edge:hover .react-flow__edge-path { stroke: #60a5fa !important; stroke-width: 3px !important; }
        `}</style>

        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} onEdgeReconnect={onEdgeReconnect}
          isValidConnection={isValidConnection}
          onNodeClick={onNodeClick} onNodeDoubleClick={onNodeDoubleClick} onEdgeClick={onEdgeClick} onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView snapToGrid snapGrid={[20, 20]}
          reconnectMode="around"
          deleteKeyCode={["Backspace", "Delete"]}
          className="bg-transparent"
          nodesDraggable edgesUpdatable edgesFocusable
          connectionRadius={50}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ animated: true, style: { stroke: '#94A3B8', strokeWidth: 2.5 }, type: 'smoothstep', selectable: true }}
        >
          <Background variant={BackgroundVariant.Lines} color="#e5e7eb" gap={20} size={1} />

          {/* Empty state — REMOVED AS REQUESTED */}

        {/* ── Top Bar ── only back button */}
          <Panel position="top-left" className="m-3">
            <button onClick={onBack} 
              className="h-10 w-10 bg-white border border-neutral-200 shadow-lg rounded-2xl flex items-center justify-center text-neutral-500 hover:text-neutral-800 transition-colors shrink-0">
              <ChevronLeft size={16} />
            </button>
          </Panel>

          <Panel position="top-right" className="m-3 flex items-center gap-2">
            {/* Save — icon only on mobile, icon+text on desktop */}
            <button onClick={() => saveFlow('draft')} disabled={saving}
              className="h-10 px-3 sm:px-4 bg-white border border-neutral-200 text-neutral-900 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:shadow-xl transition-all flex items-center gap-1.5">
              {saving ? <Loader2 className="animate-spin" size={14} /> : saveStatus === 'saved' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Save size={14} />}
              <span className="hidden sm:inline">{saveStatus === 'saved' && !saving ? 'Saved' : 'Save'}</span>
            </button>
            {/* Publish */}
            <button onClick={() => saveFlow('active')} disabled={publishing}
              className="h-10 px-3 sm:px-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-blue-700 transition-all flex items-center gap-1.5">
              {publishing ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} fill="white" />}
              <span>Publish</span>
            </button>
          </Panel>
        </ReactFlow>

        {/* ── Floating Zoom Controls — fixed bottom-left ── */}
        <div className="absolute bottom-14 sm:bottom-6 left-4 z-50 flex flex-col gap-1.5 transition-all">
          <button onClick={() => zoomIn({ duration: 300 })}
            className="h-9 w-9 bg-white border border-neutral-200 rounded-xl shadow-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-50 active:scale-95 transition-all"
            title="Zoom In">
            <Plus size={16} />
          </button>
          <button onClick={() => zoomOut({ duration: 300 })}
            className="h-9 w-9 bg-white border border-neutral-200 rounded-xl shadow-lg flex items-center justify-center text-neutral-700 font-bold text-lg leading-none hover:bg-neutral-50 active:scale-95 transition-all"
            title="Zoom Out">
            <Minus size={16} />
          </button>
          <button onClick={() => fitView({ duration: 500, padding: 0.2 })}
            className="h-9 w-9 bg-white border border-neutral-200 rounded-xl shadow-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-50 active:scale-95 transition-all"
            title="Fit View">
            <Layers size={15} />
          </button>
        </div>

        {/* ── Edge Delete Overlay Mobile ── */}
        <AnimatePresence>
          {selectedEdgeId && (
            <Panel position="bottom-center" className="mb-24 sm:mb-10 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="pointer-events-auto bg-neutral-900 text-white px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-md"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Connection Selected</p>
                <div className="w-[1px] h-4 bg-white/20" />
                <button 
                  onClick={deleteSelectedEdge}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-xl text-[10px] font-black uppercase transition-all"
                >
                  <Trash2 size={14} />
                  Delete Line
                </button>
                <button 
                  onClick={() => setSelectedEdgeId(null)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={14} />
                </button>
              </motion.div>
            </Panel>
          )}
        </AnimatePresence>

        {/* ── Config Panel Toggle ── */}
        <button
          onClick={() => setIsPanelOpen(p => !p)}
          className={cn(
            "absolute bottom-14 sm:bottom-6 right-4 z-50 h-12 w-12 rounded-2xl shadow-xl flex items-center justify-center transition-all active:scale-95",
            isPanelOpen ? "bg-white text-neutral-600 border border-neutral-200 shadow-2xl" : "bg-blue-600 text-white"
          )}
          title={isPanelOpen ? "Close Panel" : "Open Panel"}>
          {isPanelOpen ? <X size={20} /> : <Settings2 size={20} />}
        </button>

        {/* ── Post Selector Modal ── */}
        <AnimatePresence>
          {showPostModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setShowPostModal(false)}
                className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
              >
                <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-neutral-900">Pick any post or reel to automate</h2>
                    <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest">Last 90 Days</p>
                  </div>
                  <button onClick={() => setShowPostModal(false)} className="h-10 w-10 bg-neutral-50 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-4">
                    {MOCK_POSTS.concat(MOCK_POSTS).map((post, idx) => (
                      <button 
                        key={`${post.id}-${idx}`}
                        onClick={() => {
                          updateNodeData({ selectedPostId: post.id });
                          setShowPostModal(false);
                        }}
                        className={cn(
                          "group text-left space-y-2 relative transition-all active:scale-95",
                          selectedNode?.data.selectedPostId === post.id ? "scale-[0.98]" : ""
                        )}
                      >
                        <div className={cn(
                          "aspect-[3/4] rounded-2xl overflow-hidden relative border-4 transition-all",
                          selectedNode?.data.selectedPostId === post.id ? "border-blue-500" : "border-transparent group-hover:border-neutral-200"
                        )}>
                          <img src={post.thumbnail} className="w-full h-full object-cover" alt="" />
                          <div className="absolute top-2 right-2 h-6 w-6 bg-black/40 backdrop-blur-md rounded-lg flex items-center justify-center">
                            <Layers size={12} className="text-white" />
                          </div>
                          {selectedNode?.data.selectedPostId === post.id && (
                            <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                              <div className="h-8 w-8 bg-blue-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center">
                                <CheckCircle2 size={16} className="text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="px-1">
                          <p className="text-[11px] font-bold text-neutral-800 line-clamp-1">{post.caption}</p>
                          <p className="text-[9px] text-neutral-400 font-medium">{post.timestamp}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}