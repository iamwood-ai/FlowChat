import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../lib/cropImage';
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
  const { user, userProfile, activeWorkspace, workspaces, updateWorkspace, createWorkspace, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // Default to profile as requested
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.displayName || user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [profilePhoto, setProfilePhoto] = useState(userProfile?.photoURL || user?.photoURL || '');
  const [workspaceName, setWorkspaceName] = useState(activeWorkspace?.name || '');
  const [smartReplyDelay, setSmartReplyDelay] = useState(activeWorkspace?.automationConfig?.smartReplyDelay || 5);
  const [keywordSensitivity, setKeywordSensitivity] = useState(activeWorkspace?.automationConfig?.keywordSensitivity || 'Strict Match');

  // Sync with workspace config
  React.useEffect(() => {
    if (activeWorkspace?.automationConfig) {
      setSmartReplyDelay(activeWorkspace.automationConfig.smartReplyDelay || 5);
      setKeywordSensitivity(activeWorkspace.automationConfig.keywordSensitivity || 'Strict Match');
    }
  }, [activeWorkspace?.id]);

  // Manual save for Automation Config
  const handleSaveAutomationConfig = async () => {
    if (!activeWorkspace) return;
    setIsSaving(true);
    try {
      await updateWorkspace(activeWorkspace.id, {
        automationConfig: {
          smartReplyDelay: Number(smartReplyDelay),
          keywordSensitivity: String(keywordSensitivity)
        }
      });
      // Show a success state for the button instead of alert
      setIsSaving(false);
      const btn = document.activeElement as HTMLButtonElement;
      const originalText = btn.innerText;
      btn.innerText = "Saved! ✓";
      btn.classList.replace('bg-blue-600', 'bg-emerald-600');
      setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.replace('bg-emerald-600', 'bg-blue-600');
      }, 2000);
    } catch (error) {
      console.error("Failed to save automation config:", error);
      alert("Failed to save automation config.");
      setIsSaving(false);
    }
  };

  // 2FA State
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState<'method' | 'verify'>('method');
  const [selected2FAMethod, setSelected2FAMethod] = useState<'email' | 'phone' | null>(null);
  const [twoFactorValue, setTwoFactorValue] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // Sync with user prop if it changes
  React.useEffect(() => {
    if (user) {
      setDisplayName(userProfile?.displayName || user.displayName || '');
      setEmail(user.email || '');
      setProfilePhoto(userProfile?.photoURL || user.photoURL || '');
    }
  }, [user, userProfile]);

  // Sync workspace name
  React.useEffect(() => {
    if (activeWorkspace) {
      setWorkspaceName(activeWorkspace.name);
    }
  }, [activeWorkspace]);

  // Cropper State
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApplyCrop = async () => {
    if (imageToCrop && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
        setProfilePhoto(croppedImage);
        setImageToCrop(null);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSaveWorkspaceName = async () => {
    if (!activeWorkspace || !workspaceName || workspaceName === activeWorkspace.name) return;
    setIsSaving(true);
    await updateWorkspace(activeWorkspace.id, workspaceName);
    // Also sync the display name state in settings view
    setDisplayName(workspaceName);
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
      setImageToCrop(url);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // 1. Update User Profile
      await updateUserProfile({
        displayName,
        photoURL: profilePhoto
      });

      // 2. Update Active Workspace Name to match Display Name
      // This ensures "Wood" appears in the sidebar/header as the user expects
      if (activeWorkspace && displayName && displayName !== activeWorkspace.name) {
        await updateWorkspace(activeWorkspace.id, { name: displayName });
        setWorkspaceName(displayName);
      }

      alert("Changes saved successfully!");
    } catch (error) {
      console.error(error);
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
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
        <h3 className="text-base font-bold text-neutral-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Display Name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Profile Photo</label>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                {profilePhoto ? <img src={profilePhoto} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-neutral-300"><User size={24} /></div>}
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
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] font-bold shadow-lg shadow-blue-100 hover:bg-blue-700"
                >
                  Upload
                </button>
                <button 
                  onClick={() => setProfilePhoto('')}
                  className="px-3 py-1.5 border border-neutral-200 rounded-lg text-[11px] font-bold text-neutral-600 hover:bg-neutral-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-neutral-100 flex justify-end">
          <button 
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="bg-neutral-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
        <h3 className="text-base font-bold text-neutral-900 mb-4">Active Workspace</h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-blue-50 bg-blue-50/20 gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <Zap size={20} />
            </div>
            <div className="flex-1">
              <input 
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                onBlur={handleSaveWorkspaceName}
                className="bg-transparent font-bold text-sm text-neutral-900 outline-none border-b border-transparent focus:border-blue-200 w-full"
                placeholder="Profile Name"
              />
              <p className="text-[10px] text-neutral-500">Business Management Profile</p>
            </div>
          </div>
          <button className="text-xs font-bold text-blue-600 hover:underline w-fit">Change</button>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
        <h3 className="text-base font-bold text-neutral-900 mb-4">Security Credentials</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
           <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">New Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Confirm Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>
        <div className="flex justify-end">
           <button 
            onClick={handleUpdateSecurity}
            className="px-5 py-2.5 bg-neutral-900 text-white rounded-xl font-bold text-xs shadow-xl shadow-neutral-200 hover:bg-neutral-800"
           >
              Update Password
           </button>
        </div>
        <div className="my-6 h-[1px] bg-neutral-100" />
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-3">
              <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 h-fit">
                <Lock size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900">Sign out from other devices</p>
                <p className="text-[11px] text-neutral-500 max-w-xs mt-0.5 leading-relaxed">Logout from all other browsers and phones.</p>
              </div>
            </div>
            <button className="px-4 py-2 border border-neutral-200 rounded-lg text-xs font-bold text-neutral-600 hover:bg-neutral-50 w-fit">Logout Others</button>
          </div>
          <div className="h-[1px] bg-neutral-100" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 h-fit">
                <Shield size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900">Two-Factor Authentication</p>
                <p className="text-[11px] text-neutral-500 max-w-xs mt-0.5 leading-relaxed">Add an extra layer of security to your account.</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 w-fit">
              <span className={cn("text-[9px] font-bold uppercase tracking-widest", is2FAEnabled ? "text-emerald-600" : "text-neutral-400")}>
                {is2FAEnabled ? "Active" : "Inactive"}
              </span>
              <button 
                onClick={() => {
                  if (is2FAEnabled) {
                    setIs2FAEnabled(false);
                  } else {
                    setIs2FAModalOpen(true);
                    setTwoFactorStep('method');
                  }
                }}
                className={cn(
                  "w-10 h-5 rounded-full relative transition-all shadow-inner",
                  is2FAEnabled ? "bg-emerald-500" : "bg-neutral-200"
                )}
              >
                <motion.div 
                  animate={{ x: is2FAEnabled ? 20 : 0 }}
                  className="absolute left-0.5 top-0.5 h-4 w-4 bg-white rounded-full shadow-sm" 
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
        <h3 className="text-base font-bold text-neutral-900 mb-4 flex items-center justify-between">
          Active Sessions
          <button className="text-[11px] font-bold text-red-500 hover:underline px-2 py-1">Logout All</button>
        </h3>
        <div className="space-y-3">
          {[
            { device: 'MacBook Pro 16"', location: 'London, UK', status: 'Current Session', browser: 'Chrome' },
            { device: 'iPhone 15 Pro', location: 'London, UK', status: 'Last seen 2h ago', browser: 'Safari' },
          ].map((session) => (
            <div key={session.device} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-neutral-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-50 rounded-lg text-neutral-400">
                  {session.device.includes('iPhone') ? <Smartphone size={18} /> : <Eye size={18} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-800">{session.device} • {session.browser}</p>
                  <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">{session.location} • {session.status}</p>
                </div>
              </div>
              <button className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-neutral-300 w-fit">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAutomations = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-neutral-900">Global Automation Config</h3>
          <button 
            onClick={handleSaveAutomationConfig}
            disabled={isSaving}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
          >
            {isSaving ? "Saving..." : "Save Config"}
          </button>
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-neutral-900">Smart Reply Delay</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">Control bot reply speed.</p>
              </div>
              <span className="text-xs font-bold text-blue-600">
                {smartReplyDelay === 61 ? '24h' : `${smartReplyDelay}s`}
              </span>
            </div>
            <input 
              type="range" 
              className="w-full h-1.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-blue-600" 
              min="0" 
              max="61" 
              value={smartReplyDelay}
              onChange={(e) => setSmartReplyDelay(parseInt(e.target.value))}
            />
          </div>
          
          <div className="h-[1px] bg-neutral-100" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-neutral-900">Keyword Sensitivity</p>
              <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">How strictly keyword matching is applied.</p>
            </div>
            <select 
              value={keywordSensitivity}
              onChange={(e) => setKeywordSensitivity(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-lg pl-3 pr-10 py-2 text-xs font-bold text-neutral-900 outline-none focus:ring-2 focus:ring-blue-500 w-fit appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-[size:1.1em_1.1em] bg-no-repeat transition-all shadow-sm"
            >
              <option>Strict Match</option>
              <option>Fuzzy Match</option>
              <option>Natural Language (AI)</option>
            </select>
          </div>

          <div className="h-[1px] bg-neutral-100" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-3">
              <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600 h-fit">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900">AI Personality Strength</p>
                <p className="text-[11px] text-neutral-500 max-w-sm mt-0.5 leading-relaxed">Creative Gemini responses beyond fixed nodes.</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-bold w-fit">Configure AI</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIntegrations = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map((platform) => (
          <div key={platform.id} className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-3 rounded-lg", platform.bg)}>
                <platform.icon className={platform.color} size={24} />
              </div>
              {platform.connected ? (
                <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                  <CheckCircle2 size={10} />
                  Active
                </span>
              ) : (
                <button 
                  onClick={() => handleConnect(platform.id)}
                  className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:underline"
                >
                  Connect
                </button>
              )}
            </div>
            <h3 className="text-sm font-bold text-neutral-900 mb-1">{platform.name}</h3>
            <p className="text-xs text-neutral-500 mb-4 leading-relaxed line-clamp-2">
              Automate responses and build complex flows.
            </p>
            <div className="flex gap-2">
              <button disabled={!platform.connected} className="flex-1 rounded-lg border border-neutral-200 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50">
                Configure
              </button>
              {platform.connected && (
                <button className="p-2 rounded-lg border border-neutral-200 text-neutral-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-600 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2">Multi-profile account</h2>
          <p className="text-blue-100 text-xs max-w-md mb-4 leading-relaxed">
            Switch between different business profiles instantly. Manage multiple distinct brands easily.
          </p>
          <div className="flex gap-2">
             <button 
               onClick={handleAddWorkspace}
               className="flex-1 bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-xs hover:bg-neutral-50 shadow-lg shadow-blue-900/20 text-center"
             >
               Add Profile
             </button>
             <button className="flex-1 bg-blue-500/30 text-white border border-blue-400/30 px-4 py-2 rounded-lg font-bold text-xs hover:bg-blue-500/50 text-center">
               Docs
             </button>
          </div>
        </div>
        <Globe className="absolute -right-16 -bottom-16 w-64 h-64 text-blue-500/20" />
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
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-6 pb-20">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="text-neutral-500 text-xs sm:text-sm">Manage profile, integrations, and account settings.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-56 shrink-0 flex sm:flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-white text-blue-600 shadow-sm border border-neutral-200" 
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && <ChevronRight size={12} className="ml-auto hidden lg:block" />}
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

      {/* Cropper Modal */}
      <AnimatePresence>
        {imageToCrop && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-neutral-900/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[80vh]"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="font-bold text-neutral-900">Crop Profile Photo</h3>
                <button 
                  onClick={() => setImageToCrop(null)}
                  className="p-2 hover:bg-neutral-50 rounded-full text-neutral-400"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 relative bg-neutral-100">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape="round"
                  showGrid={false}
                />
              </div>

              <div className="p-6 border-t border-neutral-100 space-y-6 bg-white">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-neutral-400 uppercase tracking-widest">
                    <span>Zoom</span>
                    <span>{zoom.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-blue-600 h-1.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setImageToCrop(null)}
                    className="flex-1 px-6 py-3 border border-neutral-200 rounded-2xl text-sm font-bold text-neutral-600 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleApplyCrop}
                    className="flex-[2] px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    Apply Crop
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2FA Modal */}
      <AnimatePresence>
        {is2FAModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="font-bold text-neutral-900">Setup Two-Factor Authentication</h3>
                <button 
                  onClick={() => setIs2FAModalOpen(false)}
                  className="p-2 hover:bg-neutral-50 rounded-full text-neutral-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8">
                {twoFactorStep === 'method' ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 text-blue-600">
                        <Lock size={32} />
                      </div>
                      <h4 className="text-lg font-bold text-neutral-900">Choose a Verification Method</h4>
                      <p className="text-sm text-neutral-500 mt-2">Where should we send your verification code?</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={() => {
                          setSelected2FAMethod('email');
                          setTwoFactorValue(user?.email || '');
                        }}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                          selected2FAMethod === 'email' ? "border-blue-600 bg-blue-50/50" : "border-neutral-100 hover:border-neutral-200"
                        )}
                      >
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-neutral-100 text-blue-600">
                          <Send size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-800">Email Address</p>
                          <p className="text-xs text-neutral-500">Send code to your registered email</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => {
                          setSelected2FAMethod('phone');
                          setTwoFactorValue('');
                        }}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                          selected2FAMethod === 'phone' ? "border-blue-600 bg-blue-50/50" : "border-neutral-100 hover:border-neutral-200"
                        )}
                      >
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-neutral-100 text-blue-600">
                          <Smartphone size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-800">Phone Number</p>
                          <p className="text-xs text-neutral-500">Receive SMS with a unique code</p>
                        </div>
                      </button>
                    </div>

                    {selected2FAMethod === 'phone' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2 p-1"
                      >
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Phone Number</label>
                        <input 
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={twoFactorValue}
                          onChange={(e) => setTwoFactorValue(e.target.value)}
                          className="w-full rounded-xl border-neutral-200 bg-neutral-50 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </motion.div>
                    )}

                    <button 
                      disabled={!selected2FAMethod || (selected2FAMethod === 'phone' && !twoFactorValue)}
                      onClick={() => setTwoFactorStep('verify')}
                      className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                      Continue
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 text-emerald-600">
                        <CheckCircle2 size={32} />
                      </div>
                      <h4 className="text-lg font-bold text-neutral-900">Verify your identity</h4>
                      <p className="text-sm text-neutral-500 mt-2">
                        Enter the 6-digit code we sent to 
                        <span className="font-bold text-neutral-800 ml-1">{twoFactorValue || user?.email}</span>
                      </p>
                    </div>

                    <div className="flex gap-2 justify-center">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <input 
                          key={i}
                          type="text"
                          maxLength={1}
                          className="w-12 h-14 bg-neutral-50 border-2 border-neutral-100 rounded-xl text-center text-xl font-bold focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                          value={verificationCode[i] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d?$/.test(val)) {
                              const newCode = verificationCode.split('');
                              newCode[i] = val;
                              setVerificationCode(newCode.join(''));
                              // Auto-focus next
                              if (val && i < 5) {
                                (e.target.nextSibling as HTMLInputElement)?.focus();
                              }
                            }
                          }}
                        />
                      ))}
                    </div>

                    <div className="text-center">
                      <button className="text-xs font-bold text-blue-600 hover:underline">Resend Code</button>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => setTwoFactorStep('method')}
                        className="flex-1 px-6 py-3 border border-neutral-200 rounded-2xl text-sm font-bold text-neutral-600 hover:bg-neutral-50"
                      >
                        Back
                      </button>
                      <button 
                        disabled={verificationCode.length !== 6}
                        onClick={() => {
                          setIs2FAEnabled(true);
                          setIs2FAModalOpen(false);
                          alert("Two-Factor Authentication has been enabled!");
                        }}
                        className="flex-[2] px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                      >
                        Verify & Enable
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
