import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar, { ThemePreset } from '../components/Sidebar.tsx';
import GroupCard from '../components/GroupCard.tsx';
import InviteModal from '../components/InviteModal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import { AdminManager } from '../components/AdminManager.tsx';
import { Icons } from '../constants.tsx';
import { TelegramGroup, JoinEvent, BannedUser, BatchFolder } from '../types.ts';
import { verifyBotToken, getChatDetails, TelegramBotInfo, getChatMemberCount, getRecentUpdates, kickChatMember, banMember, unbanMember, deleteMessage, setWebhook, deleteWebhook } from '../services/telegramService.ts';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

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

  return result.join('').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, '');
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

const TABS = ['dashboard', 'groups', 'folders', 'analysis', 'settings'];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'dashboard';
  });
  const [selectedGroup, setSelectedGroup] = useState<TelegramGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('tg_recent_searches');
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [filterOption, setFilterOption] = useState<'mostMembers' | 'leastMembers' | 'frequent' | 'recent' | 'newAdded' | 'activeToday'>('recent');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
  const [auditSubTab, setAuditSubTab] = useState<'audit' | 'blocked' | 'deleted'>('audit');
  const [updates, setUpdates] = useState<any[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved as 'light' | 'dark';
    return 'dark';
  });
  const [colorTheme, setColorTheme] = useState<ThemePreset>(() => {
    const saved = localStorage.getItem('color_theme');
    if (saved) return saved as ThemePreset;
    return 'midnight';
  });
  const [fontSize, setFontSize] = useState<'xs' | 'small' | 'normal'>(() => {
    const saved = localStorage.getItem('font_size');
    if (saved) return saved as 'xs' | 'small' | 'normal';
    return 'small';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('color_theme', colorTheme);
    localStorage.setItem('font_size', fontSize);

    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'theme-midnight', 'theme-quantum', 'theme-violet', 'theme-executive', 'font-xs', 'font-small', 'font-normal');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }

    root.classList.add(`theme-${colorTheme}`);
    root.classList.add(`font-${fontSize}`);
  }, [theme, colorTheme, fontSize]);
  
  const [token, setToken] = useState(localStorage.getItem('tg_bot_token') || DEFAULT_TOKEN);
  const [autoCleanServiceMessages, setAutoCleanServiceMessages] = useState(() => {
    return localStorage.getItem('tg_auto_clean') === 'true';
  });
  const [autoWelcome, setAutoWelcome] = useState(() => {
    return localStorage.getItem('tg_auto_welcome') === 'true';
  });
  const [autoApproveJoinRequest, setAutoApproveJoinRequest] = useState(() => {
    return localStorage.getItem('tg_auto_approve') === 'true';
  });
  const [welcomeMessage, setWelcomeMessage] = useState(() => localStorage.getItem('tg_welcome_message') || 'Welcome to the group!');
  const [isWelcomeEnabled, setIsWelcomeEnabled] = useState(() => localStorage.getItem('tg_welcome_enabled') === 'true');

  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>(() => {
    const saved = localStorage.getItem('tg_banned_users');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [deletedGroups, setDeletedGroups] = useState<any[]>(() => {
    const saved = localStorage.getItem('tg_deleted_groups_bin');
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const valid = parsed.filter((g: any) => {
        const deletedTime = g.deletedAt || now;
        return (now - deletedTime) < thirtyDaysMs;
      });
      return Array.isArray(valid) ? valid : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const filtered = deletedGroups.filter(g => (now - (g.deletedAt || now)) < thirtyDaysMs);
    localStorage.setItem('tg_deleted_groups_bin', JSON.stringify(filtered));
    const deletedIds = filtered.map(g => String(g.id));
    localStorage.setItem('tg_deleted_groups', JSON.stringify(deletedIds));
  }, [deletedGroups]);

  const moveToDeletedBin = (group: TelegramGroup, reason: string) => {
    setGroups(prev => prev.filter(g => g.id !== group.id));
    setDeletedGroups(prev => {
      if (prev.some(d => d.id === group.id)) return prev;
      return [...prev, { ...group, deletedAt: Date.now(), errorReason: reason }];
    });
    fetch('/api/groups/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: group.id })
    }).catch(e => console.error("Failed to remove unacceptable group from DB:", e));
    showNotification(`Moved unacceptable group "${group.name}" to Deleted Bin (${reason})`, 'alert');
  };

  const handleEmptyTrash = () => {
    handleOpenConfirmModal({
      title: 'Empty Deleted Bin',
      message: 'Are you sure you want to permanently purge all items in the deleted bin?',
      onConfirm: () => {
        setDeletedGroups([]);
        showNotification('Deleted bin emptied successfully', 'info');
      }
    });
  };

  const [folders, setFolders] = useState<BatchFolder[]>(() => {
    try {
      const saved = localStorage.getItem('telebridge_batch_folders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [
      { id: 'f-1', name: 'VIP Batches 📂', color: 'from-indigo-600 to-blue-600', batchIds: [], createdAt: Date.now() },
      { id: 'f-2', name: 'Active Hubs 📂', color: 'from-emerald-600 to-teal-600', batchIds: [], createdAt: Date.now() }
    ];
  });
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('📂');
  const [newFolderColor, setNewFolderColor] = useState('from-indigo-600 to-blue-600');
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [folderSearchQuery, setFolderSearchQuery] = useState('');

  const matchFolderSearch = (name: string) => {
    if (!folderSearchQuery.trim()) return true;
    const q = folderSearchQuery.trim().toLowerCase();
    const n = (name || '').toLowerCase();
    return n.includes(q) || n.normalize('NFD').replace(/[\u0300-\u036f]/g, "").includes(q.normalize('NFD').replace(/[\u0300-\u036f]/g, ""));
  };

  useEffect(() => {
    localStorage.setItem('telebridge_batch_folders', JSON.stringify(folders));
    
    // Sync to MongoDB in background
    const syncFolders = async () => {
      try {
        // We could do bulk but let's just ensure we have them. 
        // For production, a more sophisticated sync is better.
        // For now, we'll just handle explicit creation/deletion in their respective handlers.
      } catch (e) {
        console.error("Failed to sync folders to DB:", e);
      }
    };
    syncFolders();
  }, [folders]);

  const [botInfo, setBotInfo] = useState<TelegramBotInfo | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncingToDb, setIsSyncingToDb] = useState(false);
  const [isLocked, setIsLocked] = useState(() => localStorage.getItem('tg_token_locked') !== 'false');
  const [groups, setGroups] = useState<TelegramGroup[]>(() => {
    const saved = localStorage.getItem('tg_groups');
    try {
      const parsed = saved ? JSON.parse(saved) : DEFAULT_GROUPS;
      const deletedIds = JSON.parse(localStorage.getItem('tg_deleted_groups') || '[]');
      const filtered = Array.isArray(parsed) && parsed.length > 0 
        ? parsed.filter((g: any) => g && g.id && !deletedIds.includes(String(g.id))) 
        : DEFAULT_GROUPS;
      return filtered.map((g: any) => ({
        ...g,
        createdAt: g.createdAt || Date.now()
      }));
    } catch (e) {
      return DEFAULT_GROUPS.map(g => ({ ...g, createdAt: Date.now() }));
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
  const [isProcessingWebhook, setIsProcessingWebhook] = useState(false);
  const [webhookActive, setWebhookActive] = useState(() => {
    return localStorage.getItem('tg_webhook_active') === 'true';
  });
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
  const [analyticsRange, setAnalyticsRange] = useState<'1W' | '1M' | '3M' | '6M' | '1Y' | 'CUSTOM'>('1W');
  const [analysisStartDate, setAnalysisStartDate] = useState<string>('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'alert' | 'info'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'alert' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  const [analysisEndDate, setAnalysisEndDate] = useState<string>('');
  const [isGroupListCollapsed, setIsGroupListCollapsed] = useState(true);
  const [selectedGroupToDelete, setSelectedGroupToDelete] = useState('');
  const [settingsSubTab, setSettingsSubTab] = useState<'charts' | 'config' | 'admins'>('charts');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [linkToRevoke, setLinkToRevoke] = useState('');

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{new Date(label).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          <p className="text-sm font-black text-blue-600 dark:text-blue-400">{payload[0].value} <span className="text-[10px] text-slate-500 uppercase">Joins</span></p>
        </div>
      );
    }
    return null;
  };

  const processedChartData = useMemo(() => {
    if (!joinEvents.length) return [];

    const now = new Date();
    let daysToLookBack = 7;
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (analyticsRange === 'CUSTOM' && analysisStartDate && analysisEndDate) {
      startDate = new Date(analysisStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(analysisEndDate);
      endDate.setHours(23, 59, 59, 999);
      
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      daysToLookBack = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } else {
      if (analyticsRange === '1M') daysToLookBack = 30;
      else if (analyticsRange === '3M') daysToLookBack = 90;
      else if (analyticsRange === '6M') daysToLookBack = 180;
      else if (analyticsRange === '1Y') daysToLookBack = 365;
      
      startDate = new Date();
      startDate.setDate(now.getDate() - daysToLookBack + 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    const dataMap: Record<string, number> = {};
    
    // Initialize all days in range with 0
    for (let i = 0; i < daysToLookBack; i++) {
      const d = new Date(startDate!);
      d.setDate(startDate!.getDate() + i);
      const dateStr = d.toLocaleDateString('en-CA');
      dataMap[dateStr] = 0;
    }

    joinEvents.forEach(event => {
      const d = new Date(event.timestamp);
      if (d >= startDate! && d <= endDate!) {
        const dateStr = d.toLocaleDateString('en-CA');
        if (dataMap[dateStr] !== undefined) {
          dataMap[dateStr]++;
        }
      }
    });

    return Object.entries(dataMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [joinEvents, analyticsRange, analysisStartDate, analysisEndDate]);

  const comparisonStats = useMemo(() => {
    const now = new Date();
    // Helper to format date in IST
    const getIstDateStr = (date: Date) => date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const todayStr = getIstDateStr(now);
    const yesterday = new Date(now.getTime() - 86400000);
    const yesterdayStr = getIstDateStr(yesterday);

    let todayCount = 0;
    let yesterdayCount = 0;

    // Weekly comparison - still using event timestamps but dateStr is IST
    const startOfThisWeek = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"})); 
    startOfThisWeek.setHours(0, 0, 0, 0); 
    startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfThisWeek.getDay());

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    let thisWeekCount = 0;
    let lastWeekCount = 0;

    joinEvents.forEach(event => {
      const d = new Date(event.timestamp);
      const dateStr = getIstDateStr(d);
      
      if (dateStr === todayStr) todayCount++;
      else if (dateStr === yesterdayStr) yesterdayCount++;

      if (d >= startOfThisWeek) thisWeekCount++;
      else if (d >= startOfLastWeek && d < startOfThisWeek) lastWeekCount++;
    });

    const getTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return {
      today: todayCount,
      yesterday: yesterdayCount,
      todayTrend: getTrend(todayCount, yesterdayCount),
      thisWeek: thisWeekCount,
      lastWeek: lastWeekCount,
      weekTrend: getTrend(thisWeekCount, lastWeekCount)
    };
  }, [joinEvents]);



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
    localStorage.setItem('tg_recent_searches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);



  useEffect(() => {
    localStorage.setItem('tg_auto_clean', autoCleanServiceMessages.toString());
  }, [autoCleanServiceMessages]);

  useEffect(() => {
    localStorage.setItem('tg_welcome_message', welcomeMessage);
  }, [welcomeMessage]);

  useEffect(() => {
    localStorage.setItem('tg_welcome_enabled', isWelcomeEnabled.toString());
  }, [isWelcomeEnabled]);

  useEffect(() => {
    localStorage.setItem('tg_auto_welcome', autoWelcome.toString());
  }, [autoWelcome]);
  useEffect(() => {
    localStorage.setItem('tg_auto_approve', autoApproveJoinRequest.toString());
  }, [autoApproveJoinRequest]);

  useEffect(() => {
    localStorage.setItem('tg_webhook_active', webhookActive.toString());
  }, [webhookActive]);

  useEffect(() => {
    localStorage.setItem('tg_pending_joins', JSON.stringify(pendingJoins));
  }, [pendingJoins]);

  useEffect(() => {
    localStorage.setItem('tg_pending_groups', JSON.stringify(pendingGroups));
  }, [pendingGroups]);

  useEffect(() => {
    localStorage.setItem('tg_banned_users', JSON.stringify(bannedUsers));
  }, [bannedUsers]);

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
        showNotification("Link copied to clipboard!", 'success');
      });
    } else {
      navigator.clipboard.writeText(url);
      showNotification("Link copied to clipboard!", 'success');
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      showNotification("Install via browser menu (3 dots) -> 'Add to Home Screen'", 'info');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const [animationDirection, setAnimationDirection] = useState<'left' | 'right'>('right');
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

        const [groupsRes, eventsRes, foldersRes] = await Promise.all([
          fetch('/api/groups', { signal: controller.signal, headers: { 'Accept': 'application/json' } }),
          fetch('/api/events', { signal: controller.signal, headers: { 'Accept': 'application/json' } }),
          fetch('/api/folders', { signal: controller.signal, headers: { 'Accept': 'application/json' } })
        ]);
        
        clearTimeout(timeoutId);

        if (!groupsRes.ok) {
          const errorData = await groupsRes.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || `Server Error: ${groupsRes.status}`);
        }

        const isJsonGroups = groupsRes.headers.get("content-type")?.includes("application/json");
        if (!isJsonGroups) {
           const text = await groupsRes.text();
           console.error("Initial /api/groups expected JSON but got text:", text.slice(0, 100));
           throw new Error("Invalid response format from server (expected JSON)");
        }
        const serverGroups: TelegramGroup[] = await groupsRes.json();
        
        // Merge Strategy: Use server data as truth, but preserve local groups not on server
        // and use newer timestamps if available
        setGroups(prev => {
          const deletedIds = JSON.parse(localStorage.getItem('tg_deleted_groups') || '[]');
          
          // Filter out deleted groups from server data
          const activeServerGroups = Array.isArray(serverGroups) 
            ? serverGroups.filter(sg => sg && sg.id && !deletedIds.includes(String(sg.id))).map(sg => ({
                ...sg,
                createdAt: sg.createdAt || Date.now()
              }))
            : [];
          
          const merged = [...activeServerGroups];
          
          prev.forEach(localG => {
            if (!localG || !localG.id || deletedIds.includes(String(localG.id))) return;
            
            const serverG = merged.find(sg => sg.id === localG.id);
            if (!serverG) {
              // Local only group (maybe created offline), keep it
              merged.push({ ...localG, createdAt: localG.createdAt || Date.now() });
            } else {
              // Compare timestamps if available
              if ((localG.lastInteraction || 0) > (serverG.lastInteraction || 0)) {
                // Local is newer, keep local version for now
                const idx = merged.findIndex(sg => sg.id === localG.id);
                merged[idx] = { ...localG, createdAt: localG.createdAt || serverG.createdAt || Date.now() };
              }
            }
          });
          return merged;
        });

        // Sync Folders
        if (foldersRes.ok) {
          const serverFolders: BatchFolder[] = await foldersRes.json();
          if (Array.isArray(serverFolders) && serverFolders.length > 0) {
            setFolders(prev => {
              // Merge folders: server data wins, but keep local folders if not on server
              const merged = [...serverFolders];
              prev.forEach(localF => {
                if (!merged.find(sf => sf.id === localF.id)) {
                  merged.push(localF);
                }
              });
              return merged;
            });
          }
        }
        
        setSyncStatus('connected');
        setDbError(null);
        setLastSyncTime(new Date());

        if (eventsRes.ok) {
          const isJsonEvents = eventsRes.headers.get("content-type")?.includes("application/json");
          if (isJsonEvents) {
            const serverEvents: JoinEvent[] = await eventsRes.json();
            setJoinEvents(prev => {
              // Merge events by timestamp and userId to avoid duplicates
              const combined = [...serverEvents, ...prev];
              return combined.filter((v, i, a) => 
                a.findIndex(t => t.userId === v.userId && t.timestamp === v.timestamp) === i
              ).sort((a, b) => b.timestamp - a.timestamp).slice(0, 10000);
            });
          } else {
            console.error("Initial /api/events expected JSON but got text.");
          }
        }
      } catch (err: any) {
        console.error("Initial fetch error:", err);
        setSyncStatus('error');
        
        const errorMessage = err.message || String(err);
        if (errorMessage.includes('IP not whitelisted')) {
          setDbError('MongoDB Error: IP not whitelisted. Please allow 0.0.0.0/0 in Atlas.');
        } else if (err.name === 'AbortError' || errorMessage.includes('Failed to fetch') || errorMessage.includes('timeout')) {
          setDbError('Slow network: Using local data');
        } else {
          setDbError(errorMessage);
        }
        
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

      // If webhook is active, we don't query Telegram, but we must query our DB to refresh the UI
      if (webhookActive) {
        try {
          const [groupsRes, eventsRes] = await Promise.all([
            fetch('/api/groups', { headers: { 'Accept': 'application/json' } }),
            fetch('/api/events', { headers: { 'Accept': 'application/json' } })
          ]);
          
          if (groupsRes.ok) {
            const isJson = groupsRes.headers.get("content-type")?.includes("application/json");
            if (isJson) {
              const serverGroups: TelegramGroup[] = await groupsRes.json();
              setGroups(prev => {
                const deletedIds = JSON.parse(localStorage.getItem('tg_deleted_groups') || '[]');
                const activeServerGroups = Array.isArray(serverGroups)
                  ? serverGroups.filter(sg => sg && sg.id && !deletedIds.includes(String(sg.id)))
                  : [];
                
                const merged = [...activeServerGroups];
                prev.forEach(localG => {
                  if (!localG || !localG.id || deletedIds.includes(String(localG.id))) return;
                  const serverG = merged.find(sg => sg.id === localG.id);
                  if (!serverG) merged.push(localG);
                });
                return merged;
              });
            } else {
              const text = await groupsRes.text();
              console.error("Expected JSON for /api/groups but got text:", text.slice(0, 100));
            }
          }
          if (eventsRes.ok) {
            const isJson = eventsRes.headers.get("content-type")?.includes("application/json");
            if (isJson) {
              const serverEvents: JoinEvent[] = await eventsRes.json();
              setJoinEvents(prev => {
                const combined = [...serverEvents, ...prev];
                return combined.filter((v, i, a) => 
                  a.findIndex(t => t.userId === v.userId && t.timestamp === v.timestamp) === i
                ).sort((a, b) => b.timestamp - a.timestamp).slice(0, 10000);
              });
            } else {
              const text = await eventsRes.text();
              console.error("Expected JSON for /api/events but got text:", text.slice(0, 100));
            }
          }
        } catch (err) {
          console.error("DB background sync error:", err);
        }
        
        timeoutId = setTimeout(poll, 5000);
        return;
      }

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
  }, [token, botInfo, webhookActive]);

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

  // Mobile Phone System Back Button & Browser History Management
  useEffect(() => {
    // Initialize or replace baseline state so back always has a known root
    if (!window.history.state || typeof window.history.state !== 'object' || !window.history.state.tab) {
      window.history.replaceState({ tab: activeTab, folderId: activeFolderId, modal: null }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;

      // 1. Modals priority: dismiss modals if state no longer contains them
      if (!state || state.modal !== 'group') {
        setSelectedGroup(null);
      } else if (state.modal === 'group' && state.groupId) {
        const foundGroup = groups.find(g => g.id === state.groupId);
        if (foundGroup) setSelectedGroup(foundGroup);
      }

      if (!state || state.modal !== 'createFolder') {
        setIsCreateFolderModalOpen(false);
      } else if (state.modal === 'createFolder') {
        setIsCreateFolderModalOpen(true);
      }

      if (!state || state.modal !== 'confirm') {
        setConfirmationModalConfig(prev => prev.isOpen ? { ...prev, isOpen: false } : prev);
      }

      // 2. Folder detail sub-page:
      if (state && state.folderId !== undefined) {
        setActiveFolderId(state.folderId);
      } else {
        setActiveFolderId(null);
      }

      // 3. Tab / Page navigation:
      const targetTab = state?.tab || 'dashboard';
      if (targetTab !== activeTab) {
        const currentIndex = TABS.indexOf(activeTab);
        const newIndex = TABS.indexOf(targetTab);
        if (newIndex > currentIndex) {
          setAnimationDirection('right');
        } else if (newIndex < currentIndex) {
          setAnimationDirection('left');
        }
        setActiveTab(targetTab);
        localStorage.setItem('activeTab', targetTab);
        if (targetTab === 'analysis') {
          setAuditSubTab('audit');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab, activeFolderId, groups]);

  const handleTabChange = (newTab: string, pushToHistory = true) => {
    if (activeTab === newTab && activeFolderId === null && !selectedGroup && !isCreateFolderModalOpen) return;

    const currentIndex = TABS.indexOf(activeTab);
    const newIndex = TABS.indexOf(newTab);
    
    if (newIndex > currentIndex) {
      setAnimationDirection('right');
    } else if (newIndex < currentIndex) {
      setAnimationDirection('left');
    }

    setSelectedGroup(null);
    setIsCreateFolderModalOpen(false);
    if (activeFolderId !== null && newTab !== 'folders') {
      setActiveFolderId(null);
    }

    if (pushToHistory) {
      window.history.pushState({ tab: newTab, folderId: null, modal: null }, '');
    }
    
    if (currentIndex !== newIndex) {
      setActiveTab(newTab);
      localStorage.setItem('activeTab', newTab);
      if (newTab === 'analysis') {
        setAuditSubTab('audit');
      }
    }
  };

  const handleOpenGroupModal = (group: TelegramGroup) => {
    window.history.pushState({ tab: activeTab, folderId: activeFolderId, modal: 'group', groupId: group.id }, '');
    setSelectedGroup(group);
  };

  const handleCloseGroupModal = () => {
    if (window.history.state?.modal === 'group') {
      window.history.back();
    } else {
      setSelectedGroup(null);
    }
  };

  const handleOpenFolder = (folderId: string) => {
    window.history.pushState({ tab: 'folders', folderId: folderId, modal: null }, '');
    setActiveFolderId(folderId);
  };

  const handleCloseFolder = () => {
    setActiveFolderId(null);
  };

  const handleOpenCreateFolderModal = () => {
    window.history.pushState({ tab: 'folders', folderId: activeFolderId, modal: 'createFolder' }, '');
    setIsCreateFolderModalOpen(true);
  };

  const handleCloseCreateFolderModal = () => {
    if (window.history.state?.modal === 'createFolder') {
      window.history.back();
    } else {
      setIsCreateFolderModalOpen(false);
    }
  };

  const handleOpenConfirmModal = (config: {
    title: string;
    message: string;
    onConfirm: () => void;
  }) => {
    window.history.pushState({ tab: activeTab, folderId: activeFolderId, modal: 'confirm' }, '');
    setConfirmationModalConfig({
      isOpen: true,
      title: config.title,
      message: config.message,
      onConfirm: () => {
        config.onConfirm();
        if (window.history.state?.modal === 'confirm') {
          window.history.back();
        } else {
          setConfirmationModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleCloseConfirmModal = () => {
    if (window.history.state?.modal === 'confirm') {
      window.history.back();
    } else {
      setConfirmationModalConfig(prev => ({ ...prev, isOpen: false }));
    }
  };
  
  const syncDataToDatabase = async () => {
    if (isSyncingToDb) return;
    if (pendingGroups.length === 0 && pendingJoins.length === 0) {
      showNotification("No pending data to update.", 'info');
      return;
    }

    setIsSyncingToDb(true);
    try {
      // Sync Groups
      if (pendingGroups.length > 0) {
        const res = await fetch('/api/groups/bulk-update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pendingGroups)
        });
        if (!res.ok) throw new Error("Groups sync failed");
      }

      // Sync Joins
      if (pendingJoins.length > 0) {
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pendingJoins)
        });
        if (!res.ok) throw new Error("Joins sync failed");
      }

      setPendingGroups([]);
      setPendingJoins([]);
      setSyncStatus('connected');
      setLastSyncTime(new Date());
      showNotification("Database updated successfully!", 'success');
    } catch (err: any) {
      console.error("Manual sync error:", err);
      showNotification(`Update failed: ${err.message}`, 'alert');
    } finally {
      setIsSyncingToDb(false);
    }
  };

  const syncAllGroupsMemberCount = async (currentToken: string, groupsToSync?: TelegramGroup[]) => {
    const targetGroups = groupsToSync || groups;
    if (targetGroups.length === 0) return;
    
    try {
      const updatedGroups: TelegramGroup[] = [];
      const groupsToPending: TelegramGroup[] = [];

      await Promise.all(targetGroups.map(async (g) => {
        try {
          const count = await getChatMemberCount(currentToken, g.id);
          if (count !== g.memberCount) {
            const updatedGroup = { ...g, memberCount: count };
            updatedGroups.push(updatedGroup);
            groupsToPending.push(updatedGroup);
          } else {
            updatedGroups.push(g);
          }
        } catch (e: any) {
          const errMsg = e.message || String(e);
          if (errMsg.includes('Bad Request') || errMsg.includes('chat not found') || errMsg.includes('kicked') || errMsg.includes('Forbidden') || errMsg.includes('not a member')) {
            moveToDeletedBin(g, errMsg);
          } else {
            updatedGroups.push(g);
          }
        }
      }));

      // Update local state
      setGroups(prev => {
        const newGroups = [...prev];
        updatedGroups.forEach(ug => {
          const idx = newGroups.findIndex(g => g.id === ug.id);
          if (idx !== -1) newGroups[idx] = ug;
        });
        return newGroups;
      });

      // Queue for manual sync
      if (groupsToPending.length > 0) {
        setPendingGroups(prev => {
          const combined = [...prev];
          groupsToPending.forEach(pg => {
            const idx = combined.findIndex(g => g.id === pg.id);
            if (idx !== -1) combined[idx] = pg;
            else combined.push(pg);
          });
          return combined;
        });
      }

      showNotification(`Bot injection check complete: ${groupsToPending.length} groups updated locally.`, 'success');
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

    const ids = newChatId.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) return;

    setIsAddingGroup(true);
    let successCount = 0;
    let failCount = 0;
    const newDiscovered: TelegramGroup[] = [];

    for (const rawId of ids) {
      const normalizedId = rawId.startsWith('-100') ? rawId : `-100${rawId.replace(/^-/, '')}`;
      if (groups.some(g => g.id === rawId || g.id === normalizedId)) {
        continue;
      }

      try {
        const chat = await getChatDetails(token, rawId);
        const count = await getChatMemberCount(token, rawId);
        const newGroup: TelegramGroup = {
          id: chat.id.toString(),
          name: chat.title,
          memberCount: count,
          description: chat.description || 'Synced Hub',
          category: 'Telegram',
          image: `https://picsum.photos/seed/${chat.id}/200`,
          lastInteraction: Date.now(),
          createdAt: Date.now()
        };
        newDiscovered.push(newGroup);
        successCount++;
      } catch (err: any) { 
        console.warn(`Failed to inject group ${rawId}:`, err);
        const reason = err.message || 'Bad Request / Unaccessible';
        const dummyGroup: TelegramGroup = {
          id: rawId.startsWith('-100') ? rawId : `-100${rawId.replace(/^-/, '')}`,
          name: `Unacceptable Hub (${rawId})`,
          memberCount: 0,
          description: reason,
          category: 'Telegram',
          image: `https://picsum.photos/seed/${rawId}/200`,
          createdAt: Date.now()
        };
        moveToDeletedBin(dummyGroup, reason);
        failCount++;
      }
    }

    if (newDiscovered.length > 0) {
      setGroups(prev => [...newDiscovered, ...prev]);
      setPendingGroups(prev => [...prev, ...newDiscovered]);
      showNotification(`${successCount} batches successfully injected! (Saved locally).`, 'success');
    }

    if (failCount > 0 && successCount === 0) {
      showNotification(`Injection failed for all ${failCount} IDs. Check token/permissions.`, 'alert');
    } else if (failCount > 0) {
      showNotification(`${failCount} IDs failed. Check token/permissions.`, 'info');
    }

    setNewChatId('');
    setIsAddingGroup(false);
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

        if (u.chat_join_request && u.chat_join_request.chat) {
          const jr = u.chat_join_request;
          newJoins.push({
            userId: jr.from.id,
            userName: jr.from.first_name + (jr.from.last_name ? ` ${jr.from.last_name}` : ''),
            chatId: jr.chat.id,
            chatTitle: jr.chat.title,
            timestamp: jr.date ? jr.date * 1000 : Date.now(),
            is_bot: jr.from.is_bot
          });
        }

        const msg = u.message || u.channel_post;
        if (msg) {
          const chat = msg.chat;
          if (chat && (['group', 'supergroup', 'channel'].includes(chat.type))) {
            newDiscoveredGroups.push({
              id: chat.id.toString(),
              name: chat.title || 'Unknown Group',
              memberCount: 0, // We don't know the count yet
              description: chat.description || 'Auto Discovered Hub',
              category: 'Telegram',
              image: `https://picsum.photos/seed/${chat.id}/200`,
              lastInteraction: Date.now(),
              createdAt: Date.now()
            });
          }
        }

        if (u.my_chat_member) {
          const myMu = u.my_chat_member;
          const newStatus = myMu.new_chat_member?.status;
          if (['member', 'administrator', 'creator', 'restricted'].includes(newStatus)) {
            const chat = myMu.chat;
            if (chat) {
              newDiscoveredGroups.push({
                id: chat.id.toString(),
                name: chat.title || 'Unknown Group',
                memberCount: 1,
                description: chat.description || 'Auto Discovered Hub',
                category: 'Telegram',
                image: `https://picsum.photos/seed/${chat.id}/200`,
                lastInteraction: Date.now(),
                createdAt: Date.now()
              });
            }
          }
        }

        const mu = u.chat_member;
        
        if (mu && mu.chat) {
          const chatIdStr = mu.chat.id.toString();
          const oldStatus = mu.old_chat_member?.status;
          const newStatus = mu.new_chat_member?.status;

          const isMemberNow = ['member', 'administrator', 'creator', 'restricted'].includes(newStatus);
          const wasMemberBefore = ['member', 'administrator', 'creator', 'restricted'].includes(oldStatus);

          if (isMemberNow && !wasMemberBefore) {
            newJoins.push({
              userId: mu.new_chat_member.user.id,
              userName: mu.new_chat_member.user.first_name + (mu.new_chat_member.user.last_name ? ` ${mu.new_chat_member.user.last_name}` : ''),
              chatId: mu.chat.id,
              chatTitle: mu.chat.title,
              timestamp: mu.date ? mu.date * 1000 : Date.now(),
              is_bot: mu.new_chat_member.user.is_bot
            });
            // Don't auto increment memberChanges here directly, do it globally later if deduped
          } else if (!isMemberNow && wasMemberBefore) {
            memberChanges[chatIdStr] = (memberChanges[chatIdStr] || 0) - 1;
          }
        }

          if (msg && msg.new_chat_members) {
            const chatId = msg.chat.id;
            const chatTitle = msg.chat.title;
            const chatIdStr = chatId.toString();
            
            msg.new_chat_members.forEach((newUser: any) => {
            newJoins.push({
              userId: newUser.id,
              userName: newUser.first_name + (newUser.last_name ? ` ${newUser.last_name}` : ''),
              chatId: chatId,
              chatTitle: chatTitle,
              timestamp: msg.date ? msg.date * 1000 : Date.now(),
              is_bot: newUser.is_bot
            });
          });
        }

        if (msg && msg.left_chat_member) {
          const chatIdStr = msg.chat.id.toString();
          const chatId = msg.chat.id;
          memberChanges[chatIdStr] = (memberChanges[chatIdStr] || 0) - 1;
        }

        // Auto-clean service messages (Join/Leave)
        const isJoinLeave = msg && msg.message_id && (msg.new_chat_members || msg.left_chat_member || msg.new_chat_participant || msg.left_chat_participant);
        if (autoCleanServiceMessages && isJoinLeave) {
          setTimeout(() => {
            deleteMessage(currentToken, msg.chat.id, msg.message_id).catch(() => {});
          }, 1000);
        }

        if (msg && msg.new_chat_title) {
          const chatIdStr = msg.chat.id.toString();
          titleChanges[chatIdStr] = msg.new_chat_title;
        }
      });

      if (maxId > lastUpdateId) {
        setLastUpdateId(maxId);
        localStorage.setItem('tg_last_update_id', maxId.toString());
      }

      // Deduplicate New Joins across the same batch before sending exactly once
      const dedupedJoins = [];
      const joinKeys = new Set();
      
      for (const ev of newJoins) {
        // Broadly duplicate within 60s
        const broadKey = `${ev.userId}-${ev.chatId}-${Math.floor(ev.timestamp / 60000)}`;
        if (!joinKeys.has(broadKey)) {
          joinKeys.add(broadKey);
          
          // Only process strictly if we haven't seen them locally in our historical state to prevent cross-batch dual incrementing
          const cutoffLower = ev.timestamp - 120000;
          const cutoffUpper = ev.timestamp + 120000;
          const existInHistory = joinEvents.some(past => past.userId === ev.userId && past.chatId === ev.chatId && past.timestamp > cutoffLower && past.timestamp < cutoffUpper);
          
          if (!existInHistory) {
             dedupedJoins.push(ev);
             const cIdStr = ev.chatId.toString();
             memberChanges[cIdStr] = (memberChanges[cIdStr] || 0) + 1;
             
             // Frontend fallback for Auto-welcome if webhook is disabled
             if (autoWelcome && !webhookActive && !ev.is_bot) {
               setTimeout(() => {
                 const escapedName = (ev.userName || 'Awesome Member').toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
                 const text = `🎉 <b>Welcome to the Hub!</b> 🎉\n\nHey <a href="tg://user?id=${ev.userId}"><b>${escapedName}</b></a>, we're thrilled to have you here! ✨\n\n<i>Enjoy your stay, and keep it friendly!</i> 🚀`;
                 fetch(`https://api.telegram.org/bot${currentToken}/sendMessage`, {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ chat_id: ev.chatId, text, parse_mode: 'HTML' })
                 })
                 .then(res => res.json())
                 .then(data => {
                   if (data.ok) {
                     setTimeout(() => {
                        deleteMessage(currentToken, ev.chatId, data.result.message_id).catch(() => {});
                      }, 59000); // 59 SECONDS
                   }
                 }).catch(() => {});
               }, 5000); // 5 SECONDS delay
             }
          }
        }
      }

      if (newDiscoveredGroups.length > 0) {
        const uniqueNewGroups = newDiscoveredGroups.filter(
          (newGroup, index, self) => index === self.findIndex((t) => t.id === newGroup.id)
        );

        if (uniqueNewGroups.length > 0) {
          // Fetch real member counts for new groups in background
          uniqueNewGroups.forEach(async (ng) => {
            try {
              const count = await getChatMemberCount(currentToken, ng.id);
              setGroups(prev => prev.map(g => g.id === ng.id ? { ...g, memberCount: count } : g));
              
              // Also update in DB if we're synced
              fetch(`/api/groups/${ng.id}/interaction`, { method: 'POST' }).catch(() => {});
            } catch (e) {
              console.warn("Failed to update count for discovered group:", ng.id);
            }
          });

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

          // Queue for manual sync (Saving locally first)
          setPendingGroups(prev => {
            const combined = [...prev];
            uniqueNewGroups.forEach(ng => {
              if (!combined.some(p => p.id === ng.id)) combined.push(ng);
            });
            return combined;
          });
        }
      }

      if (dedupedJoins.length > 0) {
        // Queue for manual sync
        setPendingJoins(prev => [...prev, ...dedupedJoins]);
      }

      if (dedupedJoins.length > 0) {
        setJoinEvents(prev => {
          const combined = [...dedupedJoins, ...prev];
          return combined.filter((v, i, a) => a.findIndex(t => t.userId === v.userId && t.timestamp === v.timestamp) === i).slice(0, 10000);
        });
      }

      if (Object.keys(memberChanges).length > 0 || Object.keys(titleChanges).length > 0) {
        const updatedGroupsToPending: TelegramGroup[] = [];
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
              updatedGroupsToPending.push(updatedGroup);
              return updatedGroup;
            }
            return g;
          });
          return newGroups;
        });

        // Queue for manual sync
        if (updatedGroupsToPending.length > 0) {
          setPendingGroups(prev => {
            const combined = [...prev];
            updatedGroupsToPending.forEach(pg => {
              const idx = combined.findIndex(g => g.id === pg.id);
              if (idx !== -1) combined[idx] = pg;
              else combined.push(pg);
            });
            return combined;
          });
        }
      }

      setLastUpdateId(maxId);
      setLastSyncTime(new Date());
    } catch (e: any) {
      if (e.message?.includes('Conflict')) {
        console.log("Polling skipped: Webhook (24/7 background mode) is currently handling updates.");
        return;
      }

      const isNetworkError = e.message?.includes('timeout') || e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError');
      
      if (isNetworkError) {
        console.warn("Discovery skipped: Network connectivity issue.");
        setSyncStatus('error');
        setDbError("Sync paused: Check your internet connection.");
      } else {
        console.error("Discovery error:", e);
      }
    } finally { setIsScanning(false); }
  };

  const handleRequestKick = (joinEvent: JoinEvent) => {
    handleOpenConfirmModal({
      title: `Confirm Removal`,
      message: `Are you sure you want to remove ${joinEvent.userName} from ${joinEvent.chatTitle}? They will be able to rejoin if they have a valid link.`,
      onConfirm: () => handleExecuteKick(joinEvent.chatId, joinEvent.userId, `${joinEvent.userId}-${joinEvent.timestamp}`),
    });
  };

  const handleRequestBan = (joinEvent: JoinEvent) => {
    handleOpenConfirmModal({
      title: `Confirm Permanent Ban`,
      message: `Are you sure you want to permanently BAN ${joinEvent.userName} from ${joinEvent.chatTitle}? They will NOT be able to rejoin even with a valid link.`,
      onConfirm: () => handleExecuteBan(joinEvent.chatId, joinEvent.userId, `${joinEvent.userId}-${joinEvent.timestamp}`),
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
      showNotification(`Operation failed: ${err.message}. Local data updated.`, 'alert'); 
    }
  };

  const handleExecuteBan = async (chatId: number, userId: number, eventId: string) => {
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
      await banMember(token, chatId, userId);
      const timestamp = parseInt(eventId.split('-')[1]);
      
      // Add to banned users list
      const event = joinEvents.find(e => `${e.userId}-${e.timestamp}` === eventId);
      if (event) {
        setBannedUsers(prev => [...prev, {
          userId: event.userId,
          userName: event.userName,
          chatId: event.chatId,
          chatTitle: event.chatTitle,
          timestamp: Date.now()
        }]);
      }

      // Background sync for DB
      fetch(`/api/events/${userId}/${timestamp}`, { method: 'DELETE' })
        .catch(e => console.warn("Failed to delete event from DB", e));
      showNotification("User banned permanently.", 'success');
    } catch (err: any) { 
      showNotification(`Ban failed: ${err.message}. Local data updated.`, 'alert'); 
    }
  };

  const handleUnban = async (banned: BannedUser) => {
    if (!token) return;
    try {
      await unbanMember(token, banned.chatId, banned.userId);
      setBannedUsers(prev => prev.filter(u => u.userId !== banned.userId || u.chatId !== banned.chatId));
      showNotification(`User ${banned.userName} unbanned successfully.`, 'success');
    } catch (err: any) {
      showNotification(`Failed to unban: ${err.message}`, 'alert');
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

  const handleDeleteGroup = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    handleOpenConfirmModal({
      title: 'Remove Group',
      message: 'Are you sure you want to remove this group? This action will permanently remove it from the synced hub.',
      onConfirm: async () => {
        // Track the deleted group ID in localStorage permanently to prevent resurrection in offline-first sync
        try {
          const deletedIds = JSON.parse(localStorage.getItem('tg_deleted_groups') || '[]');
          if (!deletedIds.includes(String(id))) {
            deletedIds.push(String(id));
            localStorage.setItem('tg_deleted_groups', JSON.stringify(deletedIds));
          }
        } catch (err) {
          console.error("Failed to update tg_deleted_groups in localStorage", err);
        }

        // OPTIMISTIC UPDATE: Remove group from UI immediately
        setGroups(prev => prev.filter(g => g.id !== id));
        setSelectedGroupToDelete('');
        showNotification("Group removed successfully", 'success');
        
        try {
          // Permanently remove on the server
          const res = await fetch(`/api/groups/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (!res.ok) {
            let errorMsg = `HTTP Error ${res.status}`;
            try {
              const errData = await res.json();
              errorMsg = errData.error || errData.details || errorMsg;
            } catch (errJson) {
              const errText = await res.text().catch(() => "");
              if (errText) {
                errorMsg += `: ${errText.slice(0, 100)}`;
              }
            }
            throw new Error(errorMsg);
          }
          console.log(`[API POST Remove] Group ${id} deleted permanently from DB.`);
        } catch (err: any) {
          console.error(`[API POST Remove] Server deletion failed (cached ID will prevent resurrection):`, err.message);
          // Show a subtle notification that server sync will be retried later, but keep the UI clean
          showNotification(`Local change synced. Server sync will retry later.`, 'success');
        }
      }
    });
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
        showNotification('Data imported!', 'success');
      } catch (err) { showNotification('Import failed.', 'alert'); }
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

  const handleSetWebhook = async () => {
    if (!token) return;
    setIsProcessingWebhook(true);
    try {
      const baseUrl = window.location.origin;
      const webhookUrl = `${baseUrl}/api/webhook/${token}?welcome=${autoWelcome}&clean=${autoCleanServiceMessages}&approve=${autoApproveJoinRequest}`;
      await setWebhook(token, webhookUrl);
      setWebhookActive(true);
      showNotification("Webhook set! 24/7 background mode is now ACTIVE.", "success");
    } catch (err: any) {
      showNotification(`Failed to set webhook: ${err.message}`, "alert");
    } finally {
      setIsProcessingWebhook(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!token) return;
    setIsProcessingWebhook(true);
    try {
      await deleteWebhook(token);
      setWebhookActive(false);
      showNotification("Webhook disabled. Background cleanup is now OFF.", "info");
    } catch (err: any) {
      showNotification(`Failed to delete webhook: ${err.message}`, "alert");
    } finally {
      setIsProcessingWebhook(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage || !token) return;
    try {
      const response = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, message: broadcastMessage }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: `Server error (${response.status})` }));
        throw new Error(data.error || 'Failed to broadcast');
      }

      showNotification("Broadcast successful!", 'success');
      setBroadcastMessage('');
      const res = await fetch('/api/broadcast', { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        setBroadcasts(await res.json().catch(() => []));
      }
    } catch (err: any) {
      showNotification(`Broadcast failed: ${err.message}`, 'alert');
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/broadcast/${id}?token=${encodeURIComponent(token)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to delete';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || `Server error (${response.status})`;
          }
        } catch (e) {
          errorMessage = `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      showNotification("Broadcast deleted!", 'success');
      const res = await fetch('/api/broadcast', { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        try {
          setBroadcasts(await res.json());
        } catch (e) {
          console.error("Failed to parse broadcasts list", e);
        }
      }
    } catch (err: any) {
      showNotification(`Delete failed: ${err.message}`, 'alert');
    }
  };

  const handleRevokeLink = async () => {
    if (!linkToRevoke) return;
    console.log("handleRevokeLink called. Link:", linkToRevoke, "Token:", token);
    try {
      const response = await fetch('/api/revoke-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: linkToRevoke, token }),
      });
      if (!response.ok) {
        const text = await response.text();
        console.error("Server response:", text);
        try {
          const data = JSON.parse(text);
          throw new Error(data.error || 'Failed to revoke link');
        } catch {
          throw new Error(`Failed to revoke link (server returned non-JSON): ${text.substring(0, 50)}...`);
        }
      }
      showNotification("Link revoked successfully!", 'success');
      setLinkToRevoke('');
    } catch (err: any) {
      showNotification("Failed to revoke link: " + err.message, 'alert');
    }
  };

  const filteredJoins = useMemo(() => joinEvents.filter(e => new Date(e.timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) === selectedDate).sort((a, b) => a.timestamp - b.timestamp), [joinEvents, selectedDate]);
  const joinsTodayCount = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return joinEvents.filter(e => {
      const eventDate = new Date(e.timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      return eventDate === today;
    }).length;
  }, [joinEvents]);

  const filteredGroups = useMemo(() => {
    let filtered = groups
      .filter(g => {
        const normalizedName = normalizeText(g.name);
        const normalizedDesc = normalizeText(g.description || '');
        const normalizedQuery = normalizeText(debouncedSearchQuery);
        return normalizedName.includes(normalizedQuery) || 
               normalizedDesc.includes(normalizedQuery) ||
               g.id.includes(debouncedSearchQuery);
      });
    
    if (filterOption === 'activeToday') {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const activeIds = new Set(joinEvents
        .filter(e => new Date(e.timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) === today)
        .map(e => e.chatId.toString())
      );
      filtered = filtered.filter(g => activeIds.has(g.id));
    }

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
      case 'newAdded':
        filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        break;
    }
    filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    return filtered;
  }, [groups, debouncedSearchQuery, filterOption, joinEvents]);

  // STABLE SERIAL NUMBER: We calculate index based on the master sorted list to avoid jumping
  const getStableIndex = (groupId: string) => {
    return groups.findIndex(g => g.id === groupId);
  };

  const formatTime12h = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  
  const animationClass = useMemo(() => {
    if (animationDirection === 'right') {
      return 'animate-in slide-in-from-right-8';
    }
    return 'animate-in slide-in-from-left-8';
  }, [activeTab]);

  const BubbleBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      <div className="absolute top-[-10%] left-[-5%] w-24 h-24 bg-white/20 rounded-full blur-xl animate-float-slow"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float"></div>
      <div className="absolute top-[40%] right-[10%] w-16 h-16 bg-white/15 rounded-full blur-lg animate-float-delayed"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans transition-all duration-300">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        theme={theme}
        toggleTheme={toggleTheme}
        colorTheme={colorTheme}
        onColorThemeChange={(preset) => {
          setColorTheme(preset);
          if (preset === 'executive') setTheme('light');
          else setTheme('dark');
        }}
        hideMobileNav={isCreateFolderModalOpen || !!selectedGroup}
      />

      <main className="flex-1 transition-all duration-300 md:ml-64 px-4 md:px-6 lg:px-8 pb-28 w-full max-w-[1400px] mx-auto">
        <header className={`sticky top-0 z-40 backdrop-blur-2xl -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 py-3 mb-5 transition-all rounded-b-[2rem] md:rounded-b-[2.5rem] ${
          colorTheme === 'quantum'
            ? 'bg-gradient-to-r from-slate-950 via-emerald-950/90 to-slate-950 border-b border-emerald-500/35 shadow-[0_10px_30px_rgba(16,185,129,0.22)]'
            : colorTheme === 'violet'
            ? 'bg-gradient-to-r from-slate-950 via-purple-950/90 to-slate-950 border-b border-purple-500/35 shadow-[0_10px_30px_rgba(168,85,247,0.22)]'
            : colorTheme === 'executive'
            ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-600/50 shadow-[0_10px_30px_rgba(0,0,0,0.3)]'
            : 'bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 border-b border-indigo-500/35 shadow-[0_10px_30px_rgba(99,102,241,0.25)]'
        }`}>
          <div className="flex items-center justify-between gap-3">
            {/* Left: Tab Title & Icon with Status Glow */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-md shadow-indigo-500/30 flex-shrink-0 flex items-center justify-center text-white text-lg font-black ring-2 ring-white/10">
                {activeTab === 'dashboard' && '⚡'}
                {activeTab === 'groups' && '👥'}
                {activeTab === 'folders' && '📂'}
                {activeTab === 'analysis' && '🛡️'}
                {activeTab === 'settings' && '⚙️'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 key={activeTab} className="text-base md:text-xl font-black tracking-tight text-white capitalize truncate animate-in fade-in drop-shadow-sm">
                    {activeTab === 'dashboard' ? 'Home' : activeTab === 'groups' ? 'Batches & Hubs' : activeTab === 'folders' ? 'Batch Folders' : activeTab === 'analysis' ? 'Audit & Security' : 'Bot Settings'}
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[9px] font-black uppercase tracking-wider shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-300/85 truncate">
                  {activeTab === 'dashboard' && 'Real-time hub metrics & join monitors'}
                  {activeTab === 'groups' && `${groups.length} Telegram groups connected`}
                  {activeTab === 'folders' && `${folders.length} organized batch folders`}
                  {activeTab === 'analysis' && 'Security audit & unauthorized joins'}
                  {activeTab === 'settings' && 'Bot token & configuration'}
                </p>
              </div>
            </div>
              
            {/* Right: Controls & Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* Font Size Quick Selector */}
              <div className="hidden lg:flex items-center gap-0.5 p-1 bg-slate-900/80 border border-slate-700/80 rounded-2xl shadow-inner backdrop-blur-md">
                {[
                  { id: 'xs', label: 'Micro', short: 'XS' },
                  { id: 'small', label: 'Small', short: 'S' },
                  { id: 'normal', label: 'Medium', short: 'M' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFontSize(f.id as 'xs' | 'small' | 'normal')}
                    title={`Font Size: ${f.label}`}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black tracking-tight transition-all ${
                      fontSize === f.id
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm scale-105'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{f.short}</span>
                  </button>
                ))}
              </div>

              {/* Quick Theme Presets (Desktop) */}
              <div className="hidden xl:flex items-center gap-0.5 p-1 bg-slate-900/80 border border-slate-700/80 rounded-2xl shadow-inner backdrop-blur-md">
                {(['midnight', 'quantum', 'violet', 'executive'] as ThemePreset[]).map((preset) => {
                  const presetLabels: Record<ThemePreset, { name: string; color: string }> = {
                    midnight: { name: 'Cyber', color: 'bg-indigo-500' },
                    quantum: { name: 'Emerald', color: 'bg-emerald-500' },
                    violet: { name: 'Violet', color: 'bg-purple-500' },
                    executive: { name: 'Slate', color: 'bg-slate-600' }
                  };
                  return (
                    <button
                      key={preset}
                      onClick={() => {
                        setColorTheme(preset);
                        if (preset === 'executive') setTheme('light');
                        else setTheme('dark');
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase transition-all ${
                        colorTheme === preset
                          ? 'bg-white/20 text-white shadow-xs border border-white/30 scale-105'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${presetLabels[preset].color}`} />
                      <span>{presetLabels[preset].name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Theme mode toggle */}
              <button 
                onClick={toggleTheme} 
                className="w-9 h-9 rounded-2xl bg-slate-900/80 border border-slate-700/80 shadow-sm flex items-center justify-center text-amber-400 hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all"
                title="Toggle Dark / Light Mode"
              >
                {theme === 'dark' ? <Icons.Sun size={16} /> : <Icons.Moon size={16} className="text-indigo-400" />}
              </button>

              {/* Sync Hubs Button */}
              <button 
                onClick={() => syncAllGroupsMemberCount(token)} 
                disabled={isScanning} 
                className="h-9 px-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white rounded-2xl shadow-md shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2 font-bold text-xs"
                title="Refresh Telegram Hubs Data"
              >
                <Icons.Refresh size={14} className={isScanning ? 'animate-spin' : ''} />
                <span className="text-[11px] font-black tracking-wide hidden sm:inline">Sync Hubs</span>
              </button>
            </div>
          </div>
        </header>

        <div 
          className="relative min-h-[70vh]"
        >
          {activeTab === 'dashboard' && (
            <div className={`space-y-4 sm:space-y-5 ${animationClass}`}>
              {/* Top Bot Identity & Quick Controls Card */}
              <section
                aria-label="Active Bot Summary"
                className="relative rounded-[1.75rem] bg-gradient-to-br from-[#F0F3FF] via-white to-[#EEF4FF] dark:from-slate-900 dark:via-slate-900/95 dark:to-indigo-950/50 border-[1.5px] border-indigo-200/80 dark:border-indigo-500/25 p-4 sm:p-5 shadow-[0_8px_28px_-8px_rgba(99,102,241,0.16)] overflow-hidden"
              >
                <div className="absolute -right-6 -bottom-6 opacity-[0.06] dark:opacity-[0.07] text-indigo-600 dark:text-indigo-400 pointer-events-none select-none">
                  <Icons.Radio size={135} strokeWidth={1.2} />
                </div>

                <div className="relative z-10 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-md shadow-blue-500/20 shrink-0">
                      <img
                        src="/logo.jpg"
                        alt={botInfo?.first_name || 'TeleBridge Pro'}
                        referrerPolicy="no-referrer"
                        className="w-full h-full rounded-[14px] object-cover bg-white"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                          {botInfo?.first_name || 'TeleBridge Pro'}
                        </h2>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          ACTIVE & LIVE
                        </span>
                        <button
                          type="button"
                          onClick={() => syncAllGroupsMemberCount(token)}
                          disabled={isScanning}
                          className="px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 active:scale-95 transition-all flex items-center gap-1 text-[9px] font-black uppercase tracking-wider shrink-0 disabled:opacity-60 shadow-xs"
                        >
                          <Icons.Refresh size={10} className={isScanning ? 'animate-spin' : ''} strokeWidth={2.5} />
                          <span>{isScanning ? 'SYNCING...' : 'SYNC HUBS'}</span>
                        </button>
                      </div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        @{botInfo?.username || 'telebridge_bot'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interactive Quick Controls Single Line */}
                <div className="relative z-10 flex items-center gap-2 mt-4 pt-3.5 border-t border-indigo-100/90 dark:border-slate-800 overflow-x-auto custom-scrollbar whitespace-nowrap pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !autoWelcome;
                      setAutoWelcome(next);
                      showNotification(`Auto-Welcome turned ${next ? 'ON' : 'OFF'}`, 'info');
                    }}
                    className={`min-h-[34px] px-3.5 py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 transition-all duration-200 hover:scale-[1.02] active:scale-95 shrink-0 shadow-xs ${
                      autoWelcome
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-500/35 dark:text-emerald-300'
                        : 'bg-white/90 border-slate-200/90 text-slate-600 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icons.Zap size={12} strokeWidth={2.5} />
                    <span>Welcome: {autoWelcome ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !autoCleanServiceMessages;
                      setAutoCleanServiceMessages(next);
                      showNotification(`Auto-Clean turned ${next ? 'ON' : 'OFF'}`, 'info');
                    }}
                    className={`min-h-[34px] px-3.5 py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 transition-all duration-200 hover:scale-[1.02] active:scale-95 shrink-0 shadow-xs ${
                      autoCleanServiceMessages
                        ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-500/15 dark:border-amber-500/35 dark:text-amber-300'
                        : 'bg-white/90 border-slate-200/90 text-slate-600 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icons.Trash2 size={12} strokeWidth={2.5} />
                    <span>Auto-Clean: {autoCleanServiceMessages ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !autoApproveJoinRequest;
                      setAutoApproveJoinRequest(next);
                      showNotification(`Auto-Approve turned ${next ? 'ON' : 'OFF'}`, 'info');
                    }}
                    className={`min-h-[34px] px-3.5 py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 transition-all duration-200 hover:scale-[1.02] active:scale-95 shrink-0 shadow-xs ${
                      autoApproveJoinRequest
                        ? 'bg-fuchsia-50 border-fuchsia-300 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:border-fuchsia-500/35 dark:text-fuchsia-300'
                        : 'bg-white/90 border-slate-200/90 text-slate-600 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icons.UserCheck size={12} strokeWidth={2.5} />
                    <span>Auto-Approve: {autoApproveJoinRequest ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('settings')}
                    className={`min-h-[34px] px-3.5 py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 transition-all duration-200 hover:scale-[1.02] active:scale-95 shrink-0 shadow-xs ${
                      webhookActive
                        ? 'bg-cyan-50 border-cyan-300 text-cyan-700 dark:bg-cyan-500/15 dark:border-cyan-500/35 dark:text-cyan-300'
                        : 'bg-white/90 border-cyan-200/80 text-cyan-700 dark:bg-slate-800/80 dark:border-cyan-500/30 dark:text-cyan-300'
                    }`}
                  >
                    <Icons.Clock size={12} strokeWidth={2.5} />
                    <span>Webhook: {webhookActive ? 'LIVE' : 'SETUP'}</span>
                  </button>
                </div>
              </section>



              {/* 2-Column Pastel Bento Cards with Icon Watermarks */}
              <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
                {/* Card 1: Total Network (Violet) */}
                <button
                  type="button"
                  onClick={() => handleTabChange('groups')}
                  className="text-left bg-[#F5F2FF] dark:bg-violet-950/25 border-[1.5px] border-violet-200/85 dark:border-violet-500/25 rounded-[1.5rem] p-4 sm:p-5 shadow-[0_6px_22px_-8px_rgba(124,58,237,0.14)] relative overflow-hidden group hover:-translate-y-0.5 active:scale-[0.985] transition-all"
                >
                  <div className="absolute -right-3 -bottom-4 opacity-[0.11] dark:opacity-[0.10] text-violet-600 dark:text-violet-400 pointer-events-none select-none group-hover:scale-105 transition-transform duration-300">
                    <Icons.Users size={92} strokeWidth={1.5} />
                  </div>
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-500/25 shrink-0">
                          <Icons.Users size={20} strokeWidth={2.2} />
                        </div>
                        <span className="px-2 py-0.5 rounded-lg bg-violet-200/60 dark:bg-violet-500/20 text-[10px] font-extrabold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                          Network
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] font-extrabold text-violet-700 dark:text-violet-300 uppercase tracking-wider mb-1">
                        Total Members
                      </p>
                      <p className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tabular-nums tracking-tight leading-none">
                        {totalMembers.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-1 text-violet-700 dark:text-violet-300">
                      <span className="text-xs font-bold truncate">Manage Hubs</span>
                      <Icons.ArrowRight size={15} className="shrink-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>

                {/* Card 2: Active Batches (Cyan) */}
                <button
                  type="button"
                  onClick={() => handleTabChange('groups')}
                  className="text-left bg-[#ECFAFE] dark:bg-cyan-950/25 border-[1.5px] border-cyan-200/85 dark:border-cyan-500/25 rounded-[1.5rem] p-4 sm:p-5 shadow-[0_6px_22px_-8px_rgba(6,182,212,0.14)] relative overflow-hidden group hover:-translate-y-0.5 active:scale-[0.985] transition-all"
                >
                  <div className="absolute -right-3 -bottom-4 opacity-[0.11] dark:opacity-[0.10] text-cyan-600 dark:text-cyan-400 pointer-events-none select-none group-hover:scale-105 transition-transform duration-300">
                    <Icons.Database size={92} strokeWidth={1.5} />
                  </div>
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-cyan-500 text-white flex items-center justify-center shadow-md shadow-cyan-500/25 shrink-0">
                          <Icons.Database size={20} strokeWidth={2.2} />
                        </div>
                        <span className="px-2 py-0.5 rounded-lg bg-cyan-200/60 dark:bg-cyan-500/20 text-[10px] font-extrabold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">
                          Connected
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] font-extrabold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider mb-1">
                        Active Batches
                      </p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tabular-nums tracking-tight leading-none">
                          {groups.length}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                          / {folders.length} folders
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-1 text-cyan-700 dark:text-cyan-300">
                      <span className="text-xs font-bold truncate">Target Groups</span>
                      <Icons.ArrowRight size={15} className="shrink-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>

                {/* Card 3: Joins Today (Magenta / Fuchsia) */}
                <button
                  type="button"
                  onClick={() => handleTabChange('analysis')}
                  className="text-left bg-[#FDF2FA] dark:bg-fuchsia-950/25 border-[1.5px] border-fuchsia-200/85 dark:border-fuchsia-500/25 rounded-[1.5rem] p-4 sm:p-5 shadow-[0_6px_22px_-8px_rgba(217,70,239,0.14)] relative overflow-hidden group hover:-translate-y-0.5 active:scale-[0.985] transition-all"
                >
                  <div className="absolute -right-3 -bottom-4 opacity-[0.11] dark:opacity-[0.10] text-fuchsia-600 dark:text-fuchsia-400 pointer-events-none select-none group-hover:scale-105 transition-transform duration-300">
                    <Icons.TrendingUp size={92} strokeWidth={1.5} />
                  </div>
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-fuchsia-500 text-white flex items-center justify-center shadow-md shadow-fuchsia-500/25 shrink-0">
                          <Icons.TrendingUp size={20} strokeWidth={2.2} />
                        </div>
                        <span className="px-2 py-0.5 rounded-lg bg-fuchsia-200/60 dark:bg-fuchsia-500/20 text-[10px] font-extrabold text-fuchsia-700 dark:text-fuchsia-300 uppercase tracking-wider">
                          Today
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] font-extrabold text-fuchsia-700 dark:text-fuchsia-300 uppercase tracking-wider mb-1">
                        Joins Tracked
                      </p>
                      <p className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tabular-nums tracking-tight leading-none">
                        {joinsTodayCount.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-1 text-fuchsia-700 dark:text-fuchsia-300">
                      <span className="text-xs font-bold truncate">View Analytics</span>
                      <Icons.ArrowRight size={15} className="shrink-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>

                {/* Card 4: Security Audit (Warm Amber) */}
                <button
                  type="button"
                  onClick={() => handleTabChange('analysis')}
                  className="text-left bg-[#FFF9EB] dark:bg-amber-950/25 border-[1.5px] border-amber-200/85 dark:border-amber-500/25 rounded-[1.5rem] p-4 sm:p-5 shadow-[0_6px_22px_-8px_rgba(245,158,11,0.14)] relative overflow-hidden group hover:-translate-y-0.5 active:scale-[0.985] transition-all"
                >
                  <div className="absolute -right-3 -bottom-4 opacity-[0.11] dark:opacity-[0.10] text-amber-600 dark:text-amber-400 pointer-events-none select-none group-hover:scale-105 transition-transform duration-300">
                    <Icons.ShieldCheck size={92} strokeWidth={1.5} />
                  </div>
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
                          <Icons.ShieldCheck size={20} strokeWidth={2.2} />
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                            bannedUsers.length > 0
                              ? 'bg-rose-500 text-white'
                              : 'bg-amber-200/65 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {bannedUsers.length > 0 ? `${bannedUsers.length} Blocked` : 'Shield'}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1">
                        Audit Log
                      </p>
                      <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight leading-none truncate">
                        {joinEvents.length.toLocaleString()} Events
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-1 text-amber-700 dark:text-amber-300">
                      <span className="text-xs font-bold truncate">Inspect Audit</span>
                      <Icons.ArrowRight size={15} className="shrink-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>

                {/* Card 5: Batch Folders (Royal Blue) */}
                <button
                  type="button"
                  onClick={() => handleTabChange('folders')}
                  className="text-left bg-[#EFF5FF] dark:bg-blue-950/25 border-[1.5px] border-blue-200/85 dark:border-blue-500/25 rounded-[1.5rem] p-4 sm:p-5 shadow-[0_6px_22px_-8px_rgba(37,99,235,0.14)] relative overflow-hidden group hover:-translate-y-0.5 active:scale-[0.985] transition-all"
                >
                  <div className="absolute -right-3 -bottom-4 opacity-[0.11] dark:opacity-[0.10] text-blue-600 dark:text-blue-400 pointer-events-none select-none group-hover:scale-105 transition-transform duration-300">
                    <Icons.Folder size={92} strokeWidth={1.5} />
                  </div>
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                          <Icons.Folder size={20} strokeWidth={2.2} />
                        </div>
                        <span className="px-2 py-0.5 rounded-lg bg-blue-200/60 dark:bg-blue-500/20 text-[10px] font-extrabold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                          Folders
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] font-extrabold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">
                        Batch Folders
                      </p>
                      <p className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tabular-nums tracking-tight leading-none">
                        {folders.length}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-1 text-blue-700 dark:text-blue-300">
                      <span className="text-xs font-bold truncate">Open Folders</span>
                      <Icons.ArrowRight size={15} className="shrink-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>

                {/* Card 6: Bot Sync Engine (Emerald Mint) */}
                <button
                  type="button"
                  onClick={() => syncAllGroupsMemberCount(token)}
                  disabled={isScanning}
                  className="text-left bg-[#ECFDF5] dark:bg-emerald-950/25 border-[1.5px] border-emerald-200/85 dark:border-emerald-500/25 rounded-[1.5rem] p-4 sm:p-5 shadow-[0_6px_22px_-8px_rgba(16,185,129,0.14)] relative overflow-hidden group hover:-translate-y-0.5 active:scale-[0.985] transition-all disabled:opacity-75"
                >
                  <div className="absolute -right-3 -bottom-4 opacity-[0.11] dark:opacity-[0.10] text-emerald-600 dark:text-emerald-400 pointer-events-none select-none group-hover:scale-105 transition-transform duration-300">
                    <Icons.Activity size={92} strokeWidth={1.5} />
                  </div>
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                          <Icons.Refresh size={20} strokeWidth={2.2} className={isScanning ? 'animate-spin' : ''} />
                        </div>
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wider">
                          {isScanning ? 'Syncing' : 'Running'}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1">
                        Sync Engine
                      </p>
                      <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-tight truncate">
                        {isScanning ? 'Syncing...' : botInfo ? 'Active & Live' : 'Ready'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-1 text-emerald-700 dark:text-emerald-300">
                      <span className="text-xs font-bold truncate">Run Full Sync</span>
                      <Icons.ArrowRight size={15} className="shrink-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              </div>

              {/* Fast Batch Injection Card - Matching Light Pastel Aesthetic */}
              <section
                aria-label="Fast Batch Injection"
                className="relative rounded-[1.75rem] bg-[#F8FAFC] dark:bg-slate-900/90 border-[1.5px] border-indigo-200/80 dark:border-indigo-500/25 p-5 sm:p-6 shadow-[0_8px_28px_-8px_rgba(99,102,241,0.12)] overflow-hidden group"
              >
                <div className="absolute -right-5 -bottom-6 opacity-[0.08] dark:opacity-[0.07] text-indigo-600 dark:text-indigo-400 pointer-events-none select-none group-hover:scale-105 transition-transform duration-500">
                  <Icons.Zap size={140} strokeWidth={1.3} />
                </div>

                <div className="relative z-10 flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
                      <Icons.Zap size={21} strokeWidth={2.4} />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Quick Hub Uplink
                      </p>
                      <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Fast Batch Injection
                      </h3>
                    </div>
                  </div>
                  <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-indigo-100/80 dark:bg-indigo-500/15 text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    Chat ID
                  </span>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-4 flex items-center text-indigo-500/70 pointer-events-none">
                      <Icons.Hash size={16} strokeWidth={2.5} />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter Chat ID (e.g. -1001234567890)"
                      className="w-full min-h-[46px] bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/80 pl-10 pr-4 py-3 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
                      value={newChatId}
                      onChange={e => setNewChatId(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddGroupManual}
                    disabled={isAddingGroup || !newChatId}
                    className="min-h-[46px] px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-500/25 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                  >
                    {isAddingGroup ? (
                      <>
                        <Icons.Refresh size={16} className="animate-spin" />
                        <span>Injecting...</span>
                      </>
                    ) : (
                      <>
                        <span>Inject Hub</span>
                        <Icons.ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </section>

              {/* Revoke Invite Link Card (At the very bottom) */}
              <section
                aria-label="Revoke Invite Link"
                className="relative rounded-[1.75rem] bg-[#F8FAFC] dark:bg-slate-900/90 border-[1.5px] border-rose-200/80 dark:border-rose-500/25 p-5 sm:p-6 shadow-[0_8px_28px_-8px_rgba(244,63,94,0.12)] overflow-hidden group"
              >
                <div className="absolute -right-5 -bottom-6 opacity-[0.08] dark:opacity-[0.07] text-rose-600 dark:text-rose-400 pointer-events-none select-none group-hover:scale-105 transition-transform duration-500">
                  <Icons.Link size={140} strokeWidth={1.3} />
                </div>

                <div className="relative z-10 flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-600 to-pink-600 text-white flex items-center justify-center shadow-md shadow-rose-500/25 shrink-0">
                      <Icons.Link size={21} strokeWidth={2.4} />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        Link Security
                      </p>
                      <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Revoke Invite Link
                      </h3>
                    </div>
                  </div>
                  <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-rose-100/80 dark:bg-rose-500/15 text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                    Revoke
                  </span>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-4 flex items-center text-rose-500/70 pointer-events-none">
                      <Icons.Link size={16} strokeWidth={2.5} />
                    </div>
                    <input
                      type="text"
                      placeholder="Paste invite link to revoke (e.g. https://t.me/+...)"
                      className="w-full min-h-[46px] bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/80 pl-10 pr-4 py-3 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
                      value={linkToRevoke}
                      onChange={e => setLinkToRevoke(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRevokeLink}
                    disabled={!linkToRevoke}
                    className="min-h-[46px] px-7 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-rose-500/25 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <span>Revoke Link</span>
                    <Icons.ArrowRight size={16} />
                  </button>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'groups' && (
            <div className={`space-y-6 ${animationClass}`}>
                <div className="flex gap-2">
                  <div className="relative group flex-1 min-w-0">
                    <div className="relative flex items-center bg-white/70 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 border-b-[4px] border-b-slate-300 dark:border-b-slate-800 rounded-[1.5rem] shadow-sm focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/50 transition-all">
                      <div className="pl-4 text-slate-400">
                        <Icons.Search size={15} />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Search active batches..." 
                        className="flex-1 bg-transparent py-2.5 px-3 text-xs outline-none font-bold"
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)} 
                        onFocus={() => setShowRecentSearches(true)}
                        onBlur={() => setTimeout(() => setShowRecentSearches(false), 350)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchQuery.trim()) {
                            const trimmed = searchQuery.trim();
                            setRecentSearches(prev => [trimmed, ...prev.filter(s => s !== trimmed)].slice(0, 10));
                            setShowRecentSearches(false);
                          }
                        }}
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="pr-4 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Icons.X size={15} />
                        </button>
                      )}
                    </div>
                    {showRecentSearches && recentSearches.length > 0 && (
                      <div className="flex flex-row gap-1.5 overflow-x-auto py-1.5 mt-2 custom-scrollbar max-w-full">
                        <span className="text-[8px] font-black text-slate-400 uppercase whitespace-nowrap self-center sticky left-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm pr-2 z-10">Recent:</span>
                        {recentSearches.map((s, i) => {
                          const colors = [
                            'from-pink-500/10 to-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/30',
                            'from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30',
                            'from-purple-500/10 to-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-purple-200/50 dark:border-purple-900/30',
                            'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30',
                            'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30'
                          ];
                          const colorClass = colors[i % colors.length];
                          return (
                            <button 
                              key={i} 
                              onClick={() => {
                                setSearchQuery(s);
                                setShowRecentSearches(false);
                              }} 
                              className={`px-3 py-1 rounded-xl text-[9px] whitespace-nowrap transition-all font-black border shadow-sm hover:scale-105 active:scale-95 bg-gradient-to-r ${colorClass}`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button 
                      onClick={() => setShowFilterMenu(!showFilterMenu)} 
                      className={`flex items-center gap-1.5 p-2.5 rounded-[1.5rem] border shadow-sm hover:brightness-105 active:scale-95 transition-all
                        ${filterOption !== 'recent' 
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500 border-b-[4px] border-b-indigo-800' 
                          : 'bg-white/70 dark:bg-slate-900/40 backdrop-blur-md border-slate-200/60 dark:border-slate-800/60 border-b-[4px] border-b-slate-300 dark:border-b-slate-800 text-slate-600 dark:text-slate-400'}`}
                    >
                      <Icons.Filter size={15} />
                      {filterOption !== 'recent' && (
                        <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">
                          {filterOption.replace(/([A-Z])/g, ' $1')}
                        </span>
                      )}
                    </button>
                    {showFilterMenu && (
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xl z-20 py-1.5 overflow-hidden">
                        <p className="px-3.5 py-1 text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 mb-1">Sort & Filter</p>
                        {[
                          { id: 'recent', label: 'Last Active', icon: <Icons.Zap size={11} /> },
                          { id: 'newAdded', label: 'Newly Added', icon: <Icons.PlusCircle size={11} /> },
                          { id: 'activeToday', label: 'Active Today', icon: <Icons.Activity size={11} /> },
                          { id: 'frequent', label: 'Most Frequent', icon: <Icons.BarChart size={11} /> },
                          { id: 'mostMembers', label: 'Biggest Community', icon: <Icons.Users size={11} /> },
                          { id: 'leastMembers', label: 'Smallest Community', icon: <Icons.User size={11} /> },
                        ].map(opt => (
                          <button 
                            key={opt.id} 
                            onClick={() => { setFilterOption(opt.id as any); setShowFilterMenu(false); }} 
                            className={`w-full text-left px-3.5 py-2 text-xs font-black flex items-center gap-2.5 transition-colors ${filterOption === opt.id ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                          >
                            <span className={filterOption === opt.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}>{opt.icon}</span>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGroups.length > 0 ? (
                    (() => {
                      // Stable Serial Number Calculation: Always sort by createdAt to keep IDs persistent
                      const masterSortedGroups = [...groups].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                      return filteredGroups.map((g) => {
                        const stableIdx = masterSortedGroups.findIndex(item => item.id === g.id);
                        return (
                          <GroupCard 
                            key={g.id} 
                            group={g} 
                            index={stableIdx >= 0 ? stableIdx : 0} 
                            onClick={() => {
                              handleOpenGroupModal(g);
                              if (searchQuery.trim()) {
                                const trimmed = searchQuery.trim();
                                setRecentSearches(prev => [trimmed, ...prev.filter(s => s !== trimmed)].slice(0, 10));
                              }
                            }} 
                            onTogglePin={handleTogglePin} 
                          />
                        );
                      });
                    })()
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

          {activeTab === 'folders' && (
            <div className={`space-y-6 ${animationClass}`}>
              {activeFolderId === null ? (
                /* 1. Main Folder List View (No outer container box, compact folder cards, large prominent icon) */
                <div className="relative">
                  <div className="flex flex-row items-center justify-between gap-2 mb-5 px-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-base sm:text-lg">📂</span>
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-500 truncate">Organized Batch Vault</p>
                      </div>
                      <h2 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate">Batch Folders</h2>
                    </div>

                    <button
                      onClick={handleOpenCreateFolderModal}
                      className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl shadow-md shadow-amber-500/25 active:scale-95 transition-all text-xs font-black tracking-wide whitespace-nowrap"
                    >
                      <span className="text-sm sm:text-base leading-none font-bold">+</span>
                      <span>Create Folder</span>
                    </button>
                  </div>

                  {/* Compact Folders List (Small boxes with large prominent folder icon) */}
                  {folders.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-24">
                      {folders.map(folder => {
                        const count = folder.batchIds.length;
                        return (
                           <div
                             key={folder.id}
                             onClick={() => handleOpenFolder(folder.id)}
                             className="bg-white hover:bg-slate-50 dark:bg-slate-900/80 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between group relative overflow-hidden"
                           >
                             {/* Background Watermark */}
                             <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700">
                               <Icons.Folder size={80} strokeWidth={1.5} />
                             </div>
                             
                             <div className="flex items-center gap-3 truncate relative z-10">
                               <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${folder.color} flex items-center justify-center text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform text-2xl`}>
                                 {folder.name.split(' ').pop()}
                               </div>
                               <div className="truncate">
                                 <h3 className="text-xs font-extrabold text-slate-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">{folder.name.split(' ').slice(0, -1).join(' ')}</h3>
                                 <p className="text-[10px] text-slate-400 font-bold">{count} {count === 1 ? 'batch' : 'batches'}</p>
                               </div>
                             </div>
                             <div className="flex items-center gap-1.5 relative z-20">
                               <button
                                 type="button"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   e.preventDefault();
                                   handleOpenConfirmModal({
                                     title: 'Delete Folder',
                                     message: `Are you sure you want to delete folder "${folder.name}"? This action is permanent.`,
                                     onConfirm: () => {
                                       setFolders(prev => prev.filter(f => f.id !== folder.id));
                                       fetch(`/api/folders/${folder.id}`, { method: 'DELETE' })
                                         .catch(e => console.error("Failed to delete folder from DB:", e));
                                       showNotification('Folder deleted successfully', 'info');
                                     }
                                   });
                                 }}
                                 className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                                 title="Delete Folder"
                               >
                                 <Icons.Trash size={16} />
                               </button>
                              <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 px-4 text-slate-400 text-xs bg-white dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 mb-20 flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl">
                        📂
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Folders Created Yet</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Click "Create Folder" at the top to organize your batches</p>
                      </div>
                      <button
                        onClick={handleOpenCreateFolderModal}
                        className="mt-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                      >
                        + Create Your First Folder
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* 2. Folder Detail Sub-Page (Shows Batches inside this folder) */
                (() => {
                  const currentFolder = folders.find(f => f.id === activeFolderId);
                  if (!currentFolder) {
                    handleCloseFolder();
                    return null;
                  }
                  const folderBatches = groups.filter(g => currentFolder.batchIds.includes(g.id));
                  return (
                    <div className="relative">
                      {/* Back button & Folder Header */}
                      <div className="flex flex-row items-center justify-between gap-2 mb-4 px-1">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={handleCloseFolder}
                            className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm shrink-0"
                            title="Back to Folders"
                          >
                            ←
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="text-xs">📂</span>
                              <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 hidden sm:inline">Folder View</span>
                            </div>
                            <h2 className="text-base md:text-lg font-black tracking-tight text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-xs">{currentFolder.name}</h2>
                          </div>
                        </div>

                        {/* Folder Delete Action */}
                        <div className="flex items-center shrink-0">
                          <button
                            onClick={() => {
                              handleOpenConfirmModal({
                                title: 'Delete Folder',
                                message: `Are you sure you want to delete folder "${currentFolder.name}"?`,
                                 onConfirm: () => {
                                   setFolders(prev => prev.filter(f => f.id !== currentFolder.id));
                                   fetch(`/api/folders/${currentFolder.id}`, { method: 'DELETE' })
                                     .catch(e => console.error("Failed to delete folder from DB:", e));
                                   handleCloseFolder();
                                   showNotification('Folder deleted successfully', 'info');
                                 }
                              });
                            }}
                            className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 text-rose-600 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                            title="Delete Folder"
                          >
                            <Icons.Trash size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Searchable Add Batch to Folder Section */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 mb-4 shadow-sm space-y-2">
                        <div className="flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-1.5 flex-1 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                            <Icons.Search size={12} className="text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search batches to add..."
                              value={folderSearchQuery}
                              onChange={e => setFolderSearchQuery(e.target.value)}
                              className="w-full bg-transparent text-[10px] font-bold outline-none text-slate-900 dark:text-white"
                            />
                          </div>
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline shrink-0">
                            {groups.filter(g => !currentFolder.batchIds.includes(g.id) && normalizeText(g.name).includes(normalizeText(folderSearchQuery))).length} Avail
                          </span>
                        </div>

                        {folderSearchQuery.trim() && (
                          <div className="max-h-40 overflow-y-auto space-y-1 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                            {groups
                              .filter(g => !currentFolder.batchIds.includes(g.id) && normalizeText(g.name).includes(normalizeText(folderSearchQuery)))
                              .map(group => (
                                <div key={group.id} className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-slate-950 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
                                  <div className="flex items-center gap-2 truncate">
                                    <img src={group.image} alt="" className="w-5 h-5 rounded-md object-cover" />
                                    <div className="truncate">
                                      <p className="text-[10px] font-bold text-slate-900 dark:text-white truncate">{group.name}</p>
                                      <p className="text-[8px] text-slate-400 leading-none">{group.memberCount} members</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setFolders(prev => {
                                        const updated = prev.map(f => f.id === currentFolder.id ? { ...f, batchIds: [...f.batchIds, group.id] } : f);
                                        const updatedFolder = updated.find(f => f.id === currentFolder.id);
                                        if (updatedFolder) {
                                          fetch('/api/folders', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(updatedFolder)
                                          }).catch(e => console.error("Failed to sync folder update to DB:", e));
                                        }
                                        return updated;
                                      });
                                      showNotification(`Added "${group.name}" to folder 📂`, 'success');
                                    }}
                                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[9px] font-black uppercase tracking-wider transition-all shadow-sm"
                                  >
                                    + Add
                                  </button>
                                </div>
                              ))}
                            {groups.filter(g => !currentFolder.batchIds.includes(g.id) && normalizeText(g.name).toLowerCase().includes(normalizeText(folderSearchQuery).toLowerCase())).length === 0 && (
                              <p className="text-center py-3 text-[10px] text-slate-400 italic">No matching batches found.</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 3D Decorated Batches List inside this folder */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {folderBatches.length > 0 ? (
                          folderBatches.map(batch => (
                            <div
                              key={batch.id}
                              onClick={() => handleOpenGroupModal(batch)}
                              className="bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950/90 border border-slate-200/90 dark:border-slate-800/90 rounded-[14px] p-2.5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex items-center justify-between group relative overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/5"
                              title="Click to Generate Telegram Link"
                            >
                              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 opacity-90" />
                              <div className="flex items-center gap-2.5 truncate relative z-10">
                                <div className="relative">
                                  <img src={batch.image} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 shadow-sm ring-1 ring-white dark:ring-slate-800 group-hover:scale-105 transition-transform" />
                                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 text-white rounded-full text-[8px] flex items-center justify-center font-black shadow-sm">✓</span>
                                </div>
                                <div className="truncate">
                                  <h4 className="text-[11px] font-black text-slate-900 dark:text-white truncate group-hover:text-amber-500 transition-colors leading-tight mb-0.5">{batch.name}</h4>
                                  <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5 leading-none">
                                    <span>👥 {batch.memberCount.toLocaleString()} members</span>
                                    <span>•</span>
                                    <span className="text-amber-600 dark:text-amber-400">⚡ Link</span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center flex-shrink-0 relative z-10 ml-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleOpenConfirmModal({
                                      title: 'Remove Batch',
                                      message: `Are you sure you want to remove "${batch.name}" from this folder?`,
                                      onConfirm: () => {
                                        setFolders(prev => {
                                        const updated = prev.map(f => f.id === currentFolder.id ? { ...f, batchIds: f.batchIds.filter(id => id !== batch.id) } : f);
                                        const updatedFolder = updated.find(f => f.id === currentFolder.id);
                                        if (updatedFolder) {
                                          fetch('/api/folders', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(updatedFolder)
                                          }).catch(e => console.error("Failed to sync folder update to DB:", e));
                                        }
                                        return updated;
                                      });
                                        showNotification('Batch removed from folder', 'info');
                                      }
                                    });
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                  title="Remove from folder"
                                >
                                  <Icons.X size={12} />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full text-center py-16 text-slate-400 text-xs italic bg-white dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            No batches assigned to this folder yet. Use the dropdown above to add batches!
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className={`space-y-4 ${animationClass}`}>
              {/* Compact Sub-tab Switcher */}
              <div className="flex bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner max-w-lg mb-3">
                <button 
                  onClick={() => setAuditSubTab('audit')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${auditSubTab === 'audit' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-500/10' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <Icons.Activity size={13} strokeWidth={2.5} /> Live Audit
                </button>
                <button 
                  onClick={() => setAuditSubTab('blocked')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${auditSubTab === 'blocked' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm border border-rose-500/10' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <Icons.Shield size={13} strokeWidth={2.5} /> Block List ({bannedUsers.length})
                </button>
                <button 
                  onClick={() => setAuditSubTab('deleted')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${auditSubTab === 'deleted' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm border border-amber-500/10' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <span>🗑️</span> Deleted Bin ({deletedGroups.length})
                </button>
              </div>

              {auditSubTab === 'audit' ? (
                <>
                  {/* Compact Stats Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                     <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-3.5 rounded-2xl shadow-md shadow-indigo-500/15 text-white relative overflow-hidden transition-all group">
                        <div className="flex items-center justify-between mb-1">
                           <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Total Joins</p>
                           <Icons.Activity size={14} className="opacity-60" />
                        </div>
                        <div className="flex items-baseline gap-2">
                           <p className="text-2xl font-black tracking-tight">{filteredJoins.length}</p>
                           <span className="text-[9px] font-semibold opacity-75">captured</span>
                        </div>
                        <p className="text-[8px] font-medium opacity-65 mt-0.5 truncate">{selectedDate}</p>
                        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none" />
                     </div>

                     <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3.5 rounded-2xl shadow-md shadow-emerald-500/15 text-white relative overflow-hidden transition-all group">
                        <div className="flex items-center justify-between mb-1">
                           <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Engine Status</p>
                           <Icons.Zap size={14} className="opacity-60" />
                        </div>
                        <div className="flex items-baseline gap-2">
                           <p className="text-2xl font-black tracking-tight">{isScanning ? 'SYNCING' : 'SECURE'}</p>
                           <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        </div>
                        <p className="text-[8px] font-medium opacity-65 mt-0.5 truncate">{isScanning ? 'Processing Updates' : 'Monitoring Real-time'}</p>
                        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none" />
                     </div>

                     <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-md flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-1.5">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filter By Date</p>
                           <Icons.Calendar size={13} className="text-slate-400" />
                        </div>
                        <input 
                           type="date" 
                           value={selectedDate} 
                           onChange={e => setSelectedDate(e.target.value)} 
                           className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold outline-none rounded-lg py-1.5 px-2.5 w-full focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer" 
                        />
                     </div>
                  </div>

                  {/* Sleek Stream Table */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
                     <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                        <div className="flex items-center gap-2">
                           <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Join Audit Stream</h3>
                           <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                             {filteredJoins.length} events
                           </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Live Flow</span>
                        </div>
                     </div>
                     <div className="overflow-y-auto max-h-[200px] custom-scrollbar">
                       <table className="w-full text-left">
                          <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xl z-20 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                              <th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest w-10">#</th>
                              <th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">User Identity</th>
                              <th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Target Hub</th>
                              <th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                              <th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {filteredJoins.length > 0 ? filteredJoins.map((e, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                <td className="px-3 py-1.5 text-[9px] font-mono font-bold text-slate-400">{idx + 1}</td>
                                <td className="px-3 py-1.5">
                                   <div className="flex items-center gap-2">
                                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black uppercase shadow-xs ${ROW_COLORS[idx % ROW_COLORS.length]} border border-white/20 flex-shrink-0`}>
                                         {e.userName.charAt(0)}
                                      </div>
                                      <div className="min-w-0">
                                         <p className="text-[10px] font-bold text-slate-900 dark:text-white truncate max-w-[140px] leading-tight">{e.userName}</p>
                                         <p className="text-[8px] font-mono text-slate-400 tracking-tighter">ID: {e.userId}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-3 py-1.5">
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[140px] leading-tight">{e.chatTitle}</span>
                                      <span className="text-[7px] font-mono text-slate-400 opacity-60">HUB_{e.chatId.toString().slice(-6)}</span>
                                   </div>
                                </td>
                                <td className="px-3 py-1.5 text-[9px] font-medium text-slate-500 whitespace-nowrap">
                                   {formatTime12h(e.timestamp)}
                                </td>
                                <td className="px-3 py-1.5 text-right">
                                  <div className="flex justify-end gap-1">
                                    <button 
                                      onClick={() => handleRequestKick(e)} 
                                      title="Kick Member" 
                                      className="p-1 text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all active:scale-90"
                                    >
                                      <Icons.LogOut size={13} strokeWidth={2.2}/>
                                    </button>
                                    <button 
                                      onClick={() => handleRequestBan(e)} 
                                      title="Permanent Ban" 
                                      className="p-1 text-rose-600 hover:bg-rose-600/10 rounded-lg transition-all active:scale-90"
                                    >
                                      <Icons.Ban size={13} strokeWidth={2.2}/>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={5} className="py-10 text-center">
                                  <div className="flex flex-col items-center gap-1.5 opacity-40">
                                    <Icons.Activity size={24} />
                                    <p className="text-[10px] font-bold uppercase tracking-wider">No audit data for this date</p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                       </table>
                     </div>
                  </div>
                </>
              ) : auditSubTab === 'blocked' ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 flex items-center justify-between">
                      <div>
                        <h2 className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">Shield Protection</h2>
                        <p className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Blacklisted Entity Management</p>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shadow-xs">
                         <Icons.Shield size={16} strokeWidth={2.5} />
                      </div>
                    </div>
                    
                    <div className="p-0 overflow-x-auto max-h-[380px] custom-scrollbar">
                      {bannedUsers.length === 0 ? (
                        <div className="py-10 text-center">
                          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-inner">
                             <Icons.CheckCircle className="text-emerald-500" size={22} strokeWidth={2} />
                          </div>
                          <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-xs">Vault is Empty</h3>
                          <p className="text-[9px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">No active bans in database</p>
                        </div>
                      ) : (
                        <table className="w-full text-left">
                          <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xl z-20 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                              <th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Target ID</th>
                              <th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Subject Name</th>
                              <th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Origin Hub</th>
                              <th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Incident Date</th>
                              <th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Relief</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {bannedUsers.map((user, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                <td className="px-3 py-2">
                                  <span className="text-[8px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-slate-700/50">{user.userId}</span>
                                </td>
                                <td className="px-3 py-2">
                                  <div className="text-[10px] font-bold text-slate-900 dark:text-white truncate max-w-[140px]">{user.userName}</div>
                                </td>
                                <td className="px-3 py-2">
                                  <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 truncate max-w-[140px]">{user.chatTitle}</div>
                                  <div className="text-[7px] font-mono text-slate-400 opacity-60 tracking-tighter">ID: {user.chatId}</div>
                                </td>
                                <td className="px-3 py-2 text-[9px] font-medium text-slate-500 whitespace-nowrap">
                                  {new Date(user.timestamp).toLocaleString('en-CA', { dateStyle: 'short', timeStyle: 'short' })}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <button 
                                    onClick={() => handleUnban(user)}
                                    className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[8px] font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all inline-flex items-center gap-1"
                                  >
                                    <Icons.RefreshCw size={10} strokeWidth={2.5} />
                                    <span>Pardon</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 flex items-center justify-between">
                      <div>
                        <h2 className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">Deleted & Unacceptable Bin ({deletedGroups.length})</h2>
                        <p className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Auto-deletion countdown in 30 days</p>
                      </div>
                      <div className="flex items-center gap-2">
                         {deletedGroups.length > 0 && (
                           <button onClick={handleEmptyTrash} className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 border border-rose-500/20 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all">
                             Empty Trash
                           </button>
                         )}
                         <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-xs">
                            <span>🗑️</span>
                         </div>
                      </div>
                    </div>
                    
                    <div className="p-4 overflow-x-auto max-h-[380px] custom-scrollbar space-y-3">
                      {deletedGroups.length === 0 ? (
                        <div className="py-10 text-center">
                          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-inner">
                             <Icons.CheckCircle className="text-emerald-500" size={22} strokeWidth={2} />
                          </div>
                          <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-xs">Bin is Empty</h3>
                          <p className="text-[9px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">No unacceptable or bad request groups</p>
                        </div>
                      ) : (
                        deletedGroups.map((dg, idx) => {
                          const daysLeft = Math.max(1, 30 - Math.floor((Date.now() - (dg.deletedAt || Date.now())) / (24 * 60 * 60 * 1000)));
                          return (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3 truncate">
                                <img src={dg.image} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                                <div className="truncate">
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{dg.name}</h4>
                                  <p className="text-[10px] text-rose-500 font-semibold truncate">Removal Reason: {dg.errorReason || 'Bad request / Unaccessible'}</p>
                                  <p className="text-[8px] font-mono text-slate-400">ID: {dg.id} • ⏳ Countdown: <span className="text-amber-500 font-bold">{daysLeft} days remaining</span> until DB purge</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                <button 
                                  onClick={() => {
                                    setDeletedGroups(prev => prev.filter(d => d.id !== dg.id));
                                    setGroups(prev => [...prev, { ...dg, createdAt: Date.now() }]);
                                    fetch('/api/groups', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify(dg)
                                    }).catch(e => console.error("Failed to restore group:", e));
                                    showNotification(`Restored "${dg.name}" successfully!`, 'success');
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all"
                                >
                                  Restore
                                </button>
                                 <button 
                                  onClick={() => {
                                    handleOpenConfirmModal({
                                      title: 'Delete Permanently',
                                      message: `Permanently delete "${dg.name}" from database immediately?`,
                                      onConfirm: () => {
                                        setDeletedGroups(prev => prev.filter(d => d.id !== dg.id));
                                        // Also delete from server
                                        fetch(`/api/groups/${dg.id}`, { method: 'DELETE' })
                                          .catch(e => console.error("Failed to permanently delete group:", e));
                                        showNotification('Group permanently deleted', 'info');
                                      }
                                    });
                                  }}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                </div>
              )}
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
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                <button 
                  onClick={() => setSettingsSubTab('charts')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${settingsSubTab === 'charts' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm scale-[1.01]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <Icons.BarChart3 size={10} /> Analytics
                </button>
                <button 
                  onClick={() => setSettingsSubTab('config')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${settingsSubTab === 'config' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm scale-[1.01]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <Icons.Settings size={10} /> Configuration
                </button>
                <button 
                  onClick={() => setSettingsSubTab('admins')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${settingsSubTab === 'admins' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm scale-[1.01]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <Icons.Shield size={10} /> Bot Admins
                </button>
              </div>

              {settingsSubTab === 'charts' && (
                <>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Analysis Period</h3>
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {(['1W', '1M', '1Y', 'CUSTOM'] as const).map(range => (
                          <button
                            key={range}
                            onClick={() => setAnalyticsRange(range)}
                            className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${analyticsRange === range ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {analyticsRange === 'CUSTOM' && (
                      <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Start Date</p>
                          <input 
                            type="date" 
                            value={analysisStartDate} 
                            onChange={e => setAnalysisStartDate(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">End Date</p>
                          <input 
                            type="date" 
                            value={analysisEndDate} 
                            onChange={e => setAnalysisEndDate(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Channel Analytics</h2>
                          {analyticsRange !== 'CUSTOM' && (
                            <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1 ${comparisonStats.weekTrend >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                              {comparisonStats.weekTrend >= 0 ? <Icons.TrendingUp size={10} /> : <Icons.TrendingUp size={10} className="rotate-180" />}
                              {Math.abs(comparisonStats.weekTrend)}%
                            </div>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                          <p className="text-3xl font-black tracking-tighter">
                            {analyticsRange === 'CUSTOM' ? processedChartData.reduce((acc, curr) => acc + curr.count, 0) : comparisonStats.thisWeek}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">
                            {analyticsRange === 'CUSTOM' ? 'Total Joins in Period' : 'Joins this week'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="h-[180px] w-full -ml-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={processedChartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis 
                            dataKey="date" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                            tickFormatter={(str) => {
                              const d = new Date(str);
                              if (analyticsRange === '1W') return d.toLocaleDateString('en-GB', { weekday: 'short' }).charAt(0);
                              if (analyticsRange === '1Y') return d.toLocaleDateString('en-GB', { month: 'short' }).charAt(0);
                              return d.toLocaleDateString('en-GB', { day: 'numeric' });
                            }}
                            minTickGap={20}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#2563eb" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorCount)" 
                            animationDuration={1000}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center italic">Continuous Monitoring Active</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">

                  </div>
                </>
              )}

              {settingsSubTab === 'config' && (
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
                    <Icons.Zap size={14} /> Bot Gateway & Customization
                  </h3>
                    
                    {/* Bot Admin Quick Access Banner */}
                    <div className="mb-8 p-5 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-indigo-500/5 rounded-[2rem] border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                          <Icons.Shield size={20} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                            Bot Admin Management
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            Add co-admins by Username/ID & promote across all Telegram groups.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSettingsSubTab('admins')}
                        className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
                      >
                        <Icons.UserPlus size={14} /> Open Admin Manager
                      </button>
                    </div>

                    {/* New Welcome Message Configuration */}
                    <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Automated Welcome Message</h4>
                        <button 
                          onClick={() => setIsWelcomeEnabled(!isWelcomeEnabled)}
                          className={`px-3 py-1 text-[9px] font-black rounded-lg ${isWelcomeEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                        >
                          {isWelcomeEnabled ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </div>
                      <textarea
                        value={welcomeMessage}
                        onChange={e => setWelcomeMessage(e.target.value)}
                        disabled={!isWelcomeEnabled}
                        className="w-full h-24 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Enter the welcome message..."
                      />
                      <p className="text-[8px] font-bold text-slate-400 mt-2">Use {"{{name}}"} to insert the user's name.</p>
                    </div>

                    {/* Core System Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-white dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <Icons.Shield size={20} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Security Guard</h4>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white">Cleanup & Moderation</h3>
                          </div>
                        </div>

                        <div className="space-y-5">
                          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 transition-all hover:border-indigo-500/30">
                            <div>
                              <p className="text-[10px] font-bold text-slate-900 dark:text-slate-200">Group Cleanup</p>
                              <p className="text-[8px] text-slate-500">Auto-purge service messages</p>
                            </div>
                            <button 
                              onClick={() => setAutoCleanServiceMessages(!autoCleanServiceMessages)}
                              className={`w-10 h-6 rounded-full transition-all relative ${autoCleanServiceMessages ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-800'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoCleanServiceMessages ? 'left-5' : 'left-1'} shadow-sm`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 transition-all hover:border-indigo-500/30">
                            <div>
                              <p className="text-[10px] font-bold text-slate-900 dark:text-slate-200">Join Requests</p>
                              <p className="text-[8px] text-slate-500">Auto-approve new users</p>
                            </div>
                            <button 
                              onClick={() => setAutoApproveJoinRequest(!autoApproveJoinRequest)}
                              className={`w-10 h-6 rounded-full transition-all relative ${autoApproveJoinRequest ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-800'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoApproveJoinRequest ? 'left-5' : 'left-1'} shadow-sm`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 transition-all hover:border-indigo-500/30">
                            <div>
                              <p className="text-[10px] font-bold text-slate-900 dark:text-slate-200">Group Welcome</p>
                              <p className="text-[8px] text-slate-500">Auto-greet new members</p>
                            </div>
                            <button 
                              onClick={() => setAutoWelcome(!autoWelcome)}
                              className={`w-10 h-6 rounded-full transition-all relative ${autoWelcome ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-800'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoWelcome ? 'left-5' : 'left-1'} shadow-sm`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 shadow-xl flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Icons.Zap size={20} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Background Services</h4>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white">Active Worker (24/7)</h3>
                          </div>
                        </div>

                        <div className="flex-1 bg-slate-50 dark:bg-white/5 rounded-3xl p-5 border border-slate-100 dark:border-white/5 mb-4">
                          <p className="text-[9px] font-bold text-slate-500 mb-4 leading-relaxed italic">
                            The background worker ensures all automation rules (cleanup, welcome, sync) remain active even when you are offline.
                          </p>
                          <div className="flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${webhookActive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-400/20'}`}>
                              {webhookActive ? 'SYSTEM ACTIVE' : 'WORKER STANDBY'}
                            </span>
                            {webhookActive ? (
                              <button onClick={handleDeleteWebhook} disabled={isProcessingWebhook} className="px-4 py-2 bg-rose-600 text-white text-[9px] font-black uppercase rounded-xl shadow-lg hover:bg-rose-500 active:scale-95 transition-all disabled:opacity-50">Stop Worker</button>
                            ) : (
                              <button onClick={handleSetWebhook} disabled={isProcessingWebhook} className="px-4 py-2 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-xl shadow-lg hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50">Start Worker</button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                           <Icons.AlertCircle size={14} className="text-amber-500 shrink-0" />
                           <p className="text-[8px] font-medium text-amber-600 dark:text-amber-400">Requires bot <span className="underline font-black">Delete Messages</span> permissions for cleanup.</p>
                        </div>
                      </div>
                    </div>

                    {/* Communication & Connection */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                       <div className="lg:col-span-2 bg-white dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 shadow-xl">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                <Icons.Radio size={20} strokeWidth={2.5} />
                              </div>
                              <h3 className="text-sm font-black text-slate-900 dark:text-white">Global Broadcast</h3>
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{broadcasts.length} Sent</span>
                          </div>
                          <textarea 
                            placeholder="Enter broadcast message..." 
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-5 py-4 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-4 focus:ring-indigo-500/20 mb-4 transition-all resize-none shadow-inner"
                            rows={3}
                            value={broadcastMessage}
                            onChange={e => setBroadcastMessage(e.target.value)}
                          />
                          <button 
                            onClick={handleBroadcast}
                            disabled={!broadcastMessage || !token}
                            className="w-full py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl hover:shadow-rose-500/30 active:scale-95 transition-all disabled:opacity-50"
                          >
                            Execute Broadcast
                          </button>
                       </div>

                       <div className="bg-white dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 shadow-xl">
                          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-6">Database Status</h3>
                          <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-slate-500">Pending Batches</span>
                              <span className="font-black text-indigo-500">{pendingGroups.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-slate-500">Pending Joins</span>
                              <span className="font-black text-indigo-500">{pendingJoins.length}</span>
                            </div>
                            <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                               <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(pendingGroups.length + pendingJoins.length) > 0 ? 100 : 0}%` }}></div>
                            </div>
                          </div>
                          <button 
                            onClick={syncDataToDatabase}
                            disabled={isSyncingToDb || (pendingGroups.length === 0 && pendingJoins.length === 0)}
                            className="w-full py-4 bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                          >
                            {isSyncingToDb ? 'Syncing...' : 'Sync to Cloud'}
                          </button>
                       </div>
                    </div>

                    {/* Bot Connection & Identity */}
                    <div className="bg-white dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 shadow-xl mb-8">
                       <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
                            <Icons.Link size={24} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none mb-1">Bot Connection</h3>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Verify & Lock system identity</p>
                          </div>
                       </div>

                       <div className="flex flex-col md:flex-row gap-4">
                         <div className="flex-1 relative group">
                            <input 
                              type="password" 
                              value={token} 
                              onChange={e => setToken(e.target.value)} 
                              disabled={isLocked} 
                              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-6 py-4 rounded-2xl text-slate-900 dark:text-white font-mono text-xs outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all shadow-inner" 
                              placeholder="Enter Bot Token" 
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Secure AES-256</span>
                            </div>
                         </div>
                         <div className="flex gap-2 shrink-0">
                           <button onClick={() => handleVerify(token)} className="px-8 py-4 bg-indigo-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl hover:bg-indigo-500 active:scale-95 transition-all">Verify</button>
                           <button onClick={() => setIsLocked(!isLocked)} className="px-6 py-4 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                              {isLocked ? <Icons.Lock size={16} /> : <Icons.Unlock size={16} />}
                           </button>
                         </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                       <button onClick={handleExport} className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-900 dark:bg-white/5 text-white rounded-[2rem] shadow-lg hover:-translate-y-1 transition-all group">
                         <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                            <Icons.DownloadCloud size={20} />
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-[0.2em]">Export</span>
                       </button>
                       <button onClick={handleShareApp} className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-900 dark:bg-white/5 text-white rounded-[2rem] shadow-lg hover:-translate-y-1 transition-all group">
                         <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                            <Icons.Share2 size={20} />
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-[0.2em]">Share</span>
                       </button>
                       <button onClick={() => importFileRef.current?.click()} className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-900 dark:bg-white/5 text-white rounded-[2rem] shadow-lg hover:-translate-y-1 transition-all group">
                         <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                            <Icons.UploadCloud size={20} />
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-[0.2em]">Import</span>
                       </button>
                       <button onClick={() => window.open('/api/diagnostics', '_blank')} className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-900 dark:bg-white/5 text-white rounded-[2rem] shadow-lg hover:-translate-y-1 transition-all group">
                         <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                            <Icons.Activity size={20} />
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-[0.2em]">Logs</span>
                       </button>
                       <input type="file" ref={importFileRef} onChange={handleImport} accept=".json" className="hidden" />
                    </div>

                    {/* Visual Experience Card moved to footer area of settings */}
                    <div className="relative rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-black p-8 shadow-2xl overflow-hidden border border-white/5">
                       <BubbleBackground />
                       <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="text-center md:text-left">
                             <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Interface Engine</h4>
                             <h3 className="text-2xl font-black text-white leading-tight">Visual Experience & Themes</h3>
                             <p className="text-slate-400 text-xs mt-2 max-w-sm">Personalize your administrative dashboard with hand-crafted high-fidelity color presets.</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={toggleTheme}
                            className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[8px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                          >
                            {theme === 'dark' ? <Icons.Sun size={10} className="text-amber-500" /> : <Icons.Moon size={10} className="text-indigo-600" />}
                            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {[
                          { id: 'midnight', name: 'Cyber Obsidian', desc: 'Neon Indigo & Dark Glass', bg: 'from-indigo-950 via-slate-950 to-purple-950 text-white', border: 'border-indigo-500' },
                          { id: 'quantum', name: 'Quantum Emerald', desc: 'Futuristic Tech & Teal', bg: 'from-emerald-950 via-slate-950 to-teal-950 text-white', border: 'border-emerald-500' },
                          { id: 'violet', name: 'Violet Aura', desc: 'Magenta & Violet Glow', bg: 'from-fuchsia-950 via-slate-950 to-purple-950 text-white', border: 'border-purple-500' },
                          { id: 'executive', name: 'Executive Light', desc: 'Crisp Slate & Minimal Light', bg: 'from-slate-100 via-white to-indigo-50 text-slate-900', border: 'border-slate-400' }
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setColorTheme(t.id as ThemePreset);
                              if (t.id === 'executive') setTheme('light');
                              else setTheme('dark');
                            }}
                            className={`p-2 rounded-xl border transition-all text-left flex flex-col justify-between gap-1.5 relative overflow-hidden ${
                              colorTheme === t.id
                                ? `${t.border} ring-1 ring-indigo-500/50 shadow-md scale-[1.01]`
                                : 'border-slate-200 dark:border-slate-800 opacity-80 hover:opacity-100'
                            } bg-gradient-to-br ${t.bg}`}
                          >
                            <div className="flex items-center justify-between z-10 w-full">
                              <span className="text-[8px] font-black uppercase tracking-tight">{t.name}</span>
                              {colorTheme === t.id && (
                                <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                                  <Icons.Check size={8} strokeWidth={3} />
                                </div>
                              )}
                            </div>
                            <p className="text-[8px] font-medium opacity-75 z-10 leading-tight">{t.desc}</p>
                          </button>
                        ))}
                      </div>

                      {/* Font Size Scaling Options */}
                      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h5 className="text-[8px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider leading-none">
                              Typography Scale / Font Size
                            </h5>
                            <p className="text-[8px] text-slate-500 dark:text-slate-400 font-bold leading-none mt-0.5">
                              Adjust text size across the whole dashboard interface.
                            </p>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-mono font-black text-[8px] uppercase">
                            Current: {fontSize === 'xs' ? 'Micro (11.5px)' : fontSize === 'small' ? 'Compact (13px)' : 'Medium (15px)'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                          {[
                            { id: 'xs', title: 'Extra Small', size: '11.5px Base', desc: 'Ultra-dense pro view' },
                            { id: 'small', title: 'Small / Compact', size: '13px Base', desc: 'Recommended default' },
                            { id: 'normal', title: 'Medium', size: '15px Base', desc: 'Larger text readability' },
                          ].map((f) => (
                            <button
                              key={f.id}
                              onClick={() => setFontSize(f.id as 'xs' | 'small' | 'normal')}
                              className={`p-2 rounded-xl border transition-all text-left flex flex-col gap-0.5 ${
                                fontSize === f.id
                                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm scale-[1.01]'
                                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="text-[8px] font-black tracking-tight">{f.title}</span>
                                <span className={`text-[8px] font-mono px-1 py-0.5 rounded ${fontSize === f.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                  {f.size}
                                </span>
                              </div>
                              <p className={`text-[8px] ${fontSize === f.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                                {f.desc}
                              </p>
                            </button>
                          ))}
                    </div>
                  </div>
                </div>
              )}

              {settingsSubTab === 'admins' && (
                <AdminManager
                  botToken={token}
                  groups={groups}
                  onShowNotification={showNotification}
                />
              )}
            </div>
          )}
        </div>
      </main>


      {selectedGroup && (
        <InviteModal group={selectedGroup} onClose={handleCloseGroupModal} botToken={token} onInteraction={() => handleGroupInteraction(selectedGroup.id)} />
      )}

      {/* Root-Level Full Screen Create Folder Page */}
      {isCreateFolderModalOpen && (
        <div 
          className="fixed inset-0 z-[999] bg-slate-50 dark:bg-slate-950 flex flex-col h-[100dvh] w-screen overflow-hidden animate-in fade-in duration-150"
        >
          {/* Top Navigation Header */}
          <header className="px-4 py-2.5 sm:px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shrink-0 shadow-sm z-50">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCloseCreateFolderModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all active:scale-95 shadow-sm"
                title="Back to Folders"
              >
                <Icons.ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${newFolderColor} flex items-center justify-center text-white shadow-sm text-sm flex-shrink-0`}>
                  {newFolderIcon}
                </div>
                <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">Create Batch Folder</h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!newFolderName.trim()) {
                    showNotification('Please enter folder name', 'alert');
                    return;
                  }
                  const cleanName = newFolderName.trim().replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
                  const newFolder: BatchFolder = {
                    id: 'folder-' + Date.now(),
                    name: `${cleanName || 'My Folder'} ${newFolderIcon}`,
                    color: newFolderColor,
                    batchIds: [],
                    createdAt: Date.now()
                  };
                  setFolders(prev => [newFolder, ...prev]);
                  setNewFolderName('');
                  handleCloseCreateFolderModal();
                  showNotification(`Folder created with icon ${newFolderIcon}`, 'success');
                }}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center gap-1"
              >
                <span>+ Create</span>
              </button>
              <button
                type="button"
                onClick={handleCloseCreateFolderModal}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Close"
              >
                <Icons.X size={15} />
              </button>
            </div>
          </header>

          {/* Main Single-Page Simple Content Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:py-4 flex flex-col justify-start">
            <div className="max-w-md mx-auto w-full space-y-3 pb-6">
              
              {/* 1. Sleek Live Preview Bar */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-sm">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${newFolderColor} flex items-center justify-center text-white text-base shadow-sm flex-shrink-0 transition-all`}>
                  {newFolderIcon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preview</p>
                  <h3 className="font-black text-xs text-slate-900 dark:text-white truncate">
                    {newFolderName.trim() ? `${newFolderName.trim()} ${newFolderIcon}` : `My Batch Folder ${newFolderIcon}`}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-bold">
                  Ready
                </span>
              </div>

              {/* 2. Folder Name Input Field */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Folder Name *
                  </label>
                  <span className="text-[10px] font-medium text-slate-400">{newFolderName.length}/40</span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    maxLength={40}
                    placeholder="e.g. UPSC Batches, VIP Students..."
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newFolderName.trim()) {
                        const cleanName = newFolderName.trim().replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
                        const newFolder: BatchFolder = {
                          id: 'folder-' + Date.now(),
                          name: `${cleanName || 'My Folder'} ${newFolderIcon}`,
                          color: newFolderColor,
                          batchIds: [],
                          createdAt: Date.now()
                        };
                        setFolders(prev => [newFolder, ...prev]);
                        setNewFolderName('');
                        handleCloseCreateFolderModal();
                        showNotification(`Folder created with icon ${newFolderIcon}`, 'success');
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder:text-slate-400 pr-8"
                    autoFocus
                  />
                  {newFolderName && (
                    <button
                      type="button"
                      onClick={() => setNewFolderName('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center text-[10px] font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Quick Presets (Small Chips) */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {[
                    { name: 'UPSC Aspirants', icon: '📚', color: 'from-amber-500 to-orange-600' },
                    { name: 'VIP Paid Hub', icon: '💎', color: 'from-purple-600 to-pink-600' },
                    { name: 'Daily Alerts', icon: '⚡', color: 'from-indigo-600 to-blue-600' },
                    { name: 'Tech Batches', icon: '🚀', color: 'from-cyan-600 to-blue-600' },
                    { name: 'Test Series', icon: '🎯', color: 'from-emerald-600 to-teal-600' }
                  ].map(idea => (
                    <button
                      key={idea.name}
                      type="button"
                      onClick={() => {
                        setNewFolderName(idea.name);
                        setNewFolderIcon(idea.icon);
                        setNewFolderColor(idea.color);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 hover:text-amber-500 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200/50 dark:border-slate-700/50 transition-all active:scale-95"
                    >
                      <span>{idea.icon}</span>
                      <span>{idea.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Choose Icon (Small Compact Grid) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 shadow-sm space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Select Icon
                </label>
                <div className="grid grid-cols-8 gap-1.5">
                  {['📂', '📁', '💎', '📚', '⚡', '🚀', '🎯', '💼', '🔥', '🏆', '⭐', '🏷️', '🎓', '🔒', '📊', '🌟'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewFolderIcon(emoji)}
                      className={`h-8 rounded-lg flex items-center justify-center text-sm transition-all active:scale-90 ${
                        newFolderIcon === emoji
                          ? 'bg-amber-500/20 border border-amber-500 shadow-sm scale-105'
                          : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Color Gradient Swatches (Compact) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 shadow-sm space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Color Accent
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'Indigo Blue', value: 'from-indigo-600 to-blue-600' },
                    { label: 'Emerald Teal', value: 'from-emerald-600 to-teal-600' },
                    { label: 'Purple Pink', value: 'from-purple-600 to-pink-600' },
                    { label: 'Amber Orange', value: 'from-amber-500 to-orange-600' },
                    { label: 'Rose Flame', value: 'from-rose-600 to-red-600' },
                    { label: 'Cyan Sky', value: 'from-cyan-600 to-blue-600' }
                  ].map(themeOpt => (
                    <button
                      key={themeOpt.value}
                      type="button"
                      onClick={() => setNewFolderColor(themeOpt.value)}
                      className={`p-2 rounded-lg border flex items-center gap-2 transition-all ${
                        newFolderColor === themeOpt.value 
                          ? 'border-amber-500 bg-amber-500/10 shadow-sm' 
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${themeOpt.value} flex-shrink-0 shadow-sm`} />
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">{themeOpt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Compact Bottom Action Dock */}
          <footer className="px-4 py-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] relative z-50">
            <div className="max-w-md mx-auto w-full flex flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleCloseCreateFolderModal}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (!newFolderName.trim()) {
                    showNotification('Please enter folder name', 'alert');
                    return;
                  }
                  const cleanName = newFolderName.trim().replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
                  const newFolder: BatchFolder = {
                    id: 'folder-' + Date.now(),
                    name: `${cleanName || 'My Folder'} ${newFolderIcon}`,
                    color: newFolderColor,
                    batchIds: [],
                    createdAt: Date.now()
                  };
                  setFolders(prev => [newFolder, ...prev]);

                  // Sync to MongoDB
                  fetch('/api/folders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newFolder)
                  }).catch(e => console.error("Failed to sync new folder to DB:", e));

                  setNewFolderName('');
                  handleCloseCreateFolderModal();
                  showNotification(`Folder created with icon ${newFolderIcon}`, 'success');
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/25 active:scale-95 flex items-center gap-2"
              >
                <Icons.Plus size={14} strokeWidth={3} />
                <span>Create Folder</span>
              </button>
            </div>
          </footer>
        </div>
      )}

      {confirmationModalConfig.isOpen && (
        <ConfirmationModal
          title={confirmationModalConfig.title}
          message={confirmationModalConfig.message}
          onConfirm={confirmationModalConfig.onConfirm}
          onClose={handleCloseConfirmModal}
        />
      )}

      {notification && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-max max-w-[90vw] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md ${
            notification.type === 'success' 
              ? 'bg-emerald-500/90 border-emerald-400 text-white' 
              : notification.type === 'alert'
              ? 'bg-rose-500/90 border-rose-400 text-white'
              : 'bg-indigo-600/90 border-indigo-500 text-white'
          }`}>
            {notification.type === 'success' && <Icons.CheckCircle size={18} />}
            {notification.type === 'alert' && <Icons.AlertCircle size={18} />}
            {notification.type === 'info' && <Icons.Info size={18} />}
            <span className="text-xs font-black uppercase tracking-widest">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;