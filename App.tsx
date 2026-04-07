import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar.tsx';
import GroupCard from './components/GroupCard.tsx';
import InviteModal from './components/InviteModal.tsx';
import ConfirmationModal from './components/ConfirmationModal.tsx';
import { Icons } from './constants.tsx';
import { TelegramGroup, JoinEvent } from './types.ts';
import { verifyBotToken, getChatDetails, TelegramBotInfo, getChatMemberCount, getRecentUpdates, kickChatMember } from './services/telegramService.ts';

// Add missing constant ROW_COLORS
const ROW_COLORS = [
  'bg-blue-500/10 border-blue-500/20 text-blue-600',
  'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
  'bg-rose-500/10 border-rose-500/20 text-rose-600',
  'bg-amber-500/10 border-amber-500/20 text-amber-600',
  'bg-purple-500/10 border-purple-500/20 text-purple-600',
];

const DEFAULT_TOKEN = '8357993008:AAGCcWUfCrRboCCnUS3N3kHS53PvAPIMwxs';
const DEFAULT_GROUPS: TelegramGroup[] = [
  { "id": "-1003698762401", "name": "GK & GS Brahmastra 4.0 Batch", "memberCount": 5, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003698762401/200", "lastInteraction": 1774102797184 },
  { "id": "-1003040206839", "name": "ɢᴀɢᴀɴ ᴘʀᴀᴛᴀᴘ", "memberCount": 19, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003040206839/200", "lastInteraction": 1774101136444 },
  { "id": "-1003339244700", "name": "🎯 Abhinay sir Math", "memberCount": 9, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003339244700/200", "lastInteraction": 1774015354790 },
  { "id": "-1003036147121", "name": "Aman Sir ENG ( Rec)", "memberCount": 21, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003036147121/200", "lastInteraction": 1773675480941 },
  { "id": "-1003865582010", "name": "Intense Maths Revision (IMR)", "memberCount": 4, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003865582010/200", "lastInteraction": 1773906201286 },
  { "id": "-1003114073401", "name": "Himanshi mam CDP", "memberCount": 6, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003114073401/200", "lastInteraction": 1774148078755 },
  { "id": "-1003612284793", "name": "PARMAR UP GK", "memberCount": 23, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003612284793/200", "lastInteraction": 1774068601367 },
  { "id": "-1003676915691", "name": "Amarnath sir Hindi", "memberCount": 6, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003676915691/200", "lastInteraction": 1770980589344 },
  { "id": "-1003225282870", "name": "Selection Way", "memberCount": 31, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003225282870/200", "lastInteraction": 1773385627192 },
  { "id": "-1003153087650", "name": "Parmar SSC 4.0 🔴Live", "memberCount": 481, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003153087650/200", "lastInteraction": 1775504736123 },
  { "id": "-1003736636212", "name": "Ultra Calculation", "memberCount": 5, "description": "Auto Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003736636212/200", "lastInteraction": 1773920218031 },
  { "id": "-1003732445402", "name": "RANI MAM 7.0", "memberCount": 79, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003732445402/200", "lastInteraction": 1774100397699 },
  { "id": "-1003360985096", "name": "Hindi Foundation Batch 2025 by khan sir", "memberCount": 6, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003360985096/200", "lastInteraction": 1770980272065 },
  { "id": "-1003067240220", "name": "𝗔𝗗𝗜𝗧𝗬𝗔 𝗦𝗜𝗥 3.0", "memberCount": 35, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003067240220/200", "lastInteraction": 1773975394503 },
  { "id": "-1003037426232", "name": "𝐕𝐈𝐊𝐑𝐀𝐌𝐉𝐄𝐄𝐓 𝐑𝐄𝐀𝐒𝐎𝐍𝐈𝐍𝐆 𝟑.𝟎", "memberCount": 8, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003037426232/200", "lastInteraction": 1771649376701 },
  { "id": "-1003767448478", "name": "E1 Coching", "memberCount": 5, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003767448478/200", "lastInteraction": 1770961968213 },
  { "id": "-1003636154961", "name": "Parmar 2.0 ENG", "memberCount": 9, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003636154961/200", "lastInteraction": 1773971217355 },
  { "id": "-1003565371067", "name": "RWA sanjeev sir Eng Live", "memberCount": 4, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003565371067/200", "lastInteraction": 1769822904677 },
  { "id": "-1003856954597", "name": "Nimisha mam", "memberCount": 41, "description": "Auto Discovered Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003856954597/200", "lastInteraction": 1775500553389 },
  { "id": "-1002793359066", "name": "Piyush Sir Reasoning", "memberCount": 74, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1002793359066/200", "lastInteraction": 1774110379993 },
  { "id": "-1003577096046", "name": "Math by Bhutesh sir", "memberCount": 11, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003577096046/200", "lastInteraction": 1774104429374 },
  { "id": "-1003012561565", "name": "Parmar 3.0", "memberCount": 29, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003012561565/200", "lastInteraction": 1774146437398 },
  { "id": "-1003419167658", "name": "🛑𝚁𝙰𝙽𝙸 𝙼𝙰𝙼 𝟼.𝟶", "memberCount": 23, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003419167658/200", "lastInteraction": 1772894197557 },
  { "id": "-1002661265147", "name": "Batch 1", "memberCount": 46, "description": "Auto Discovered Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1002661265147/200", "lastInteraction": 1775504589652 },
  { "id": "-1002986001803", "name": "rakesh yadav", "memberCount": 107, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1002986001803/200", "lastInteraction": 1773996390291 },
  { "id": "-1003790122016", "name": "Science magnet", "memberCount": 93, "description": "Auto Discovered Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003790122016/200", "lastInteraction": 1775500715439 },
  { "id": "-1003615370383", "name": "MATH MANIA", "memberCount": 9, "description": "Auto Discovered Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003615370383/200", "lastInteraction": 1775502355637 },
  { "id": "-1003839638841", "name": "Bhutesh sir math parmar ssc", "memberCount": 4, "description": "Auto Discovered Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003839638841/200", "lastInteraction": 1775504050623 }
];

const TABS = ['dashboard', 'groups', 'analysis', 'settings', 'debug'];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'dashboard';
  });
  const [selectedGroup, setSelectedGroup] = useState<TelegramGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [filterOption, setFilterOption] = useState<'mostMembers' | 'leastMembers' | 'frequent' | 'recent'>('recent');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  const [updates, setUpdates] = useState<any[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  
  const [token, setToken] = useState(localStorage.getItem('tg_bot_token') || DEFAULT_TOKEN);
  const [botInfo, setBotInfo] = useState<TelegramBotInfo | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLocked, setIsLocked] = useState(() => localStorage.getItem('tg_token_locked') !== 'false');
  const [groups, setGroups] = useState<TelegramGroup[]>(() => {
    const saved = localStorage.getItem('tg_groups');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [joinEvents, setJoinEvents] = useState<JoinEvent[]>([]);
  const [newChatId, setNewChatId] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  const [lastUpdateId, setLastUpdateId] = useState(() => Number(localStorage.getItem('tg_last_update_id')) || 0);
  const lastUpdateIdRef = useRef(lastUpdateId);
  const tabId = useRef(Math.random().toString(36).substring(7));
  const [isMaster, setIsMaster] = useState(false);

  useEffect(() => {
    lastUpdateIdRef.current = lastUpdateId;
  }, [lastUpdateId]);

  const [animationDirection, setAnimationDirection] = useState<'left' | 'right'>('right');
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [confirmationModalConfig, setConfirmationModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [groupsRes, eventsRes, broadcastsRes] = await Promise.all([
          fetch('/api/groups'),
          fetch('/api/events'),
          fetch('/api/broadcast')
        ]);
        
        if (groupsRes.ok) {
          const data = await groupsRes.json();
          // Fallback to DEFAULT_GROUPS only if DB is empty AND we don't have cached groups
          if (data && data.length > 0) {
            setGroups(data);
          } else if (groups.length === 0) {
            setGroups(DEFAULT_GROUPS);
          }
          
          // Trigger initial sync after we have groups
          const finalGroups = data && data.length > 0 ? data : (groups.length > 0 ? groups : DEFAULT_GROUPS);
          if (token) {
            handleVerify(token).then(() => {
              syncAllGroupsMemberCount(token, finalGroups);
            });
          }
        } else {
          // If fetch failed, keep using groups from localStorage (already in state)
          if (groups.length === 0) {
            setGroups(DEFAULT_GROUPS);
          }
        }
        
        if (eventsRes.ok) setJoinEvents(await eventsRes.json());
        if (broadcastsRes.ok) setBroadcasts(await broadcastsRes.json());
      } catch (error) {
        console.error("App: Failed to fetch initial data", error);
        setGroups(DEFAULT_GROUPS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let timeoutId: any;
    
    const poll = async () => {
      if (!token || !botInfo) return;

      // Tab locking: only one tab should poll
      const now = Date.now();
      const lastPoll = Number(localStorage.getItem('tg_last_poll_time') || 0);
      const masterTabId = localStorage.getItem('tg_master_tab_id');

      // If no master or master hasn't polled in 15s, try to become master
      if (!masterTabId || now - lastPoll > 15000 || masterTabId === tabId.current) {
        localStorage.setItem('tg_master_tab_id', tabId.current);
        localStorage.setItem('tg_last_poll_time', now.toString());
        setIsMaster(true);
        
        try {
          await discoverGroupsAndJoins(token);
        } catch (err: any) {
          if (err.message?.includes('Conflict')) {
            console.warn("Polling conflict: Another instance is running. This tab will wait.");
            setIsMaster(false);
          } else {
            console.error("Polling error", err);
          }
        }
      } else {
        setIsMaster(false);
      }

      timeoutId = setTimeout(poll, 10000);
    };

    if (token && botInfo) {
      poll();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (localStorage.getItem('tg_master_tab_id') === tabId.current) {
        localStorage.removeItem('tg_master_tab_id');
        localStorage.removeItem('tg_last_poll_time');
      }
    };
  }, [token, botInfo]);

  useEffect(() => {
    const newTotal = groups.reduce((sum, g) => sum + (g.memberCount || 0), 0);
    setTotalMembers(newTotal);
  }, [groups]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('tg_token_locked', isLocked.toString());
    localStorage.setItem('tg_last_update_id', lastUpdateId.toString());
    localStorage.setItem('tg_groups', JSON.stringify(groups));
  }, [isLocked, lastUpdateId, groups]);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const handleTabChange = (newTab: string) => {
    const currentIndex = TABS.indexOf(activeTab);
    const newIndex = TABS.indexOf(newTab);
    
    if (newIndex > currentIndex) {
      setAnimationDirection('right');
    } else if (newIndex < currentIndex) {
      setAnimationDirection('left');
    }
    
    if (currentIndex !== newIndex) {
      setActiveTab(newTab);
    }
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
  
    const horizontalDistance = touchStart.x - touchEnd.x;
    const verticalDistance = touchStart.y - touchEnd.y;
    const minSwipeDistance = 50;
  
    if (Math.abs(horizontalDistance) < minSwipeDistance || Math.abs(horizontalDistance) < Math.abs(verticalDistance)) {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
  
    const currentIndex = TABS.indexOf(activeTab);
    if (horizontalDistance > 0) { // Swipe Left
      const nextIndex = (currentIndex + 1) % TABS.length;
      handleTabChange(TABS[nextIndex]);
    } else { // Swipe Right
      const prevIndex = (currentIndex - 1 + TABS.length) % TABS.length;
      handleTabChange(TABS[prevIndex]);
    }
  
    setTouchStart(null);
    setTouchEnd(null);
  };

  const syncAllGroupsMemberCount = async (currentToken: string, groupsToSync?: TelegramGroup[]) => {
    const targetGroups = groupsToSync || groups;
    if (targetGroups.length === 0) return;
    
    try {
      const updatedGroups = await Promise.all(targetGroups.map(async (g) => {
        try {
          const count = await getChatMemberCount(currentToken, g.id);
          if (count !== g.memberCount) {
            const updatedGroup = { ...g, memberCount: count };
            // Persist to backend
            await fetch('/api/groups', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedGroup)
            });
            return updatedGroup;
          }
          return g;
        } catch (e) {
          return g;
        }
      }));
      setGroups(updatedGroups);
    } catch (e) {
      console.error("Global sync failed", e);
    }
  };

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  const handleVerify = async (testToken: string) => {
    if (!testToken) return;
    setIsVerifying(true);
    try {
      const info = await verifyBotToken(testToken);
      setBotInfo(info);
      setToken(testToken);
      localStorage.setItem('tg_bot_token', testToken);
      discoverGroupsAndJoins(testToken);
    } catch (err: any) {
      setBotInfo(null);
    } finally { setIsVerifying(false); }
  };

  const handleAddGroupManual = async () => {
    if (!token || !newChatId) return;

    const normalizedId = newChatId.startsWith('-100') ? newChatId : `-100${newChatId.replace(/^-/, '')}`;
    if (groups.some(g => g.id === newChatId || g.id === normalizedId)) {
      alert("This batch is already injected and saved in the database!");
      setNewChatId('');
      return;
    }

    setIsAddingGroup(true);
    try {
      const chat = await getChatDetails(token, newChatId);
      const count = await getChatMemberCount(token, newChatId);
      const newGroup: TelegramGroup = {
        id: chat.id.toString(),
        name: chat.title,
        memberCount: count,
        description: chat.description || 'Synced Hub',
        category: 'Telegram',
        image: `https://picsum.photos/seed/${chat.id}/200`,
        lastInteraction: Date.now()
      };
      await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroup)
      });
      setGroups(prev => [newGroup, ...prev.filter(g => g.id !== newGroup.id)]);
      setNewChatId('');
      alert("Batch successfully injected!");
    } catch (err: any) { alert(err.message); } finally { setIsAddingGroup(false); }
  };

  const discoverGroupsAndJoins = async (currentToken: string) => {
    if (!currentToken || isScanning) return;
    setIsScanning(true);
    try {
      const updates = await getRecentUpdates(currentToken, lastUpdateIdRef.current + 1);
      setUpdates(updates);
      const newJoins: JoinEvent[] = [];
      let maxId = lastUpdateIdRef.current;
      
      const memberChanges: Record<string, number> = {};
      const titleChanges: Record<string, string> = {};
      const newDiscoveredGroups: TelegramGroup[] = [];

      updates.forEach(u => {
        maxId = Math.max(maxId, u.update_id);

        if (u.message) {
          const chat = u.message.chat;
          if (chat && (chat.type === 'group' || chat.type === 'supergroup')) {
            newDiscoveredGroups.push({
              id: chat.id.toString(),
              name: chat.title || 'Unknown Group',
              memberCount: 0, // We don't know the count yet
              description: chat.description || 'Auto Discovered Hub',
              category: 'Telegram',
              image: `https://picsum.photos/seed/${chat.id}/200`,
              lastInteraction: Date.now()
            });
          }
        }

        if (u.my_chat_member) {
          const myMu = u.my_chat_member;
          const newStatus = myMu.new_chat_member?.status;
          if (['member', 'administrator'].includes(newStatus)) {
            const chat = myMu.chat;
            if (chat) {
              newDiscoveredGroups.push({
                id: chat.id.toString(),
                name: chat.title || 'Unknown Group',
                memberCount: 1,
                description: chat.description || 'Auto Discovered Hub',
                category: 'Telegram',
                image: `https://picsum.photos/seed/${chat.id}/200`,
                lastInteraction: Date.now()
              });
            }
          }
        }

        const mu = u.chat_member;
        
        if (mu && mu.chat) {
          const chatIdStr = mu.chat.id.toString();
          const oldStatus = mu.old_chat_member?.status;
          const newStatus = mu.new_chat_member?.status;

          const isMemberNow = ['member', 'administrator', 'creator'].includes(newStatus);
          const wasMemberBefore = ['member', 'administrator', 'creator'].includes(oldStatus);

          if (isMemberNow && !wasMemberBefore) {
            newJoins.push({
              userId: mu.new_chat_member.user.id,
              userName: mu.new_chat_member.user.first_name + (mu.new_chat_member.user.last_name ? ` ${mu.new_chat_member.user.last_name}` : ''),
              chatId: mu.chat.id,
              chatTitle: mu.chat.title,
              timestamp: mu.date ? mu.date * 1000 : Date.now()
            });
            memberChanges[chatIdStr] = (memberChanges[chatIdStr] || 0) + 1;
          } else if (!isMemberNow && wasMemberBefore) {
            memberChanges[chatIdStr] = (memberChanges[chatIdStr] || 0) - 1;
          }
        }

        if (u.message && u.message.new_chat_members) {
          const chatId = u.message.chat.id;
          const chatTitle = u.message.chat.title;
          const chatIdStr = chatId.toString();
          
          u.message.new_chat_members.forEach((newUser: any) => {
            newJoins.push({
              userId: newUser.id,
              userName: newUser.first_name + (newUser.last_name ? ` ${newUser.last_name}` : ''),
              chatId: chatId,
              chatTitle: chatTitle,
              timestamp: u.message.date ? u.message.date * 1000 : Date.now()
            });
          });
          memberChanges[chatIdStr] = (memberChanges[chatIdStr] || 0) + u.message.new_chat_members.length;
        }

        if (u.message && u.message.left_chat_member) {
          const chatIdStr = u.message.chat.id.toString();
          memberChanges[chatIdStr] = (memberChanges[chatIdStr] || 0) - 1;
        }

        if (u.message && u.message.new_chat_title) {
          const chatIdStr = u.message.chat.id.toString();
          titleChanges[chatIdStr] = u.message.new_chat_title;
        }
      });

      if (maxId > lastUpdateId) {
        setLastUpdateId(maxId);
        localStorage.setItem('tg_last_update_id', maxId.toString());
      }

      if (newDiscoveredGroups.length > 0) {
        const uniqueNewGroups = newDiscoveredGroups.filter(
          (newGroup, index, self) => index === self.findIndex((t) => t.id === newGroup.id)
        );

        if (uniqueNewGroups.length > 0) {
          await fetch('/api/groups/bulk-update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(uniqueNewGroups)
          });
          
          setGroups(prev => {
            const newGroups = [...prev];
            uniqueNewGroups.forEach(newGroup => {
              if (!newGroups.some(g => g.id === newGroup.id)) {
                newGroups.unshift(newGroup);
              }
            });
            return newGroups;
          });
        }
      }

      if (newJoins.length > 0) {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newJoins)
        });
        setJoinEvents(prev => {
          const combined = [...newJoins, ...prev];
          return combined.filter((v, i, a) => a.findIndex(t => t.userId === v.userId && t.timestamp === v.timestamp) === i).slice(0, 10000);
        });
      }

      if (Object.keys(memberChanges).length > 0 || Object.keys(titleChanges).length > 0) {
        let updatedGroupsToSave: TelegramGroup[] = [];
        setGroups(prevGroups => {
          const newGroups = prevGroups.map(g => {
            const hasMemberChange = memberChanges[g.id] !== undefined;
            const hasTitleChange = titleChanges[g.id] !== undefined;

            if (hasMemberChange || hasTitleChange) {
              const updatedGroup = { ...g };
              if (hasMemberChange) {
                updatedGroup.memberCount = Math.max(0, (g.memberCount || 0) + memberChanges[g.id]);
              }
              if (hasTitleChange) {
                updatedGroup.name = titleChanges[g.id];
              }
              updatedGroupsToSave.push(updatedGroup);
              return updatedGroup;
            }
            return g;
          });
          return newGroups;
        });
        if (updatedGroupsToSave.length > 0) {
          await fetch('/api/groups/bulk-update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedGroupsToSave)
          });
        }
      }

      setLastUpdateId(maxId);
    } catch (e: any) {
      console.error("Discovery error:", e);
      if (e.message?.includes('Conflict')) throw e;
    } finally { setIsScanning(false); }
  };

  const handleRequestKick = (joinEvent: JoinEvent) => {
    setConfirmationModalConfig({
      isOpen: true,
      title: `Confirm Removal`,
      message: `Are you sure you want to remove ${joinEvent.userName} from ${joinEvent.chatTitle}? This action cannot be undone.`,
      onConfirm: () => handleExecuteKick(joinEvent.chatId, joinEvent.userId, `${joinEvent.userId}-${joinEvent.timestamp}`),
    });
  };

  const handleExecuteKick = async (chatId: number, userId: number, eventId: string) => {
    setConfirmationModalConfig(prev => ({ ...prev, isOpen: false }));
    if (!token) return;
    try {
      await kickChatMember(token, chatId, userId);
      const timestamp = eventId.split('-')[1];
      await fetch(`/api/events/${userId}/${timestamp}`, { method: 'DELETE' });
      setJoinEvents(prev => prev.filter(e => `${e.userId}-${e.timestamp}` !== eventId));
      setGroups(prevGroups => prevGroups.map(g => {
        if (g.id === chatId.toString()) {
          return { ...g, memberCount: Math.max(0, (g.memberCount || 0) - 1) };
        }
        return g;
      }));
    } catch (err: any) { alert(`Operation failed: ${err.message}`); }
  };

  const handleGroupInteraction = async (groupId: string) => {
    try {
      await fetch(`/api/groups/${groupId}/interaction`, { method: 'PUT' });
      setGroups(prev => prev.map(g => 
        g.id === groupId ? { ...g, lastInteraction: Date.now() } : g
      ));
    } catch (err) {
      console.error("Failed to update interaction", err);
    }
  };

  const handleTogglePin = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    console.log(`[Pin] Toggling pin for group ${id}`);
    const updatedGroups = groups.map(g => g.id === id ? { ...g, pinned: !g.pinned } : g);
    setGroups(updatedGroups);
    const groupToUpdate = updatedGroups.find(g => g.id === id);
    if (!groupToUpdate) return;
    
    console.log(`[Pin] Saving updated group to DB:`, groupToUpdate);
    try {
      const res = await fetch('/api/groups/bulk-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([groupToUpdate]),
      });
      if (res.ok) {
        console.log(`[Pin] Successfully saved pin status to DB for ${id}`);
      } else {
        console.error(`[Pin] Failed to save pin status to DB for ${id}`);
      }
    } catch (err) {
      console.error("[Pin] Failed to update pin status", err);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.joinEvents) setJoinEvents(data.joinEvents);
        if (data.groups) setGroups(data.groups);
        if (data.token) {
          setToken(data.token);
          handleVerify(data.token);
        }
        alert('Data imported!');
      } catch (err) { alert('Import failed.'); }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleExport = () => {
    const data = { joinEvents, groups, token, theme };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telebridge-data-${selectedDate}.json`;
    a.click();
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage || !token) return;
    try {
      await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, message: broadcastMessage }),
      });
      alert("Broadcast successful!");
      setBroadcastMessage('');
      const res = await fetch('/api/broadcast');
      if (res.ok) setBroadcasts(await res.json());
    } catch (err: any) {
      alert(`Broadcast failed: ${err.message}`);
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/broadcast/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      alert("Broadcast deleted!");
      const res = await fetch('/api/broadcast');
      if (res.ok) setBroadcasts(await res.json());
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filteredJoins = useMemo(() => joinEvents.filter(e => new Date(e.timestamp).toLocaleDateString('en-CA') === selectedDate).sort((a, b) => b.timestamp - a.timestamp), [joinEvents, selectedDate]);
  const joinsTodayCount = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    return joinEvents.filter(e => {
      const eventDate = new Date(e.timestamp).toLocaleDateString('en-CA');
      return eventDate === today;
    }).length;
  }, [joinEvents]);

  const filteredGroups = useMemo(() => {
    let filtered = groups
      .filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()) || g.id.includes(searchQuery));
    
    switch (filterOption) {
      case 'mostMembers':
        filtered.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
        break;
      case 'leastMembers':
        filtered.sort((a, b) => (a.memberCount || 0) - (b.memberCount || 0));
        break;
      case 'frequent':
        filtered.sort((a, b) => (b.interactionCount || 0) - (a.interactionCount || 0));
        break;
      case 'recent':
        filtered.sort((a, b) => (b.lastInteraction || 0) - (a.lastInteraction || 0));
        break;
    }
    filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    return filtered;
  }, [groups, searchQuery, filterOption]);

  const formatTime12h = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  
  const animationClass = useMemo(() => {
    if (animationDirection === 'right') {
      return 'animate-in slide-in-from-right-8';
    }
    return 'animate-in slide-in-from-left-8';
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans transition-all duration-300">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-1 md:ml-64 p-4 pb-28 md:p-6 lg:p-8 pt-4 w-full max-w-[1400px] mx-auto overflow-hidden">
        <header className="flex flex-col gap-2 mb-4 animate-in slide-in-from-top">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-8 bg-blue-600 rounded-full shadow-[0_0_25px_rgba(37,99,235,0.7)]" />
              <h1 key={activeTab} className="text-2xl md:text-3xl font-black tracking-tighter capitalize animate-in fade-in">{activeTab}</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-90 transition-all">
                {theme === 'dark' ? <Icons.Sun size={18} className="text-amber-500" /> : <Icons.Moon size={18} className="text-blue-600" />}
              </button>
              <button onClick={() => syncAllGroupsMemberCount(token)} disabled={isScanning} className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg active:scale-90 transition-all">
                <Icons.Refresh size={18} className={isScanning ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </header>

        <div 
          className="relative min-h-[70vh]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {activeTab === 'dashboard' && (
            <div className={`space-y-6 ${animationClass}`}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                 <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-[2rem] border-b-4 border-indigo-800 shadow-[0_15px_30px_rgba(79,70,229,0.4)] transition-all hover:-translate-y-1 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm"><Icons.Home size={20} className="text-white" strokeWidth={3} /></div>
                    <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1 relative z-10">Batches</p>
                    <p className="text-3xl font-black text-white relative z-10">{groups.length}</p>
                 </div>
                 <div className="bg-gradient-to-br from-emerald-400 to-teal-600 p-5 rounded-[2rem] border-b-4 border-teal-800 shadow-[0_15px_30px_rgba(13,148,136,0.4)] transition-all hover:-translate-y-1 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm"><Icons.Users size={20} className="text-white" strokeWidth={3} /></div>
                    <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-1 relative z-10">Total Verified</p>
                    <p className="text-3xl font-black text-white relative z-10">{totalMembers.toLocaleString()}</p>
                 </div>
                 <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-5 rounded-[2rem] border-b-4 border-orange-700 shadow-[0_15px_30px_rgba(249,115,22,0.4)] transition-all hover:-translate-y-1 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm"><Icons.Activity size={20} className="text-white" strokeWidth={3} /></div>
                    <p className="text-[10px] font-black text-amber-50 uppercase tracking-widest mb-1 relative z-10">Joins Today</p>
                    <p className="text-3xl font-black text-white relative z-10">{joinsTodayCount}</p>
                 </div>
                 <div className="bg-gradient-to-br from-fuchsia-500 to-purple-600 p-5 rounded-[2rem] border-b-4 border-purple-800 shadow-[0_15px_30px_rgba(192,38,211,0.4)] transition-all hover:-translate-y-1 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm"><Icons.Zap size={20} className="text-white" strokeWidth={3} /></div>
                    <p className="text-[10px] font-black text-purple-100 uppercase tracking-widest mb-1 relative z-10">Status</p>
                    <p className="text-xl font-black text-white uppercase relative z-10">{botInfo ? 'ACTIVE' : 'OFFLINE'}</p>
                 </div>
              </div>
              <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-xl overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                 <h2 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-3">
                   <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                     <Icons.Zap size={20} />
                   </div>
                   Fast Batch Injection
                 </h2>
                 <div className="flex flex-col sm:flex-row gap-3">
                   <input type="text" placeholder="Enter Telegram Chat ID (-100...)" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-2xl text-xs font-mono outline-none focus:ring-4 focus:ring-blue-500/10 shadow-inner" value={newChatId} onChange={e => setNewChatId(e.target.value)} />
                   <button onClick={handleAddGroupManual} disabled={isAddingGroup || !newChatId} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50 transition-all">
                     {isAddingGroup ? 'Connecting...' : 'Inject Batch'}
                   </button>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'groups' && (
            <div className={`space-y-6 ${animationClass}`}>
               <div className="relative group flex gap-2">
                <div className="relative flex-1">
                  <Icons.Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search active batches..." 
                    className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 pl-10 pr-10 py-3 rounded-2xl text-xs outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all" 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    onFocus={() => setShowRecentSearches(true)}
                    onBlur={() => setTimeout(() => setShowRecentSearches(false), 200)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        setRecentSearches(prev => [searchQuery.trim(), ...prev.filter(s => s !== searchQuery.trim())].slice(0, 10));
                        setShowRecentSearches(false);
                      }
                    }}
                  />
                  {showRecentSearches && recentSearches.length > 0 && (
                    <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 py-2">
                      <p className="px-4 py-1 text-[9px] font-black text-slate-400 uppercase">Recent Searches</p>
                      {recentSearches.map((s, i) => (
                        <button key={i} onClick={() => { setSearchQuery(s); setShowRecentSearches(false); }} className="w-full text-left px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      <Icons.X size={14} />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <button onClick={() => setShowFilterMenu(!showFilterMenu)} className="p-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                    <Icons.Filter size={18} className="text-slate-600 dark:text-slate-400" />
                  </button>
                  {showFilterMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 py-2">
                      {['recent', 'frequent', 'mostMembers', 'leastMembers'].map(option => (
                        <button key={option} onClick={() => { setFilterOption(option as any); setShowFilterMenu(false); }} className={`w-full text-left px-4 py-2 text-xs font-bold capitalize ${filterOption === option ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-600 dark:text-slate-400'}`}>
                          {option.replace(/([A-Z])/g, ' $1')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Icons.Loader size={32} className="animate-spin mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest">Loading Batches...</p>
                  </div>
                ) : filteredGroups.length > 0 ? (
                  filteredGroups.map(g => (
                    <GroupCard key={g.id} group={g} onClick={() => setSelectedGroup(g)} onTogglePin={handleTogglePin} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50 dark:bg-slate-900/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <Icons.Search size={32} className="mb-4 opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest">No batches found</p>
                    <p className="text-[10px] mt-1 opacity-60">Try a different search or add a new batch</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className={`space-y-6 ${animationClass}`}>
              <div className="flex flex-col md:flex-row gap-4">
                 <div className="flex-1 bg-indigo-600 p-6 rounded-[2.5rem] border-b-4 border-indigo-900 shadow-xl text-white relative overflow-hidden active:scale-95 transition-transform">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">Total Joined ({selectedDate})</p>
                    <p className="text-4xl font-black">{filteredJoins.length}</p>
                    <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full" />
                 </div>
                 <div className="flex-1 bg-rose-500 p-6 rounded-[2.5rem] border-b-4 border-rose-800 shadow-xl text-white relative overflow-hidden active:scale-95 transition-transform">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">Live Audit</p>
                    <p className="text-4xl font-black">{isScanning ? 'SYNCING...' : 'ACTIVE'}</p>
                    <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full" />
                 </div>
                 <div className="bg-slate-900 p-6 rounded-[2.5rem] border-b-4 border-black shadow-xl flex flex-col justify-center min-w-[220px]">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Window Selector</p>
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-white/5 border-none text-white text-xs font-black uppercase outline-none rounded-xl p-2 w-full" />
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                 <div className="overflow-y-auto max-h-[55vh] custom-scrollbar">
                   <table className="w-full text-left">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 backdrop-blur-md z-10">
                        <tr>
                          <th className="px-1 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">SL</th>
                          <th className="px-1 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                          <th className="px-1 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Target</th>
                          <th className="px-1 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                          <th className="px-1 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredJoins.map((e, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="px-1 py-2 text-[9px] font-mono text-slate-500 text-center">{idx + 1}</td>
                            <td className="px-1 py-2">
                               <div className={`inline-flex items-center px-1.5 py-0.5 rounded-full border ${ROW_COLORS[idx % ROW_COLORS.length]} font-black text-[8px] uppercase`}>
                                 {e.userName.substring(0, 8)}
                               </div>
                            </td>
                            <td className="px-1 py-2 text-[8px] font-bold text-slate-500 truncate max-w-[80px]">{e.chatTitle.substring(0, 12)}</td>
                            <td className="px-1 py-2 text-[8px] font-mono text-slate-400">{formatTime12h(e.timestamp).replace(' ', '')}</td>
                            <td className="px-1 py-2 text-right">
                              <button onClick={() => handleRequestKick(e)} className="p-0.5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-md transition-all"><Icons.Trash size={12}/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'debug' && (
            <div className={`space-y-6 ${animationClass}`}>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                <h2 className="text-lg font-black uppercase tracking-tight mb-4">Recent Telegram Updates</h2>
                <pre className="text-xs font-mono bg-slate-100 dark:bg-slate-950 p-4 rounded-xl overflow-x-auto max-h-[60vh]">
                  {JSON.stringify(updates, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className={`max-w-xl space-y-6 ${animationClass}`}>
               <div className="bg-indigo-700/10 p-8 rounded-[3rem] border-2 border-indigo-500/20 shadow-xl">
                  <h3 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                    <Icons.Zap size={14} /> Bot Gateway
                  </h3>
                  <input type="password" value={token} onChange={e => setToken(e.target.value)} disabled={isLocked} className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 px-6 py-4 rounded-2xl text-slate-900 dark:text-white font-mono text-xs outline-none focus:ring-4 focus:ring-indigo-500/20 mb-4 transition-all" />
                  <div className="flex gap-2 mb-6">
                    <button onClick={() => handleVerify(token)} className="flex-1 py-4 bg-indigo-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl hover:bg-indigo-500 active:scale-95 transition-all">Sync Connection</button>
                    <button onClick={() => setIsLocked(!isLocked)} className="px-6 py-4 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">{isLocked ? 'Unlock' : 'Lock'}</button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-slate-200 dark:border-slate-800 pt-6">
                    <button onClick={handleExport} className="flex flex-col items-center justify-center gap-2 p-5 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all">
                      <Icons.DownloadCloud size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Export Data</span>
                    </button>
                    <button onClick={() => importFileRef.current?.click()} className="flex flex-col items-center justify-center gap-2 p-5 bg-emerald-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all">
                      <Icons.UploadCloud size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Import Data</span>
                    </button>
                    <input type="file" ref={importFileRef} onChange={handleImport} accept=".json" className="hidden" />
                  </div>

                  <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Broadcast to All Hubs</h4>
                    <textarea 
                      placeholder="Enter broadcast message..." 
                      className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 px-6 py-4 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-4 focus:ring-indigo-500/20 mb-4 transition-all"
                      rows={3}
                      value={broadcastMessage}
                      onChange={e => setBroadcastMessage(e.target.value)}
                    />
                    <button 
                      onClick={handleBroadcast}
                      disabled={!broadcastMessage || !token}
                      className="w-full py-4 bg-rose-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl hover:bg-rose-500 active:scale-95 transition-all disabled:opacity-50"
                    >
                      Broadcast Message
                    </button>
                  </div>

                  <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Broadcast History</h4>
                    <div className="space-y-3">
                      {broadcasts.map(b => (
                        <div key={b._id} className="bg-white dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
                          <div className="flex-1 min-w-0 mr-4">
                            <p className="text-xs text-slate-900 dark:text-white truncate">{b.message}</p>
                            <p className="text-[9px] text-slate-500">{new Date(b.timestamp).toLocaleString()}</p>
                          </div>
                          <button onClick={() => handleDeleteBroadcast(b._id)} className="p-2 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all">
                            <Icons.Trash size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {selectedGroup && (
        <InviteModal group={selectedGroup} onClose={() => setSelectedGroup(null)} botToken={token} onInteraction={() => handleGroupInteraction(selectedGroup.id)} />
      )}

      {confirmationModalConfig.isOpen && (
        <ConfirmationModal
          title={confirmationModalConfig.title}
          message={confirmationModalConfig.message}
          onConfirm={confirmationModalConfig.onConfirm}
          onClose={() => setConfirmationModalConfig(prev => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
};

export default App;