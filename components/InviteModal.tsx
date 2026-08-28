
import React, { useState, useEffect } from 'react';
import { TelegramGroup } from '../types.ts';
import { Icons } from '../constants.tsx';
import { createInviteLink, revokeInviteLink } from '../services/telegramService.ts';

interface InviteModalProps {
  group: TelegramGroup;
  onClose: () => void;
  botToken: string;
  onInteraction: () => void;
}

const InviteModal: React.FC<InviteModalProps> = ({ group, onClose, botToken, onInteraction }) => {
  const [link, setLink] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [useLimit] = useState(1);
  const [expiration] = useState('0'); // Default to 0 (Unlimited Time)

  useEffect(() => {
    if (botToken && group) {
      handleGenerateLink();
    }
  }, [group, botToken]);

  const handleGenerateLink = async () => {
    if (!botToken) {
      setError("Connect your bot in settings first!");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    try {
      // 1. Call Telegram API (This is the only network wait we need)
      const realLink = await createInviteLink(
        botToken, 
        group.id, 
        useLimit, 
        parseInt(expiration)
      );
      
      // 2. Immediately show the link to the user (Milliseconds after Telegram responds)
      setLink(realLink);
      setIsGenerating(false);
      onInteraction();
      
      // Auto-copy to clipboard
      performCopy(realLink);

      // 3. Save to our database in the background (Don't block the UI)
      fetch(`/api/groups/${group.id}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: realLink }),
      }).catch(err => {
        console.error("Failed to save link to DB:", err);
      });

    } catch (err: any) {
      setError(err.message || 'Failed to generate link. Check bot permissions.');
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
      if (link === linkToRevoke) setLink('');
    } catch (err: any) {
      setError(err.message || 'Failed to revoke link.');
    }
  };

  const performCopy = (textToCopy: string) => {
    if (!textToCopy) return;

    const fallbackCopy = () => {
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch((err) => {
        console.error('Clipboard API failed, trying fallback', err);
        fallbackCopy();
      });
    } else {
      fallbackCopy();
    }
  };

  const copyToClipboard = () => {
    performCopy(link);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white/95 dark:bg-slate-950/90 w-full max-w-md rounded-[2.2rem] overflow-hidden shadow-[0_25px_50px_-12px_rgba(99,102,241,0.25)] flex flex-col p-6 md:p-8 animate-in zoom-in-95 duration-300 border-2 border-indigo-200/50 dark:border-indigo-900/50 border-b-[6px] border-b-indigo-500/80 dark:border-b-indigo-500/50">
        
        {/* Dynamic Refraction Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-purple-500/5 opacity-50 pointer-events-none" />

        <div className="flex justify-between items-start mb-6 relative z-10">
           <div>
             <div className="flex items-center gap-2 mb-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
               <p className="text-[8px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">TeleBridge Secure Gateway</p>
             </div>
             <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight break-words max-w-[280px]">{group.name}</h2>
           </div>
           <button 
             onClick={onClose} 
             className="bg-slate-100/80 dark:bg-slate-900/80 hover:bg-rose-500 hover:text-white text-slate-400 hover:scale-105 transition-all p-1.5 rounded-xl active:scale-95 border border-slate-200/40 dark:border-slate-800/40 shadow-sm"
           >
             <Icons.X size={15} />
           </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-wide">
            {error}
          </div>
        )}

        <div className="space-y-6 relative z-10">
          {/* Link Container Box */}
          <div className="bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-sm p-4 rounded-2xl border-2 border-dashed border-indigo-200/50 dark:border-indigo-900/30 relative group min-h-[70px] flex items-center shadow-inner">
            {isGenerating ? (
              <div className="flex items-center gap-3 text-slate-400 text-xs font-black animate-pulse">
                <div className="w-4.5 h-4.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span>GENERATING SECURE KEY...</span>
              </div>
            ) : link ? (
              <>
                <div className="text-indigo-600 dark:text-indigo-400 font-mono text-xs truncate mr-10 select-all font-black uppercase tracking-wide">{link}</div>
                <button 
                  onClick={copyToClipboard}
                  className="absolute right-3.5 p-2 bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-xl text-slate-500 dark:text-slate-300 transition-all shadow-sm active:scale-90 border border-slate-200/50 dark:border-slate-700/50 hover:scale-110"
                >
                  {copied ? <Icons.Check size={14} className="text-emerald-500" /> : <Icons.Copy size={14} />}
                </button>
              </>
            ) : (
              <span className="text-slate-400 italic text-xs font-medium">Link preparation required...</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5">
            <button 
              onClick={handleGenerateLink}
              className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-500/20 active:translate-y-[2px] border-b-[4px] border-indigo-800 dark:border-indigo-950 active:border-b-[1px] hover:scale-[1.02]"
            >
              Rotate Link
            </button>
            <button 
              onClick={copyToClipboard}
              className={`flex-1 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:translate-y-[2px] active:border-b-[1px] border-b-[4px] hover:scale-[1.02]
                ${copied 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-700 dark:border-emerald-850 shadow-md shadow-emerald-500/10' 
                  : 'bg-slate-100/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-slate-300/80 dark:border-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 shadow-sm'
                }`}
            >
              {copied ? 'Copied Link' : 'Duplicate Link'}
            </button>
          </div>

          {/* Metadata Badges */}
          <div className="pt-4 border-t border-slate-200/40 dark:border-slate-800/40 flex justify-between items-center text-slate-400">
            <div className="flex items-center gap-1.5">
              <Icons.Users size={12} className="text-slate-400" />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Limit: 1 User</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icons.Clock size={12} className="text-slate-400" />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Expiry: Permanent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
