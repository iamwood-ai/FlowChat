import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
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

import { motion } from 'motion/react';

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
  CheckCircle2,
  Settings2,
  X,
  Layers,
  Instagram,
  Facebook,
  Loader2,
  Smartphone,
  ExternalLink,
  Mail,
  UserPlus,
  Link as LinkIcon,
  Languages,
  Repeat
} from 'lucide-react';
import { cn } from '../../lib/utils';
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
      "w-full h-full shadow-xl rounded-2xl border bg-white overflow-hidden flex flex-col min-h-[80px] min-w-[150px]",
      selected ? "border-blue-500 ring-4 ring-blue-500/10" : "border-neutral-200"
    )}>
      <NodeResizer minWidth={150} minHeight={80} isVisible={selected} lineClassName="border-blue-400" handleClassName="h-3 w-3 bg-white border-2 border-blue-400 rounded-full" />
      <div className="bg-blue-600 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-white">
          <MessageSquare size={14} className="fill-white/20" />
          <span className="text-[11px] font-black uppercase tracking-wider">Message</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
        </div>
      </div>
      <div className="p-3 flex-1 overflow-auto scrollbar-hide">
        <div className="min-h-[40px] flex flex-col justify-start">
          <p className="text-xs text-neutral-600 leading-relaxed">
            {data.label || 'Enter your message here...'}
          </p>
        </div>

        {data.buttons?.length > 0 && (
          <div className="space-y-1.5 mt-2">
            {data.buttons.map((btn: any, i: number) => (
              <div 
                key={i} 
                className="w-full py-1.5 px-3 bg-neutral-50 border border-neutral-100 rounded-lg text-[10px] font-bold text-neutral-500 flex items-center justify-between group"
              >
                <span className="truncate max-w-[150px]">{btn.label}</span>
                {btn.type === 'external_link' ? <ExternalLink size={10} /> : <ChevronRight size={10} />}
              </div>
            ))}
          </div>
        )}

        {data.type === 'email_capture' && (
          <div className="mt-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail size={12} className="text-neutral-400" />
              <span className="text-[10px] text-neutral-400 italic">User replies with email...</span>
            </div>
            <div className="bg-blue-500 text-white p-1 rounded-md">
              <ChevronRight size={10} />
            </div>
          </div>
        )}

        <div className="flex gap-1.5 mt-2">
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
      "w-full h-full shadow-xl rounded-2xl border bg-white overflow-hidden flex flex-col min-h-[80px] min-w-[150px]",
      selected ? "border-amber-500 ring-4 ring-amber-500/10" : "border-neutral-200"
    )}>
      <NodeResizer minWidth={150} minHeight={80} isVisible={selected} lineClassName="border-amber-400" handleClassName="h-3 w-3 bg-white border-2 border-amber-400 rounded-full" />
      <div className="bg-amber-500 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-white">
          <Zap size={14} fill="currentColor" />
          <span className="text-[11px] font-black uppercase tracking-wider">Trigger</span>
        </div>
      </div>
      <div className="p-4 flex-1 overflow-auto scrollbar-hide space-y-3">
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
      "w-full h-full shadow-xl rounded-2xl border bg-white overflow-hidden flex flex-col min-h-[80px] min-w-[150px]",
      selected ? "border-purple-500 ring-4 ring-purple-500/10" : "border-neutral-200"
    )}>
      <NodeResizer minWidth={150} minHeight={80} isVisible={selected} lineClassName="border-purple-400" handleClassName="h-3 w-3 bg-white border-2 border-purple-400 rounded-full" />
      <div className="bg-purple-600 px-4 py-2 flex items-center gap-2 text-white shrink-0">
        <Clock size={14} />
        <span className="text-[11px] font-black uppercase tracking-wider">Delay</span>
      </div>
      <div className="p-4 flex-1 overflow-auto scrollbar-hide flex flex-col justify-center">
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
      "w-full h-full shadow-xl rounded-2xl border bg-white overflow-hidden flex flex-col min-h-[80px] min-w-[150px]",
      selected ? "border-fuchsia-500 ring-4 ring-fuchsia-500/10" : "border-neutral-200"
    )}>
      <NodeResizer minWidth={150} minHeight={80} isVisible={selected} lineClassName="border-fuchsia-400" handleClassName="h-3 w-3 bg-white border-2 border-fuchsia-400 rounded-full" />
      <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 px-4 py-2 flex items-center gap-2 text-white shrink-0">
        <Zap size={14} fill="white" />
        <span className="text-[11px] font-black uppercase tracking-wider">AI Intent</span>
      </div>
      <div className="p-4 flex-1 overflow-auto scrollbar-hide space-y-2">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Model Context</p>
        <p className="text-xs text-neutral-500 italic bg-neutral-50 p-2 rounded-lg border border-neutral-100">
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
    style: { width: 180, height: 130 }
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
    position: { x: 400, y: 220 },
    style: { width: 220, height: 160 }
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
];

