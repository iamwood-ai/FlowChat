import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  GitBranch, 
  Users, 
  BarChart3, 
  Settings, 
  Menu,
  ChevronRight,
  Plus,
  LogOut,
  Zap,
  Globe
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import DashboardHome from './components/dashboard/DashboardHome';
import AutomationsManager from './components/flows/AutomationsManager';
import ContactList from './components/crm/ContactList';
import AnalyticsView from './components/analytics/AnalyticsView';
import SettingsView from './components/settings/Settings';
import Login from './components/auth/Login';

type View = 'dashboard' | 'flows' | 'audience' | 'analytics' | 'settings';

function MainApp() {
  const { user, userProfile, loading, activeWorkspace, workspaces, switchWorkspace, createWorkspace, logout } = useAuth();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [viewParams, setViewParams] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleNavigate = (view: View, params?: any) => {
    setActiveView(view);
    setViewParams(params || null);
    if(window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'flows', label: 'Automate', icon: GitBranch },
    { id: 'audience', label: 'Audience', icon: Users },
    { id: 'analytics', label: 'Insights', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardHome onNavigate={handleNavigate} />;
      case 'flows': return <AutomationsManager initialParams={viewParams} />;
      case 'audience': return <ContactList />;
      case 'analytics': return <AnalyticsView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardHome onNavigate={handleNavigate} />;
    }
  };

  const handleAddWorkspace = async () => {
    const name = prompt("Enter profile name (e.g. My Agency, Personal Brand):");
    if (name) {
      await createWorkspace(name);
    }
  };

  return (
    <div className="flex h-[100dvh] bg-[#F8F9FA] font-sans text-[#1A1A1A] overflow-hidden">
      {/* Sidebar - Desktop Only */}
      {window.innerWidth >= 1024 && (
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-neutral-200 bg-white transition-all lg:relative",
            isSidebarOpen ? "w-[280px]" : "w-[80px]"
          )}
        >
          {/* Branding & Profile Switcher */}
          <div className="p-4">
            <div className="relative">
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border border-neutral-100 p-2.5 transition-all hover:bg-neutral-50",
                  !isSidebarOpen && "justify-center"
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-100">
                  <Zap size={20} fill="currentColor" />
                </div>
                {isSidebarOpen && (
                  <div className="flex-1 overflow-hidden text-left">
                    <p className="truncate text-sm font-bold text-neutral-900">
                      {activeWorkspace?.name || "Select Profile"}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Active Profile
                    </p>
                  </div>
                )}
                {isSidebarOpen && <ChevronRight size={14} className={cn("text-neutral-400 transition-transform", isProfileMenuOpen && "rotate-90")} />}
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {isProfileMenuOpen && isSidebarOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 top-full z-50 mt-2 w-full rounded-2xl border border-neutral-200 bg-white p-2 shadow-2xl"
                  >
                    <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Switch Profile</p>
                    <div className="max-h-48 overflow-y-auto">
                      {workspaces.map(ws => (
                        <button
                          key={ws.id}
                          onClick={() => { switchWorkspace(ws.id); setIsProfileMenuOpen(false); }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                            activeWorkspace?.id === ws.id ? "bg-blue-50 text-blue-700" : "text-neutral-600 hover:bg-neutral-50"
                          )}
                        >
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          {ws.name}
                        </button>
                      ))}
                    </div>
                    <div className="my-2 h-[1px] bg-neutral-100" />
                    <button 
                      onClick={handleAddWorkspace}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50"
                    >
                      <Plus size={16} />
                      Add New Profile
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-3 text-[14px]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveView(item.id as View); }}
                  className={cn(
                    "group flex w-full items-center rounded-xl px-3 py-2.5 transition-all duration-200",
                    isActive 
                      ? "bg-blue-50 text-blue-700 shadow-sm" 
                      : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                  )}
                >
                  <Icon className={cn("shrink-0", isActive ? "text-blue-600" : "text-neutral-400 group-hover:text-neutral-600")} size={20} />
                  {isSidebarOpen && (
                    <span className="ml-3 font-semibold">{item.label}</span>
                  )}
                  {isActive && isSidebarOpen && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="ml-auto"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-4 space-y-2">
            <button 
              onClick={logout}
              className={cn(
                "flex w-full items-center rounded-xl px-3 py-2.5 text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors",
                !isSidebarOpen && "justify-center"
              )}
            >
              <LogOut size={20} />
              {isSidebarOpen && <span className="ml-3 font-semibold">Sign Out</span>}
            </button>

            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="h-10 w-full items-center justify-center rounded-xl bg-neutral-50 text-neutral-400 hover:bg-neutral-100 flex"
            >
              <Menu size={20} />
            </button>
          </div>
        </aside>
      )}

      {/* Mobile Sidebar Backdrop - Removed since sidebar is desktop only */}
      <AnimatePresence>
        {false && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="relative flex-1 overflow-hidden flex flex-col w-full h-full">
        <div className="flex-1 flex flex-col bg-[#F8F9FA] overflow-hidden">
          <AnimatePresence>
            <motion.div
              key={activeView}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.05 }}
              className="h-full w-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Navigation - Visible ONLY on small mobile screens */}
        <div className="sm:hidden border-t border-neutral-200 bg-white px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)] shrink-0 z-50 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id as View)}
                  className={cn(
                    "flex flex-col items-center gap-1 min-w-[64px] py-1 transition-all active:scale-95",
                    isActive ? "text-blue-600" : "text-neutral-400"
                  )}
                >
                  <Icon size={20} className={cn("transition-colors", isActive && "stroke-[2.5px]")} />
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-wider",
                    isActive ? "text-blue-600" : "text-neutral-400"
                  )}>
                    {item.id === 'flows' ? 'Automate' : item.id === 'analytics' ? 'Insights' : item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
