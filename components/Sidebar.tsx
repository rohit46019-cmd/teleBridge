import React from 'react';
import { Icons } from '../constants.tsx';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, theme, toggleTheme }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: Icons.Home, color: 'text-blue-500' },
    { id: 'groups', label: 'Hubs', icon: Icons.Users, color: 'text-indigo-500' },
    { id: 'analysis', label: 'Audit', icon: Icons.Activity, color: 'text-emerald-500' },
    { id: 'settings', label: 'Nodes', icon: Icons.Settings, color: 'text-purple-500' },
    { id: 'debug', label: 'Debug', icon: Icons.RefreshCw, color: 'text-amber-500' },
  ];

  return (
    <>
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col h-screen fixed top-0 left-0 z-20 transition-all duration-500">
        <div className="p-8 pb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Icons.Zap className="text-white" size={20} strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-slate-900 dark:text-white">TeleBridge</span>
        </div>

        <nav className="flex-1 mt-8 px-4 space-y-1.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${
                activeTab === item.id
                  ? `bg-slate-100 dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700`
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className={`${activeTab === item.id ? item.color : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} transition-colors`}>
                <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              </div>
              <span className={`font-medium text-sm ${activeTab === item.id ? 'text-slate-900 dark:text-white font-semibold' : ''}`}>{item.label}</span>
              {activeTab === item.id && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-current ${item.color}`} />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6">
           <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
             <div className="flex items-center gap-2 mb-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-xs font-medium text-slate-600 dark:text-slate-300">System Online</p>
             </div>
             <div className="w-full bg-black/10 dark:bg-black/30 h-1 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full w-[95%] rounded-full" />
             </div>
           </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around p-1.5 pb-5 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all active:scale-90 relative ${
              activeTab === item.id ? `${item.color}` : 'text-slate-400'
            }`}
          >
            <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            {activeTab === item.id && (
              <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-current" />
            )}
          </button>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;