export default function FlowBuilderContainer(props: FlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowBuilder {...props} />
    </ReactFlowProvider>
  );
}

function FlowBuilder({ flowId: initialFlowId, templateId, prompt, onBack }: FlowBuilderProps) {
  const { activeWorkspace } = useAuth();
  const [flowId, setFlowId] = useState<string | null>(initialFlowId || null);
  const [flowName, setFlowName] = useState('New Automation Flow');
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [activeTab, setActiveTab] = useState<'nodes' | 'templates' | 'properties'>('nodes');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const { fitView } = useReactFlow();
  const [isPanelOpen, setIsPanelOpen] = useState(window.innerWidth >= 1024);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);

  // Handle fitView on initial load or template load
  useEffect(() => {
    if (nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ duration: 800, padding: 0.2 });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [flowId, templateId, fitView]);

  // Template Data Generator
  const getTemplateData = (id: string) => {
    switch (id) {
      case 'grow-email-list':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'comment', postType: 'any', keywords: ['EMAIL'], trigger: 'Keyword: EMAIL' }, position: { x: 400, y: 50 }, style: { width: 180, height: 130 } },
            { id: 'm1', type: 'messageNode', data: { type: 'email_capture', label: "I'd love to send you the guide! What's your best email address?", buttons: [] }, position: { x: 400, y: 200 }, style: { width: 200, height: 140 } },
            { id: 'd1', type: 'delayNode', data: { duration: '5 min' }, position: { x: 400, y: 360 }, style: { width: 150, height: 100 } },
            { id: 'm2', type: 'messageNode', data: { type: 'dm', label: "Just checking in, did you get a chance to type your email?", buttons: [] }, position: { x: 400, y: 480 }, style: { width: 200, height: 140 } }
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
            { id: 't1', type: 'triggerNode', data: { type: 'comment', postType: 'any', keywords: ['LINK'], trigger: 'Comment: LINK' }, position: { x: 400, y: 50 }, style: { width: 180, height: 130 } },
            { id: 'm1', type: 'messageNode', data: { type: 'link_delivery', label: "Here is the exclusive link you requested! Enjoy 20% off today.", buttons: [{ label: 'Get Link', type: 'external_link', link: 'https://example.com' }] }, position: { x: 400, y: 200 }, style: { width: 200, height: 160 } }
          ],
          edges: [{ id: 'e1', source: 't1', target: 'm1', animated: true }]
        };
      case 'sell-reel-comments':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'comment', postType: 'any', keywords: ['SHOP', 'BUY'], trigger: 'Comment: SHOP' }, position: { x: 400, y: 50 }, style: { width: 180, height: 130 } },
            { id: 'm1', type: 'messageNode', data: { type: 'dm', label: "Ready to shop? Here's the direct link to the product in the Reel!", buttons: [{ label: 'Shop Now', type: 'external_link', link: 'https://yourstore.com' }] }, position: { x: 400, y: 200 }, style: { width: 200, height: 160 } }
          ],
          edges: [{ id: 'e1', source: 't1', target: 'm1', animated: true }]
        };
      case 'get-collabs-stories':
        return {
          nodes: [
             { id: 't1', type: 'triggerNode', data: { type: 'story_reply', postType: 'any', trigger: 'Story Reply' }, position: { x: 400, y: 50 }, style: { width: 180, height: 110 } },
             { id: 'm1', type: 'messageNode', data: { type: 'follow_check', label: "Thanks for the reply! Are you a creator? We are looking for ambassadors.", buttons: [{ label: 'I am a creator!', type: 'next_step' }] }, position: { x: 400, y: 200 }, style: { width: 200, height: 160 } }
          ],
          edges: [{ id: 'e1', source: 't1', target: 'm1', animated: true }]
        };
      case 'run-giveaway':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'comment', postType: 'any', keywords: ['WIN'], trigger: 'Keyword: WIN' }, position: { x: 400, y: 50 }, style: { width: 180, height: 130 } },
            { id: 'm1', type: 'messageNode', data: { type: 'follow_check', label: "You're almost entered! First, are you following us? It's a requirement to win!", buttons: [{ label: 'Done!', type: 'next_step' }] }, position: { x: 400, y: 200 }, style: { width: 200, height: 160 } },
            { id: 'm2', type: 'messageNode', data: { type: 'dm', label: "Great! You're now officially entered into the giveaway. We'll announce the winner on Friday!", buttons: [] }, position: { x: 400, y: 380 }, style: { width: 200, height: 140 } }
          ],
          edges: [
            { id: 'e1', source: 't1', target: 'm1', animated: true },
            { id: 'e2', source: 'm1', target: 'm2' }
          ]
        };
      case 'generate-leads-stories':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'story_reply', postType: 'any', trigger: 'Story Interaction' }, position: { x: 400, y: 50 }, style: { width: 180, height: 110 } },
            { id: 'm1', type: 'messageNode', data: { type: 'email_capture', label: "I see you're interested! Drop your email and I'll send over our pricing guide.", buttons: [] }, position: { x: 400, y: 200 }, style: { width: 200, height: 140 } }
          ],
          edges: [{ id: 'e1', source: 't1', target: 'm1', animated: true }]
        };
      case 'affiliate-links':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'comment', postType: 'any', keywords: ['LINK', 'WHERE'], trigger: 'Keyword: LINK' }, position: { x: 400, y: 50 }, style: { width: 180, height: 130 } },
            { id: 'm1', type: 'messageNode', data: { type: 'link_delivery', label: "Found it! Here is the link to the item you liked:", buttons: [{ label: 'View Product', type: 'external_link', link: 'https://amzn.to/example' }] }, position: { x: 400, y: 200 }, style: { width: 200, height: 160 } }
          ],
          edges: [{ id: 'e1', source: 't1', target: 'm1', animated: true }]
        };
      case 'grow-followers-comments':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'comment', postType: 'any', keywords: ['FOLLOW'], trigger: 'Keyword: FOLLOW' }, position: { x: 400, y: 50 }, style: { width: 180, height: 130 } },
            { id: 'm1', type: 'messageNode', data: { type: 'follow_check', label: "Thanks for the comment! Make sure you're following for the full breakdown.", buttons: [{ label: 'I Follow', type: 'next_step' }] }, position: { x: 400, y: 200 }, style: { width: 200, height: 160 } },
            { id: 'm2', type: 'messageNode', data: { type: 'dm', label: "Awesome! Here is the breakdown I promised.", buttons: [] }, position: { x: 400, y: 380 }, style: { width: 200, height: 140 } }
          ],
          edges: [
            { id: 'e1', source: 't1', target: 'm1', animated: true },
            { id: 'e2', source: 'm1', target: 'm2' }
          ]
        };
      case 'respond-dms':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'dm', trigger: 'Any DM' }, position: { x: 400, y: 50 }, style: { width: 180, height: 90 } },
            { id: 'm1', type: 'messageNode', data: { type: 'dm', label: "Thanks for reaching out! A member of our team will get back to you soon. In the meantime, how can I help?", buttons: [] }, position: { x: 400, y: 200 }, style: { width: 200, height: 140 } }
          ],
          edges: [{ id: 'e1', source: 't1', target: 'm1', animated: true }]
        };
      case 'automate-ai':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'dm', trigger: 'Customer Query' }, position: { x: 400, y: 50 }, style: { width: 180, height: 90 } },
            { id: 'ai1', type: 'aiNode', data: { prompt: 'You are a helpful customer support agent for our brand. Answer common questions about shipping, returns, and product availability based on our website info.' }, position: { x: 400, y: 200 }, style: { width: 200, height: 140 } },
            { id: 'm1', type: 'messageNode', data: { type: 'dm', label: "I've analyzed your request. Here's what I found...", buttons: [] }, position: { x: 400, y: 360 }, style: { width: 200, height: 140 } }
          ],
          edges: [
            { id: 'e1', source: 't1', target: 'ai1' },
            { id: 'e2', source: 'ai1', target: 'm1' }
          ]
        };
      case 'dm-course-closer':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'comment', postType: 'any', keywords: ['COURSE', 'LEARN'], trigger: 'Keyword: COURSE' }, position: { x: 400, y: 50 }, style: { width: 180, height: 130 } },
            { id: 'm1', type: 'messageNode', data: { type: 'dm', label: "Excited to see you want to level up! To see if you're a good fit, what's your current monthly revenue?", buttons: [{ label: '$0 - $1k', type: 'next_step' }, { label: '$1k - $5k', type: 'next_step' }, { label: '$5k+', type: 'next_step' }] }, position: { x: 400, y: 200 }, style: { width: 200, height: 220 } },
            { id: 'm2', type: 'messageNode', data: { type: 'dm', label: "Got it! Based on that, you should check out our Advanced Masterclass.", buttons: [{ label: 'View Course', type: 'external_link', link: 'https://yourcourse.com' }] }, position: { x: 400, y: 450 }, style: { width: 200, height: 160 } }
          ],
          edges: [
            { id: 'e1', source: 't1', target: 'm1', animated: true },
            { id: 'e2', source: 'm1', target: 'm2' }
          ]
        };
      case 'follow-freebie':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'comment', postType: 'any', keywords: ['GIFT', 'FREE'], trigger: 'Keyword: GIFT' }, position: { x: 400, y: 50 }, style: { width: 180, height: 130 } },
            { id: 'm1', type: 'messageNode', data: { type: 'follow_check', label: "I'd love to send you the freebie! Just hit the button below once you're following us.", buttons: [{ label: 'I am following!', type: 'next_step' }] }, position: { x: 400, y: 200 }, style: { width: 200, height: 160 } },
            { id: 'm2', type: 'messageNode', data: { type: 'link_delivery', label: "Success! Here is your download link:", buttons: [{ label: 'Download Now', type: 'external_link', link: 'https://drive.google.com/...' }] }, position: { x: 400, y: 380 }, style: { width: 200, height: 140 } }
          ],
          edges: [
            { id: 'e1', source: 't1', target: 'm1', animated: true },
            { id: 'e2', source: 'm1', target: 'm2' }
          ]
        };
      case 'insta-to-whatsapp':
        return {
          nodes: [
            { id: 't1', type: 'triggerNode', data: { type: 'dm', trigger: 'Sales Inquiry' }, position: { x: 400, y: 50 }, style: { width: 180, height: 90 } },
            { id: 'm1', type: 'messageNode', data: { type: 'dm', label: "Let's chat more personally on WhatsApp so I can send you all the voice notes and details!", buttons: [{ label: 'Chat on WhatsApp', type: 'external_link', link: 'https://wa.me/yournumber' }] }, position: { x: 400, y: 160 }, style: { width: 200, height: 160 } }
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
    (params: Connection) => {
      if (params.source === params.target) return; // Prevent self-connection
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setEdges],
  );

  const isValidConnection = useCallback((connection: Connection) => {
    return connection.source !== connection.target;
  }, []);

  const onEdgeReconnect = useCallback(
    (oldEdge: any, newConnection: any) => setEdges((els) => reconnectEdge(oldEdge, newConnection, els)),
    []
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
      saveFlow('draft');
    }, 2000);

    return () => clearTimeout(timer);
  }, [nodes, edges, flowName]);

  const saveFlow = async (status: 'draft' | 'active' = 'draft') => {
    if (!activeWorkspace) {
      setSaveStatus('error');
      return;
    }
    const isPublishing = status === 'active';
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
        status: status,
        updatedAt: serverTimestamp()
      }, { merge: true });
      if (!flowId) setFlowId(currentFlowId);
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
    
    // Default dimensions based on type (reduced)
    const style = 
      type === 'triggerNode' ? { width: 180, height: 130 } :
      type === 'delayNode' ? { width: 150, height: 100 } :
      { width: 200, height: 160 };

    const newNode = {
      id,
      type,
      position: { x: lastNode?.position.x || 400, y: (lastNode?.position.y || 0) + 180 },
      data: initialData,
      style
    };
    setNodes((nds) => nds.concat(newNode));
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full flex overflow-hidden relative bg-[#F8FAFC]">
      {/* Sidebar Toggle for Mobile */}
      <button 
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="lg:hidden absolute bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-blue-600 text-white shadow-2xl flex items-center justify-center transition-transform active:scale-95"
      >
        {isPanelOpen ? <X size={24} /> : <Settings2 size={24} />}
      </button>

      {/* Settings Side Panel */}
      <div 
        className={cn(
          "h-full border-r border-neutral-200 bg-white flex flex-col overflow-hidden shadow-2xl relative z-40 transition-all duration-300",
          window.innerWidth < 1024 ? (isPanelOpen ? "fixed inset-0 w-full" : "w-0 opacity-0 -translate-x-full") : "w-96"
        )}
      >
        <div className="flex border-b border-neutral-100 h-14 shrink-0">
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

               {/* LAYOUT PRESETS (SHARED) */}
               <div className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Layout & Alignment</label>
                    <span className="text-[10px] text-neutral-300 font-mono italic">Smart Sync</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'square', label: 'Square', w: 180, h: 180 },
                      { id: 'vertical', label: 'Vertical', w: 160, h: 240 },
                      { id: 'horizontal', label: 'Wide', w: 250, h: 130 }
                    ].map((p) => (
                      <button 
                        key={p.id}
                        onClick={() => {
                          setNodes(nds => nds.map(n => n.id === selectedNodeId ? { 
                            ...n, 
                            style: { ...n.style, width: p.w, height: p.h } 
                          } : n));
                        }}
                        className="py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-[9px] font-black uppercase text-neutral-500 hover:border-blue-500 hover:bg-blue-50 transition-all font-bold"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
 
                   <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => {
                        if (!selectedNodeId) return;
                        const refNode = nodes.find(n => n.id !== selectedNodeId);
                        if (refNode && refNode.style) {
                          setNodes(nds => nds.map(n => n.id === selectedNodeId ? {
                            ...n,
                            style: { ...n.style, width: refNode.style?.width, height: refNode.style?.height }
                          } : n));
                        }
                      }}
                      className="flex-1 py-3 bg-neutral-900 text-white rounded-xl text-[9px] font-black uppercase tracking-tighter hover:bg-black transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                    >
                      <Layers size={12} /> Sync Size
                    </button>
                    <button 
                      onClick={() => {
                        const currentWidth = selectedNode?.style?.width;
                        const currentHeight = selectedNode?.style?.height;
                        if (currentWidth && currentHeight) {
                          setNodes(nds => nds.map(n => ({
                            ...n,
                            style: { ...n.style, width: currentWidth, height: currentHeight }
                          })));
                        }
                      }}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-tighter hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                    >
                      <Zap size={12} /> Unify All
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button 
                      onClick={() => {
                        if (!selectedNodeId) return;
                        const selection = nodes.filter(n => n.selected);
                        if (selection.length < 2) return;
                        const masterX = selection[0].position.x;
                        setNodes(nds => nds.map(n => n.selected ? { ...n, position: { ...n.position, x: masterX } } : n));
                      }}
                      className="py-2 rounded-lg border border-neutral-200 bg-white text-[9px] font-bold uppercase text-neutral-500 hover:border-blue-500 hover:text-blue-600 transition-all font-bold"
                    >
                      Align Left
                    </button>
                    <button 
                      onClick={() => {
                        if (!selectedNodeId) return;
                        const selection = nodes.filter(n => n.selected);
                        if (selection.length < 2) return;
                        const masterY = selection[0].position.y;
                        setNodes(nds => nds.map(n => n.selected ? { ...n, position: { ...n.position, y: masterY } } : n));
                      }}
                      className="py-2 rounded-lg border border-neutral-200 bg-white text-[9px] font-bold uppercase text-neutral-500 hover:border-blue-500 hover:text-blue-600 transition-all font-bold"
                    >
                      Align Top
                    </button>
                  </div>
                  <div className="flex items-center gap-2 px-1 py-1 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                    <p className="text-[9px] text-neutral-400 font-bold leading-tight">
                      Select reference node, then use <span className="text-neutral-900 uppercase">Apply to All</span> to unify sizes.
                    </p>
                  </div>
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

                    {selectedNode.data.postType === 'specific' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between">
                           <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Select Post Slot</label>
                           <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-neutral-400">Last 90 days</span>
                              <button className="w-8 h-4 bg-emerald-500 rounded-full relative transition-all">
                                <div className="absolute right-0.5 top-0.5 h-3 w-3 bg-white rounded-full shadow-sm" />
                              </button>
                           </div>
                        </div>
                        
                        {/* 1:1 Post Preview Overlay */}
                        {selectedNode.data.selectedPostId && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="aspect-square w-full rounded-2xl border-4 border-amber-500 shadow-2xl relative overflow-hidden bg-neutral-100"
                          >
                             <img 
                               src={`https://picsum.photos/seed/${parseInt(selectedNode.data.selectedPostId.split('-')[1]) + 10}/600`} 
                               alt="Selected Post" 
                               className="w-full h-full object-cover"
                             />
                             <div className="absolute top-3 right-3 bg-amber-500 text-white p-1.5 rounded-full shadow-lg">
                               <CheckCircle2 size={16} />
                             </div>
                             <div className="absolute bottom-4 inset-x-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-white/20 shadow-xl">
                               <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-0.5">Post Attached</p>
                               <p className="text-[11px] text-neutral-600 font-bold truncate">@{activeWorkspace?.name || 'User'} • Instagram Reel</p>
                             </div>
                          </motion.div>
                        )}
                        
                        <div className="grid grid-cols-3 gap-2 h-44 overflow-y-auto pr-1 scrollbar-hide bg-neutral-50/50 p-2 rounded-xl border border-neutral-100">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                            <button 
                              key={i}
                              onClick={() => updateNodeData({ selectedPostId: `post-${i}` })}
                              className={cn(
                                "aspect-square rounded-lg bg-white border-2 transition-all relative overflow-hidden group shadow-sm",
                                selectedNode.data.selectedPostId === `post-${i}` ? "border-amber-500 ring-2 ring-amber-500/20" : "border-transparent"
                              )}
                            >
                              <img src={`https://picsum.photos/seed/${i + 10}/200`} alt="" className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                              {selectedNode.data.selectedPostId === `post-${i}` && (
                                <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                                  <div className="bg-amber-500 text-white rounded-full p-1 shadow-md"><CheckCircle2 size={10} /></div>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-neutral-400 italic text-center">Tap a post to attach this automation</p>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Trigger Keywords (Max 10)</label>
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
                             { id: 'dm', label: 'Standard DM', icon: MessageSquare, defaultContent: "Hello! How can we help you today?" },
                             { id: 'follow_check', label: 'Follow Guard', icon: UserPlus, defaultContent: "Thanks for reaching out! To proceed, please make sure you're following our profile." },
                             { id: 'email_capture', label: 'Email Opt-in', icon: Mail, defaultContent: "Great! Please reply with your email address to receive the details." },
                             { id: 'link_delivery', label: 'Link Send', icon: LinkIcon, defaultContent: "Here is the exclusive link I promised! Enjoy." }
                           ].map((t) => (
                              <button 
                                key={t.id}
                                onClick={() => {
                                  const updates: any = { type: t.id };
                                  if (!selectedNode.data.label || selectedNode.data.label === 'Enter your message here...') {
                                    updates.label = t.defaultContent;
                                  }
                                  
                                  // Add default follow button if type is follow_check
                                  if (t.id === 'follow_check' && (!selectedNode.data.buttons || selectedNode.data.buttons.length === 0)) {
                                    updates.buttons = [{ label: 'Follow Profile', type: 'external_link', link: `https://instagram.com/${activeWorkspace?.name || 'profile'}` }];
                                  }

                                  updateNodeData(updates);
                                }}
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
                        className="w-full h-32 bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
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
               "flex-1 flex items-center justify-center gap-2 text-white rounded-xl text-xs font-black uppercase shadow-xl transition-all disabled:opacity-50",
               saveStatus === 'saved' && publishing === false ? "bg-emerald-600" : "bg-neutral-900 hover:bg-black"
             )}
           >
              {publishing ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} fill="white" />}
              {saveStatus === 'saved' && publishing === false ? 'Published ✨' : 'Publish'}
           </button>
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div className="flex-1 bg-[#F8FAFC] relative">
        <div className="h-full w-full">
          <style>{`
            .react-flow__edge.selected .react-flow__edge-path {
              stroke: #3b82f6 !important;
              stroke-width: 4px !important;
            }
            .react-flow__edge:hover .react-flow__edge-path {
              stroke: #60a5fa !important;
              stroke-width: 3px !important;
            }
          `}</style>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeReconnect={onEdgeReconnect}
            isValidConnection={isValidConnection}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid={true}
            snapGrid={[20, 20]}
            reconnectMode="around"
            deleteKeyCode={["Backspace", "Delete"]}
            className="bg-transparent touch-none"
            nodesDraggable={true}
            edgesUpdatable={true}
            edgesFocusable={true}
            connectionRadius={50}
            defaultEdgeOptions={{ 
              animated: true, 
              style: { stroke: '#94A3B8', strokeWidth: 2.5 },
              type: 'smoothstep',
              selectable: true
            }}
          >
            <Background variant={BackgroundVariant.Lines} color="#e5e7eb" gap={20} size={1} />
            <Controls position="bottom-left" showInteractive={false} className="hidden sm:flex border-neutral-200 shadow-xl rounded-xl" />
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
              className="hidden lg:block !bottom-4 !right-4 !bg-white !border-neutral-200 !rounded-xl !shadow-2xl"
            />
            
            <Panel position="top-left" className="bg-white/90 backdrop-blur-md p-2 rounded-2xl border border-neutral-200 shadow-xl m-4 flex items-center gap-2 max-w-[200px] sm:max-w-none overflow-hidden">
               <button 
                onClick={onBack}
                className="lg:hidden p-2 text-neutral-500 hover:bg-neutral-50 rounded-lg shrink-0"
               >
                 <ChevronRight size={18} className="rotate-180" />
               </button>
               <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0 hidden sm:flex">
                  <Languages size={20} className="text-white" />
               </div>
               <div className="min-w-0">
                 <input 
                   value={flowName}
                   onChange={(e) => setFlowName(e.target.value)}
                   className="text-sm font-black text-neutral-900 bg-transparent outline-none border-none p-0 focus:ring-0 w-full truncate"
                 />
                 <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest truncate">Automation Flow</p>
               </div>
            </Panel>

            <Panel position="top-right" className="flex items-center gap-2 m-4">
               <button 
                 onClick={() => saveFlow('draft')}
                 disabled={saving || saveStatus === 'saving'}
                 className="h-10 px-4 bg-white border border-neutral-200 text-neutral-900 rounded-2xl text-[10px] font-black uppercase shadow-xl hover:shadow-2xl transition-all flex items-center gap-2"
               >
                 {saving ? <Loader2 className="animate-spin" size={14} /> : (saveStatus === 'saved' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Save size={14} />)}
                 <span className="hidden sm:inline">{saveStatus === 'saved' && !saving ? 'Saved' : 'Save'}</span>
               </button>
               <button 
                 onClick={() => saveFlow('active')}
                 disabled={publishing}
                 className="h-10 px-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
               >
                 {publishing ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} fill="white" />}
                 <span>Publish</span>
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
