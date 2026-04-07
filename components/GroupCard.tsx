
import React, { useState } from 'react';
import { TelegramGroup } from '../types.ts';
import { Icons } from '../constants.tsx';

interface GroupCardProps {
  group: TelegramGroup;
  onClick: (group: TelegramGroup) => void;
  onTogglePin: (e: React.MouseEvent, id: string) => void;
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

const GroupCard: React.FC<GroupCardProps> = ({ group, onClick, onTogglePin }) => {
  const [copied, setCopied] = useState(false);

  // Use a stable index for the theme based on the group ID
  const themeIndex = Math.abs(group.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % UNIQUE_THEMES.length;
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
      className={`group relative rounded-3xl p-6 flex items-center justify-between transition-all duration-500 cursor-pointer 
        bg-white dark:bg-slate-900 border-2 ${theme.border}
        hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] 
        dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)]
        active:scale-[0.98] active:translate-y-0 overflow-hidden w-full
        before:absolute before:inset-0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500
        before:bg-gradient-to-br ${theme.gradient}
      `}
      style={{
        backgroundImage: theme.pattern,
        backgroundSize: '20px 20px'
      }}
    >
      {/* 3D Glass Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Colorful Accent Glow */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${theme.accent}`} />

      <button 
        onClick={(e) => onTogglePin(e, group.id)} 
        className={`absolute top-4 right-4 p-2.5 rounded-xl transition-all shadow-md z-20 border-2 
          ${group.pinned 
            ? 'bg-amber-400 text-white border-amber-300 scale-110 rotate-12' 
            : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-500'}`}
      >
         <Icons.Pin size={16} className={group.pinned ? 'fill-current' : ''} />
      </button>

      <div className="flex items-center gap-6 relative z-10 flex-1 min-w-0">
        <div className="relative">
          <div className={`absolute inset-0 blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500 rounded-2xl ${theme.accent}`} />
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 flex-shrink-0 group-hover:scale-110 transition-transform duration-500 border-2 border-white/20 shadow-2xl relative z-10">
            <img 
              src={group.image} 
              alt={group.name} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
              loading="lazy" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${group.id}/200`;
              }}
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-display font-black text-slate-900 dark:text-white truncate leading-tight mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {group.name}
          </h3>
          <div className="flex items-center gap-2.5">
            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-sm ${theme.accent}`}>
              {group.memberCount} MEMBERS
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 relative z-10 ml-4 mr-12">
        <button 
          onClick={copyId} 
          className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 rounded-2xl transition-all border-2 border-slate-200 dark:border-slate-700 group/copy"
        >
          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate max-w-[120px]">
            {copied ? 'COPIED!' : `ID: ${group.id}`}
          </span>
          <Icons.Copy size={14} className={copied ? 'text-emerald-500 scale-125' : 'text-slate-400 group-hover/copy:text-blue-500 transition-all'} />
        </button>
        
        <div className={`w-12 h-12 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shadow-xl active:scale-90 ${theme.accent} border-2 border-white/20`}>
          <Icons.Link size={22} strokeWidth={3} />
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
