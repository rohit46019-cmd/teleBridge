
import React, { useState } from 'react';
import { TelegramGroup } from '../types.ts';
import { Icons } from '../constants.tsx';

interface GroupCardProps {
  group: TelegramGroup;
  onClick: (group: TelegramGroup) => void;
  onTogglePin: (e: React.MouseEvent, id: string) => void;
  index?: number;
}

const UNIQUE_THEMES = [
  { 
    bgLight: 'bg-gradient-to-br from-indigo-50/70 to-blue-50/40',
    bgDark: 'dark:bg-gradient-to-br dark:from-indigo-950/25 dark:to-slate-900/40',
    accent: 'bg-indigo-600',
    borderLight: 'border-indigo-200/80 border-b-[5px] border-b-indigo-600',
    borderDark: 'dark:border-indigo-900/50 dark:border-b-[5px] dark:border-b-indigo-500',
    text: 'text-indigo-600 dark:text-indigo-400',
    glow: 'rgba(99,102,241,0.25)',
    pattern: 'radial-gradient(circle at 1.5px 1.5px, rgba(99,102,241,0.12) 1px, transparent 0)'
  },
  { 
    bgLight: 'bg-gradient-to-br from-emerald-50/70 to-teal-50/40',
    bgDark: 'dark:bg-gradient-to-br dark:from-emerald-950/25 dark:to-slate-900/40',
    accent: 'bg-emerald-600',
    borderLight: 'border-emerald-200/80 border-b-[5px] border-b-emerald-600',
    borderDark: 'dark:border-emerald-900/50 dark:border-b-[5px] dark:border-b-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    glow: 'rgba(16,185,129,0.25)',
    pattern: 'repeating-linear-gradient(45deg, rgba(16,185,129,0.06) 0px, rgba(16,185,129,0.06) 2px, transparent 2px, transparent 8px)'
  },
  { 
    bgLight: 'bg-gradient-to-br from-rose-50/70 to-pink-50/40',
    bgDark: 'dark:bg-gradient-to-br dark:from-rose-950/25 dark:to-slate-900/40',
    accent: 'bg-rose-600',
    borderLight: 'border-rose-200/80 border-b-[5px] border-b-rose-600',
    borderDark: 'dark:border-rose-900/50 dark:border-b-[5px] dark:border-b-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    glow: 'rgba(244,63,94,0.25)',
    pattern: 'radial-gradient(circle at 3px 3px, rgba(244,63,94,0.12) 1.5px, transparent 0)'
  },
  { 
    bgLight: 'bg-gradient-to-br from-amber-50/70 to-orange-50/40',
    bgDark: 'dark:bg-gradient-to-br dark:from-amber-950/25 dark:to-slate-900/40',
    accent: 'bg-amber-600',
    borderLight: 'border-amber-200/80 border-b-[5px] border-b-amber-600',
    borderDark: 'dark:border-amber-900/50 dark:border-b-[5px] dark:border-b-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    glow: 'rgba(245,158,11,0.25)',
    pattern: 'repeating-linear-gradient(-45deg, rgba(245,158,11,0.06) 0px, rgba(245,158,11,0.06) 2px, transparent 2px, transparent 8px)'
  },
  { 
    bgLight: 'bg-gradient-to-br from-purple-50/70 to-fuchsia-50/40',
    bgDark: 'dark:bg-gradient-to-br dark:from-purple-950/25 dark:to-slate-900/40',
    accent: 'bg-purple-600',
    borderLight: 'border-purple-200/80 border-b-[5px] border-b-purple-600',
    borderDark: 'dark:border-purple-900/50 dark:border-b-[5px] dark:border-b-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    glow: 'rgba(147,51,234,0.25)',
    pattern: 'radial-gradient(circle at 1.5px 1.5px, rgba(147,51,234,0.12) 1px, transparent 0)'
  },
  { 
    bgLight: 'bg-gradient-to-br from-cyan-50/70 to-blue-50/40',
    bgDark: 'dark:bg-gradient-to-br dark:from-cyan-950/25 dark:to-slate-900/40',
    accent: 'bg-cyan-600',
    borderLight: 'border-cyan-200/80 border-b-[5px] border-b-cyan-600',
    borderDark: 'dark:border-cyan-900/50 dark:border-b-[5px] dark:border-b-cyan-500',
    text: 'text-cyan-600 dark:text-cyan-400',
    glow: 'rgba(6,182,212,0.25)',
    pattern: 'radial-gradient(circle at 1px 1px, rgba(6,182,212,0.15) 1.5px, transparent 0)'
  },
  { 
    bgLight: 'bg-gradient-to-br from-lime-50/70 to-green-50/40',
    bgDark: 'dark:bg-gradient-to-br dark:from-lime-950/25 dark:to-slate-900/40',
    accent: 'bg-lime-600',
    borderLight: 'border-lime-200/80 border-b-[5px] border-b-lime-600',
    borderDark: 'dark:border-lime-900/50 dark:border-b-[5px] dark:border-b-lime-500',
    text: 'text-lime-600 dark:text-lime-400',
    glow: 'rgba(132,204,22,0.25)',
    pattern: 'linear-gradient(45deg, rgba(132,204,22,0.05) 25%, transparent 25%, transparent 75%, rgba(132,204,22,0.05) 75%)'
  },
  { 
    bgLight: 'bg-gradient-to-br from-fuchsia-50/70 to-rose-50/40',
    bgDark: 'dark:bg-gradient-to-br dark:from-fuchsia-950/25 dark:to-slate-900/40',
    accent: 'bg-fuchsia-600',
    borderLight: 'border-fuchsia-200/80 border-b-[5px] border-b-fuchsia-600',
    borderDark: 'dark:border-fuchsia-900/50 dark:border-b-[5px] dark:border-b-fuchsia-500',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
    glow: 'rgba(192,38,211,0.25)',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(192,38,211,0.08) 0, rgba(192,38,211,0.08) 1px, transparent 1px, transparent 15px)'
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
      className={`group relative rounded-[1.85rem] p-4 flex items-center justify-between transition-all duration-500 cursor-pointer 
        ${theme.bgLight} ${theme.bgDark} border ${theme.borderLight} ${theme.borderDark}
        hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] 
        hover:border-b-[7px] active:translate-y-[2px] active:border-b-[3px]
        overflow-hidden w-full
      `}
      style={{
        backgroundImage: theme.pattern,
        backgroundSize: '15px 15px',
        boxShadow: `0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01), hover: 0 25px 50px -12px ${theme.glow}`
      }}
    >
      {/* Dynamic Glow Refraction */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 opacity-40 group-hover:opacity-75 transition-opacity duration-500 pointer-events-none" />
      
      {/* Left Vertical Brand Highlight Pill */}
      <div className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full ${theme.accent} shadow-[2px_0_10px_${theme.glow}]`} />

      {/* Pin/Tag Actions Container */}
      <div className="absolute top-3 left-4 flex items-center gap-1.5 z-20">
        <button 
          onClick={(e) => onTogglePin(e, group.id)} 
          className={`p-1 rounded-xl transition-all shadow-[0_2px_8px_rgba(0,0,0,0.08)] border backdrop-blur-md hover:scale-110 active:scale-95
            ${group.pinned 
              ? 'bg-amber-400 text-white border-amber-300 scale-110 rotate-12' 
              : 'bg-white/90 dark:bg-slate-800/90 border-slate-200/50 dark:border-slate-700/50 text-slate-400 hover:text-amber-500'}`}
        >
          <span className="text-[10px] leading-none">{group.pinned ? '📌' : '📍'}</span>
        </button>

        {index !== undefined && (
          <span className="px-2 py-0.5 rounded-lg font-mono font-black text-[9px] leading-none tracking-tight text-white bg-slate-900/90 dark:bg-slate-800/90 border border-white/10 shadow-sm whitespace-nowrap">
            #{String(index + 1).padStart(2, '0')}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 relative z-10 flex-1 min-w-0 ml-8">
        <div className="relative">
          {/* Radial Pulse Effect behind Image */}
          <div className={`absolute -inset-1 blur-md opacity-30 group-hover:opacity-60 transition-opacity duration-500 rounded-xl ${theme.accent}`} />
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 flex-shrink-0 group-hover:scale-110 transition-transform duration-500 border-2 border-white/40 shadow-lg relative z-10">
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
          <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 truncate leading-tight mb-1 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
            {group.name}
          </h3>
          <div className="flex items-center gap-2">
            <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black text-white uppercase tracking-wider shadow-sm ${theme.accent} shadow-[0_2px_6px_${theme.glow}]`}>
              {group.memberCount} MEMBERS
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 relative z-10 ml-2">
        <button 
          onClick={copyId} 
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 bg-white/60 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all border border-slate-200/50 dark:border-slate-700/50 group/copy shadow-sm active:scale-95"
        >
          <span className="text-[9px] font-mono font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate max-w-[90px]">
            {copied ? 'COPIED!' : `ID: ${group.id}`}
          </span>
          <Icons.Copy size={11} className={copied ? 'text-emerald-500 scale-125' : 'text-slate-400 group-hover/copy:text-blue-500 transition-all'} />
        </button>
        
        <div className={`w-9 h-9 text-white rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shadow-[0_4px_10px_rgba(0,0,0,0.12)] active:scale-90 ${theme.accent} border-2 border-white/20`}>
          <Icons.Link size={15} strokeWidth={3} />
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
