
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

  const copyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(group.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onClick={() => onClick(group)}
      className="group relative glass rounded-3xl p-5 flex items-center justify-between hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:shadow-xl active:scale-[0.99] active:translate-y-0 overflow-hidden w-full"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <button onClick={(e) => onTogglePin(e, group.id)} className={`absolute top-4 right-4 p-2 rounded-xl transition-all shadow-sm border ${group.pinned ? 'bg-amber-400 text-white border-amber-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'}`}>
         <Icons.Pin size={14} />
      </button>

      <div className="flex items-center gap-5 relative z-10 flex-1 min-w-0">
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-black/10 flex-shrink-0 group-hover:scale-105 transition-transform duration-500 border border-white/10 shadow-lg">
          <img 
            src={group.image} 
            alt={group.name} 
            className="w-full h-full object-cover" 
            loading="lazy" 
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/200';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-display font-bold text-slate-900 dark:text-white truncate leading-tight mb-1">{group.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{group.memberCount} MEMBERS</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 relative z-10 ml-4 mr-10">
        <button onClick={copyId} className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10">
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate max-w-[100px]">ID: {group.id}</span>
          <Icons.Copy size={12} className={copied ? 'text-emerald-500' : 'text-slate-400'} />
        </button>
        <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-all shadow-lg shadow-blue-500/25 active:scale-90">
          <Icons.Link size={18} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
