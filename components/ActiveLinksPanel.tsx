import React, { useState, useMemo } from 'react';
import { InviteLinkRecord } from '../types.ts';
import { Icons } from '../constants.tsx';

interface ActiveLinksPanelProps {
  links: InviteLinkRecord[];
  isLoading: boolean;
  onRefresh: () => void;
  onRevokeLink: (link: string, chatId?: string) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  onCopyLink: (link: string) => void;
}

const formatExpiryCountdown = (item: InviteLinkRecord): string => {
  if (item.status === 'revoked') return 'Revoked';
  if (!item.expiresAt || item.expiresAt === 0) return 'Permanent';
  const diffMs = item.expiresAt - Date.now();
  if (diffMs <= 0) return 'Expired';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m left`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h left`;
  const days = Math.floor(hrs / 24);
  return `${days}d left`;
};

const ActiveLinksPanel: React.FC<ActiveLinksPanelProps> = ({
  links,
  isLoading,
  onRefresh,
  onRevokeLink,
  onDeleteRecord,
  onCopyLink,
}) => {
  const [filter, setFilter] = useState<'active' | 'all' | 'expired' | 'revoked'>('active');
  const [busyLink, setBusyLink] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    let active = 0;
    let expired = 0;
    let revoked = 0;
    for (const l of links) {
      const s = l.status || 'active';
      if (s === 'active') active++;
      else if (s === 'expired') expired++;
      else if (s === 'revoked') revoked++;
    }
    return { active, expired, revoked, all: links.length };
  }, [links]);

  const filteredLinks = useMemo(() => {
    if (filter === 'all') return links;
    return links.filter((l) => (l.status || 'active') === filter);
  }, [links, filter]);

  const handleRevoke = async (item: InviteLinkRecord) => {
    setBusyLink(item.link);
    try {
      await onRevokeLink(item.link, item.groupId);
    } finally {
      setBusyLink(null);
    }
  };

  return (
    <section
      aria-label="Active Invite Links Manager"
      className="relative rounded-[1.75rem] bg-[#F8FAFC] dark:bg-slate-900/90 border-[1.5px] border-indigo-200/80 dark:border-indigo-500/25 p-5 sm:p-6 shadow-[0_8px_28px_-8px_rgba(99,102,241,0.12)] overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
            <Icons.Key size={18} strokeWidth={2.3} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Multi-Group Link Vault
            </p>
            <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Active Links Manager ({counts.active})
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
        >
          <Icons.Refresh size={11} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-200/70 dark:border-slate-800 mb-4 overflow-x-auto">
        {([
          { id: 'active', label: `Active (${counts.active})` },
          { id: 'expired', label: `Expired (${counts.expired})` },
          { id: 'revoked', label: `Revoked (${counts.revoked})` },
          { id: 'all', label: `All (${counts.all})` },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
              filter === tab.id
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Links List */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
        {filteredLinks.length > 0 ? (
          filteredLinks.map((item, idx) => {
            const status = item.status || 'active';
            const rowKey = item._id || `${item.link}-${idx}`;
            return (
              <div
                key={rowKey}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-[190px]">
                      {item.groupName || `Hub ${item.groupId}`}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : status === 'expired'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 truncate">
                    {item.link}
                  </p>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5 tabular-nums">
                    {formatExpiryCountdown(item)} · Limit:{' '}
                    {item.memberLimit === 0 ? 'Unlimited' : `${item.memberLimit || 1}u`} ·{' '}
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      onCopyLink(item.link);
                      setCopiedId(rowKey);
                      setTimeout(() => setCopiedId(null), 1500);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300 text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                  >
                    {copiedId === rowKey ? (
                      <Icons.Check size={11} className="text-emerald-500" />
                    ) : (
                      <Icons.Copy size={11} />
                    )}
                    <span>{copiedId === rowKey ? 'Copied' : 'Copy'}</span>
                  </button>

                  {status === 'active' ? (
                    <button
                      type="button"
                      onClick={() => handleRevoke(item)}
                      disabled={busyLink === item.link}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
                    >
                      {busyLink === item.link ? 'Revoking...' : 'Revoke'}
                    </button>
                  ) : (
                    item._id && (
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(item._id!)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                        title="Remove from history"
                      >
                        <Icons.Trash size={13} />
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            No {filter === 'all' ? '' : filter} invite links recorded yet. Open any batch to generate one.
          </div>
        )}
      </div>
    </section>
  );
};

export default ActiveLinksPanel;
