import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  Panel
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { 
  MessageSquare, 
  Zap, 
  Clock, 
  Split, 
  Save, 
  Play,
  Plus,
  Trash2,
  ChevronRight,
  Settings2,
  Instagram,
  Facebook,
  Loader2,
  CheckCircle2,
  X,
  Smartphone,
  ExternalLink,
  Mail,
  UserPlus,
  Link as LinkIcon,
  Languages,
  Repeat
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { ALL_TEMPLATES } from '../../constants/templates';

// --- Types & Interfaces ---

interface ButtonData {
  label: string;
  type: 'next_step' | 'external_link';
  link?: string;
}

interface TriggerData {
  type: 'comment' | 'dm' | 'follow' | 'story_reply' | 'live_comment';
  postType: 'any' | 'specific' | 'next';
  keywords: string[];
  replyToComment: boolean;
  replies: string[];
  trigger: string;
}

interface MessageData {
  type: 'dm' | 'follow_check' | 'email_capture' | 'link_delivery';
  label: string;
  buttons: ButtonData[];
  followUpId?: string;
}

// --- Custom Node Components ---

const MessageNode = ({ data, selected }: any) => {
  return (
    <div className={cn(
      "w-[260px] shadow-xl rounded-2xl border bg-white overflow-hidden transition-all duration-300",
      selected ? "border-blue-500 ring-4 ring-blue-500/10 scale-[1.02]" : "border-neutral-200"
    )}>
      <div className="bg-blue-600 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <MessageSquare size={14} className="fill-white/20" />
          <span className="text-[11px] font-black uppercase tracking-wider">Message</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="min-h-[60px] flex flex-col justify-center">
          <p className="text-xs text-neutral-600 leading-relaxed">
            {data.label || 'Enter your message here...'}
          </p>
        </div>
        
        {data.buttons?.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-neutral-50">
            {data.buttons.map((btn: any, i: number) => (
              <div 
                key={i} 
                className="w-full py-2 px-3 bg-neutral-50 border border-neutral-100 rounded-lg text-[10px] font-bold text-neutral-500 flex items-center justify-between group"
              >
                <span className="truncate max-w-[150px]">{btn.label}</span>
                {btn.type === 'external_link' ? <ExternalLink size={10} /> : <ChevronRight size={10} />}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-1.5 pt-2">
          <div className={cn(
            "px-2 py-1 rounded-md text-[9px] font-bold uppercase",
            data.type === 'follow_check' ? "bg-purple-100 text-purple-600" :
            data.type === 'email_capture' ? "bg-teal-100 text-teal-600" :
            "bg-blue-100 text-blue-600"
          )}>
            {data.type?.replace('_', ' ') || 'standard dm'}
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white shadow-sm" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white shadow-sm" />
    </div>
  );
};

const TriggerNode = ({ data, selected }: any) => {
  return (
    <div className={cn(
      "w-[260px] shadow-xl rounded-2xl border bg-white overflow-hidden transition-all duration-300",
      selected ? "border-amber-500 ring-4 ring-amber-500/10 scale-[1.02]" : "border-neutral-200"
    )}>
      <div className="bg-amber-500 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Zap size={14} fill="currentColor" />
          <span className="text-[11px] font-black uppercase tracking-wider">Trigger</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="text-[9px] text-neutral-400 font-black uppercase tracking-widest mb-1">
             On {data.type === 'comment' ? 'Comment' : 'Interaction'}
          </p>
          <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
            <p className="text-xs font-bold text-amber-900 line-clamp-2">
              {data.postType === 'specific' ? 'Specific Post' : 
               data.postType === 'next' ? 'Next Post' : 'Any Post'}
            </p>
          </div>
        </div>

        {data.keywords?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.keywords.map((kw: string, i: number) => (
              <span key={i} className="px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded text-[9px] font-mono border border-neutral-200">
                {kw}
              </span>
            ))}
          </div>
        )}

        {data.replyToComment && (
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">
            <Repeat size={10} />
            <span>Auto-reply active</span>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white shadow-sm" />
    </div>
  );
};

const DelayNode = ({ data, selected }: any) => {
  return (
    <div className={cn(
      "w-[220px] shadow-xl rounded-2xl border bg-white overflow-hidden transition-all duration-300",
      selected ? "border-purple-500 ring-4 ring-purple-500/10 scale-[1.02]" : "border-neutral-200"
    )}>
      <div className="bg-purple-600 px-4 py-2 flex items-center gap-2 text-white">
        <Clock size={14} />
        <span className="text-[11px] font-black uppercase tracking-wider">Delay</span>
      </div>
      <div className="p-4">
        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-center">
          <p className="text-lg font-black text-purple-700">{data.duration || '24 hrs'}</p>
          <p className="text-[9px] text-purple-400 font-bold uppercase tracking-widest mt-1">Wait Time</p>
        </div>
      </div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white shadow-sm" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white shadow-sm" />
    </div>
  );
};

const AINode = ({ data, selected }: any) => {
  return (
    <div className={cn(
      "w-[260px] shadow-xl rounded-2xl border bg-white overflow-hidden transition-all duration-300",
      selected ? "border-fuchsia-500 ring-4 ring-fuchsia-500/10 scale-[1.02]" : "border-neutral-200"
    )}>
      <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 px-4 py-2 flex items-center gap-2 text-white">
        <Zap size={14} fill="white" />
        <span className="text-[11px] font-black uppercase tracking-wider">AI Intent</span>
      </div>
      <div className="p-4 space-y-2">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Model Context</p>
        <p className="text-xs text-neutral-500 italic line-clamp-3 bg-neutral-50 p-2 rounded-lg border border-neutral-100">
          "{data.prompt || 'Analyze intent and reply accordingly...'}"
        </p>
      </div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-fuchsia-500 !border-2 !border-white shadow-sm" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-fuchsia-500 !border-2 !border-white shadow-sm" />
    </div>
  );
};

const nodeTypes = {
  messageNode: MessageNode,
  triggerNode: TriggerNode,
  delayNode: DelayNode,
  aiNode: AINode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'triggerNode',
    data: { 
      type: 'comment', 
      postType: 'any', 
      keywords: ['INFO'], 
      replyToComment: true,
      replies: ['Check your DMs! 🚀'],
      trigger: 'On Comment: "INFO"' 
    },
    position: { x: 400, y: 50 },
  },
  {
    id: '2',
    type: 'messageNode',
    data: { 
      type: 'dm',
      label: "Hey! Glad you commented. Are you following us yet for more updates?",
      buttons: [
        { label: 'Yes, Following!', type: 'next_step' },
        { label: 'Check Profile', type: 'external_link', link: 'https://instagram.com' }
      ]
    },
    position: { x: 400, y: 300 },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
];

export default function FlowBuilder({ flowId: initialFlowId, templateId, prompt, onBack }: FlowBuilderProps) {
  const { activeWorkspace } = useAuth();
  const [flowId, setFlowId] = useState<string | null>(initialFlowId || null);
  const [flowName, setFlowName] = useState('New Automation Flow');
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [activeTab, setActiveTab] = useState<'nodes' | 'templates' | 'properties'>('nodes');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [status, setStatus] = useState<'draft' | 'active'>('draft');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load existing flow data if flowId is provided
  useEffect(() => {
    const loadFlow = async () => {
      if (!initialFlowId || !activeWorkspace) return;
      
      const flowDoc = await getDoc(doc(db, `workspaces/${activeWorkspace.id}/flows/${initialFlowId}`));
      if (flowDoc.exists()) {
        const data = flowDoc.data();
        setNodes(data.nodes || initialNodes);
        setEdges(data.edges || initialEdges);
        setFlowName(data.name || 'New Automation Flow');
        setStatus(data.status || 'draft');
        setLastSaved(data.updatedAt?.toDate() || null);
      }
    };
    loadFlow();
  }, [initialFlowId, activeWorkspace]);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);

  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [isPostSelectionOpen, setIsPostSelectionOpen] = useState(false);
  const [mockPosts, setMockPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    if (isPostSelectionOpen) {
      setLoadingPosts(true);
      // Mock API call to fetch posts
      setTimeout(() => {
        setMockPosts([
          { id: '1', type: 'image', thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop', caption: 'Summer Vibes ☀️ #holidays' },
          { id: '2', type: 'reel', thumbnail: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=100&h=100&fit=crop', caption: 'How to build flows in 60s 🚀' },
          { id: '3', type: 'image', thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=100&fit=crop', caption: 'New features alert! ⚡️' },
        ]);
        setLoadingPosts(false);
      }, 800);
    }
  }, [isPostSelectionOpen]);

  // Template Data Generator
  const getTemplateData = (id: string) => {
    switch (id) {
      case 'grow-email-list':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'comment', postType: 'any', keywords: ['EMAIL'], trigger: 'Keyword: EMAIL' }, position: { x: 400, y: 50 } },
            { id: 'm1', type: 'messageNode', data: { type: 'email_capture', label: "I'd love to send you the guide! What's your best email address?", buttons: [] }, position: { x: 400, y: 250 } },
            { id: 'd1', type: 'delayNode', data: { duration: '5 min' }, position: { x: 400, y: 450 } },
            { id: 'm2', type: 'messageNode', data: { type: 'dm', label: "Just checking in, did you get a chance to type your email?", buttons: [] }, position: { x: 400, y: 600 } }
          ],
          edges: [
            { id: 'e1', source: 't1', target: 'm1', animated: true },
            { id: 'e2', source: 'm1', target: 'd1' },
            { id: 'e3', source: 'd1', target: 'm2' }
          ]
        };
      case 'auto-dm-comments':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'comment', postType: 'any', keywords: ['LINK'], trigger: 'Comment: LINK' }, position: { x: 400, y: 50 } },
            { id: 'm1', type: 'messageNode', data: { type: 'link_delivery', label: "Here is the exclusive link you requested! Enjoy 20% off today.", buttons: [{ label: 'Get Link', type: 'external_link', link: 'https://example.com' }] }, position: { x: 400, y: 250 } }
          ],
          edges: [{ id: 'e1', source: 't1', target: 'm1', animated: true }]
        };
      case 'sell-reel-comments':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'comment', postType: 'any', keywords: ['SHOP', 'BUY'], trigger: 'Comment: SHOP' }, position: { x: 400, y: 50 } },
            { id: 'm1', type: 'messageNode', data: { type: 'dm', label: "Ready to shop? Here's the direct link to the product in the Reel!", buttons: [{ label: 'Shop Now', type: 'external_link', link: 'https://yourstore.com' }] }, position: { x: 400, y: 250 } }
          ],
          edges: [{ id: 'e1', source: 't1', target: 'm1', animated: true }]
        };
      case 'get-collabs-stories':
        return {
          nodes: [
             { id: 't1', type: 'triggerNode', data: { type: 'story_reply', postType: 'any', trigger: 'Story Reply' }, position: { x: 400, y: 50 } },
             { id: 'm1', type: 'messageNode', data: { type: 'follow_check', label: "Thanks for the reply! Are you a creator? We are looking for ambassadors.", buttons: [{ label: 'I am a creator!', type: 'next_step' }] }, position: { x: 400, y: 250 } }
          ],
          edges: [{ id: 'e1', source: 't1', target: 'm1', animated: true }]
        };
      case 'run-giveaway':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'comment', postType: 'any', keywords: ['WIN'], trigger: 'Keyword: WIN' }, position: { x: 400, y: 50 } },
            { id: 'm1', type: 'messageNode', data: { type: 'follow_check', label: "You're almost entered! First, are you following us? It's a requirement to win!", buttons: [{ label: 'Done!', type: 'next_step' }] }, position: { x: 400, y: 250 } },
            { id: 'm2', type: 'messageNode', data: { type: 'dm', label: "Great! You're now officially entered into the giveaway. We'll announce the winner on Friday!", buttons: [] }, position: { x: 400, y: 450 } }
          ],
          edges: [
            { id: 'e1', source: 't1', target: 'm1', animated: true },
            { id: 'e2', source: 'm1', target: 'm2' }
          ]
        };
      case 'generate-leads-stories':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'story_reply', postType: 'any', trigger: 'Story Interaction' }, position: { x: 400, y: 50 } },
            { id: 'm1', type: 'messageNode', data: { type: 'email_capture', label: "I see you're interested! Drop your email and I'll send over our pricing guide.", buttons: [] }, position: { x: 400, y: 250 } }
          ],
          edges: [{ id: 'e1', source: 't1', target: 'm1', animated: true }]
        };
      case 'affiliate-links':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'comment', postType: 'any', keywords: ['LINK', 'WHERE'], trigger: 'Keyword: LINK' }, position: { x: 400, y: 50 } },
            { id: 'm1', type: 'messageNode', data: { type: 'link_delivery', label: "Found it! Here is the link to the item you liked:", buttons: [{ label: 'View Product', type: 'external_link', link: 'https://amzn.to/example' }] }, position: { x: 400, y: 250 } }
          ],
          edges: [{ id: 'e1', source: 't1', target: 'm1', animated: true }]
        };
      case 'grow-followers-comments':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'comment', postType: 'any', keywords: ['FOLLOW'], trigger: 'Keyword: FOLLOW' }, position: { x: 400, y: 50 } },
            { id: 'm1', type: 'messageNode', data: { type: 'follow_check', label: "Thanks for the comment! Make sure you're following for the full breakdown.", buttons: [{ label: 'I Follow', type: 'next_step' }] }, position: { x: 400, y: 250 } },
            { id: 'm2', type: 'messageNode', data: { type: 'dm', label: "Awesome! Here is the breakdown I promised.", buttons: [] }, position: { x: 400, y: 450 } }
          ],
          edges: [
            { id: 'e1', source: 't1', target: 'm1', animated: true },
            { id: 'e2', source: 'm1', target: 'm2' }
          ]
        };
      case 'respond-dms':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'dm', trigger: 'Any DM' }, position: { x: 400, y: 50 } },
            { id: 'm1', type: 'messageNode', data: { type: 'dm', label: "Thanks for reaching out! A member of our team will get back to you soon. In the meantime, how can I help?", buttons: [] }, position: { x: 400, y: 250 } }
          ],
          edges: [{ id: 'e1', source: 't1', target: 'm1', animated: true }]
        };
      case 'automate-ai':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'dm', trigger: 'Customer Query' }, position: { x: 400, y: 50 } },
            { id: 'ai1', type: 'aiNode', data: { prompt: 'You are a helpful customer support agent for our brand. Answer common questions about shipping, returns, and product availability based on our website info.' }, position: { x: 400, y: 250 } },
            { id: 'm1', type: 'messageNode', data: { type: 'dm', label: "I've analyzed your request. Here's what I found...", buttons: [] }, position: { x: 400, y: 450 } }
          ],
          edges: [
            { id: 'e1', source: 't1', target: 'ai1' },
            { id: 'e2', source: 'ai1', target: 'm1' }
          ]
        };
      case 'dm-course-closer':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'comment', postType: 'any', keywords: ['COURSE', 'LEARN'], trigger: 'Keyword: COURSE' }, position: { x: 400, y: 50 } },
            { id: 'm1', type: 'messageNode', data: { type: 'dm', label: "Excited to see you want to level up! To see if you're a good fit, what's your current monthly revenue?", buttons: [{ label: '$0 - $1k', type: 'next_step' }, { label: '$1k - $5k', type: 'next_step' }, { label: '$5k+', type: 'next_step' }] }, position: { x: 400, y: 250 } },
            { id: 'm2', type: 'messageNode', data: { type: 'dm', label: "Got it! Based on that, you should check out our Advanced Masterclass.", buttons: [{ label: 'View Course', type: 'external_link', link: 'https://yourcourse.com' }] }, position: { x: 400, y: 500 } }
          ],
          edges: [
            { id: 'e1', source: 't1', target: 'm1', animated: true },
            { id: 'e2', source: 'm1', target: 'm2' }
          ]
        };
      case 'follow-freebie':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'comment', postType: 'any', keywords: ['GIFT', 'FREE'], trigger: 'Keyword: GIFT' }, position: { x: 400, y: 50 } },
            { id: 'm1', type: 'messageNode', data: { type: 'follow_check', label: "I'd love to send you the freebie! Just hit the button below once you're following us.", buttons: [{ label: 'I am following!', type: 'next_step' }] }, position: { x: 400, y: 250 } },
            { id: 'm2', type: 'messageNode', data: { type: 'link_delivery', label: "Success! Here is your download link:", buttons: [{ label: 'Download Now', type: 'external_link', link: 'https://drive.google.com/...' }] }, position: { x: 400, y: 500 } }
          ],
          edges: [
            { id: 'e1', source: 't1', target: 'm1', animated: true },
            { id: 'e2', source: 'm1', target: 'm2' }
          ]
        };
      case 'insta-to-whatsapp':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'dm', trigger: 'Sales Inquiry' }, position: { x: 400, y: 50 } },
            { id: 'm1', type: 'messageNode', data: { type: 'dm', label: "Let's chat more personally on WhatsApp so I can send you all the voice notes and details!", buttons: [{ label: 'Chat on WhatsApp', type: 'external_link', link: 'https://wa.me/yournumber' }] }, position: { x: 400, y: 250 } }
          ],
          edges: [{ id: 'e1', source: 't1', target: 'm1', animated: true }]
        };
      default:
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'comment', postType: 'any', keywords: ['START'], trigger: 'Trigger' }, position: { x: 400, y: 50 } },
            { id: 'm1', type: 'messageNode', data: { type: 'dm', label: 'Hello! This is your custom automation.', buttons: [] }, position: { x: 400, y: 250 } }
          ],
          edges: [{ id: 'e1', source: 't1', target: 'm1', animated: true }]
        };
    }
  };

  useEffect(() => {
    if (!activeWorkspace) return;

    const initFlow = async () => {
      if (flowId) {
        try {
          const flowRef = doc(db, 'workspaces', activeWorkspace.id, 'flows', flowId);
          const flowDoc = await getDoc(flowRef);
          if (flowDoc.exists()) {
            const data = flowDoc.data();
            if (data.nodes) setNodes(data.nodes);
            if (data.edges) setEdges(data.edges);
            if (data.name) setFlowName(data.name);
          }
        } catch (error) {
          console.warn("Error loading flow", error);
        }
      } else if (templateId) {
        const data = getTemplateData(templateId);
        if (data) {
          setNodes(data.nodes);
          setEdges(data.edges);
          const template = ALL_TEMPLATES.find(t => t.id === templateId);
          setFlowName(template ? `Flow: ${template.title}` : `Flow: ${templateId}`);
        }
      }
    };

    initFlow();
  }, [activeWorkspace, flowId, templateId]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId(node.id);
    setActiveTab('properties');
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    if (activeTab === 'properties') setActiveTab('nodes');
  }, [activeTab]);

  const updateNodeData = (newData: any) => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNodeId) {
          return {
            ...node,
            data: { ...node.data, ...newData },
          };
        }
        return node;
      })
    );
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
    setSelectedNodeId(null);
    setActiveTab('nodes');
  };

  useEffect(() => {
    if (!activeWorkspace) return;
    // Don't auto-save if there's no meaningful content yet
    if (nodes.length <= 1 && edges.length === 0 && flowName === 'New Automation Flow') return;
    
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      saveFlow(status); // Auto-save with current status
    }, 2000);

    return () => clearTimeout(timer);
  }, [nodes, edges, flowName]);

  const saveFlow = async (newStatus?: 'draft' | 'active') => {
    if (!activeWorkspace) {
      setSaveStatus('error');
      return;
    }
    
    const finalStatus = newStatus || status;
    const isPublishing = finalStatus === 'active' && status === 'draft';
    
    if (isPublishing) setPublishing(true);
    else setSaving(true);
    setSaveStatus('saving');

    const currentFlowId = flowId || `flow-${Date.now()}`;
    const path = `workspaces/${activeWorkspace.id}/flows/${currentFlowId}`;
    try {
      await setDoc(doc(db, path), {
        id: currentFlowId,
        workspaceId: activeWorkspace.id,
        name: flowName,
        nodes: nodes,
        edges: edges,
        status: finalStatus,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      if (!flowId) setFlowId(currentFlowId);
      setStatus(finalStatus);
      setLastSaved(new Date());
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  const addNode = (type: string, initialData: any = {}) => {
    const id = Date.now().toString();
    const lastNode = nodes[nodes.length - 1];
    const newNode = {
      id,
      type,
      position: { x: lastNode?.position.x || 400, y: (lastNode?.position.y || 0) + 200 },
      data: initialData,
    };
    setNodes((nds) => nds.concat(newNode));
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full flex overflow-hidden relative bg-[#F8FAFC]">
      {/* Mobile Overlay */}
      <div className="lg:hidden absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center text-neutral-900">
        <Smartphone size={32} className="text-blue-600 mb-4" />
        <h3 className="text-xl font-bold mb-2">Desktop Recommended</h3>
        <p className="text-sm text-neutral-500 max-w-xs">Building flows requires precision. Switch to a larger screen for the best experience.</p>
        <button onClick={onBack} className="mt-8 px-6 py-2 bg-neutral-900 text-white rounded-xl text-sm font-bold">Back to List</button>
      </div>

      {/* Settings Side Panel */}
      <div className="w-96 border-r border-neutral-200 bg-white flex flex-col overflow-hidden shadow-2xl relative z-10 transition-all duration-300">
        <div className="flex border-b border-neutral-100 h-14">
          <button 
            onClick={() => setActiveTab('nodes')}
            className={cn(
              "flex-1 text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'nodes' ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            Steps
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={cn(
              "flex-1 text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'templates' ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            Library
          </button>
          {selectedNodeId && (
            <button 
              onClick={() => setActiveTab('properties')}
              className={cn(
                "flex-1 text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'properties' ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30" : "text-neutral-400 hover:text-neutral-600"
              )}
            >
              Config
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          {activeTab === 'nodes' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="h-[1px] flex-1 bg-neutral-100" />
                  Primary Actions
                  <div className="h-[1px] flex-1 bg-neutral-100" />
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => addNode('messageNode', { label: 'Hello! I am your automation assistant.', type: 'dm', buttons: [] })}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-neutral-100 bg-neutral-50/50 hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                      <MessageSquare size={22} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-neutral-800">Send Message</p>
                      <p className="text-[11px] text-neutral-400">DMs, Replies, Buttons</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => addNode('delayNode', { duration: '24 hrs' })}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-neutral-100 bg-neutral-50/50 hover:border-purple-200 hover:bg-white hover:shadow-xl hover:shadow-purple-500/5 transition-all group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform">
                      <Clock size={22} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-neutral-800">Smart Delay</p>
                      <p className="text-[11px] text-neutral-400">Custom wait time</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => addNode('aiNode', { prompt: 'Analyze intent and reply' })}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-neutral-100 bg-neutral-50/50 hover:border-fuchsia-200 hover:bg-white hover:shadow-xl hover:shadow-fuchsia-500/5 transition-all group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-100 text-fuchsia-600 group-hover:scale-110 transition-transform">
                      <Zap size={22} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-neutral-800">AI Response</p>
                      <p className="text-[11px] text-neutral-400">Intent analysis</p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="h-[1px] flex-1 bg-neutral-100" />
                  Triggers
                  <div className="h-[1px] flex-1 bg-neutral-100" />
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Keyword', type: 'comment', postType: 'any', icon: Zap },
                    { label: 'Comment', type: 'comment', postType: 'any', icon: MessageSquare },
                  ].map(trigger => (
                    <button 
                      key={trigger.label} 
                      onClick={() => addNode('triggerNode', { type: trigger.type, postType: trigger.postType, keywords: ['START'], trigger: `${trigger.label} Trigger` })}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white border border-neutral-200 hover:border-amber-400 hover:shadow-lg transition-all"
                    >
                      <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                        <trigger.icon size={20} />
                      </div>
                      <span className="text-[11px] font-black uppercase text-neutral-600">{trigger.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              {ALL_TEMPLATES.map((tpl) => (
                <button 
                  key={tpl.id}
                  onClick={() => {
                    const data = getTemplateData(tpl.id);
                    if (data) {
                      setNodes(data.nodes);
                      setEdges(data.edges);
                      setFlowName(`Template: ${tpl.title}`);
                    }
                  }}
                  className="w-full text-left p-4 rounded-2xl border border-neutral-200 bg-white hover:border-blue-600 hover:shadow-xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm", tpl.color)}>
                      <tpl.icon size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-neutral-900">{tpl.title}</h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">{tpl.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'properties' && selectedNode && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="flex items-center justify-between pb-6 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-neutral-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                      <Settings2 size={20} />
                    </div>
                    <h3 className="text-lg font-black text-neutral-900 capitalize tracking-tight">Configuration</h3>
                  </div>
                  <button onClick={deleteSelectedNode} className="p-2.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <Trash2 size={20} />
                  </button>
               </div>

               {/* TRIGGER CONFIG */}
               {selectedNode.type === 'triggerNode' && (
                 <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block text-center bg-neutral-50 py-1.5 rounded-lg border border-neutral-100">Post Targeting</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['any', 'specific', 'next'].map((pt) => (
                           <button 
                            key={pt}
                            onClick={() => updateNodeData({ postType: pt })}
                            className={cn(
                              "py-3 rounded-xl border text-[10px] font-bold uppercase transition-all",
                              selectedNode.data.postType === pt ? "bg-amber-500 border-amber-600 text-white shadow-lg" : "bg-white border-neutral-200 text-neutral-400 hover:bg-neutral-50"
                            )}
                           >
                             {pt}
                           </button>
                        ))}
                      </div>
                    </div>

                    {/* Trigger Post Selection UI */}
                    {selectedNode.data.postType === 'specific' && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">Selected Post</label>
                        {selectedNode.data.postId ? (
                          <div className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                            <div className="h-12 w-12 rounded-lg bg-neutral-200 overflow-hidden shrink-0">
                               <img src={selectedNode.data.postThumbnail || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop"} alt="" className="h-full w-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-neutral-800 truncate">{selectedNode.data.postCaption || "Post Selected"}</p>
                              <p className="text-[10px] text-neutral-400 truncate">ID: {selectedNode.data.postId}</p>
                            </div>
                            <button 
                              onClick={() => setIsPostSelectionOpen(true)}
                              className="text-[10px] font-bold text-blue-600 hover:underline"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setIsPostSelectionOpen(true)}
                            className="w-full py-4 border-2 border-dashed border-neutral-100 rounded-2xl text-neutral-400 text-xs font-bold hover:bg-amber-50 hover:border-amber-200 transition-all flex flex-col items-center gap-2"
                          >
                            <Instagram size={20} />
                            Select specific post or reel
                          </button>
                        )}
                      </div>
                    )}

                    <div>
                      <div className="space-y-2">
                        {selectedNode.data.keywords?.map((kw: string, idx: number) => (
                          <div key={idx} className="flex gap-2">
                            <input 
                              type="text" 
                              value={kw}
                              onChange={(e) => {
                                const newKws = [...(selectedNode.data.keywords || [])];
                                newKws[idx] = e.target.value;
                                updateNodeData({ keywords: newKws });
                              }}
                              className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                            <button 
                              onClick={() => updateNodeData({ keywords: selectedNode.data.keywords.filter((_: any, i: number) => i !== idx) })}
                              className="p-3 text-neutral-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        {(selectedNode.data.keywords?.length || 0) < 10 && (
                          <button 
                            onClick={() => updateNodeData({ keywords: [...(selectedNode.data.keywords || []), 'NEW_KEYWORD'] })}
                            className="w-full py-3 border-2 border-dashed border-neutral-100 rounded-xl text-neutral-400 text-xs font-bold hover:bg-neutral-50 hover:border-amber-200 transition-all flex items-center justify-center gap-2"
                          >
                            <Plus size={14} /> Add Keyword
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-100">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-black text-neutral-800">Auto-reply to comment</p>
                          <p className="text-[11px] text-neutral-400">Reply publicly under their post</p>
                        </div>
                        <button 
                          onClick={() => updateNodeData({ replyToComment: !selectedNode.data.replyToComment })}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative flex items-center px-1",
                            selectedNode.data.replyToComment ? "bg-emerald-500" : "bg-neutral-200"
                          )}
                        >
                          <div className={cn("w-4 h-4 bg-white rounded-full transition-all shadow-sm", selectedNode.data.replyToComment ? "translate-x-6" : "translate-x-0")} />
                        </button>
                      </div>

                      {selectedNode.data.replyToComment && (
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Answer Variants (Max 5)</label>
                           {selectedNode.data.replies?.map((r: string, idx: number) => (
                             <div key={idx} className="relative group">
                               <textarea 
                                 value={r}
                                 onChange={(e) => {
                                   const nr = [...(selectedNode.data.replies || [])];
                                   nr[idx] = e.target.value;
                                   updateNodeData({ replies: nr });
                                 }}
                                 placeholder={`Variant ${idx + 1}...`}
                                 className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 pr-10 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                               />
                               <button 
                                 onClick={() => {
                                   const nr = [...(selectedNode.data.replies || [])];
                                   nr.splice(idx, 1);
                                   updateNodeData({ replies: nr });
                                 }}
                                 className="absolute right-3 top-3 text-neutral-300 hover:text-red-500 transition-colors"
                               >
                                 <Trash2 size={14} />
                               </button>
                             </div>
                           ))}
                           {(selectedNode.data.replies?.length || 0) < 5 && (
                             <button 
                               onClick={() => updateNodeData({ replies: [...(selectedNode.data.replies || []), ''] })}
                               className="w-full py-2 border border-emerald-100 rounded-xl text-emerald-600 text-[10px] font-black uppercase tracking-tight hover:bg-emerald-50"
                             >
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
                 <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Message Type</label>
                        <div className="grid grid-cols-2 gap-2">
                           {[
                             { id: 'dm', label: 'Standard DM', icon: MessageSquare },
                             { id: 'follow_check', label: 'Follow Guard', icon: UserPlus },
                             { id: 'email_capture', label: 'Email Opt-in', icon: Mail },
                             { id: 'link_delivery', label: 'Link Send', icon: LinkIcon }
                           ].map((t) => (
                              <button 
                                key={t.id}
                                onClick={() => updateNodeData({ type: t.id })}
                                className={cn(
                                  "flex items-center gap-2 p-3 rounded-xl border text-[10px] font-bold transition-all",
                                  selectedNode.data.type === t.id ? "bg-blue-600 border-blue-700 text-white shadow-lg" : "bg-white border-neutral-200 text-neutral-400"
                                )}
                              >
                                <t.icon size={14} />
                                {t.label}
                              </button>
                           ))}
                        </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Message Content</label>
                      <textarea 
                        value={selectedNode.data.label}
                        onChange={(e) => updateNodeData({ label: e.target.value })}
                        placeholder="Type your message..."
                        className="w-full h-40 bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-neutral-400 font-bold bg-blue-50/50 p-2 rounded-lg">
                        <Zap size={12} className="text-amber-500" />
                        <span>TIP: Include a clear call-to-action</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-neutral-100 pb-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Buttons</label>
                        <span className="text-[10px] text-neutral-300 font-mono">Max 3</span>
                      </div>
                      <div className="space-y-4">
                        {selectedNode.data.buttons?.map((btn: any, idx: number) => (
                          <div key={idx} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase text-neutral-300">Button #{idx + 1}</span>
                              <button onClick={() => updateNodeData({ buttons: selectedNode.data.buttons.filter((_: any, i: number) => i !== idx) })} className="text-neutral-300 hover:text-red-500"><Trash2 size={14} /></button>
                            </div>
                            <input 
                              type="text" 
                              maxLength={25}
                              value={btn.label}
                              placeholder="Button Label (Max 25 chars)"
                              onChange={(e) => {
                                const newBtns = [...selectedNode.data.buttons];
                                newBtns[idx].label = e.target.value;
                                updateNodeData({ buttons: newBtns });
                              }}
                              className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-bold outline-none"
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                   const newBtns = [...selectedNode.data.buttons];
                                   newBtns[idx].type = 'next_step';
                                   updateNodeData({ buttons: newBtns });
                                }}
                                className={cn("flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all", btn.type === 'next_step' ? "bg-neutral-900 border-neutral-900 text-white" : "bg-white border-neutral-200 text-neutral-400")}
                              >
                                Next Step
                              </button>
                              <button 
                                onClick={() => {
                                   const newBtns = [...selectedNode.data.buttons];
                                   newBtns[idx].type = 'external_link';
                                   updateNodeData({ buttons: newBtns });
                                }}
                                className={cn("flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all", btn.type === 'external_link' ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-neutral-200 text-neutral-400")}
                              >
                                Website
                              </button>
                            </div>
                            {btn.type === 'external_link' && (
                              <input 
                                type="url" 
                                value={btn.link}
                                placeholder="https://..."
                                onChange={(e) => {
                                  const newBtns = [...selectedNode.data.buttons];
                                  newBtns[idx].link = e.target.value;
                                  updateNodeData({ buttons: newBtns });
                                }}
                                className="w-full px-3 py-2 bg-white border border-blue-100 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            )}
                          </div>
                        ))}
                        {(selectedNode.data.buttons?.length || 0) < 3 && (
                          <button 
                            onClick={() => updateNodeData({ buttons: [...(selectedNode.data.buttons || []), { label: 'New Button', type: 'next_step' }] })}
                            className="w-full py-4 border-2 border-dashed border-neutral-100 rounded-2xl text-neutral-400 text-xs font-black uppercase hover:bg-neutral-50 hover:border-blue-200 transition-all"
                          >
                            + Add Button
                          </button>
                        )}
                      </div>
                    </div>
                 </div>
               )}

               {/* DELAY CONFIG */}
               {selectedNode.type === 'delayNode' && (
                 <div className="space-y-6 text-center">
                    <div className="flex flex-col items-center">
                      <div className="h-16 w-16 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
                        <Clock size={32} />
                      </div>
                      <h4 className="text-lg font-black text-neutral-900">Wait Duration</h4>
                      <p className="text-xs text-neutral-400 mt-1 max-w-[200px]">How long should we wait before proceeding to the next step?</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {['Instant', '5 min', '30 min', '1 hr', '24 hrs', 'Next Day'].map((d) => (
                        <button 
                          key={d}
                          onClick={() => updateNodeData({ duration: d })}
                          className={cn(
                            "p-4 rounded-2xl border text-xs font-black transition-all",
                            selectedNode.data.duration === d ? "bg-purple-600 border-purple-700 text-white shadow-xl scale-105" : "bg-neutral-50 border-neutral-100 text-neutral-400 hover:bg-white hover:border-purple-200"
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                    
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-left">
                       <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1 flex items-center gap-1">
                         <Zap size={10} /> Pro Tip
                       </p>
                       <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                         Delays humanize your automation and increase conversion by not overwhelming the user instantly.
                       </p>
                    </div>
                 </div>
               )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-100 flex gap-2 h-20 bg-neutral-50/50">
           <button 
             onClick={onBack}
             className="flex-1 flex items-center justify-center gap-2 bg-white border border-neutral-200 rounded-xl text-xs font-black uppercase text-neutral-700 hover:border-neutral-400 transition-all"
           >
              Exit
           </button>
           <button 
             onClick={() => saveFlow('active')}
             disabled={publishing || saveStatus === 'saving'}
             className={cn(
               "flex-[2] flex items-center justify-center gap-2 text-white rounded-xl text-xs font-black uppercase shadow-xl transition-all disabled:opacity-50",
               saveStatus === 'saved' && publishing === false ? "bg-emerald-600" : "bg-neutral-900 hover:bg-black"
             )}
           >
              {publishing ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} fill="white" />}
              {saveStatus === 'saved' && publishing === false ? 'Published ✨' : 'Publish'}
           </button>
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div className="flex-1 bg-[#F8FAFC]">
        <div className="h-full w-full">
          {/* Header Info */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-md px-6 py-2.5 rounded-full border border-neutral-200/50 shadow-2xl shadow-blue-500/10 flex items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
             <input 
               type="text" 
               value={flowName}
               onChange={(e) => setFlowName(e.target.value)}
               className="bg-transparent font-black text-neutral-900 border-none outline-none text-sm w-48 pointer-events-auto"
             />
          </div>
          <div className="h-4 w-[1px] bg-neutral-200" />
          <div className="flex items-center gap-2 text-[10px] font-bold">
            {saveStatus === 'saving' && <span className="text-blue-500 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Auto-saving...</span>}
            {saveStatus === 'saved' && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={10} /> All changes saved</span>}
            {saveStatus === 'error' && <span className="text-red-500">Error saving</span>}
            {saveStatus === 'idle' && lastSaved && <span className="text-neutral-400">Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
        </div>
      </div>

      {/* Action Buttons Panel */}
      <div className="absolute bottom-6 right-6 z-50 flex gap-3 pointer-events-auto">
        <button 
          onClick={() => saveFlow('draft')}
          disabled={saving || saveStatus === 'saving'}
          className={cn(
            "bg-white px-5 py-3 rounded-2xl text-xs font-bold text-neutral-500 border border-neutral-200 shadow-lg hover:bg-neutral-50 transition-all disabled:opacity-50",
            status === 'draft' && "bg-neutral-50"
          )}
        >
          {status === 'draft' ? (lastSaved ? 'Draft Saved' : 'Keep as Draft') : 'Switch to Draft'}
        </button>
        
        <button 
          onClick={() => saveFlow()}
          disabled={saving || saveStatus === 'saving'}
          className="bg-white px-8 py-3 rounded-2xl text-sm font-bold text-neutral-900 border border-neutral-900/10 shadow-xl hover:bg-neutral-50 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin text-blue-600" /> : <Save size={16} className="text-blue-600" />}
          Save
        </button>

        <button 
          onClick={() => saveFlow('active')}
          disabled={publishing || saveStatus === 'saving'}
          className={cn(
            "px-8 py-3 rounded-2xl text-sm font-bold shadow-xl transition-all disabled:opacity-50 flex items-center gap-2",
            status === 'active' 
              ? "bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600" 
              : "bg-blue-600 text-white shadow-blue-500/30 hover:bg-blue-700"
          )}
        >
          {publishing ? <Loader2 size={16} className="animate-spin" /> : status === 'active' ? <CheckCircle2 size={16} /> : <Play size={14} className="fill-white" />}
          {status === 'active' ? 'Published' : 'Publish'}
        </button>
      </div>

      {/* Post Selection Modal */}
      <AnimatePresence>
        {isPostSelectionOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-neutral-900/40 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="text-lg font-black text-neutral-900">Select Post or Reel</h3>
                <button onClick={() => setIsPostSelectionOpen(false)} className="p-2 hover:bg-neutral-50 rounded-full text-neutral-400">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                {loadingPosts ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-neutral-400">
                    <Loader2 size={32} className="animate-spin" />
                    <p className="text-xs font-bold uppercase tracking-widest">Fetching your posts...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {mockPosts.map((post) => (
                      <button 
                        key={post.id}
                        onClick={() => {
                          updateNodeData({ 
                            postId: post.id, 
                            postThumbnail: post.thumbnail, 
                            postCaption: post.caption 
                          });
                          setIsPostSelectionOpen(false);
                        }}
                        className="flex items-center gap-4 p-3 rounded-2xl border border-neutral-100 hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left"
                      >
                        <div className="h-16 w-16 rounded-xl bg-neutral-100 overflow-hidden shrink-0 border border-neutral-100 shadow-sm">
                          <img src={post.thumbnail} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-neutral-800 line-clamp-2 leading-relaxed">{post.caption}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider px-1.5 py-0.5 bg-neutral-50 rounded border border-neutral-100">{post.type}</span>
                            <span className="text-[10px] text-neutral-300">ID: {post.id}</span>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-neutral-300" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-6 bg-neutral-50 border-t border-neutral-100">
                 <p className="text-[10px] text-center text-neutral-400 font-bold uppercase tracking-widest">Connect Instagram in settings to see all your posts</p>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-transparent"
            nodesDraggable={true}
            defaultEdgeOptions={{ 
              animated: true, 
              style: { stroke: '#CBD5E1', strokeWidth: 2 },
              type: 'smoothstep'
            }}
          >
            <Background color="#CBD5E1" gap={20} size={1} />
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                switch (node.type) {
                  case 'messageNode': return '#2563eb';
                  case 'triggerNode': return '#f59e0b';
                  case 'delayNode': return '#9333ea';
                  default: return '#64748b';
                }
              }}
              maskColor="rgba(248, 250, 252, 0.7)"
              className="!bottom-4 !right-4 !bg-white !border-neutral-200 !rounded-xl !shadow-2xl"
            />
            
            <Panel position="top-left" className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-neutral-200 shadow-xl m-4 flex items-center gap-4">
               <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Languages size={20} className="text-white" />
               </div>
               <div>
                 <input 
                   value={flowName}
                   onChange={(e) => setFlowName(e.target.value)}
                   className="text-sm font-black text-neutral-900 bg-transparent outline-none border-none p-0 focus:ring-0 w-48"
                 />
                 <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Automation Flow</p>
               </div>
            </Panel>

            <Panel position="top-right" className="flex items-center gap-3 m-4">
               {lastSaved && (
                 <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-200 text-[10px] font-bold text-neutral-400 flex items-center gap-2">
                    <div className={cn("h-1.5 w-1.5 rounded-full", saveStatus === 'saving' ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                    Last saved: {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </div>
               )}
               <button 
                 onClick={() => saveFlow('draft')}
                 disabled={saving || saveStatus === 'saving'}
                 className="px-6 py-2.5 bg-white border border-neutral-200 text-neutral-900 rounded-2xl text-[10px] font-black uppercase shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
               >
                 {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                 {saveStatus === 'saved' && !saving ? 'Saved ✅' : 'Save Draft'}
               </button>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

interface FlowBuilderProps {
  flowId?: string | null;
  templateId?: string | null;
  prompt?: string | null;
  onBack: () => void;
}
