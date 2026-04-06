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
      <aside className="hidden md:flex w-64 glass border-r border-white/10 flex-col h-screen fixed top-0 left-0 z-20 transition-all duration-500">
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
                  ? `bg-white/10 dark:bg-white/5 shadow-sm border border-white/10`
                  : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
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

      <nav className="md:hidden fixed bottom-6 left-6 right-6 glass border border-white/10 flex items-center justify-around p-2 z-50 rounded-3xl shadow-2xl">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all active:scale-90 ${
              activeTab === item.id ? `bg-white/10 ${item.color}` : 'text-slate-400'
            }`}
          >
            <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
          </button>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;