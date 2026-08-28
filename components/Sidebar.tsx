import React from 'react';
import { Icons } from '../constants.tsx';

export type ThemePreset = 'midnight' | 'quantum' | 'violet' | 'executive';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  colorTheme?: ThemePreset;
  onColorThemeChange?: (preset: ThemePreset) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  theme,
  toggleTheme,
  colorTheme = 'midnight',
  onColorThemeChange,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: Icons.Home, color: 'text-indigo-400' },
    { id: 'groups', label: 'Hubs', icon: Icons.Users, color: 'text-blue-400' },
    { id: 'analysis', label: 'Audit', icon: Icons.Activity, color: 'text-emerald-400' },
    { id: 'settings', label: 'Settings', icon: Icons.Settings, color: 'text-purple-400' },
  ];

  const presets: { id: ThemePreset; name: string; bg: string; border: string }[] = [
    { id: 'midnight', name: 'Cyber', bg: 'bg-indigo-600', border: 'border-indigo-400' },
    { id: 'quantum', name: 'Emerald', bg: 'bg-emerald-600', border: 'border-emerald-400' },
    { id: 'violet', name: 'Violet', bg: 'bg-purple-600', border: 'border-purple-400' },
    { id: 'executive', name: 'Slate', bg: 'bg-slate-700', border: 'border-slate-500' },
  ];

  return (
    <>
      <aside className="hidden md:flex w-64 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-2xl border-r border-slate-200/80 dark:border-slate-800/80 flex-col h-screen fixed top-0 left-0 z-20 transition-all duration-300 shadow-2xl">
        {/* Brand Header */}
        <div className="p-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 animate-pulse-slow">
              <Icons.Zap className="text-white" size={20} strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-display font-black text-xl tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-950 dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent">
                TeleBridge
              </span>
              <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-indigo-500 dark:text-indigo-400">
                PRO ENGINE v4.2
              </span>
            </div>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 mt-6 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative ${
                activeTab === item.id
                  ? `bg-indigo-600/10 dark:bg-indigo-500/15 text-indigo-900 dark:text-white border border-indigo-500/30 shadow-lg shadow-indigo-500/10`
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div
                className={`${
                  activeTab === item.id ? item.color : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                } transition-colors`}
              >
                <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              </div>
              <span className={`font-bold text-sm tracking-tight ${activeTab === item.id ? 'font-black' : ''}`}>
                {item.label}
              </span>
              {activeTab === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-r-full bg-indigo-500 shadow-md shadow-indigo-500/50" />
              )}
            </button>
          ))}
        </nav>

        {/* Theme Palette Switcher Box in Sidebar */}
        <div className="p-4 mx-4 mb-4 bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Icons.Sliders size={11} className="text-indigo-500" /> Color Theme
            </span>
            <button
              onClick={toggleTheme}
              className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-amber-500 hover:scale-110 transition-transform"
              title="Toggle Light / Dark"
            >
              {theme === 'dark' ? <Icons.Sun size={12} /> : <Icons.Moon size={12} className="text-indigo-500" />}
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => onColorThemeChange?.(p.id)}
                className={`py-1.5 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-[8px] font-black uppercase tracking-tighter ${
                  colorTheme === p.id
                    ? `${p.bg} text-white ${p.border} shadow-md scale-105`
                    : 'bg-white dark:bg-slate-800/80 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-white'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${p.bg} ring-1 ring-white/30`} />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status indicator */}
        <div className="p-4 pt-0">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Hub Gateway Sync</p>
            </div>
            <span className="text-[9px] font-mono font-black text-emerald-500">ONLINE</span>
          </div>
        </div>
      </aside>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 dark:bg-slate-950/95 border-t border-slate-800 flex items-center justify-around p-2 z-50 backdrop-blur-xl shadow-2xl">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all active:scale-95 ${
              activeTab === item.id ? `${item.color} bg-indigo-500/20 text-white font-bold` : 'text-slate-400'
            }`}
          >
            <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 1.5} />
            <span className="text-[9px] font-black uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
