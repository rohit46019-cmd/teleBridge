import React, { useState, useEffect } from 'react';
import { TelegramGroup, AdminUser, AdminPermissions } from '../types.ts';
import { Icons } from '../constants.tsx';

interface AdminManagerProps {
  botToken: string;
  groups: TelegramGroup[];
  onShowNotification: (message: string, type?: 'success' | 'alert' | 'info') => void;
}

const DEFAULT_PERMISSIONS: AdminPermissions = {
  canDeleteMessages: true,
  canRestrictMembers: true,
  canInviteUsers: true,
  canPinMessages: true,
  canChangeInfo: false,
  canManageVideoChats: true,
  canManageTopics: true,
  canPromoteMembers: false,
};

export const AdminManager: React.FC<AdminManagerProps> = ({
  botToken,
  groups,
  onShowNotification,
}) => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);

  // Form Inputs
  const [userQuery, setUserQuery] = useState('');
  const [resolvedUserId, setResolvedUserId] = useState<number | null>(null);
  const [resolvedName, setResolvedName] = useState('');
  const [resolvedUsername, setResolvedUsername] = useState('');
  const [customTitle, setCustomTitle] = useState('Admin');
  const [isMasterAdmin, setIsMasterAdmin] = useState(true);
  const [groupScope, setGroupScope] = useState<'all' | 'custom'>('all');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<AdminPermissions>(DEFAULT_PERMISSIONS);
  const [showAdvancedPerms, setShowAdvancedPerms] = useState(false);

  // Resolution & Auto-suggest
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [userMatches, setUserMatches] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Actions Status
  const [isPromoting, setIsPromoting] = useState(false);
  const [isDemotingId, setIsDemotingId] = useState<number | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [actionReport, setActionReport] = useState<{
    type: 'promote' | 'demote';
    promotedCount?: number;
    demotedCount?: number;
    failedCount?: number;
    totalGroups?: number;
    results: any[];
  } | null>(null);
  const [expandedAdminId, setExpandedAdminId] = useState<number | null>(null);
  const [showHelpGuide, setShowHelpGuide] = useState(false);

  // Load admins on mount
  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setIsLoadingAdmins(true);
    try {
      const res = await fetch('/api/admins');
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (e) {
      console.error('Failed to fetch admins:', e);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  // Debounced user lookup
  useEffect(() => {
    const trimmed = userQuery.trim();
    if (!trimmed) {
      setUserMatches([]);
      setResolvedUserId(null);
      setResolvedName('');
      setResolvedUsername('');
      return;
    }

    const cleanInput = trimmed.replace(/^@/, '');
    if (/^\d{5,15}$/.test(cleanInput)) {
      setResolvedUserId(Number(cleanInput));
      if (!resolvedName) setResolvedName(`User ID ${cleanInput}`);
    }

    const timer = setTimeout(async () => {
      setIsSearchingUser(true);
      try {
        const res = await fetch(`/api/admin/resolve-user?query=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setUserMatches(data.matches || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Error resolving user:', err);
      } finally {
        setIsSearchingUser(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [userQuery]);

  const selectUserSuggestion = (match: any) => {
    setResolvedUserId(match.userId);
    setResolvedName(match.userName || `User ${match.userId}`);
    setResolvedUsername(match.username || '');
    setUserQuery(match.username ? `@${match.username}` : String(match.userId));
    setShowSuggestions(false);
    onShowNotification(`Selected user: ${match.userName || match.userId}`, 'info');
  };

  const toggleGroupSelection = (groupId: string) => {
    if (selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(selectedGroupIds.filter(id => id !== groupId));
    } else {
      setSelectedGroupIds([...selectedGroupIds, groupId]);
    }
  };

  const selectAllGroups = () => {
    setSelectedGroupIds(groups.map(g => g.id));
  };

  const deselectAllGroups = () => {
    setSelectedGroupIds([]);
  };

  const handlePromoteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!botToken) {
      onShowNotification('Please configure your Telegram Bot Token first in Bot Gateway!', 'alert');
      return;
    }

    let targetUserId = resolvedUserId;
    if (!targetUserId) {
      const cleanNum = userQuery.trim().replace(/^@/, '');
      if (/^\d{5,15}$/.test(cleanNum)) {
        targetUserId = Number(cleanNum);
      }
    }

    if (!targetUserId) {
      onShowNotification('Please enter a valid numeric User ID or select a recognized user from the list.', 'alert');
      return;
    }

    if (groupScope === 'custom' && selectedGroupIds.length === 0) {
      onShowNotification('Please select at least one group to promote this admin in.', 'alert');
      return;
    }

    setIsPromoting(true);
    setActionReport(null);

    try {
      const payload = {
        token: botToken,
        userId: targetUserId,
        username: resolvedUsername || userQuery.trim().replace(/^@/, ''),
        name: resolvedName || userQuery.trim(),
        customTitle: customTitle.trim() || 'Admin',
        groupScope,
        groupIds: groupScope === 'custom' ? selectedGroupIds : [],
        permissions,
        isMasterAdmin,
      };

      const res = await fetch('/api/admin/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Failed to promote admin');
      }

      setActionReport({
        type: 'promote',
        promotedCount: data.promotedCount,
        failedCount: data.failedCount,
        totalGroups: data.totalGroups,
        results: data.results || [],
      });

      if (data.promotedCount > 0) {
        onShowNotification(`🎉 Successfully promoted in ${data.promotedCount} group(s)!`, 'success');
      } else {
        onShowNotification(`Saved admin to database, but promotion failed in groups. Check Bot admin privileges.`, 'alert');
      }

      // Refresh list
      fetchAdmins();

      // Reset input form
      setUserQuery('');
      setResolvedUserId(null);
      setResolvedName('');
      setResolvedUsername('');
    } catch (err: any) {
      console.error('Error promoting admin:', err);
      onShowNotification(`Error: ${err.message || 'Could not complete promotion'}`, 'alert');
    } finally {
      setIsPromoting(false);
    }
  };

  const handleDemoteAdmin = async (admin: AdminUser) => {
    if (!botToken) {
      onShowNotification('Please configure your Telegram Bot Token in Settings first.', 'alert');
      return;
    }

    const confirm = window.confirm(`Are you sure you want to demote & remove admin "${admin.name || admin.userId}"? This will revoke admin rights across all synced groups.`);
    if (!confirm) return;

    setIsDemotingId(admin.userId);
    setActionReport(null);

    try {
      const res = await fetch('/api/admin/demote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: botToken,
          userId: admin.userId,
          groupScope: 'all',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to demote admin');

      setActionReport({
        type: 'demote',
        demotedCount: data.demotedCount,
        failedCount: data.failedCount,
        results: data.results || [],
      });

      onShowNotification(`Demoted and removed admin (${data.demotedCount} groups updated)`, 'success');
      fetchAdmins();
    } catch (err: any) {
      console.error('Error demoting admin:', err);
      onShowNotification(`Demote error: ${err.message}`, 'alert');
    } finally {
      setIsDemotingId(null);
    }
  };

  const filteredAdmins = admins.filter(a => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    return (
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.username && a.username.toLowerCase().includes(q)) ||
      String(a.userId).includes(q) ||
      (a.customTitle && a.customTitle.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-indigo-900/90 via-slate-900 to-slate-950 p-6 rounded-[2.5rem] border border-indigo-500/20 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Icons.Shield size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-1.5 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              <Icons.Shield size={12} /> Telegram Admin Authority
            </span>
            <button
              onClick={() => setShowHelpGuide(!showHelpGuide)}
              className="text-[9px] font-bold text-slate-300 hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-all cursor-pointer"
            >
              <Icons.HelpCircle size={12} /> {showHelpGuide ? 'Hide Guide' : 'How to find User ID'}
            </button>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white mb-1">
            Bot Admin Manager & Permissions
          </h2>
          <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
            Promote co-admins across all your Telegram groups automatically using your bot, or grant master authorization for bot commands like <code className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-[10px]">/approveall</code>.
          </p>
        </div>

        {showHelpGuide && (
          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-slate-200 bg-black/30 p-4 rounded-2xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="font-bold text-indigo-300">💡 How to find someone's Telegram User ID or Username:</p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
              <li><strong>Username:</strong> If the user has a public username (e.g. <code className="text-indigo-200">@username</code>), type it in the search box below.</li>
              <li><strong>Numeric User ID:</strong> Forward any message from the target user to <code className="text-indigo-200">@userinfobot</code> or <code className="text-indigo-200">@MissRose_bot</code> on Telegram to get their ID.</li>
              <li><strong>Join History:</strong> Anyone who joined your synced groups via this bot will automatically appear in auto-suggestions below!</li>
            </ul>
          </div>
        )}
      </div>

      {/* Add Admin Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Icons.UserPlus size={16} className="text-indigo-600 dark:text-indigo-400" />
              Add / Promote New Admin
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              Enter username or user ID to promote via bot
            </p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
            Bot Powered
          </span>
        </div>

        <form onSubmit={handlePromoteAdmin} className="space-y-5">
          {/* User Query Input with Auto-complete */}
          <div className="space-y-1.5 relative">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
              <span>Telegram Username or User ID <span className="text-rose-500">*</span></span>
              {resolvedUserId && (
                <span className="text-emerald-500 flex items-center gap-1 font-mono text-[9px] lowercase">
                  <Icons.CheckCircle size={10} /> ID: {resolvedUserId}
                </span>
              )}
            </label>

            <div className="relative">
              <input
                type="text"
                value={userQuery}
                onChange={e => setUserQuery(e.target.value)}
                onFocus={() => { if (userMatches.length > 0) setShowSuggestions(true); }}
                placeholder="e.g. @username or 6581298945"
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 pr-10 text-slate-900 dark:text-white"
                required
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {isSearchingUser ? (
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icons.Search size={14} className="text-slate-400" />
                )}
              </div>
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && userMatches.length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                <div className="p-2 text-[9px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  Recognized Users & Members ({userMatches.length})
                </div>
                {userMatches.map((match, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectUserSuggestion(match)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 last:border-0 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{match.userName || `User ${match.userId}`}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {match.username ? `@${match.username} • ` : ''}ID: {match.userId}
                      </p>
                    </div>
                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md">
                      Select
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Admin Title & Master Admin Flag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                <span>Custom Title (Group Tag)</span>
                <span className="text-[9px] text-slate-400">max 16 chars</span>
              </label>
              <input
                type="text"
                maxLength={16}
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="e.g. Admin, VIP Mod"
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Bot Master Privileges
              </label>
              <div 
                onClick={() => setIsMasterAdmin(!isMasterAdmin)}
                className={`flex items-center justify-between p-2.5 rounded-2xl border cursor-pointer transition-all ${isMasterAdmin ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'}`}
              >
                <div className="flex items-center gap-2">
                  <Icons.Crown size={14} className={isMasterAdmin ? 'text-amber-500' : 'text-slate-400'} />
                  <div>
                    <p className="text-[11px] font-bold text-slate-800 dark:text-white">Allow /approveall command</p>
                    <p className="text-[9px] text-slate-400 font-medium">Authorized for bot admin commands</p>
                  </div>
                </div>
                <div className={`w-8 h-4 rounded-full transition-all relative ${isMasterAdmin ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isMasterAdmin ? 'left-4.5' : 'left-0.5'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Group Scope Selector */}
          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Group Promotion Scope
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGroupScope('all')}
                className={`py-3 px-4 rounded-2xl border text-left flex items-center justify-between transition-all ${groupScope === 'all' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.01]' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                <div>
                  <p className="text-xs font-black">All Synced Hubs ({groups.length})</p>
                  <p className={`text-[9px] ${groupScope === 'all' ? 'text-indigo-100' : 'text-slate-400'}`}>Promote in every group</p>
                </div>
                <Icons.CheckCircle size={16} className={groupScope === 'all' ? 'text-white' : 'opacity-20'} />
              </button>

              <button
                type="button"
                onClick={() => setGroupScope('custom')}
                className={`py-3 px-4 rounded-2xl border text-left flex items-center justify-between transition-all ${groupScope === 'custom' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.01]' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                <div>
                  <p className="text-xs font-black">Selected Groups ({selectedGroupIds.length})</p>
                  <p className={`text-[9px] ${groupScope === 'custom' ? 'text-indigo-100' : 'text-slate-400'}`}>Pick specific targets</p>
                </div>
                <Icons.Users size={16} className={groupScope === 'custom' ? 'text-white' : 'opacity-20'} />
              </button>
            </div>

            {/* Custom group selector list */}
            {groupScope === 'custom' && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Select target groups</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={selectAllGroups} className="text-[9px] text-indigo-500 font-bold hover:underline">Select All</button>
                    <span className="text-slate-300">|</span>
                    <button type="button" onClick={deselectAllGroups} className="text-[9px] text-slate-400 font-bold hover:underline">Clear</button>
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {groups.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">No groups synced yet.</p>
                  ) : (
                    groups.map(g => (
                      <div
                        key={g.id}
                        onClick={() => toggleGroupSelection(g.id)}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-colors ${selectedGroupIds.includes(g.id) ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-bold' : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                      >
                        <span className="truncate pr-2">{g.name}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[9px] text-slate-400 font-mono">{g.memberCount} members</span>
                          {selectedGroupIds.includes(g.id) ? (
                            <Icons.CheckSquare size={14} className="text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <Icons.Square size={14} className="text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Permissions Accordion */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setShowAdvancedPerms(!showAdvancedPerms)}
              className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between w-full hover:text-slate-800 dark:hover:text-white py-1"
            >
              <span className="flex items-center gap-1.5">
                <Icons.ShieldCheck size={14} className="text-indigo-500" />
                Customize Telegram Admin Rights ({Object.values(permissions).filter(Boolean).length} Active)
              </span>
              <span className="text-indigo-500 font-bold">{showAdvancedPerms ? 'Hide Rights' : 'Configure'}</span>
            </button>

            {showAdvancedPerms && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                {[
                  { key: 'canDeleteMessages', label: 'Delete Messages', desc: 'Can remove spam & messages' },
                  { key: 'canRestrictMembers', label: 'Ban & Restrict Users', desc: 'Can mute or ban violators' },
                  { key: 'canInviteUsers', label: 'Invite Users via Link', desc: 'Can generate invite links' },
                  { key: 'canPinMessages', label: 'Pin Messages', desc: 'Can pin notice messages' },
                  { key: 'canManageVideoChats', label: 'Manage Video Chats', desc: 'Can start voice/video calls' },
                  { key: 'canManageTopics', label: 'Manage Forum Topics', desc: 'Can organize forum topics' },
                  { key: 'canChangeInfo', label: 'Change Group Info', desc: 'Can modify title & photo' },
                  { key: 'canPromoteMembers', label: 'Promote Other Admins', desc: 'Can assign new admins' },
                ].map(p => {
                  const active = (permissions as any)[p.key];
                  return (
                    <div
                      key={p.key}
                      onClick={() => setPermissions({ ...permissions, [p.key]: !active })}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${active ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800' : 'bg-transparent border-transparent opacity-60'}`}
                    >
                      <div className="pr-2">
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{p.label}</p>
                        <p className="text-[9px] text-slate-400">{p.desc}</p>
                      </div>
                      <div className={`w-7 h-4 rounded-full transition-all relative flex-shrink-0 ${active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${active ? 'left-3.5' : 'left-0.5'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPromoting || !userQuery.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest py-3.5 px-6 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPromoting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Promoting Admin via Telegram Bot...</span>
              </>
            ) : (
              <>
                <Icons.UserCheck size={16} />
                <span>Promote Admin via Bot</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Action Report Card */}
      {actionReport && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[2rem] shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
              <Icons.Activity size={14} className="text-indigo-500" />
              Promotion Execution Summary
            </h4>
            <button onClick={() => setActionReport(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <Icons.X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
              <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase">Success</p>
              <p className="text-base font-black text-emerald-700 dark:text-emerald-300">{actionReport.promotedCount ?? actionReport.demotedCount ?? 0} Hubs</p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200/60 dark:border-rose-800/40">
              <p className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase">Failed / Skipped</p>
              <p className="text-base font-black text-rose-700 dark:text-rose-300">{actionReport.failedCount || 0} Hubs</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
              <p className="text-[9px] font-black text-slate-400 uppercase">Total Target</p>
              <p className="text-base font-black text-slate-800 dark:text-slate-200">{actionReport.results.length} Hubs</p>
            </div>
          </div>

          {actionReport.results.some(r => !r.success) && (
            <div className="text-[10px] text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40">
              <p className="font-bold">Note on failed hubs:</p>
              <p className="text-[9px] text-rose-400">Ensure your Telegram bot is an Administrator with "Add New Admins" rights in those groups.</p>
            </div>
          )}
        </div>
      )}

      {/* Admins Directory List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Icons.Shield size={16} className="text-indigo-600 dark:text-indigo-400" />
              Registered Bot Admins ({admins.length})
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              Authorized administrators with bot & group controls
            </p>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Search admins..."
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 pr-8 text-slate-900 dark:text-white w-full sm:w-48"
            />
            <Icons.Search size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {isLoadingAdmins ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-bold">Loading administrators...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Icons.Shield size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Custom Admins Registered Yet</p>
            <p className="text-[10px] text-slate-400 max-w-sm mx-auto mt-1">
              Add your first admin above using their Telegram username or User ID to grant group management & bot authorization.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAdmins.map(admin => {
              const isExpanded = expandedAdminId === admin.userId;
              const isDemoting = isDemotingId === admin.userId;

              return (
                <div
                  key={admin.userId}
                  className="bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 p-4 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md flex-shrink-0">
                        {admin.username ? admin.username.charAt(0).toUpperCase() : (admin.name ? admin.name.charAt(0).toUpperCase() : 'A')}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {admin.name || `User ${admin.userId}`}
                          </h4>
                          {admin.customTitle && (
                            <span className="text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                              {admin.customTitle}
                            </span>
                          )}
                          {admin.isMasterAdmin && (
                            <span className="text-[8px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                              <Icons.Crown size={10} /> Master Bot
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                          {admin.username && <span>@{admin.username}</span>}
                          {admin.username && <span>•</span>}
                          <span>ID: {admin.userId}</span>
                          <span>•</span>
                          <span>{admin.groups?.includes('all') ? 'All Hubs' : `${admin.groups?.length || 0} Hubs`}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setExpandedAdminId(isExpanded ? null : admin.userId)}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                      >
                        {isExpanded ? 'Hide' : 'Details'}
                      </button>

                      <button
                        onClick={() => handleDemoteAdmin(admin)}
                        disabled={isDemoting}
                        className="text-[10px] font-bold text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-500 dark:bg-rose-950/40 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-900/40 px-2.5 py-1.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                        title="Demote across all groups & remove"
                      >
                        {isDemoting ? (
                          <div className="w-3 h-3 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Icons.Trash2 size={12} />
                        )}
                        <span>Demote</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-xs space-y-2 animate-in fade-in duration-150">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Delete Messages</p>
                          <p className={`text-[10px] font-bold ${admin.permissions?.canDeleteMessages ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {admin.permissions?.canDeleteMessages ? 'Enabled' : 'Disabled'}
                          </p>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Ban / Restrict</p>
                          <p className={`text-[10px] font-bold ${admin.permissions?.canRestrictMembers ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {admin.permissions?.canRestrictMembers ? 'Enabled' : 'Disabled'}
                          </p>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Invite Links</p>
                          <p className={`text-[10px] font-bold ${admin.permissions?.canInviteUsers ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {admin.permissions?.canInviteUsers ? 'Enabled' : 'Disabled'}
                          </p>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Pin Messages</p>
                          <p className={`text-[10px] font-bold ${admin.permissions?.canPinMessages ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {admin.permissions?.canPinMessages ? 'Enabled' : 'Disabled'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>Added on: {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}</span>
                        <span>Scope: {admin.groups?.includes('all') ? 'All Telegram Groups' : `${admin.groups?.length || 0} Specific Groups`}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
