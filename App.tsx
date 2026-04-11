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

/**
 * Normalizes "fancy" Unicode fonts (Mathematical Alphanumeric Symbols) to plain ASCII.
 * This handles common Telegram styles like Bold, Italic, Script, etc.
 */
const normalizeText = (text: string): string => {
  if (!text) return '';
  
  // 1. Standard Unicode Normalization (handles accents/diacritics)
  let normalized = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

  // 2. Map Mathematical Alphanumeric Symbols (U+1D400 - U+1D7FF)
  // This is a simplified mapping for the most common "fancy" styles
  const result = [];
  for (const char of normalized) {
    const code = char.codePointAt(0);
    if (!code) {
      result.push(char);
      continue;
    }

    let mapped = char;

    // A-Z mappings
    if (code >= 0x1D400 && code <= 0x1D7FF) {
      // Mathematical Bold, Italic, Script, Fraktur, Double-struck, Sans-serif, Monospace
      // Most of these are organized in blocks of 26
      // We can find the offset relative to 'A' (65)
      
      // Bold A-Z (1D400-1D419)
      if (code >= 0x1D400 && code <= 0x1D419) mapped = String.fromCharCode(65 + (code - 0x1D400));
      // Italic A-Z (1D434-1D44D)
      else if (code >= 0x1D434 && code <= 0x1D44D) mapped = String.fromCharCode(65 + (code - 0x1D434));
      // Bold Italic A-Z (1D468-1D481)
      else if (code >= 0x1D468 && code <= 0x1D481) mapped = String.fromCharCode(65 + (code - 0x1D468));
      // Script A-Z (1D49C-1D4B5)
      else if (code >= 0x1D49C && code <= 0x1D4B5) mapped = String.fromCharCode(65 + (code - 0x1D49C));
      // Bold Script A-Z (1D4D0-1D4E9)
      else if (code >= 0x1D4D0 && code <= 0x1D4E9) mapped = String.fromCharCode(65 + (code - 0x1D4D0));
      // Fraktur A-Z (1D504-1D51D)
      else if (code >= 0x1D504 && code <= 0x1D51D) mapped = String.fromCharCode(65 + (code - 0x1D504));
      // Double-struck A-Z (1D538-1D551)
      else if (code >= 0x1D538 && code <= 0x1D551) mapped = String.fromCharCode(65 + (code - 0x1D551)); // Wait, offset check
      // Sans-serif A-Z (1D5A0-1D5B9)
      else if (code >= 0x1D5A0 && code <= 0x1D5B9) mapped = String.fromCharCode(65 + (code - 0x1D5A0));
      // Sans-serif Bold A-Z (1D5D4-1D5ED)
      else if (code >= 0x1D5D4 && code <= 0x1D5ED) mapped = String.fromCharCode(65 + (code - 0x1D5D4));
      // Sans-serif Italic A-Z (1D608-1D621)
      else if (code >= 0x1D608 && code <= 0x1D621) mapped = String.fromCharCode(65 + (code - 0x1D608));
      // Sans-serif Bold Italic A-Z (1D63C-1D655)
      else if (code >= 0x1D63C && code <= 0x1D655) mapped = String.fromCharCode(65 + (code - 0x1D63C));
      // Monospace A-Z (1D670-1D689)
      else if (code >= 0x1D670 && code <= 0x1D689) mapped = String.fromCharCode(65 + (code - 0x1D670));
    }
    
    // a-z mappings
    if (code >= 0x1D41A && code <= 0x1D7FF) {
      // Bold a-z (1D41A-1D433)
      if (code >= 0x1D41A && code <= 0x1D433) mapped = String.fromCharCode(97 + (code - 0x1D41A));
      // Italic a-z (1D44E-1D467)
      else if (code >= 0x1D44E && code <= 0x1D467) mapped = String.fromCharCode(97 + (code - 0x1D44E));
      // Bold Italic a-z (1D482-1D49B)
      else if (code >= 0x1D482 && code <= 0x1D49B) mapped = String.fromCharCode(97 + (code - 0x1D482));
      // Script a-z (1D4B6-1D4CF)
      else if (code >= 0x1D4B6 && code <= 0x1D4CF) mapped = String.fromCharCode(97 + (code - 0x1D4B6));
      // Bold Script a-z (1D4EA-1D503)
      else if (code >= 0x1D4EA && code <= 0x1D503) mapped = String.fromCharCode(97 + (code - 0x1D4EA));
      // Fraktur a-z (1D51E-1D537)
      else if (code >= 0x1D51E && code <= 0x1D537) mapped = String.fromCharCode(97 + (code - 0x1D51E));
      // Double-struck a-z (1D552-1D56B)
      else if (code >= 0x1D552 && code <= 0x1D56B) mapped = String.fromCharCode(97 + (code - 0x1D552));
      // Sans-serif a-z (1D5BA-1D5D3)
      else if (code >= 0x1D5BA && code <= 0x1D5D3) mapped = String.fromCharCode(97 + (code - 0x1D5BA));
      // Sans-serif Bold a-z (1D5EE-1D607)
      else if (code >= 0x1D5EE && code <= 0x1D607) mapped = String.fromCharCode(97 + (code - 0x1D5EE));
      // Sans-serif Italic a-z (1D622-1D63B)
      else if (code >= 0x1D622 && code <= 0x1D63B) mapped = String.fromCharCode(97 + (code - 0x1D622));
      // Sans-serif Bold Italic a-z (1D656-1D66F)
      else if (code >= 0x1D656 && code <= 0x1D66F) mapped = String.fromCharCode(97 + (code - 0x1D656));
      // Monospace a-z (1D68A-1D6A3)
      else if (code >= 0x1D68A && code <= 0x1D6A3) mapped = String.fromCharCode(97 + (code - 0x1D68A));
    }

    // Numbers 0-9
    if (code >= 0x1D7CE && code <= 0x1D7FF) {
      // Bold (1D7CE-1D7D7), Double-struck (1D7D8-1D7E1), Sans-serif (1D7E2-1D7EB), etc.
      if (code >= 0x1D7CE && code <= 0x1D7D7) mapped = String.fromCharCode(48 + (code - 0x1D7CE));
      else if (code >= 0x1D7D8 && code <= 0x1D7E1) mapped = String.fromCharCode(48 + (code - 0x1D7D8));
      else if (code >= 0x1D7E2 && code <= 0x1D7EB) mapped = String.fromCharCode(48 + (code - 0x1D7E2));
      else if (code >= 0x1D7EC && code <= 0x1D7F5) mapped = String.fromCharCode(48 + (code - 0x1D7EC));
      else if (code >= 0x1D7F6 && code <= 0x1D7FF) mapped = String.fromCharCode(48 + (code - 0x1D7F6));
    }

    // Handling Small Caps and other common Telegram styles
    // Small Caps A-Z (approximate mapping)
    const smallCapsMap: Record<string, string> = {
      'ᴀ': 'a', 'ʙ': 'b', 'ᴄ': 'c', 'ᴅ': 'd', 'ᴇ': 'e', 'ғ': 'f', 'ɢ': 'g', 'ʜ': 'h', 'ɪ': 'i', 'ᴊ': 'j', 'ᴋ': 'k', 'ʟ': 'l', 'ᴍ': 'm', 'ɴ': 'n', 'ᴏ': 'o', 'ᴘ': 'p', 'ǫ': 'q', 'ʀ': 'r', 's': 's', 'ᴛ': 't', 'ᴜ': 'u', 'ᴠ': 'v', 'ᴡ': 'w', 'x': 'x', 'ʏ': 'y', 'ᴢ': 'z'
    };
    if (smallCapsMap[char]) mapped = smallCapsMap[char];

    result.push(mapped);
  }

  return result.join('').toLowerCase();
};

