import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Globe, 
  MessageSquare, 
  CreditCard, 
  Share2,
  Facebook,
  Instagram,
  Music2,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Lock,
  Eye,
  Send,
  Smartphone,
  Zap,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'integrations', label: 'Integrations', icon: Share2 },
  { id: 'automations', label: 'Automations', icon: MessageSquare },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

export default function SettingsView() {
  const { user, activeWorkspace, workspaces, updateWorkspace, createWorkspace } = useAuth();
  const [activeTab, setActiveTab] = useState('integrations');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [profilePhoto, setProfilePhoto] = useState(user?.photoURL || '');
  const [workspaceName, setWorkspaceName] = useState(activeWorkspace?.name || '');
  const [smartReplyDelay, setSmartReplyDelay] = useState(3);

  const handleSaveWorkspaceName = async () => {
    if (!activeWorkspace || !workspaceName || workspaceName === activeWorkspace.name) return;
    setIsSaving(true);
    await updateWorkspace(activeWorkspace.id, workspaceName);
    setIsSaving(false);
  };

  const handleAddWorkspace = async () => {
    if (workspaces.length >= 10) {
      alert("You have already reached the maximum limit of 10 profiles.");
      return;
    }
    const name = prompt("Enter profile name (e.g. My Agency, Personal Brand):");
    if (name) {
      await createWorkspace(name);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfilePhoto(url);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Simulation of saving to Firestore/Auth
      await new Promise(resolve => setTimeout(resolve, 1200));
      alert("Changes saved: Display Name: " + displayName + ", Email: " + email);
    } catch (error) {
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSecurity = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    // Implement password update logic here
    alert("Security settings updated!");
  };

  const platforms = [
    { id: 'fb', name: 'Facebook Messenger', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50', connected: true },
    { id: 'ig', name: 'Instagram DM', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50', connected: true },
    { id: 'tt', name: 'TikTok Messaging', icon: Music2, color: 'text-neutral-900', bg: 'bg-neutral-100', connected: false },
    { id: 'wa', name: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50', connected: false },
    { id: 'sms', name: 'SMS', icon: Smartphone, color: 'text-neutral-600', bg: 'bg-neutral-100', connected: false },
    { id: 'tg', name: 'Telegram', icon: Send, color: 'text-sky-500', bg: 'bg-sky-50', connected: false },
  ];

  const handleConnect = async (platformId: string) => {
    try {
      const platformMap: Record<string, string> = {
        fb: 'facebook',
        ig: 'instagram',
        tt: 'tiktok',
        wa: 'whatsapp',
        sms: 'sms',
        tg: 'telegram'
      };
      
      const response = await fetch(`/api/auth/${platformMap[platformId] || platformId}/url`);
      const { url } = await response.json();
      
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      
      if (!authWindow) {
        alert('Please allow popups to connect your account.');
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          // Success! In a real app we'd refresh connections here.
          alert('Successfully connected!');
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('OAuth error:', error);
      // Fallback for demo if endpoint fails
      setSelectedPlatform(platforms.find(p => p.id === platformId));
      setIsConnectModalOpen(true);
    }
  };

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-neutral-200 p-8 shadow-sm">
        <h3 className="text-lg font-bold text-neutral-900 mb-6">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Display Name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border-neutral-200 bg-neutral-50 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Profile Photo</label>
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-2xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                {profilePhoto ? <img src={profilePhoto} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-neutral-300"><User size={32} /></div>}
              </div>
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                  accept="image/*"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-100 hover:bg-blue-700"
                >
                  Upload
                </button>
                <button 
                  onClick={() => setProfilePhoto('')}
                  className="px-4 py-2 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-neutral-100 flex justify-end">
          <button 
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="bg-neutral-900 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-neutral-200 p-8 shadow-sm">
        <h3 className="text-lg font-bold text-neutral-900 mb-6">Active Workspace</h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-blue-50 bg-blue-50/20 gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <Zap size={24} />
            </div>
            <div className="flex-1">
              <input 
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                onBlur={handleSaveWorkspaceName}
                className="bg-transparent font-bold text-neutral-900 outline-none border-b border-transparent focus:border-blue-200 w-full"
                placeholder="Profile Name"
              />
              <p className="text-xs text-neutral-500">Business Management <span className="hidden sm:inline">Profile</span></p>
            </div>
          </div>
          <button className="text-sm font-bold text-blue-600 hover:underline w-fit">Change</button>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-neutral-200 p-8 shadow-sm">
        <h3 className="text-lg font-bold text-neutral-900 mb-6">Security Credentials</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
           <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">New Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border-neutral-200 bg-neutral-50 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Confirm Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border-neutral-200 bg-neutral-50 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>
        <div className="flex justify-end">
           <button 
            onClick={handleUpdateSecurity}
            className="px-6 py-3 bg-neutral-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-neutral-200 hover:bg-neutral-800"
           >
             Update Password
           </button>
        </div>
        <div className="my-8 h-[1px] bg-neutral-100" />
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 h-fit">
                <Lock size={20} />
              </div>
              <div>
                <p className="font-bold text-neutral-900">Sign out from other devices</p>
                <p className="text-xs text-neutral-500 max-w-xs mt-0.5 leading-relaxed">Instantly logout your account from all other browsers and phones.</p>
              </div>
            </div>
            <button className="px-5 py-2.5 border border-neutral-200 rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-50 w-fit">Logout Others</button>
          </div>
          <div className="h-[1px] bg-neutral-100" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 h-fit">
                <Shield size={20} />
              </div>
              <div>
                <p className="font-bold text-neutral-900">Two-Factor Authentication</p>
                <p className="text-xs text-neutral-500 max-w-xs mt-0.5 leading-relaxed">Add an extra layer of security to your account by requiring more than just a password.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-fit">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Active</span>
              <button className="w-12 h-6 bg-emerald-500 rounded-full relative transition-all shadow-inner shadow-black/10">
                <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-neutral-200 p-8 shadow-sm">
        <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center justify-between">
          Active Sessions
          <button className="text-xs font-bold text-red-500 hover:underline px-3 py-1">Logout All Devices</button>
        </h3>
        <div className="space-y-4">
          {[
            { device: 'MacBook Pro 16"', location: 'London, UK', status: 'Current Session', browser: 'Chrome' },
            { device: 'iPhone 15 Pro', location: 'London, UK', status: 'Last seen 2h ago', browser: 'Safari' },
          ].map((session) => (
            <div key={session.device} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-neutral-100 gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-neutral-50 rounded-xl text-neutral-400">
                  {session.device.includes('iPhone') ? <Smartphone size={20} /> : <Eye size={20} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-800">{session.device} • {session.browser}</p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">{session.location} • {session.status}</p>
                </div>
              </div>
              <button className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg text-neutral-300 w-fit">
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAutomations = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-neutral-200 p-8 shadow-sm">
        <h3 className="text-lg font-bold text-neutral-900 mb-6">Global Automation Config</h3>
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-neutral-900">Smart Reply Delay</p>
                <p className="text-xs text-neutral-500 mt-0.5">Control how quickly your bot replies to maintain a human-like feel.</p>
              </div>
              <span className="text-sm font-bold text-blue-600">
                {smartReplyDelay === 61 ? (
                  <>
                    <span className="inline sm:hidden">24h</span>
                    <span className="hidden sm:inline">24 Hours</span>
                  </>
                ) : (
                  <>
                    {smartReplyDelay}
                    <span className="inline sm:hidden">s</span>
                    <span className="hidden sm:inline"> Seconds</span>
                  </>
                )}
              </span>
            </div>
            <input 
              type="range" 
              className="w-full accent-blue-600" 
              min="0" 
              max="61" 
              value={smartReplyDelay}
              onChange={(e) => setSmartReplyDelay(parseInt(e.target.value))}
            />
            <div className="flex justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              <span>Instant</span>
              <span>Max (24hrs)</span>
            </div>
          </div>
          
          <div className="h-[1px] bg-neutral-100" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-neutral-900">Keyword Sensitivity</p>
              <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">How strictly keyword matching should be applied (Case sensitive, fuzzy, etc.)</p>
            </div>
            <select className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-600 outline-none focus:ring-2 focus:ring-blue-500 w-fit">
              <option>Strict Match</option>
              <option>Fuzzy Match</option>
              <option>Natural Language (AI)</option>
            </select>
          </div>

          <div className="h-[1px] bg-neutral-100" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-4">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600 h-fit">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="font-bold text-neutral-900">AI Personality Strength</p>
                <p className="text-xs text-neutral-500 max-w-sm mt-0.5 leading-relaxed">Higher strength allows Gemini to be more creative and helpful beyond fixed nodes.</p>
              </div>
            </div>
            <button className="px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-bold w-fit">Configure AI</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIntegrations = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((platform) => (
          <div key={platform.id} className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className={cn("p-4 rounded-xl", platform.bg)}>
                <platform.icon className={platform.color} size={28} />
              </div>
              {platform.connected ? (
                <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-100">
                  <CheckCircle2 size={12} />
                  Active
                </span>
              ) : (
                <button 
                  onClick={() => handleConnect(platform.id)}
                  className="text-xs font-bold uppercase tracking-wider text-blue-600 hover:underline"
                >
                  Connect
                </button>
              )}
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">{platform.name}</h3>
            <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
              Automate responses, manage comments, and build complex flows for {platform.name}.
            </p>
            <div className="flex gap-2">
              <button disabled={!platform.connected} className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50">
                Configure
              </button>
              {platform.connected && (
                <button className="p-2.5 rounded-xl border border-neutral-200 text-neutral-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-3">One account, multi-profile</h2>
          <p className="text-blue-100 max-w-lg mb-6 leading-relaxed">
            Switch between different business profiles instantly. You can connect all channels under one profile, or manage multiple distinct brands.
          </p>
          <div className="flex gap-3">
             <button 
               onClick={handleAddWorkspace}
               className="flex-1 bg-white text-blue-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-neutral-50 shadow-lg shadow-blue-900/20 text-center"
             >
               Explore <span className="hidden sm:inline">Multi-Profile</span>
             </button>
             <button className="flex-1 bg-blue-500/30 text-white border border-blue-400/30 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-500/50 text-center">
               View <span className="hidden sm:inline">Documentation</span>
             </button>
          </div>
        </div>
        <Globe className="absolute -right-20 -bottom-20 w-80 h-80 text-blue-500/20" />
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfile();
      case 'integrations': return renderIntegrations();
      case 'automations': return renderAutomations();
      case 'security': return renderSecurity();
      default: return (
        <div className="bg-white rounded-3xl border border-neutral-200 p-12 flex flex-col items-center justify-center text-center">
           <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
              <User className="text-neutral-300" size={32} />
           </div>
           <h2 className="text-xl font-bold text-neutral-900 mb-2">{tabs.find(t => t.id === activeTab)?.label} Configuration</h2>
           <p className="text-neutral-500 max-w-sm">This section is currently under development. Soon you'll be able to manage all your {activeTab} settings here.</p>
        </div>
      );
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto space-y-8 pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Settings</h1>
        <p className="text-neutral-500 text-sm sm:text-base">Manage your profile, integrations, and global account settings.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 shrink-0 flex sm:flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-white text-blue-600 shadow-sm border border-neutral-200" 
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
              {activeTab === tab.id && <ChevronRight size={14} className="ml-auto hidden lg:block" />}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Connection Modal */}
      <AnimatePresence>
        {isConnectModalOpen && selectedPlatform && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-neutral-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", selectedPlatform.bg)}>
                    <selectedPlatform.icon className={selectedPlatform.color} size={20} />
                  </div>
                  <h3 className="font-bold text-neutral-900">Connect {selectedPlatform.name}</h3>
                </div>
                <button 
                  onClick={() => setIsConnectModalOpen(false)}
                  className="p-2 hover:bg-neutral-50 rounded-full text-neutral-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8">
                <div className="mb-8 text-center">
                  <div className="mx-auto w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center mb-4 border border-blue-100">
                    <Lock className="text-blue-600" size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-neutral-900 underline decoration-blue-200 decoration-4 underline-offset-4">Permission Request</h4>
                  <p className="text-sm text-neutral-500 mt-2">
                    ManyFlow needs the following permissions to automate your {selectedPlatform.name} experience.
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {[
                    { id: 'read_dm', label: 'Read Direct Messages', desc: 'Allows ManyFlow to trigger actions when you receive a message.', icon: MessageSquare },
                    { id: 'send_dm', label: 'Send Direct Messages', desc: 'Allows ManyFlow to reply to your customers automatically.', icon: Send },
                    { id: 'read_comments', label: 'Read Comments', desc: 'Monitor your posts for specific keywords or engagement.', icon: Eye },
                    { id: 'write_comments', label: 'Post Comments', desc: 'Reply to user comments on your behalf.', icon: Edit2 },
                  ].map((perm) => (
                    <div key={perm.id} className="flex gap-4 p-4 rounded-xl border border-neutral-100 bg-neutral-50/50">
                      <div className="p-2 h-fit rounded-lg bg-white border border-neutral-100 text-blue-600 shadow-sm">
                        <perm.icon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-800">{perm.label}</p>
                        <p className="text-[11px] text-neutral-500 leading-relaxed mt-0.5">{perm.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setIsConnectModalOpen(false)}
                    className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                  >
                    Allow & Connect
                  </button>
                  <button 
                    onClick={() => setIsConnectModalOpen(false)}
                    className="w-full text-neutral-400 font-bold py-2 text-xs uppercase tracking-widest hover:text-neutral-600 transition-all"
                  >
                    Deny Access
                  </button>
                </div>
              </div>

              <div className="p-4 bg-neutral-50 border-t border-neutral-100 text-center">
                <p className="text-[10px] text-neutral-400 font-medium">
                  By connecting, you agree to our <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Edit2 = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
);
