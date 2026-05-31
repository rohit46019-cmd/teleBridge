
import React, { useState } from 'react';
import { TelegramGroup } from '../types.ts';
import { Icons } from '../constants.tsx';

interface GroupCardProps {
  group: TelegramGroup;
  onClick: (group: TelegramGroup) => void;
  onTogglePin: (e: React.MouseEvent, id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  index?: number;
}

const UNIQUE_THEMES = [
  { 
    gradient: 'from-blue-600/30 to-indigo-700/30', 
    accent: 'bg-blue-600', 
    border: 'border-blue-500/30 shadow-blue-500/10',
    pattern: 'radial-gradient(circle at 1.5px 1.5px, rgba(59,130,246,0.15) 1px, transparent 0)' 
  },
  { 
    gradient: 'from-emerald-500/30 to-teal-700/30', 
    accent: 'bg-emerald-600', 
    border: 'border-emerald-500/30 shadow-emerald-500/10',
    pattern: 'repeating-linear-gradient(45deg, rgba(16,185,129,0.1) 0px, rgba(16,185,129,0.1) 2px, transparent 2px, transparent 8px)' 
  },
  { 
    gradient: 'from-rose-500/30 to-pink-700/30', 
    accent: 'bg-rose-600', 
    border: 'border-rose-500/30 shadow-rose-500/10',
    pattern: 'radial-gradient(circle at 3px 3px, rgba(244,63,94,0.15) 1.5px, transparent 0)' 
  },
  { 
    gradient: 'from-amber-400/30 to-orange-600/30', 
    accent: 'bg-amber-600', 
    border: 'border-amber-500/30 shadow-amber-500/10',
    pattern: 'repeating-linear-gradient(-45deg, rgba(245,158,11,0.1) 0px, rgba(245,158,11,0.1) 2px, transparent 2px, transparent 8px)' 
  },
  { 
    gradient: 'from-purple-600/30 to-fuchsia-700/30', 
    accent: 'bg-purple-600', 
    border: 'border-purple-500/30 shadow-purple-500/10',
    pattern: 'radial-gradient(circle at 1.5px 1.5px, rgba(147,51,234,0.15) 1px, transparent 0)' 
  },
  { 
    gradient: 'from-cyan-500/30 to-blue-600/30', 
    accent: 'bg-cyan-600', 
    border: 'border-cyan-500/30 shadow-cyan-500/10',
    pattern: 'radial-gradient(circle at 1px 1px, rgba(6,182,212,0.2) 1.5px, transparent 0)' 
  },
  { 
    gradient: 'from-lime-500/30 to-green-600/30', 
    accent: 'bg-lime-600', 
    border: 'border-lime-500/30 shadow-lime-500/10',
    pattern: 'linear-gradient(45deg, rgba(132,204,22,0.08) 25%, transparent 25%, transparent 75%, rgba(132,204,22,0.08) 75%)' 
  },
  { 
    gradient: 'from-fuchsia-500/30 to-rose-600/30', 
    accent: 'bg-fuchsia-600', 
    border: 'border-fuchsia-500/30 shadow-fuchsia-500/10',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(192,38,211,0.1) 0, rgba(192,38,211,0.1) 1px, transparent 1px, transparent 15px)' 
  },
];

const GroupCard: React.FC<GroupCardProps> = ({ group, onClick, onTogglePin, index }) => {
  const [copied, setCopied] = useState(false);

  // Use index if provided, otherwise fallback to group ID based stable index
  const themeIndex = index !== undefined 
    ? index % UNIQUE_THEMES.length
    : Math.abs(group.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % UNIQUE_THEMES.length;
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
      className={`group relative rounded-xl p-3 flex items-center justify-between transition-all duration-500 cursor-pointer 
        bg-white dark:bg-slate-900 border-2 ${theme.border}
        hover:-translate-y-0.5 hover:shadow-[0_5px_15px_-5px_rgba(0,0,0,0.3)] 
        dark:hover:shadow-[0_5px_15px_-5px_rgba(0,0,0,0.5)]
        active:scale-[0.98] active:translate-y-0 overflow-hidden w-full
        before:absolute before:inset-0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500
        before:bg-gradient-to-br ${theme.gradient}
      `}
      style={{
        backgroundImage: theme.pattern,
        backgroundSize: '15px 15px'
      }}
    >
      {/* 3D Glass Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Colorful Accent Glow */}
      <div className={`absolute -right-8 -top-8 w-20 h-20 rounded-full blur-3xl opacity-10 group-hover:opacity-30 transition-opacity duration-500 ${theme.accent}`} />

      <button 
        onClick={(e) => onTogglePin(e, group.id)} 
        className={`absolute top-2 left-2 p-0.5 rounded-lg transition-all shadow-sm z-20 border backdrop-blur-md
          ${group.pinned 
            ? 'bg-amber-400 text-white border-amber-300 scale-110 rotate-12' 
            : 'bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-500'}`}
      >
         <span className="text-[8px] leading-none">{group.pinned ? '📌' : '📍'}</span>
      </button>

      <div className="flex items-center gap-3 relative z-10 flex-1 min-w-0 ml-6">
        <div className="relative">
          <div className={`absolute inset-0 blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500 rounded-lg ${theme.accent}`} />
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 flex-shrink-0 group-hover:scale-110 transition-transform duration-500 border-2 border-white/20 shadow-lg relative z-10">
            <img 
              src={group.image.replace('/200', '/100')} 
              alt={group.name} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
              loading="lazy" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${group.id}/100`;
              }}
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-display font-black text-slate-900 dark:text-white truncate leading-tight mb-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {group.name}
          </h3>
          <div className="flex items-center gap-1.5">
            <div className={`px-1.5 py-0 rounded-full text-[8px] font-black text-white uppercase tracking-wider shadow-sm ${theme.accent}`}>
              {group.memberCount} MEMBERS
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 relative z-10 ml-1">
        <button 
          onClick={copyId} 
          className="hidden md:flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all border border-slate-200 dark:border-slate-700 group/copy"
        >
          <span className="text-[8px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate max-w-[80px]">
            {copied ? 'COPIED!' : `ID: ${group.id}`}
          </span>
          <Icons.Copy size={10} className={copied ? 'text-emerald-500 scale-125' : 'text-slate-400 group-hover/copy:text-blue-500 transition-all'} />
        </button>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(e, group.id);
          }}
          className="flex items-center justify-center w-8 h-8 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-500 hover:text-rose-500 rounded-lg transition-all border border-slate-200 dark:border-slate-700"
        >
          <Icons.Trash size={14} />
        </button>
        
        <div className={`w-8 h-8 text-white rounded-lg flex items-center justify-center group-hover:scale-105 group-hover:rotate-3 transition-all shadow-md active:scale-90 ${theme.accent} border-2 border-white/20`}>
          <Icons.Link size={14} strokeWidth={3} />
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
