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
    { id: 'dashboard', label: 'Overview', icon: Icons.Home, color: 'shadow-blue-600/40' },
    { id: 'groups', label: 'Hubs', icon: Icons.Users, color: 'shadow-indigo-600/40' },
    { id: 'analysis', label: 'Audit', icon: Icons.Activity, color: 'shadow-emerald-600/40' },
    { id: 'settings', label: 'Nodes', icon: Icons.Settings, color: 'shadow-purple-600/40' },
  ];

  return (
    <>
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col h-screen fixed top-0 left-0 z-20 transition-all duration-500">
        <div className="p-8 pb-4 flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(37,99,235,0.4)]">
            <Icons.Zap className="text-white" size={24} strokeWidth={2.5} />
          </div>
          <span className="font-black text-2xl tracking-tighter text-slate-900 dark:text-white">TeleBridge</span>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.25rem] transition-all duration-500 group relative ${
                activeTab === item.id
                  ? `bg-blue-600 text-white shadow-2xl ${item.color} scale-[1.02]`
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white hover:shadow-xl'
              }`}
            >
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              <span className="font-black text-[11px] uppercase tracking-[0.2em]">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6">
           <div className="p-5 bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-600/20 rounded-3xl shadow-2xl shadow-blue-500/5">
             <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Link Status</p>
             <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2 shadow-inner">
                <div className="bg-blue-600 h-full w-[45%] rounded-full shadow-[0_0_10px_rgba(37,99,235,0.6)]" />
             </div>
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Global: Operational</p>
           </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-around p-2 z-50 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center gap-1 p-4 rounded-2xl transition-all active:scale-90 ${
              activeTab === item.id ? `bg-blue-600 text-white shadow-2xl ${item.color}` : 'text-slate-400'
            }`}
          >
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
          </button>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;