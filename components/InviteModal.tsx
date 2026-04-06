
import React, { useState, useEffect } from 'react';
import { TelegramGroup } from '../types.ts';
import { Icons } from '../constants.tsx';
import { generateLinkDescription } from '../services/geminiService.ts';
import { createInviteLink, revokeInviteLink } from '../services/telegramService.ts';

interface InviteModalProps {
  group: TelegramGroup;
  onClose: () => void;
  botToken: string;
  onInteraction: () => void;
}

const InviteModal: React.FC<InviteModalProps> = ({ group, onClose, botToken, onInteraction }) => {
  const [link, setLink] = useState<string>('');
  const [links, setLinks] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiDescription, setAiDescription] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [useLimit] = useState(1);
  const [expiration] = useState('1440'); // Default to 24 hours (1440 minutes)

  useEffect(() => {
    if (botToken && group) {
      handleGenerateLink();
    }
    const fetchAI = async () => {
      const desc = await generateLinkDescription(group.name);
      setAiDescription(desc);
    };
    fetchAI();
    fetchLinks();
  }, [group, botToken]);

  const fetchLinks = async () => {
    try {
      const res = await fetch(`/api/groups/${group.id}/links`);
      if (res.ok) setLinks(await res.json());
    } catch (err) {
      console.error("Failed to fetch links", err);
    }
  };

  const handleGenerateLink = async () => {
    if (!botToken) {
      setError("Connect your bot in settings first!");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    try {
      const realLink = await createInviteLink(
        botToken, 
        group.id, 
        useLimit, 
        parseInt(expiration)
      );
      setLink(realLink);
      await fetch(`/api/groups/${group.id}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: realLink }),
      });
      fetchLinks();
      onInteraction();
    } catch (err: any) {
      setError(err.message || 'Failed to generate link. Check bot permissions.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeLink = async (linkToRevoke: string) => {
    try {
      await revokeInviteLink(botToken, group.id, linkToRevoke);
      await fetch(`/api/groups/${group.id}/links`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: linkToRevoke }),
      });
      fetchLinks();
      if (link === linkToRevoke) setLink('');
    } catch (err: any) {
      setError(err.message || 'Failed to revoke link.');
    }
  };

  const copyToClipboard = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative glass w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col p-8 md:p-10 animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-start mb-8">
           <div>
             <div className="flex items-center gap-3 mb-2">
               <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
               <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Secure Invite System</p>
             </div>
             <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight break-words max-w-[300px]">{group.name}</h2>
           </div>
           <button onClick={onClose} className="bg-white/5 hover:bg-white/10 text-slate-500 hover:text-rose-500 transition-all p-2.5 rounded-xl active:scale-90 border border-white/10">
             <Icons.X size={20} />
           </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-[11px] font-bold uppercase tracking-wide">
            {error}
          </div>
        )}

        <div className="space-y-8">
          <div className="bg-black/5 dark:bg-black/20 p-6 rounded-2xl border border-black/5 dark:border-white/5 relative group min-h-[80px] flex items-center">
            {isGenerating ? (
              <div className="flex items-center gap-4 text-slate-400 text-sm font-medium animate-pulse">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Encrypting link...
              </div>
            ) : link ? (
              <>
                <div className="text-blue-600 dark:text-blue-400 font-mono text-sm truncate mr-12 select-all font-medium">{link}</div>
                <button 
                  onClick={copyToClipboard}
                  className="absolute right-4 p-2.5 bg-white dark:bg-slate-800 hover:bg-blue-500 hover:text-white rounded-xl text-slate-600 dark:text-slate-200 transition-all shadow-sm active:scale-90 border border-black/5 dark:border-white/5"
                >
                  {copied ? <Icons.Check size={18} /> : <Icons.Copy size={18} />}
                </button>
              </>
            ) : (
              <span className="text-slate-400 italic text-sm font-medium">Link preparation required...</span>
            )}
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleGenerateLink}
              className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95"
            >
              Rotate Key
            </button>
            <button 
              onClick={copyToClipboard}
              className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95 border ${copied ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/25' : 'bg-white/5 border-white/10 text-slate-700 dark:text-slate-200 hover:bg-white/10'}`}
            >
              {copied ? 'Copied' : 'Duplicate'}
            </button>
          </div>

          <div className="pt-8 border-t border-black/5 dark:border-white/10 space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Icons.Users size={14} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Limit: 1 User</span>
              </div>
              <div className="flex items-center gap-2">
                <Icons.Clock size={14} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expiry: 24 Hours</span>
              </div>
            </div>
            
            <div className="p-5 bg-blue-500/5 rounded-2xl border border-blue-500/10">
               <p className="text-xs text-slate-600 dark:text-blue-200/70 leading-relaxed font-medium italic">
                 "{aiDescription || "Your exclusive bridge to the community is ready. Handle with care."}"
               </p>
            </div>
            
            <div className="mt-6">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Recent Links</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                {links.map((l, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-black/5 dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5 group">
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate mr-2">{l.link}</span>
                    <button onClick={() => handleRevokeLink(l.link)} className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Icons.Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
