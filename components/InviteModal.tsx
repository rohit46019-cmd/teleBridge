
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
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col p-8 md:p-10 animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-start mb-8">
           <div>
             <div className="flex items-center gap-3 mb-2">
               <div className="w-2 h-2 rounded-full bg-[#0088cc] animate-pulse shadow-[0_0_8px_rgba(0,136,204,0.8)]" />
               <p className="text-[10px] font-bold text-[#0088cc] uppercase tracking-widest">Secure Invite System</p>
             </div>
             <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight break-words max-w-[300px]">{group.name}</h2>
           </div>
           <button onClick={onClose} className="bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-500 transition-all p-2.5 rounded-xl active:scale-90 border border-slate-200 dark:border-slate-700">
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
                <div className="w-5 h-5 border-2 border-[#0088cc] border-t-transparent rounded-full animate-spin" />
                Encrypting link...
              </div>
            ) : link ? (
              <>
                <div className="text-[#0088cc] dark:text-[#66c0f4] font-mono text-sm truncate mr-12 select-all font-medium">{link}</div>
                <button 
                  onClick={copyToClipboard}
                  className="absolute right-4 p-2.5 bg-white dark:bg-slate-800 hover:bg-[#0088cc] hover:text-white rounded-xl text-slate-600 dark:text-slate-200 transition-all shadow-sm active:scale-90 border border-black/5 dark:border-white/5"
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
              className="flex-1 py-3.5 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-[#0088cc]/30 active:scale-95"
            >
              Rotate Key
            </button>
            <button 
              onClick={copyToClipboard}
              className={`flex-1 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 ${copied ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-sm'}`}
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
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expiry: Unlimited</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