const DEFAULT_TOKEN = '8357993008:AAGCcWUfCrRboCCnUS3N3kHS53PvAPIMwxs';
const DEFAULT_GROUPS: TelegramGroup[] = [
  { "id": "-1003698762401", "name": "GK & GS Brahmastra 4.0 Batch", "memberCount": 5, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003698762401/100", "lastInteraction": 1774102797184 },
  { "id": "-1003040206839", "name": "ɢᴀɢᴀɴ ᴘʀᴀᴛᴀᴘ", "memberCount": 19, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003040206839/100", "lastInteraction": 1774101136444 },
  { "id": "-1003339244700", "name": "🎯 Abhinay sir Math", "memberCount": 9, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003339244700/100", "lastInteraction": 1774015354790 },
  { "id": "-1003036147121", "name": "Aman Sir ENG ( Rec)", "memberCount": 21, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003036147121/100", "lastInteraction": 1773675480941 },
  { "id": "-1003865582010", "name": "Intense Maths Revision (IMR)", "memberCount": 4, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003865582010/100", "lastInteraction": 1773906201286 },
  { "id": "-1003114073401", "name": "Himanshi mam CDP", "memberCount": 6, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003114073401/100", "lastInteraction": 1774148078755 },
  { "id": "-1003612284793", "name": "PARMAR UP GK", "memberCount": 23, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003612284793/100", "lastInteraction": 1774068601367 },
  { "id": "-1003676915691", "name": "Amarnath sir Hindi", "memberCount": 6, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003676915691/100", "lastInteraction": 1770980589344 },
  { "id": "-1003225282870", "name": "Selection Way", "memberCount": 31, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003225282870/100", "lastInteraction": 1773385627192 },
  { "id": "-1003153087650", "name": "Parmar SSC 4.0 🔴Live", "memberCount": 481, "description": "Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003153087650/100", "lastInteraction": 1775504736123 },
  { "id": "-1003736636212", "name": "Ultra Calculation", "memberCount": 5, "description": "Auto Synced Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003736636212/100", "lastInteraction": 1773920218031 },
  { "id": "-1003732445402", "name": "RANI MAM 7.0", "memberCount": 79, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003732445402/100", "lastInteraction": 1774100397699 },
  { "id": "-1003360985096", "name": "Hindi Foundation Batch 2025 by khan sir", "memberCount": 6, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003360985096/100", "lastInteraction": 1770980272065 },
  { "id": "-1003067240220", "name": "𝗔𝗗𝗜𝗧𝗬𝗔 𝗦𝗜𝗥 3.0", "memberCount": 35, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003067240220/100", "lastInteraction": 1773975394503 },
  { "id": "-1003037426232", "name": "𝐕𝐈𝐊𝐑𝐀𝐌𝐉𝐄𝐄𝐓 𝐑𝐄𝐀𝐒𝐎𝐍𝐈𝐍𝐆 𝟑.𝟎", "memberCount": 8, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003037426232/100", "lastInteraction": 1771649376701 },
  { "id": "-1003767448478", "name": "E1 Coching", "memberCount": 5, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003767448478/100", "lastInteraction": 1770961968213 },
  { "id": "-1003636154961", "name": "Parmar 2.0 ENG", "memberCount": 9, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003636154961/100", "lastInteraction": 1773971217355 },
  { "id": "-1003565371067", "name": "RWA sanjeev sir Eng Live", "memberCount": 4, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003565371067/100", "lastInteraction": 1769822904677 },
  { "id": "-1003856954597", "name": "Nimisha mam", "memberCount": 41, "description": "Auto Discovered Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003856954597/100", "lastInteraction": 1775500553389 },
  { "id": "-1002793359066", "name": "Piyush Sir Reasoning", "memberCount": 74, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1002793359066/100", "lastInteraction": 1774110379993 },
  { "id": "-1003577096046", "name": "Math by Bhutesh sir", "memberCount": 11, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003577096046/100", "lastInteraction": 1774104429374 },
  { "id": "-1003012561565", "name": "Parmar 3.0", "memberCount": 29, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003012561565/100", "lastInteraction": 1774146437398 },
  { "id": "-1003419167658", "name": "🛑𝚁𝙰𝙽𝙸 𝙼𝙰𝙼 𝟼.𝟶", "memberCount": 23, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1003419167658/100", "lastInteraction": 1772894197557 },
  { "id": "-1002661265147", "name": "Batch 1", "memberCount": 46, "description": "Auto Discovered Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1002661265147/100", "lastInteraction": 1775504589652 },
  { "id": "-1002986001803", "name": "rakesh yadav", "memberCount": 107, "description": "Synced Group", "category": "Telegram", "image": "https://picsum.photos/seed/-1002986001803/100", "lastInteraction": 1773996390291 },
  { "id": "-1003790122016", "name": "Science magnet", "memberCount": 93, "description": "Auto Discovered Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003790122016/100", "lastInteraction": 1775500715439 },
  { "id": "-1003615370383", "name": "MATH MANIA", "memberCount": 9, "description": "Auto Discovered Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003615370383/100", "lastInteraction": 1775502355637 },
  { "id": "-1003839638841", "name": "Bhutesh sir math parmar ssc", "memberCount": 4, "description": "Auto Discovered Hub", "category": "Telegram", "image": "https://picsum.photos/seed/-1003839638841/100", "lastInteraction": 1775504050623 }
];

const TABS = ['dashboard', 'groups', 'analysis', 'settings', 'debug'];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'dashboard';
  });
  const [selectedGroup, setSelectedGroup] = useState<TelegramGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
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
  const [joinEvents, setJoinEvents] = useState<JoinEvent[]>(() => {
    const saved = localStorage.getItem('tg_join_events');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [pendingJoins, setPendingJoins] = useState<JoinEvent[]>(() => {
    const saved = localStorage.getItem('tg_pending_joins');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [pendingGroups, setPendingGroups] = useState<TelegramGroup[]>(() => {
    const saved = localStorage.getItem('tg_pending_groups');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [newChatId, setNewChatId] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcasts, setBroadcasts] = useState<any[]>(() => {
    const saved = localStorage.getItem('tg_broadcasts');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'error' | 'syncing'>('syncing');
  const [dbError, setDbError] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [swStatus, setSwStatus] = useState<'loading' | 'registered' | 'failed'>('loading');
  const [isInIframe, setIsInIframe] = useState(false);
  const [totalMembers, setTotalMembers] = useState(0);
  const [lastUpdateId, setLastUpdateId] = useState(() => Number(localStorage.getItem('tg_last_update_id')) || 0);
  const lastUpdateIdRef = useRef(lastUpdateId);
  const tabId = useRef(Math.random().toString(36).substring(7));
  const [isMaster, setIsMaster] = useState(false);

  useEffect(() => {
    lastUpdateIdRef.current = lastUpdateId;
  }, [lastUpdateId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem('tg_pending_joins', JSON.stringify(pendingJoins));
  }, [pendingJoins]);

  useEffect(() => {
    localStorage.setItem('tg_pending_groups', JSON.stringify(pendingGroups));
  }, [pendingGroups]);

  useEffect(() => {
    localStorage.setItem('tg_join_events', JSON.stringify(joinEvents));
  }, [joinEvents]);

  useEffect(() => {
    localStorage.setItem('tg_broadcasts', JSON.stringify(broadcasts));
  }, [broadcasts]);

  useEffect(() => {
    setIsInIframe(window.self !== window.top);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => setSwStatus('registered')).catch(() => setSwStatus('failed'));
    } else {
      setSwStatus('failed');
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleShareApp = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'TeleBridge Pro',
        text: 'Manage your Telegram groups and hubs with TeleBridge Pro!',
        url: url,
      }).catch(() => {
        navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
      });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

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
  const [syncRetryCount, setSyncRetryCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setSyncStatus('syncing');
      
      // Initial local data is already loaded from state initializers
      const localGroups = groups;
      const localEvents = joinEvents;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); 

        const [groupsRes, eventsRes] = await Promise.all([
          fetch('/api/groups', { signal: controller.signal }),
          fetch('/api/events', { signal: controller.signal })
        ]);
        
        clearTimeout(timeoutId);

        if (groupsRes.ok) {
          const serverGroups: TelegramGroup[] = await groupsRes.json();
          
          // Merge Strategy: Use server data as truth, but preserve local groups not on server
          // and use newer timestamps if available
          setGroups(prev => {
            const merged = [...serverGroups];
            prev.forEach(localG => {
              const serverG = merged.find(sg => sg.id === localG.id);
              if (!serverG) {
                // Local only group (maybe created offline), keep it
                merged.push(localG);
              } else {
                // Compare timestamps if available
                if ((localG.lastInteraction || 0) > (serverG.lastInteraction || 0)) {
                  // Local is newer, keep local version for now
                  const idx = merged.findIndex(sg => sg.id === localG.id);
                  merged[idx] = localG;
                }
              }
            });
            return merged;
          });
          
          setSyncStatus('connected');
          setDbError(null);
          setLastSyncTime(new Date());
        }

        if (eventsRes.ok) {
          const serverEvents: JoinEvent[] = await eventsRes.json();
          setJoinEvents(prev => {
            // Merge events by timestamp and userId to avoid duplicates
            const combined = [...serverEvents, ...prev];
            return combined.filter((v, i, a) => 
              a.findIndex(t => t.userId === v.userId && t.timestamp === v.timestamp) === i
            ).sort((a, b) => b.timestamp - a.timestamp).slice(0, 10000);
          });
        }
      } catch (err: any) {
        console.error("Initial fetch error:", err);
        // If fetch fails, we stay in 'error' or 'syncing' status but keep using local data
        setSyncStatus('error');
        
        const isNetworkError = err.name === 'AbortError' || err.message?.includes('Failed to fetch') || err.message?.includes('timeout');
        setDbError(isNetworkError ? 'Slow network: Using local data' : 'Sync failed');
        
        if (syncRetryCount < 3) {
          setTimeout(() => setSyncRetryCount(prev => prev + 1), 10000);
        }
      } finally {
        if (token) {
          handleVerify(token).then(() => {
            syncAllGroupsMemberCount(token, groups);
          });
        }
      }
    };

    fetchData();
  }, [syncRetryCount]);

  useEffect(() => {
    let timeoutId: any;
    
    const poll = async () => {
      if (!token || !botInfo) return;

      // Tab locking: only one tab should poll
      const now = Date.now();
      const lastPoll = Number(localStorage.getItem('tg_last_poll_time') || 0);
      const masterTabId = localStorage.getItem('tg_master_tab_id');

      // If no master or master hasn't polled in 25s, try to become master
      // We use 25s to give plenty of buffer for network delays
      const isMasterExpired = !masterTabId || (now - lastPoll > 25000);
      const isMeMaster = masterTabId === tabId.current;

      if (isMeMaster || isMasterExpired) {
        // If we are trying to become master, add a small random delay to prevent race conditions
        if (!isMeMaster) {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
          // Re-check after delay
          const currentMaster = localStorage.getItem('tg_master_tab_id');
          const currentLastPoll = Number(localStorage.getItem('tg_last_poll_time') || 0);
          if (currentMaster && currentMaster !== tabId.current && (Date.now() - currentLastPoll < 25000)) {
            setIsMaster(false);
            timeoutId = setTimeout(poll, 10000);
            return;
          }
        }

        localStorage.setItem('tg_master_tab_id', tabId.current);
        localStorage.setItem('tg_last_poll_time', Date.now().toString());
        setIsMaster(true);
        
        try {
          await discoverGroupsAndJoins(token);
          // Update poll time after successful scan
          localStorage.setItem('tg_last_poll_time', Date.now().toString());
        } catch (err: any) {
          if (err.message?.includes('Conflict')) {
            console.warn("Polling conflict detected. Another instance is active. Backing off...");
            setIsMaster(false);
            // If conflict, wait longer before next attempt
            timeoutId = setTimeout(poll, 30000);
            return;
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
      if (timeoutId) clearTimeout(timeoutId);
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

  // Background sync worker for pending changes
  useEffect(() => {
    if (syncStatus !== 'connected' || (pendingJoins.length === 0 && pendingGroups.length === 0)) return;

    const syncPending = async () => {
      if (pendingJoins.length > 0) {
        try {
          const res = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pendingJoins)
          });
          if (res.ok) setPendingJoins([]);
        } catch (e) {
          console.warn("Retrying joins sync later...");
        }
      }

      if (pendingGroups.length > 0) {
        try {
          const res = await fetch('/api/groups/bulk-update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pendingGroups)
          });
          if (res.ok) setPendingGroups([]);
        } catch (e) {
          console.warn("Retrying groups sync later...");
        }
      }
    };

    const timer = setTimeout(syncPending, 5000);
    return () => clearTimeout(timer);
  }, [syncStatus, pendingJoins, pendingGroups]);

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
      alert("This batch is already injected!");
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
      
      // Update local state immediately (Offline First)
      setGroups(prev => [newGroup, ...prev.filter(g => g.id !== newGroup.id)]);
      setNewChatId('');
      
      // Attempt sync
      try {
        const res = await fetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newGroup)
        });
        if (!res.ok) throw new Error("Sync failed");
      } catch (e) {
        console.warn("Background sync failed, added to queue", e);
        setPendingGroups(prev => [...prev.filter(g => g.id !== newGroup.id), newGroup]);
      }

      alert("Batch successfully injected! (Saved locally)");
    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setIsAddingGroup(false); 
    }
  };

  const discoverGroupsAndJoins = async (currentToken: string) => {
    if (!currentToken || isScanning) return;

    // Only the master tab should perform the scan to avoid Telegram API conflicts
    const masterTabId = localStorage.getItem('tg_master_tab_id');
    if (masterTabId && masterTabId !== tabId.current) {
      const lastPoll = Number(localStorage.getItem('tg_last_poll_time') || 0);
      // If master is still active, skip
      if (Date.now() - lastPoll < 25000) {
        return;
      }
    }

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
          // Update local state immediately
          setGroups(prev => {
            const newGroups = [...prev];
            uniqueNewGroups.forEach(newGroup => {
              if (!newGroups.some(g => g.id === newGroup.id)) {
                newGroups.unshift(newGroup);
              }
            });
            return newGroups;
          });

          // Background sync
          try {
            const res = await fetch('/api/groups/bulk-update', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(uniqueNewGroups)
            });
            if (!res.ok) throw new Error("Bulk sync failed");
          } catch (e) {
            console.warn("Bulk group sync failed, adding to queue", e);
            setPendingGroups(prev => {
              const combined = [...prev];
              uniqueNewGroups.forEach(ng => {
                if (!combined.some(p => p.id === ng.id)) combined.push(ng);
              });
              return combined;
            });
          }
        }
      }

      if (newJoins.length > 0 || pendingJoins.length > 0) {
        const joinsToSave = [...pendingJoins, ...newJoins];
        try {
          const res = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(joinsToSave)
          });
          
          if (res.ok) {
            setPendingJoins([]);
            setSyncStatus('connected');
          } else {
            throw new Error("Failed to save to DB");
          }
        } catch (err) {
          console.error("Failed to save joins to DB, keeping in pending queue", err);
          setPendingJoins(joinsToSave);
          setSyncStatus('error');
        }

        if (newJoins.length > 0) {
          setJoinEvents(prev => {
            const combined = [...newJoins, ...prev];
            return combined.filter((v, i, a) => a.findIndex(t => t.userId === v.userId && t.timestamp === v.timestamp) === i).slice(0, 10000);
          });
        }
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
      setLastSyncTime(new Date());
    } catch (e: any) {
      const isNetworkError = e.message?.includes('timeout') || e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError');
      
      if (isNetworkError) {
        console.warn("Discovery skipped: Network connectivity issue.");
        setSyncStatus('error');
        setDbError("Sync paused: Check your internet connection.");
      } else {
        console.error("Discovery error:", e);
      }
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
    
    // Update local state immediately (Offline First)
    setJoinEvents(prev => prev.filter(e => `${e.userId}-${e.timestamp}` !== eventId));
    setGroups(prevGroups => prevGroups.map(g => {
      if (g.id === chatId.toString()) {
        return { ...g, memberCount: Math.max(0, (g.memberCount || 0) - 1) };
      }
      return g;
    }));

    try {
      await kickChatMember(token, chatId, userId);
      const timestamp = eventId.split('-')[1];
      // Background sync for DB
      fetch(`/api/events/${userId}/${timestamp}`, { method: 'DELETE' })
        .catch(e => console.warn("Failed to delete event from DB", e));
    } catch (err: any) { 
      alert(`Operation failed: ${err.message}. Local data updated.`); 
    }
  };

  const handleGroupInteraction = async (groupId: string) => {
    const now = Date.now();
    // Update local state immediately
    setGroups(prev => prev.map(g => 
      g.id === groupId ? { ...g, lastInteraction: now } : g
    ));

    try {
      fetch(`/api/groups/${groupId}/interaction`, { method: 'PUT' })
        .catch(e => console.warn("Interaction sync failed", e));
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
      .filter(g => {
        const normalizedName = normalizeText(g.name);
        const normalizedQuery = normalizeText(debouncedSearchQuery);
        return normalizedName.includes(normalizedQuery) || g.id.includes(debouncedSearchQuery);
      });
    
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
  }, [groups, debouncedSearchQuery, filterOption]);

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
                    <div className="flex flex-col gap-3">
                       <div>
                         <p className="text-[10px] font-black text-purple-100 uppercase tracking-widest mb-1 relative z-10">Bot Status</p>
                         <p className="text-xl font-black text-white uppercase relative z-10">{botInfo ? 'ACTIVE' : 'OFFLINE'}</p>
                       </div>
                       <div className="pt-2 border-t border-white/10">
                         <p className="text-[10px] font-black text-purple-100 uppercase tracking-widest mb-1 relative z-10">DB Sync</p>
                         <div className="flex items-center gap-1.5 relative z-10">
                           <div className={`w-2 h-2 rounded-full ${syncStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : syncStatus === 'syncing' ? 'bg-amber-400 animate-bounce' : 'bg-rose-400'}`}></div>
                           <p className="text-[9px] font-black text-white uppercase">{syncStatus}</p>
                           {syncStatus === 'error' && (
                             <button 
                               onClick={() => setSyncRetryCount(prev => prev + 1)}
                               className="ml-2 p-1 bg-white/20 hover:bg-white/30 rounded text-[8px] font-black text-white uppercase transition-colors"
                             >
                               Wake Up
                             </button>
                           )}
                         </div>
                         {syncStatus === 'error' && (
                           <div className="mt-2 p-2 bg-rose-500/20 border border-rose-500/30 rounded-lg flex items-center gap-2 animate-pulse">
                             <Icons.AlertTriangle size={10} className="text-rose-400" />
                             <p className="text-[7px] font-black text-rose-200 uppercase">Server is waking up...</p>
                           </div>
                         )}
                         {dbError && (
                           <p className="text-[7px] font-black text-rose-200 uppercase mt-1 truncate max-w-full" title={dbError}>
                             {dbError}
                           </p>
                         )}
                         {lastSyncTime && !dbError && (
                           <p className="text-[7px] font-black text-purple-200 uppercase mt-1 opacity-60">
                             Last: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                           </p>
                         )}
                       </div>
                     </div>
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
                {filteredGroups.length > 0 ? (
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

                  {deferredPrompt && (
                    <div className="mb-6 p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl shadow-lg animate-pulse">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-black text-xs uppercase tracking-widest">Install App</h4>
                          <p className="text-blue-100 text-[10px] mt-1">Add to home screen for better experience</p>
                        </div>
                        <button 
                          onClick={handleInstallClick}
                          className="px-4 py-2 bg-white text-blue-600 font-black text-[10px] uppercase rounded-xl shadow-md active:scale-95 transition-all"
                        >
                          Install Now
                        </button>
                      </div>
                    </div>
                  )}

                  {isInIframe && (
                    <div className="mb-6 p-6 bg-amber-500/10 border-2 border-amber-500/20 rounded-3xl">
                      <div className="flex items-start gap-3">
                        <Icons.AlertTriangle className="text-amber-500 shrink-0" size={18} />
                        <div>
                          <h4 className="text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-widest">Installation Note</h4>
                          <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-1 leading-relaxed">
                            Aap AI Studio ke preview me hain. App install karne ke liye upar diye gaye <b>"Open in New Tab"</b> button par click karein.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-6 grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-100 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">PWA Status</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${swStatus === 'registered' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        <span className="text-[10px] font-bold uppercase">{swStatus}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Install Ready</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${deferredPrompt ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                        <span className="text-[10px] font-bold uppercase">{deferredPrompt ? 'YES' : 'NO'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-slate-200 dark:border-slate-800 pt-6">
                    <button onClick={handleExport} className="flex flex-col items-center justify-center gap-2 p-5 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all">
                      <Icons.DownloadCloud size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Export Data</span>
                    </button>
                    <button onClick={handleShareApp} className="flex flex-col items-center justify-center gap-2 p-5 bg-purple-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all">
                      <Icons.Share2 size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Share App</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <button onClick={() => importFileRef.current?.click()} className="flex flex-col items-center justify-center gap-2 p-5 bg-emerald-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all w-full col-span-2">
                      <Icons.UploadCloud size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Import Data</span>
                    </button>
                    <input type="file" ref={importFileRef} onChange={handleImport} accept=".json" className="hidden" />
                  </div>

                  <div className="mt-6 p-6 bg-slate-100 dark:bg-black/20 rounded-[2.5rem] border border-slate-200 dark:border-white/5">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Icons.Info size={14} /> Unlimited Installation Guide
                    </h4>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Aap is app ko <b>unlimited</b> devices (Android, iPhone, PC) par install kar sakte hain. Bas app ka link share karein aur dusre device par open karein.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Browser menu me jayein (3 dots) aur <b>"Add to Home Screen"</b> ya <b>"Install App"</b> par click karein.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Ek baar install hone ke baad, app bina browser ke direct open hoga aur offline bhi kaam karega.
                        </p>
                      </div>
                    </div>
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