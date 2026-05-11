import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  RefreshCw, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface EcosystemSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ecosystems = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts, deals, and activities automatically.',
    icon: 'HS',
    logo: 'https://cdn.simpleicons.org/hubspot/FF7A59',
    color: 'bg-[#FF7A59]/10 border-[#FF7A59]/20',
    connected: false
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Sync customer orders, carts, and segments.',
    icon: 'S',
    logo: 'https://cdn.simpleicons.org/shopify/95BF47',
    color: 'bg-[#95BF47]/10 border-[#95BF47]/20',
    connected: false
  },
  {
    id: 'klaviyo',
    name: 'Klaviyo',
    description: 'Sync email lists, segments, and campaigns.',
    icon: 'K',
    logo: 'https://cdn.simpleicons.org/klaviyo/000000',
    color: 'bg-neutral-50 border-neutral-100',
    connected: false
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Automate marketing and sync audience data.',
    icon: 'MC',
    logo: 'https://cdn.simpleicons.org/mailchimp/000000',
    color: 'bg-neutral-100 border-[#FFE01B]/20',
    connected: false
  }
];

export default function EcosystemSyncModal({ isOpen, onClose }: EcosystemSyncModalProps) {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [connectedIds, setConnectedIds] = useState<string[]>([]);

  const handleSync = (id: string) => {
    setSyncing(id);
    // Simulate sync
    setTimeout(() => {
      setSyncing(null);
      setConnectedIds(prev => [...prev, id]);
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-8 sm:px-10 border-b border-neutral-100 relative">
              <div className="flex items-center gap-4 mb-2">
                <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-100">
                  <RefreshCw size={24} className={syncing ? "animate-spin" : ""} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-neutral-900 uppercase tracking-tight">Ecosystem Sync</h3>
                  <p className="text-neutral-500 text-xs sm:text-sm font-medium">Real-time bi-directional data flow.</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="absolute top-8 right-6 p-2 rounded-full hover:bg-neutral-100 text-neutral-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {ecosystems.map((app) => {
                  const isConnected = connectedIds.includes(app.id);
                  const isSyncing = syncing === app.id;

                  return (
                    <div 
                      key={app.id}
                      className={cn(
                        "group p-6 rounded-3xl border transition-all relative overflow-hidden",
                        isConnected 
                          ? "bg-emerald-50/50 border-emerald-100" 
                          : "bg-white border-neutral-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50"
                      )}
                    >
                      <div className="flex items-center gap-5 relative z-10">
                        <div className={cn(
                          "h-14 w-14 rounded-2xl flex items-center justify-center p-3 shadow-sm transition-transform group-hover:scale-110",
                          app.color
                        )}>
                          {app.logo ? (
                            <img 
                              src={app.logo} 
                              alt={app.name} 
                              className="w-full h-full object-contain" 
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : app.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-neutral-900 text-lg uppercase tracking-tight">{app.name}</h4>
                            {isConnected && <CheckCircle2 size={16} className="text-emerald-500" />}
                          </div>
                          <p className="text-xs text-neutral-500 font-medium leading-relaxed">{app.description}</p>
                        </div>
                        <button 
                          disabled={isSyncing}
                          onClick={() => handleSync(app.id)}
                          className={cn(
                            "px-4 sm:px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2",
                            isConnected 
                              ? "bg-white text-emerald-600 border border-emerald-100 shadow-sm" 
                              : "bg-neutral-900 text-white shadow-xl shadow-neutral-200 hover:bg-neutral-800"
                          )}
                        >
                          {isSyncing ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              <span className="hidden sm:inline">Syncing...</span>
                            </>
                          ) : isConnected ? (
                            <>
                              <RefreshCw size={14} />
                              <span className="hidden sm:inline">Resync</span>
                            </>
                          ) : (
                            <>
                              <span className="hidden sm:inline">Connect</span>
                              <ArrowRight size={14} />
                            </>
                          )}
                        </button>
                      </div>
                      
                      {isConnected && (
                        <div className="mt-4 pt-4 border-t border-emerald-100/50 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                            <ShieldCheck size={14} />
                            Active Connection
                          </div>
                          <span className="text-[10px] text-neutral-400 font-bold">Last sync: Just now</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                  <Zap size={20} fill="currentColor" />
                </div>
                <div>
                  <h5 className="font-black text-blue-900 text-sm uppercase tracking-tight mb-1">Instant Data Mapping</h5>
                  <p className="text-xs text-blue-700/70 font-medium leading-relaxed">
                    FlowChat automatically maps your custom fields and tags between platforms. No manual configuration required.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 sm:px-10 py-8 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
              <button className="text-xs font-bold text-neutral-400 hover:text-neutral-600 flex items-center gap-2">
                Need help? <ExternalLink size={14} />
              </button>
              <button 
                onClick={onClose}
                className="px-8 py-4 bg-white border border-neutral-200 rounded-2xl font-black text-xs text-neutral-900 uppercase tracking-widest hover:bg-neutral-100 transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
