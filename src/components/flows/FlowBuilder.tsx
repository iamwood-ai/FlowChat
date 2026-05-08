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
  Music2,
  Instagram,
  Facebook,
  Loader2,
  Smartphone
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { ALL_TEMPLATES } from '../../constants/templates';

// --- Custom Node Components ---

const MessageNode = ({ data, selected }: any) => {
  return (
    <div className={cn(
      "min-w-[220px] shadow-lg rounded-xl border bg-white overflow-hidden transition-all",
      selected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-blue-100"
    )}>
      <div className="bg-blue-600 px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-white">
          <MessageSquare size={12} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Message</span>
        </div>
        {selected && (
          <div className="flex items-center gap-1">
             <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-neutral-600 leading-relaxed min-h-[40px]">
          {data.label || 'Enter your message here...'}
        </p>
      </div>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-blue-400 !border-2 !border-white" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-blue-400 !border-2 !border-white" />
    </div>
  );
};

const TriggerNode = ({ data, selected }: any) => {
  return (
    <div className={cn(
      "min-w-[200px] shadow-lg rounded-xl border bg-white overflow-hidden transition-all",
      selected ? "border-amber-500 ring-2 ring-amber-500/20" : "border-amber-100"
    )}>
      <div className="bg-amber-500 px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-white">
          <Zap size={12} fill="currentColor" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Trigger</span>
        </div>
      </div>
      <div className="p-3">
        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">
           {data.type?.replace('Node', '') || 'Keyword'} Trigger
        </p>
        <p className="text-xs font-bold text-neutral-800">{data.trigger || 'Click to set keyword'}</p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-amber-400 !border-2 !border-white" />
    </div>
  );
};

const DelayNode = ({ data, selected }: any) => {
  return (
    <div className={cn(
      "min-w-[180px] shadow-lg rounded-xl border bg-white overflow-hidden transition-all",
      selected ? "border-purple-500 ring-2 ring-purple-500/20" : "border-purple-100"
    )}>
      <div className="bg-purple-600 px-3 py-1.5 flex items-center gap-1.5 text-white">
        <Clock size={12} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Delay</span>
      </div>
      <div className="p-3">
        <p className="text-xs font-bold text-neutral-800">Wait for {data.duration || '24 hours'}</p>
        <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-tighter">Then proceed to next step</p>
      </div>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-purple-400 !border-2 !border-white" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-purple-400 !border-2 !border-white" />
    </div>
  );
};

const ABTestNode = ({ data }: any) => {
  return (
    <div className="min-w-[200px] shadow-lg rounded-xl border border-indigo-100 bg-white overflow-hidden">
      <div className="bg-indigo-600 px-3 py-1.5 flex items-center gap-1.5 text-white">
        <Split size={12} />
        <span className="text-[10px] font-bold uppercase tracking-wider">A/B Split Test</span>
      </div>
      <div className="p-3">
        <div className="flex justify-between text-[10px] font-bold text-neutral-400 mb-2">
          <span>PATH A (50%)</span>
          <span>PATH B (50%)</span>
        </div>
        <p className="text-xs text-neutral-600 text-center italic">Splitting traffic automatically...</p>
      </div>
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-indigo-400 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} id="a" style={{ left: '30%' }} className="w-2 h-2 bg-indigo-400 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} id="b" style={{ left: '70%' }} className="w-2 h-2 bg-indigo-400 border-2 border-white" />
    </div>
  );
};

const AINode = ({ data }: any) => {
  return (
    <div className="min-w-[220px] shadow-lg rounded-xl border border-fuchsia-100 bg-white overflow-hidden">
      <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 px-3 py-1.5 flex items-center gap-1.5 text-white">
        <Zap size={12} fill="white" />
        <span className="text-[10px] font-bold uppercase tracking-wider">AI Intelligent Response</span>
      </div>
      <div className="p-3">
        <p className="text-[11px] font-medium text-neutral-800 mb-1">Prompt Context:</p>
        <p className="text-[10px] text-neutral-500 line-clamp-2 italic">
          "{data.prompt || 'Act as a helpful assistant and resolve user intent...'}"
        </p>
      </div>
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-fuchsia-400 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-fuchsia-400 border-2 border-white" />
    </div>
  );
};

const nodeTypes = {
  messageNode: MessageNode,
  triggerNode: TriggerNode,
  delayNode: DelayNode,
  abTestNode: ABTestNode,
  aiNode: AINode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'triggerNode',
    data: { trigger: 'Keyword: "OFFER"' },
    position: { x: 250, y: 50 },
  },
  {
    id: '2',
    type: 'messageNode',
    data: { label: "Hey there! Thanks for your interest in our special offer. What's your email?" },
    position: { x: 250, y: 150 },
  },
  {
    id: '3',
    type: 'delayNode',
    data: { duration: '2 minutes' },
    position: { x: 250, y: 280 },
  },
  {
    id: '4',
    type: 'messageNode',
    data: { label: "Just checking in, did you see the link?" },
    position: { x: 250, y: 380 },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
];

interface FlowBuilderProps {
  flowId?: string | null;
  templateId?: string | null;
  prompt?: string | null;
  onBack: () => void;
}

export default function FlowBuilder({ flowId: initialFlowId, templateId, prompt, onBack }: FlowBuilderProps) {
  const { activeWorkspace } = useAuth();
  const [flowId, setFlowId] = useState<string | null>(initialFlowId || null);
  const [flowName, setFlowName] = useState('New Automation Flow');
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [activeTab, setActiveTab] = useState<'nodes' | 'templates' | 'properties'>('nodes');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);

  // Load flow if it exists
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
          console.warn("Could not load flow:", error);
        }
      } else if (templateId) {
        // Load template data
        const templateInfo = ALL_TEMPLATES.find(t => t.id === templateId);
        
        const templates: Record<string, { nodes: Node[], edges: Edge[] }> = {
          'auto-dm-comments': {
            nodes: [
              { id: 't1', type: 'triggerNode', data: { trigger: 'Comment: "INFO"' }, position: { x: 250, y: 50 } },
              { id: 't2', type: 'messageNode', data: { label: "Thanks for commenting! Here is the info you requested." }, position: { x: 250, y: 180 } }
            ],
            edges: [{ id: 'te1', source: 't1', target: 't2', animated: true }]
          },
          'run-giveaway': {
            nodes: [
              { id: 'g1', type: 'triggerNode', data: { trigger: 'Comment: "WIN"' }, position: { x: 250, y: 50 } },
              { id: 'g2', type: 'messageNode', data: { label: "You've been entered into the giveaway! We'll announce winners soon." }, position: { x: 250, y: 180 } }
            ],
            edges: [{ id: 'ge1', source: 'g1', target: 'g2' }]
          },
          'respond-dms': {
            nodes: [
              { id: 'rd1', type: 'triggerNode', data: { trigger: 'Any Message' }, position: { x: 250, y: 50 } },
              { id: 'rd2', type: 'aiNode', data: { prompt: "Be a helpful customer support agent for FlowChat." }, position: { x: 250, y: 180 } }
            ],
            edges: [{ id: 'rde1', source: 'rd1', target: 'rd2' }]
          },
          'ig-comment': {
            nodes: [
              { id: 't1', type: 'triggerNode', data: { trigger: 'Comment: "OFFER"' }, position: { x: 250, y: 50 } },
              { id: 't2', type: 'messageNode', data: { label: "Thanks for commenting! Here is your 20% discount code: SAVE20" }, position: { x: 250, y: 180 } }
            ],
            edges: [{ id: 'te1', source: 't1', target: 't2', animated: true }]
          },
          'fb-welcome': {
            nodes: [
              { id: 'w1', type: 'triggerNode', data: { trigger: 'New Follower' }, position: { x: 250, y: 50 } },
              { id: 'w2', type: 'messageNode', data: { label: "Welcome to our page! How can we help you today?" }, position: { x: 250, y: 180 } }
            ],
            edges: [{ id: 'we1', source: 'w1', target: 'w2' }]
          },
          'tt-keyword': {
            nodes: [
              { id: 'tk1', type: 'triggerNode', data: { trigger: 'Keyword: "CATALOG"' }, position: { x: 250, y: 50 } },
              { id: 'tk2', type: 'messageNode', data: { label: "Our full catalog is right here: flows.ai/catalog" }, position: { x: 250, y: 180 } }
            ],
            edges: [{ id: 'tke1', source: 'tk1', target: 'tk2' }]
          },
          'wa-updates': {
            nodes: [
              { id: 'wa1', type: 'triggerNode', data: { trigger: 'Order Received' }, position: { x: 250, y: 50 } },
              { id: 'wa2', type: 'messageNode', data: { label: "Your order has been received and is being processed!" }, position: { x: 250, y: 180 } }
            ],
            edges: [{ id: 'wae1', source: 'wa1', target: 'wa2' }]
          },
          'tt-live': {
            nodes: [
              { id: 'ttl1', type: 'triggerNode', data: { trigger: 'Live Question' }, position: { x: 250, y: 50 } },
              { id: 'ttl2', type: 'messageNode', data: { label: "I'll answer that question in just a second! Keep watching." }, position: { x: 250, y: 180 } }
            ],
            edges: [{ id: 'ttle1', source: 'ttl1', target: 'ttl2' }]
          },
          'sms-sale': {
            nodes: [
              { id: 'sms1', type: 'triggerNode', data: { trigger: 'Flash Sale Start' }, position: { x: 250, y: 50 } },
              { id: 'sms2', type: 'messageNode', data: { label: "FLASH SALE: Use code SALE50 for 50% off for the next hour!" }, position: { x: 250, y: 180 } }
            ],
            edges: [{ id: 'smse1', source: 'sms1', target: 'sms2' }]
          }
        };

        const template = templates[templateId] || {
          nodes: [
            { id: 'd1', type: 'triggerNode', data: { trigger: 'Keyword: "START"' }, position: { x: 250, y: 50 } },
            { id: 'd2', type: 'messageNode', data: { label: templateInfo ? `Welcome! You've triggered the ${templateInfo.title} automation.` : "Welcome to your new automation!" }, position: { x: 250, y: 180 } }
          ],
          edges: [{ id: 'de1', source: 'd1', target: 'd2', animated: true }]
        };

        if (template) {
          setNodes(template.nodes);
          setEdges(template.edges);
          const name = templateInfo ? `Template: ${templateInfo.title}` : `Template: ${templateId.replace(/-/g, ' ')}`;
          setFlowName(name);

          // Auto-save as draft
          const newFlowId = `flow-${Date.now()}`;
          const path = `workspaces/${activeWorkspace.id}/flows/${newFlowId}`;
          setDoc(doc(db, path), {
            id: newFlowId,
            workspaceId: activeWorkspace.id,
            name: name,
            nodes: template.nodes,
            edges: template.edges,
            status: 'draft',
            updatedAt: serverTimestamp()
          }).then(() => {
            setFlowId(newFlowId);
          });
        }
      } else if (prompt) {
        setFlowName(`AI: ${prompt.slice(0, 20)}...`);
      }
    };

    initFlow();
  }, [activeWorkspace, flowId, templateId, prompt, setNodes, setEdges]);

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

  const saveFlow = async (status: 'draft' | 'active' = 'draft') => {
    if (!activeWorkspace) return;
    const isPublishing = status === 'active';
    if (isPublishing) setPublishing(true);
    else setSaving(true);

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
      alert(isPublishing ? "Flow published successfully!" : "Flow saved as draft!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  const addNode = (type: string, data: any = {}) => {
    const id = Date.now().toString();
    const newNode = {
      id,
      type,
      position: { x: 300, y: 300 },
      data: { 
        ...data,
        label: data.label || `New ${type.replace('Node', '')}`,
        trigger: data.trigger || 'New Trigger'
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const loadTemplate = (templateName: string) => {
    const templateInfo = ALL_TEMPLATES.find(t => t.id === templateName);
    const templates: Record<string, { nodes: Node[], edges: Edge[] }> = {
      'auto-dm-comments': {
        nodes: [
          { id: 't1', type: 'triggerNode', data: { trigger: 'Comment: "INFO"' }, position: { x: 250, y: 50 } },
          { id: 't2', type: 'messageNode', data: { label: "Thanks for commenting! Here is the info you requested." }, position: { x: 250, y: 180 } }
        ],
        edges: [{ id: 'te1', source: 't1', target: 't2', animated: true }]
      },
      'run-giveaway': {
        nodes: [
          { id: 'g1', type: 'triggerNode', data: { trigger: 'Comment: "WIN"' }, position: { x: 250, y: 50 } },
          { id: 'g2', type: 'messageNode', data: { label: "You've been entered into the giveaway! We'll announce winners soon." }, position: { x: 250, y: 180 } }
        ],
        edges: [{ id: 'ge1', source: 'g1', target: 'g2' }]
      },
      'respond-dms': {
        nodes: [
          { id: 'rd1', type: 'triggerNode', data: { trigger: 'Any Message' }, position: { x: 250, y: 50 } },
          { id: 'rd2', type: 'aiNode', data: { prompt: "Be a helpful customer support agent for FlowChat." }, position: { x: 250, y: 180 } }
        ],
        edges: [{ id: 'rde1', source: 'rd1', target: 'rd2' }]
      },
      'ig-comment': {
        nodes: [
          { id: 't1', type: 'triggerNode', data: { trigger: 'Comment: "OFFER"' }, position: { x: 250, y: 50 } },
          { id: 't2', type: 'messageNode', data: { label: "Thanks for commenting! Here is your 20% discount code: SAVE20" }, position: { x: 250, y: 180 } }
        ],
        edges: [{ id: 'te1', source: 't1', target: 't2', animated: true }]
      },
      'fb-welcome': {
        nodes: [
          { id: 'w1', type: 'triggerNode', data: { trigger: 'New Follower' }, position: { x: 250, y: 50 } },
          { id: 'w2', type: 'messageNode', data: { label: "Welcome to our page! How can we help you today?" }, position: { x: 250, y: 180 } }
        ],
        edges: [{ id: 'we1', source: 'w1', target: 'w2' }]
      },
      'tt-keyword': {
        nodes: [
          { id: 'tk1', type: 'triggerNode', data: { trigger: 'Keyword: "CATALOG"' }, position: { x: 250, y: 50 } },
          { id: 'tk2', type: 'messageNode', data: { label: "Our full catalog is right here: flows.ai/catalog" }, position: { x: 250, y: 180 } }
        ],
        edges: [{ id: 'tke1', source: 'tk1', target: 'tk2' }]
      },
      'wa-updates': {
        nodes: [
          { id: 'wa1', type: 'triggerNode', data: { trigger: 'Order Received' }, position: { x: 250, y: 50 } },
          { id: 'wa2', type: 'messageNode', data: { label: "Your order has been received and is being processed!" }, position: { x: 250, y: 180 } }
        ],
        edges: [{ id: 'wae1', source: 'wa1', target: 'wa2' }]
      },
      'tt-live': {
        nodes: [
          { id: 'ttl1', type: 'triggerNode', data: { trigger: 'Live Question' }, position: { x: 250, y: 50 } },
          { id: 'ttl2', type: 'messageNode', data: { label: "I'll answer that question in just a second! Keep watching." }, position: { x: 250, y: 180 } }
        ],
        edges: [{ id: 'ttle1', source: 'ttl1', target: 'ttl2' }]
      },
      'sms-sale': {
        nodes: [
          { id: 'sms1', type: 'triggerNode', data: { trigger: 'Flash Sale Start' }, position: { x: 250, y: 50 } },
          { id: 'sms2', type: 'messageNode', data: { label: "FLASH SALE: Use code SALE50 for 50% off for the next hour!" }, position: { x: 250, y: 180 } }
        ],
        edges: [{ id: 'smse1', source: 'sms1', target: 'sms2' }]
      }
    };

    const template = templates[templateName] || {
      nodes: [
        { id: 'd1', type: 'triggerNode', data: { trigger: 'Keyword: "START"' }, position: { x: 250, y: 50 } },
        { id: 'd2', type: 'messageNode', data: { label: templateInfo ? `Welcome! You've triggered the ${templateInfo.title} automation.` : "Welcome to your new automation!" }, position: { x: 250, y: 180 } }
      ],
      edges: [{ id: 'de1', source: 'd1', target: 'd2', animated: true }]
    };
    if (template) {
      setNodes(template.nodes);
      setEdges(template.edges);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full flex overflow-hidden relative">
      {/* Mobile Overlay */}
      <div className="lg:hidden absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 shadow-sm">
          <Smartphone size={32} />
        </div>
        <h3 className="text-xl font-bold text-neutral-900 mb-2">Desktop Recommended</h3>
        <p className="text-sm text-neutral-500 max-w-xs leading-relaxed">
          The Automation Builder is optimized for larger screens to ensure precision in your flow designs. Please switch to a tablet or laptop for the best experience.
        </p>
        <button 
          onClick={onBack}
          className="mt-8 px-6 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-bold shadow-xl shadow-neutral-200"
        >
          Back to List
        </button>
      </div>

      {/* Sidebar for Node palette */}
      <div className="w-80 border-r border-neutral-200 bg-white flex flex-col overflow-hidden">
        <div className="flex border-b border-neutral-100">
          <button 
            onClick={() => setActiveTab('nodes')}
            className={cn(
              "flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors",
              activeTab === 'nodes' ? "text-blue-600 border-b-2 border-blue-600" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            Components
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={cn(
              "flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors",
              activeTab === 'templates' ? "text-blue-600 border-b-2 border-blue-600" : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            Templates
          </button>
          {selectedNodeId && (
            <button 
              onClick={() => setActiveTab('properties')}
              className={cn(
                "flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors",
                activeTab === 'properties' ? "text-blue-600 border-b-2 border-blue-600" : "text-neutral-400 hover:text-neutral-600"
              )}
            >
              Settings
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {activeTab === 'nodes' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">Core Actions</h3>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => addNode('messageNode', { label: 'Hello! How can we help you?' })}
                    className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 bg-neutral-50 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                      <MessageSquare size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-neutral-800">Send Message</p>
                      <p className="text-[10px] text-neutral-500">Text, images, or cards</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => addNode('delayNode', { duration: '1 hour' })}
                    className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 bg-neutral-50 hover:border-purple-200 hover:bg-purple-50 transition-all group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-sm">
                      <Clock size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-neutral-800">Smart Delay</p>
                      <p className="text-[10px] text-neutral-500">Wait specific duration</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => addNode('aiNode', { prompt: 'Greet the user enthusiastically' })}
                    className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 bg-neutral-50 hover:border-fuchsia-200 hover:bg-fuchsia-50 transition-all group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-fuchsia-100 text-fuchsia-600 group-hover:bg-fuchsia-600 group-hover:text-white transition-colors shadow-sm">
                      <Zap size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-neutral-800">AI Response</p>
                      <p className="text-[10px] text-neutral-500">Intelligent Gemini replies</p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">Triggers</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Keyword', type: 'Keyword', icon: Zap },
                    { label: 'Comment', type: 'Comment', icon: MessageSquare },
                    { label: 'Follow', type: 'Follow', icon: Zap },
                    { label: 'Story', type: 'Story', icon: Zap },
                  ].map(trigger => (
                    <button 
                      key={trigger.label} 
                      onClick={() => addNode('triggerNode', { trigger: `${trigger.type}: "START"`, type: trigger.type })}
                      className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-white border border-neutral-200 text-[11px] font-bold text-neutral-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all"
                    >
                      <trigger.icon size={14} className="text-blue-500" />
                      {trigger.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'templates' ? (
            <div className="space-y-4">
               {[
                { id: 'ig-comment', title: 'Instagram Giveaway', icon: Instagram, color: 'text-pink-600 bg-pink-50' },
                { id: 'fb-welcome', title: 'Welcome Greeting', icon: Facebook, color: 'text-blue-600 bg-blue-50' },
                { id: 'tt-keyword', title: 'TikTok Keyword', icon: Music2, color: 'text-neutral-900 bg-neutral-100' },
                { id: 'lead-mag', title: 'Ebook Delivery', icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50' },
              ].map((template) => (
                <button 
                  key={template.id}
                  onClick={() => loadTemplate(template.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-neutral-200 bg-white hover:border-blue-600 hover:shadow-lg transition-all group text-left"
                >
                  <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", template.color)}>
                    <template.icon size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-800">{template.title}</h4>
                    <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-widest font-bold">Deploy Template</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               {selectedNode ? (
                 <div className="space-y-6">
                   <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                     <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                           <Settings2 size={16} />
                        </div>
                        <h3 className="text-sm font-bold text-neutral-900 capitalize">{selectedNode.type?.replace('Node', '')} Settings</h3>
                     </div>
                     <button 
                        onClick={deleteSelectedNode}
                        className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                   </div>

                   {/* Conditional Editor based on Node Type */}
                   {selectedNode.type === 'messageNode' && (
                     <div className="space-y-4">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Message Content</label>
                        <textarea 
                          value={selectedNode.data.label}
                          onChange={(e) => updateNodeData({ label: e.target.value })}
                          placeholder="Your message goes here..."
                          className="w-full h-32 p-4 bg-white border border-neutral-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all overflow-y-auto font-sans"
                        />
                        <div className="flex items-center gap-2 text-[10px] text-neutral-400 italic">
                           <Zap size={10} className="text-amber-500" />
                           <span>Use {`{{name}}`} for personalization</span>
                        </div>
                     </div>
                   )}

                   {selectedNode.type === 'triggerNode' && (
                     <div className="space-y-4">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Trigger Phrase</label>
                        <div className="relative">
                          <input 
                            type="text"
                            value={selectedNode.data.trigger}
                            onChange={(e) => updateNodeData({ trigger: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm font-bold text-neutral-800 outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Enter keyword..."
                          />
                          <Zap size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400" />
                        </div>
                        <p className="text-[10px] text-neutral-400 leading-relaxed italic">
                          This automation will fire when a user sends exactly this keyword in your chat.
                        </p>
                     </div>
                   )}

                   {selectedNode.type === 'delayNode' && (
                     <div className="space-y-4">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Wait Duration</label>
                        <select 
                          value={selectedNode.data.duration}
                          onChange={(e) => updateNodeData({ duration: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm font-bold text-neutral-800 outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option>Instant (No Delay)</option>
                          <option>5 minutes</option>
                          <option>30 minutes</option>
                          <option>1 hour</option>
                          <option>24 hours</option>
                        </select>
                     </div>
                   )}

                    {selectedNode.type === 'aiNode' && (
                     <div className="space-y-4">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">AI Context Prompt</label>
                        <textarea 
                          value={selectedNode.data.prompt}
                          onChange={(e) => updateNodeData({ prompt: e.target.value })}
                          placeholder="Tell Gemini how to respond..."
                          className="w-full h-32 p-4 bg-white border border-neutral-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all font-sans"
                        />
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-12 h-12 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mb-4">
                       <Plus size={24} />
                    </div>
                    <p className="text-sm font-bold text-neutral-900">No step selected</p>
                    <p className="text-xs text-neutral-400 mt-1">Select a step on the canvas to edit its properties.</p>
                 </div>
               )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-neutral-100 bg-neutral-50/50">
          <div className="rounded-2xl bg-neutral-900 p-4 text-white shadow-xl">
            <div className="flex items-center gap-2 mb-3">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Live Editor</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-white/5">
              <span className="text-neutral-400">Total Steps</span>
              <span className="font-mono text-blue-400 font-bold">{nodes.length}</span>
            </div>
            <div className="flex justify-between text-xs py-1">
              <span className="text-neutral-400">Connections</span>
              <span className="font-mono text-emerald-400 font-bold">{edges.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div className="flex-1 relative bg-neutral-50">
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
        >
          <Background color="#ccc" variant={"dots" as any} gap={20} />
          <Controls className="!bg-white !border-neutral-200 !shadow-xl !rounded-xl overflow-hidden" />
          <MiniMap 
            nodeColor={(n) => {
              if (n.type === 'triggerNode') return '#f59e0b';
              if (n.type === 'messageNode') return '#26bcff';
              if (n.type === 'delayNode') return '#9333ea';
              return '#ccc';
            }} 
            className="!bg-white/80 !border-neutral-200 !backdrop-blur-sm !rounded-2xl !shadow-lg"
          />
          
          <Panel position="top-left" className="flex items-center gap-4 bg-white p-2 rounded-xl border border-neutral-200 shadow-lg ml-4 mt-4">
             <button 
              onClick={onBack}
              className="p-2 hover:bg-neutral-50 rounded-lg text-neutral-400 hover:text-neutral-900 transition-colors"
             >
                <ChevronRight size={20} className="rotate-180" />
             </button>
             <div className="h-6 w-[1px] bg-neutral-200" />
             <input 
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              className="text-sm font-bold text-neutral-900 focus:outline-none min-w-[200px]"
              placeholder="Automation Name"
             />
          </Panel>

          <Panel position="top-right" className="flex gap-2">
            <button 
              onClick={() => saveFlow('draft')}
              disabled={saving || publishing}
              className="flex items-center gap-2 rounded-xl bg-white border border-neutral-200 px-5 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Draft
            </button>
            <button 
              onClick={() => saveFlow('active')}
              disabled={saving || publishing}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {publishing ? <Loader2 size={16} className="animate-spin text-white" /> : <Play size={16} fill="white" />}
              Publish Flow
            </button>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
