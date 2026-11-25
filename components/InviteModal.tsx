import React, { useState, useEffect, useCallback } from 'react';
import { TelegramGroup, InviteLinkRecord, WelcomeConfig } from '../types.ts';
import { Icons } from '../constants.tsx';
import { createInviteLink, revokeInviteLink, isValidHttpUrl } from '../services/telegramService.ts';

interface InviteModalProps {
  group: TelegramGroup;
  onClose: () => void;
  botToken: string;
  onInteraction: () => void;
  onUpdateGroup?: (updatedGroup: TelegramGroup) => void;
  onLinkActivity?: () => void;
  onShowNotification?: (msg: string, type: 'success' | 'alert' | 'info') => void;
}

const EXPIRY_OPTIONS = [
  { label: 'Permanent', minutes: 0 },
  { label: '1 Hour', minutes: 60 },
  { label: '24 Hours', minutes: 1440 },
  { label: '7 Days', minutes: 10080 },
];

const LIMIT_OPTIONS = [
  { label: '1 User', value: 1 },
  { label: '5 Users', value: 5 },
  { label: '10 Users', value: 10 },
  { label: 'Unlimited', value: 0 },
];

const InviteModal: React.FC<InviteModalProps> = ({
  group,
  onClose,
  botToken,
  onInteraction,
  onUpdateGroup,
  onLinkActivity,
  onShowNotification,
}) => {
  const [modalTab, setModalTab] = useState<'link' | 'welcome'>('link');
  const [link, setLink] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [useLimit, setUseLimit] = useState<number>(1);
  const [expireMinutes, setExpireMinutes] = useState<number>(0);
  const [groupLinks, setGroupLinks] = useState<InviteLinkRecord[]>([]);
  const [revokingLink, setRevokingLink] = useState<string | null>(null);

  // Per-Batch Welcome Config State
  const [welcomeMode, setWelcomeMode] = useState<'inherit' | 'on' | 'off'>(() => {
    if (group.welcomeConfig?.enabled === true) return 'on';
    if (group.welcomeConfig?.enabled === false) return 'off';
    return 'inherit';
  });
  const [welcomeText, setWelcomeText] = useState(group.welcomeConfig?.text || '');
  const [welcomePhotoUrl, setWelcomePhotoUrl] = useState(group.welcomeConfig?.photoUrl || '');
  const [welcomeButtonText, setWelcomeButtonText] = useState(group.welcomeConfig?.buttonText || '');
  const [welcomeButtonUrl, setWelcomeButtonUrl] = useState(group.welcomeConfig?.buttonUrl || '');
  const [isSavingWelcome, setIsSavingWelcome] = useState(false);

  const loadGroupLinks = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${group.id}/links`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setGroupLinks(data);
      }
    } catch {
      // ignore offline
    }
  }, [group.id]);

  useEffect(() => {
    if (botToken && group) {
      handleGenerateLink(1, 0);
      loadGroupLinks();
    }
  }, [group.id, botToken]);

  const handleGenerateLink = async (
    limitOverride?: number,
    expireOverride?: number
  ) => {
    if (!botToken) {
      setError('Connect your bot in settings first!');
      return;
    }

    const activeLimit = limitOverride !== undefined ? limitOverride : useLimit;
    const activeExpire = expireOverride !== undefined ? expireOverride : expireMinutes;

    setIsGenerating(true);
    setError(null);
    try {
      const realLink = await createInviteLink(
        botToken,
        group.id,
        activeLimit,
        activeExpire
      );

      setLink(realLink);
      setIsGenerating(false);
      onInteraction();
      performCopy(realLink);

      const expiresAt = activeExpire > 0 ? Date.now() + activeExpire * 60 * 1000 : 0;

      fetch(`/api/groups/${group.id}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link: realLink,
          groupName: group.name,
          memberLimit: activeLimit,
          expireMinutes: activeExpire,
          expiresAt,
        }),
      })
        .then(() => {
          loadGroupLinks();
          onLinkActivity?.();
        })
        .catch((err) => {
          console.error('Failed to save link to DB:', err);
        });
    } catch (err: any) {
      setError(err.message || 'Failed to generate link. Check bot permissions.');
      setIsGenerating(false);
    }
  };

  const handleRevokeSpecificLink = async (linkToRevoke: string) => {
    if (!botToken) return;
    setRevokingLink(linkToRevoke);
    setError(null);
    try {
      const res = await fetch('/api/revoke-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: linkToRevoke, token: botToken, chatId: group.id }),
      });
      if (!res.ok) {
        await revokeInviteLink(botToken, group.id, linkToRevoke);
      }
      if (link === linkToRevoke) setLink('');
      await loadGroupLinks();
      onLinkActivity?.();
      onShowNotification?.('Invite link revoked!', 'success');
    } catch (err: any) {
      setError(err.message || 'Failed to revoke link.');
    } finally {
      setRevokingLink(null);
    }
  };

  const handleSaveWelcomeConfig = async () => {
    if (welcomePhotoUrl.trim() && !isValidHttpUrl(welcomePhotoUrl)) {
      setError('Photo URL must start with https:// or http://');
      return;
    }
    if (welcomeButtonUrl.trim() && !isValidHttpUrl(welcomeButtonUrl)) {
      setError('Button URL must start with https:// or http://');
      return;
    }

    setError(null);
    setIsSavingWelcome(true);
    try {
      const welcomeConfig: WelcomeConfig = {
        enabled: welcomeMode === 'on' ? true : welcomeMode === 'off' ? false : undefined,
        text: welcomeText.trim(),
        photoUrl: welcomePhotoUrl.trim(),
        buttonText: welcomeButtonText.trim(),
        buttonUrl: welcomeButtonUrl.trim(),
      };
      const updatedGroup: TelegramGroup = {
        ...group,
        welcomeConfig,
      };
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGroup),
      });
      if (!res.ok) {
        throw new Error('Failed to save welcome settings');
      }
      onUpdateGroup?.(updatedGroup);
      onShowNotification?.(`Custom welcome saved for "${group.name}"!`, 'success');
    } catch (err: any) {
      setError(err.message || 'Could not save custom welcome.');
    } finally {
      setIsSavingWelcome(false);
    }
  };

  const performCopy = (textToCopy: string) => {
    if (!textToCopy) return;

    const fallbackCopy = () => {
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
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
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }
  };

  const copyToClipboard = () => performCopy(link);

  const activeExpiryLabel =
    EXPIRY_OPTIONS.find((e) => e.minutes === expireMinutes)?.label || 'Permanent';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300 touch-none overscroll-none">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md touch-none overscroll-none"
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
      />

      <div className="relative bg-white/95 dark:bg-slate-950/90 w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain touch-auto rounded-[2.2rem] shadow-[0_25px_50px_-12px_rgba(99,102,241,0.25)] flex flex-col p-6 md:p-7 animate-in zoom-in-95 duration-300 border-2 border-indigo-200/50 dark:border-indigo-900/50 border-b-[6px] border-b-indigo-500/80 dark:border-b-indigo-500/50">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-purple-500/5 opacity-50 pointer-events-none" />

        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <p className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1">
              TeleBridge Hub Control
            </p>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight break-words max-w-[280px]">
              {group.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-100/80 dark:bg-slate-900/80 hover:bg-rose-500 hover:text-white text-slate-400 hover:scale-105 transition-all p-1.5 rounded-xl active:scale-95 border border-slate-200/40 dark:border-slate-800/40 shadow-sm"
          >
            <Icons.X size={15} />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="relative z-10 flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => setModalTab('link')}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              modalTab === 'link'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Icons.Link size={12} />
            <span>Invite Link</span>
          </button>
          <button
            type="button"
            onClick={() => setModalTab('welcome')}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              modalTab === 'welcome'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Icons.Zap size={12} />
            <span>Custom Welcome</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-bold relative z-10">
            {error}
          </div>
        )}

        {modalTab === 'link' ? (
          <div className="space-y-4 relative z-10">
            {/* Link Container Box */}
            <div className="bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-sm p-3.5 rounded-2xl border-2 border-dashed border-indigo-200/50 dark:border-indigo-900/30 relative group min-h-[64px] flex items-center shadow-inner">
              {isGenerating ? (
                <div className="flex items-center gap-3 text-slate-400 text-xs font-black animate-pulse">
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span>GENERATING SECURE KEY...</span>
                </div>
              ) : link ? (
                <>
                  <div className="text-indigo-600 dark:text-indigo-400 font-mono text-xs truncate mr-10 select-all font-black tracking-wide">
                    {link}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="absolute right-3 p-2 bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-xl text-slate-500 dark:text-slate-300 transition-all shadow-sm active:scale-90 border border-slate-200/50 dark:border-slate-700/50"
                  >
                    {copied ? <Icons.Check size={14} className="text-emerald-500" /> : <Icons.Copy size={14} />}
                  </button>
                </>
              ) : (
                <span className="text-slate-400 italic text-xs font-medium">
                  Click Rotate Link to generate a fresh invite
                </span>
              )}
            </div>

            {/* Expiry & Member Limit Selectors */}
            <div className="space-y-2.5 bg-slate-50/70 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Auto-Expire Timer
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {EXPIRY_OPTIONS.map((opt) => (
                    <button
                      key={opt.minutes}
                      type="button"
                      onClick={() => setExpireMinutes(opt.minutes)}
                      className={`py-1.5 px-1 rounded-lg text-[9px] font-black transition-all whitespace-nowrap ${
                        expireMinutes === opt.minutes
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Member Limit
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {LIMIT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setUseLimit(opt.value)}
                      className={`py-1.5 px-1 rounded-lg text-[9px] font-black transition-all whitespace-nowrap ${
                        useLimit === opt.value
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5">
              <button
                onClick={() => handleGenerateLink()}
                disabled={isGenerating}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-500/20 active:translate-y-[2px] border-b-[4px] border-indigo-800 dark:border-indigo-950 active:border-b-[1px] disabled:opacity-60"
              >
                Rotate Link
              </button>
              <button
                onClick={copyToClipboard}
                disabled={!link}
                className={`flex-1 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:translate-y-[2px] active:border-b-[1px] border-b-[4px] disabled:opacity-50 ${
                  copied
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-700 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-100/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-slate-300/80 dark:border-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 shadow-sm'
                }`}
              >
                {copied ? 'Copied Link' : 'Copy Link'}
              </button>
            </div>

            {/* Metadata Row */}
            <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800/40 flex justify-between items-center text-slate-400 text-[9px] font-black uppercase tracking-widest">
              <span>Limit: {useLimit === 0 ? 'Unlimited' : `${useLimit} User${useLimit > 1 ? 's' : ''}`}</span>
              <span>Expiry: {activeExpiryLabel}</span>
            </div>

            {/* Recent Links for This Group */}
            {groupLinks.length > 0 && (
              <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800/40 space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Recent Links ({groupLinks.length})
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                  {groupLinks.slice(0, 6).map((item, idx) => {
                    const status = item.status || 'active';
                    return (
                      <div
                        key={item._id || `${item.link}-${idx}`}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-[10px]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-mono font-bold text-slate-700 dark:text-slate-200 truncate">
                            {item.link}
                          </p>
                          <p className="text-[8px] text-slate-400 uppercase font-bold">
                            {status} · {item.expireMinutes ? `${item.expireMinutes}m` : 'Permanent'} ·{' '}
                            {item.memberLimit === 0 ? 'Unlimited' : `${item.memberLimit || 1}u`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => performCopy(item.link)}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-600 border border-slate-200/60 dark:border-slate-700/60"
                            title="Copy Link"
                          >
                            <Icons.Copy size={11} />
                          </button>
                          {status === 'active' && (
                            <button
                              type="button"
                              onClick={() => handleRevokeSpecificLink(item.link)}
                              disabled={revokingLink === item.link}
                              className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 text-[8px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                            >
                              {revokingLink === item.link ? '...' : 'Revoke'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3.5 relative z-10">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Welcome Behavior for This Batch
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'inherit', label: 'Global Default' },
                  { id: 'on', label: 'Custom ON' },
                  { id: 'off', label: 'Disable Here' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setWelcomeMode(m.id as 'inherit' | 'on' | 'off')}
                    className={`py-1.5 px-2 rounded-lg text-[9px] font-black transition-all ${
                      welcomeMode === m.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800/60'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Custom Welcome Text
              </label>
              <textarea
                rows={3}
                value={welcomeText}
                onChange={(e) => setWelcomeText(e.target.value)}
                placeholder="Welcome {{name}} to {{group}}! Read the pinned rules before posting."
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
              <p className="text-[8px] font-bold text-slate-400 mt-1">
                Variables: {'{{name}}'} (user mention), {'{{group}}'} (batch title)
              </p>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Welcome Photo URL (Optional)
              </label>
              <input
                type="url"
                value={welcomePhotoUrl}
                onChange={(e) => setWelcomePhotoUrl(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Button Label
                </label>
                <input
                  type="text"
                  value={welcomeButtonText}
                  onChange={(e) => setWelcomeButtonText(e.target.value)}
                  placeholder="e.g. Rules & Notes"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Button Link URL
                </label>
                <input
                  type="url"
                  value={welcomeButtonUrl}
                  onChange={(e) => setWelcomeButtonUrl(e.target.value)}
                  placeholder="https://t.me/yourchannel"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveWelcomeConfig}
              disabled={isSavingWelcome}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              {isSavingWelcome ? 'Saving...' : 'Save Batch Welcome'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteModal;
