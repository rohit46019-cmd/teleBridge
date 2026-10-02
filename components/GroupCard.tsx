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
    borderLight: 'border-indigo-200/80 border-b-[4px] border-b-indigo-600',
    borderDark: 'dark:border-indigo-900/50 dark:border-b-[4px] dark:border-b-indigo-500',
    text: 'text-indigo-600 dark:text-indigo-400',
    glow: 'rgba(99,102,241,0.25)',
    pattern: 'radial-gradient(circle at 1.5px 1.5px, rgba(99,102,241,0.12) 1px, transparent 0)'
  },
  { 
    bgLight: 'bg-gradient-to-br from-emerald-50/70 to-teal-50/40',
    bgDark: 'dark:bg-gradient-to-br dark:from-emerald-950/25 dark:to-slate-900/40',
    accent: 'bg-emerald-600',
    borderLight: 'border-emerald-200/80 border-b-[4px] border-b-emerald-600',
    borderDark: 'dark:border-emerald-900/50 dark:border-b-[4px] dark:border-b-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    glow: 'rgba(16,185,129,0.25)',
    pattern: 'repeating-linear-gradient(45deg, rgba(16,185,129,0.06) 0px, rgba(16,185,129,0.06) 2px, transparent 2px, transparent 8px)'
  },
  { 
    bgLight: 'bg-gradient-to-br from-rose-50/70 to-pink-50/40',
    bgDark: 'dark:bg-gradient-to-br dark:from-rose-950/25 dark:to-slate-900/40',
    accent: 'bg-rose-600',
    borderLight: 'border-rose-200/80 border-b-[4px] border-b-rose-600',
    borderDark: 'dark:border-rose-900/50 dark:border-b-[4px] dark:border-b-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    glow: 'rgba(244,63,94,0.25)',
    pattern: 'radial-gradient(circle at 3px 3px, rgba(244,63,94,0.12) 1.5px, transparent 0)'
  },
  { 
    bgLight: 'bg-gradient-to-br from-amber-50/70 to-orange-50/40',
    bgDark: 'dark:bg-gradient-to-br dark:from-amber-950/25 dark:to-slate-900/40',
    accent: 'bg-amber-600',
    borderLight: 'border-amber-200/80 border-b-[4px] border-b-amber-600',
    borderDark: 'dark:border-amber-900/50 dark:border-b-[4px] dark:border-b-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    glow: 'rgba(245,158,11,0.25)',
    pattern: 'repeating-linear-gradient(-45deg, rgba(245,158,11,0.06) 0px, rgba(245,158,11,0.06) 2px, transparent 2px, transparent 8px)'
  },
  { 
    bgLight: 'bg-gradient-to-br from-purple-50/70 to-fuchsia-50/40',
    bgDark: 'dark:bg-gradient-to-br dark:from-purple-950/25 dark:to-slate-900/40',
    accent: 'bg-purple-600',
    borderLight: 'border-purple-200/80 border-b-[4px] border-b-purple-600',
    borderDark: 'dark:border-purple-900/50 dark:border-b-[4px] dark:border-b-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    glow: 'rgba(147,51,234,0.25)',
    pattern: 'radial-gradient(circle at 1.5px 1.5px, rgba(147,51,234,0.12) 1px, transparent 0)'
  },
  { 
    bgLight: 'bg-gradient-to-br from-cyan-50/70 to-blue-50/40',
    bgDark: 'dark:bg-gradient-to-br dark:from-cyan-950/25 dark:to-slate-900/40',
    accent: 'bg-cyan-600',
    borderLight: 'border-cyan-200/80 border-b-[4px] border-b-cyan-600',
    borderDark: 'dark:border-cyan-900/50 dark:border-b-[4px] dark:border-b-cyan-500',
    text: 'text-cyan-600 dark:text-cyan-400',
    glow: 'rgba(6,182,212,0.25)',
    pattern: 'radial-gradient(circle at 1px 1px, rgba(6,182,212,0.15) 1.5px, transparent 0)'
  },
  { 
    bgLight: 'bg-gradient-to-br from-lime-50/70 to-green-50/40',
    bgDark: 'dark:bg-gradient-to-br dark:from-lime-950/25 dark:to-slate-900/40',
    accent: 'bg-lime-600',
    borderLight: 'border-lime-200/80 border-b-[4px] border-b-lime-600',
    borderDark: 'dark:border-lime-900/50 dark:border-b-[4px] dark:border-b-lime-500',
    text: 'text-lime-600 dark:text-lime-400',
    glow: 'rgba(132,204,22,0.25)',
    pattern: 'linear-gradient(45deg, rgba(132,204,22,0.05) 25%, transparent 25%, transparent 75%, rgba(132,204,22,0.05) 75%)'
  },
  { 
    bgLight: 'bg-gradient-to-br from-fuchsia-50/70 to-rose-50/40',
    bgDark: 'dark:bg-gradient-to-br dark:from-fuchsia-950/25 dark:to-slate-900/40',
    accent: 'bg-fuchsia-600',
    borderLight: 'border-fuchsia-200/80 border-b-[4px] border-b-fuchsia-600',
    borderDark: 'dark:border-fuchsia-900/50 dark:border-b-[4px] dark:border-b-fuchsia-500',
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

  // For past added groups that might not have createdAt, fallback to lastInteraction if available.
  const timeCreated = group.createdAt || group.lastInteraction || 0;
  // 4 days in milliseconds
  const isNew = timeCreated > 0 && (Date.now() - timeCreated < 4 * 24 * 60 * 60 * 1000);

  const copyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(group.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onClick={() => onClick(group)}
      className={`group relative rounded-[1.25rem] p-3 flex items-center justify-between transition-all duration-500 cursor-pointer 
        ${group.pinned 
          ? 'bg-gradient-to-r from-amber-50/95 via-amber-100/50 to-yellow-50/80 dark:from-amber-950/50 dark:via-slate-900 dark:to-amber-950/30 border-2 border-amber-400 dark:border-amber-500 shadow-[0_12px_35px_rgba(245,158,11,0.3)] ring-2 ring-amber-400/40' 
          : `${theme.bgLight} ${theme.bgDark} border ${theme.borderLight} ${theme.borderDark}`}
        hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.15)] 
        hover:border-b-[5px] active:translate-y-[1px] active:border-b-[3px]
        overflow-hidden w-full
      `}
      style={{
        backgroundImage: group.pinned ? 'radial-gradient(circle at 2px 2px, rgba(245,158,11,0.15) 1.5px, transparent 0)' : theme.pattern,
        backgroundSize: '15px 15px',
      }}
    >
      {/* Dynamic Glow Refraction */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/15 via-transparent to-white/5 opacity-50 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none" />
      
      {/* Left Vertical Brand Highlight Pill (Gold if pinned) */}
      <div className={`absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full ${group.pinned ? 'bg-gradient-to-b from-amber-400 to-yellow-600 shadow-[0_0_12px_rgba(245,158,11,0.8)]' : `${theme.accent} shadow-[1px_0_6px_${theme.glow}]`}`} />

      {/* Pin/Tag Actions Container */}
      <div className="absolute top-2.5 left-3.5 flex items-center gap-1.5 z-20">
        <button 
          onClick={(e) => onTogglePin(e, group.id)} 
          title={group.pinned ? "Pinned to VIP Priority Top (Click to Unpin)" : "Pin to VIP Top"}
          className={`p-1.5 rounded-xl transition-all shadow-md border backdrop-blur-md hover:scale-110 active:scale-95 flex items-center justify-center
            ${group.pinned 
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-300 shadow-amber-500/50 scale-110 rotate-6 ring-2 ring-amber-300/60 animate-pulse' 
              : 'bg-white/90 dark:bg-slate-800/90 border-slate-200/50 dark:border-slate-700/50 text-slate-400 hover:text-amber-500 hover:border-amber-400'}`}
        >
          <span className="text-[10px] leading-none">{group.pinned ? '📌' : '📍'}</span>
        </button>

        {index !== undefined && (
          <span className="px-1.5 py-0.5 rounded-md font-mono font-black text-[9px] leading-none tracking-tight text-white bg-slate-900/90 dark:bg-slate-800/90 border border-white/10 shadow-sm whitespace-nowrap">
            #{String(index + 1).padStart(2, '0')}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 relative z-10 flex-1 min-w-0 ml-10">
        <div className="relative">
          {/* Radial Pulse Effect behind Image */}
          <div className={`absolute -inset-0.5 blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-500 rounded-lg ${group.pinned ? 'bg-amber-500' : theme.accent}`} />
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 flex-shrink-0 group-hover:scale-105 transition-transform duration-500 border border-white/60 dark:border-slate-700 shadow-md relative z-10">
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
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="text-xs md:text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {group.name}
            </h3>
            {group.pinned && (
              <span className="px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-sm shadow-amber-500/30 flex items-center gap-0.5 shrink-0">
                ⭐ VIP PINNED
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className={`px-1.5 py-0.5 rounded-md text-[8px] font-black text-white uppercase tracking-wider shadow-sm ${group.pinned ? 'bg-amber-600 shadow-amber-500/40' : `${theme.accent} shadow-[0_1px_4px_${theme.glow}]`}`}>
              {group.memberCount} MEMBERS
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            {isNew && (
              <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-gradient-to-r from-rose-500 to-pink-600 text-white animate-bounce shadow-md shadow-rose-500/50 border border-white/40">
                🆕 NEW
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 relative z-10 ml-2">
        <button 
          onClick={copyId} 
          className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all border border-slate-200/60 dark:border-slate-700/60 group/copy shadow-sm active:scale-95"
        >
          <span className="text-[8px] font-mono font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate max-w-[80px]">
            {copied ? 'COPIED!' : `ID: ${group.id}`}
          </span>
          <Icons.Copy size={9} className={copied ? 'text-emerald-500 scale-110' : 'text-slate-400 group-hover/copy:text-blue-500 transition-all'} />
        </button>
        
        <div className={`w-8 h-8 text-white rounded-xl flex items-center justify-center group-hover:scale-105 group-hover:rotate-3 transition-all shadow-md active:scale-90 ${group.pinned ? 'bg-gradient-to-br from-amber-500 to-yellow-600 shadow-amber-500/30' : theme.accent} border-2 border-white/20`}>
          <Icons.Link size={13} strokeWidth={3} />
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
