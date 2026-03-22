
import React, { useState } from 'react';
import { TelegramGroup } from '../types.ts';
import { Icons } from '../constants.tsx';

interface GroupCardProps {
  group: TelegramGroup;
  onClick: (group: TelegramGroup) => void;
}

const UNIQUE_THEMES = [
  { 
    gradient: 'from-blue-600/30 to-indigo-700/30', 
    accent: 'bg-blue-600', 
    border: 'border-blue-500/30 shadow-blue-500/10',
    pattern: 'radial-gradient(circle at 1.5px 1.5px, rgba(59,130,246,0.1) 1px, transparent 0)' 
  },
  { 
    gradient: 'from-emerald-500/30 to-teal-700/30', 
    accent: 'bg-emerald-600', 
    border: 'border-emerald-500/30 shadow-emerald-500/10',
    pattern: 'repeating-linear-gradient(45deg, rgba(16,185,129,0.05) 0px, rgba(16,185,129,0.05) 1px, transparent 1px, transparent 6px)' 
  },
  { 
    gradient: 'from-rose-500/30 to-pink-700/30', 
    accent: 'bg-rose-600', 
    border: 'border-rose-500/30 shadow-rose-500/10',
    pattern: 'radial-gradient(circle at 3px 3px, rgba(244,63,94,0.1) 1.5px, transparent 0)' 
  },
  { 
    gradient: 'from-amber-400/30 to-orange-600/30', 
    accent: 'bg-amber-600', 
    border: 'border-amber-500/30 shadow-amber-500/10',
    pattern: 'repeating-linear-gradient(-45deg, rgba(245,158,11,0.05) 0px, rgba(245,158,11,0.05) 1px, transparent 1px, transparent 6px)' 
  },
  { 
    gradient: 'from-purple-600/30 to-fuchsia-700/30', 
    accent: 'bg-purple-600', 
    border: 'border-purple-500/30 shadow-purple-500/10',
    pattern: 'radial-gradient(circle at 1.5px 1.5px, rgba(147,51,234,0.1) 1px, transparent 0)' 
  },
  { 
    gradient: 'from-cyan-500/30 to-blue-600/30', 
    accent: 'bg-cyan-600', 
    border: 'border-cyan-500/30 shadow-cyan-500/10',
    pattern: 'radial-gradient(circle at 1px 1px, rgba(6,182,212,0.15) 1px, transparent 0)' 
  },
];

const GroupCard: React.FC<GroupCardProps> = ({ group, onClick }) => {
  const [copied, setCopied] = useState(false);

  // Stable theme selection based on ID
  const themeIndex = Math.abs(parseInt(group.id.slice(-4)) || 0) % UNIQUE_THEMES.length;
  const theme = UNIQUE_THEMES[themeIndex];

  const copyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(group.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onClick={() => onClick(group)}
      className={`group relative bg-gradient-to-br ${theme.gradient} dark:bg-slate-900/60 backdrop-blur-md border ${theme.border} rounded-3xl p-5 flex items-center justify-between hover:-translate-y-1 transition-all duration-500 cursor-pointer shadow-xl hover:shadow-2xl active:scale-[0.99] active:translate-y-0 overflow-hidden border-b-4 border-r-4 w-full`}
      style={{ backgroundImage: theme.pattern, backgroundSize: '12px 12px' }}
    >
      {/* 3D Highlight Shine */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="flex items-center gap-5 relative z-10 flex-1 min-w-0">
        <div className="w-14 h-14 rounded-[1.25rem] overflow-hidden bg-white/50 dark:bg-slate-800/50 flex-shrink-0 group-hover:scale-110 transition-transform duration-500 border-2 border-white/20 shadow-2xl">
          <img src={group.image} alt={group.name} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight leading-tight mb-1">{group.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-900/60 dark:text-slate-400 uppercase tracking-[0.1em]">{group.memberCount} MEMBERS BATTERYED</span>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 relative z-10 ml-4">
        <button onClick={copyId} className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/30 dark:bg-slate-800/40 rounded-xl hover:bg-white/50 transition-all shadow-sm border border-white/20">
          <span className="text-[9px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-widest truncate max-w-[100px]">ID: {group.id}</span>
          <Icons.Copy size={12} className={copied ? 'text-emerald-700' : 'text-slate-600 dark:text-slate-400'} />
        </button>
        <div className={`w-10 h-10 ${theme.accent} text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all shadow-xl active:scale-90 border-b-4 border-black/20`}>
          <Icons.Link size={18} strokeWidth={3} />
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
