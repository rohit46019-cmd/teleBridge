import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from '../components/Sidebar.tsx';
import GroupCard from '../components/GroupCard.tsx';
import InviteModal from '../components/InviteModal.tsx';
import ConfirmationModal from '../components/ConfirmationModal.tsx';
import { Icons } from '../constants.tsx';
import { TelegramGroup, JoinEvent, BannedUser } from '../types.ts';
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

const TABS = ['dashboard', 'groups', 'analysis', 'settings'];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'dashboard';
  });
  const [selectedGroup, setSelectedGroup] = useState<TelegramGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [filterOption, setFilterOption] = useState<'mostMembers' | 'leastMembers' | 'frequent' | 'recent' | 'newAdded' | 'activeToday'>('recent');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
  const [auditSubTab, setAuditSubTab] = useState<'audit' | 'blocked'>('audit');
  const [updates, setUpdates] = useState<any[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  
  const [token, setToken] = useState(localStorage.getItem('tg_bot_token') || DEFAULT_TOKEN);
  const [autoCleanServiceMessages, setAutoCleanServiceMessages] = useState(() => {
    return localStorage.getItem('tg_auto_clean') === 'true';
  });
  const [autoWelcome, setAutoWelcome] = useState(() => {
    return localStorage.getItem('tg_auto_welcome') === 'true';
  });
  const [hideRevenue, setHideRevenue] = useState(() => {
    return localStorage.getItem('hideRevenue') === 'true';
  });
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>(() => {
    const saved = localStorage.getItem('tg_banned_users');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [botInfo, setBotInfo] = useState<TelegramBotInfo | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncingToDb, setIsSyncingToDb] = useState(false);
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
  const [settingsSubTab, setSettingsSubTab] = useState<'charts' | 'config'>('charts');
  const [revenueDays, setRevenueDays] = useState(14);
  const [joinRate, setJoinRate] = useState(() => {
    return Number(localStorage.getItem('tg_join_rate')) || 87;
  });

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

  const revenueAnalysis = useMemo(() => {
    if (!joinEvents.length) return { data: [], highest: null, lowest: null };

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (analyticsRange === 'CUSTOM' && analysisStartDate && analysisEndDate) {
      startDate = new Date(analysisStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(analysisEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const now = new Date();
      startDate = new Date();
      startDate.setDate(now.getDate() - revenueDays + 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    const dataMap: Record<string, number> = {};
    joinEvents.forEach(event => {
      const d = new Date(event.timestamp);
      if (d >= startDate! && d <= endDate!) {
        const dateStr = d.toLocaleDateString('en-CA');
        dataMap[dateStr] = (dataMap[dateStr] || 0) + 1;
      }
    });

    const data = Object.entries(dataMap)
      .map(([date, count]) => ({
        date,
        revenue: count * joinRate
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    let highest = data[0] || null;
    let lowest = data[0] || null;

    data.forEach(item => {
      if (highest === null || item.revenue > highest.revenue) highest = item;
      if (lowest === null || item.revenue < lowest.revenue) lowest = item;
    });

    return { data, highest, lowest };
  }, [joinEvents, joinRate, revenueDays, analyticsRange, analysisStartDate, analysisEndDate]);

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
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('hideRevenue', hideRevenue.toString());
  }, [hideRevenue]);

  useEffect(() => {
    localStorage.setItem('tg_auto_clean', autoCleanServiceMessages.toString());
  }, [autoCleanServiceMessages]);

  useEffect(() => {
    localStorage.setItem('tg_auto_welcome', autoWelcome.toString());
  }, [autoWelcome]);

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

  useEffect(() => {
    localStorage.setItem('tg_join_rate', joinRate.toString());
  }, [joinRate]);

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

        const [groupsRes, eventsRes] = await Promise.all([
          fetch('/api/groups', { signal: controller.signal, headers: { 'Accept': 'application/json' } }),
          fetch('/api/events', { signal: controller.signal, headers: { 'Accept': 'application/json' } })
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
                const merged = [...serverGroups];
                prev.forEach(localG => {
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
      if (newTab === 'analysis') {
        setAuditSubTab('audit');
      }
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
        } catch (e) {
          updatedGroups.push(g);
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
    setConfirmationModalConfig({
      isOpen: true,
      title: `Confirm Removal`,
      message: `Are you sure you want to remove ${joinEvent.userName} from ${joinEvent.chatTitle}? They will be able to rejoin if they have a valid link.`,
      onConfirm: () => handleExecuteKick(joinEvent.chatId, joinEvent.userId, `${joinEvent.userId}-${joinEvent.timestamp}`),
    });
  };

  const handleRequestBan = (joinEvent: JoinEvent) => {
    setConfirmationModalConfig({
      isOpen: true,
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
      const webhookUrl = `${baseUrl}/api/webhook/${token}?welcome=${autoWelcome}&clean=${autoCleanServiceMessages}`;
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

  const filteredJoins = useMemo(() => joinEvents.filter(e => new Date(e.timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) === selectedDate).sort((a, b) => b.timestamp - a.timestamp), [joinEvents, selectedDate]);
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

  const BubbleBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      <div className="absolute top-[-10%] left-[-5%] w-24 h-24 bg-white/20 rounded-full blur-xl animate-float-slow"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float"></div>
      <div className="absolute top-[40%] right-[10%] w-16 h-16 bg-white/15 rounded-full blur-lg animate-float-delayed"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans transition-all duration-300">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-1 md:ml-64 px-4 md:px-6 lg:px-8 pb-28 w-full max-w-[1400px] mx-auto">
        <header className="sticky top-0 z-40 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 py-2.5 mb-4 border-b border-slate-200 dark:border-white/5 animate-in slide-in-from-top">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.6)]" />
              <h1 key={activeTab} className="text-xl md:text-2xl font-black tracking-tighter capitalize animate-in fade-in">{activeTab}</h1>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button onClick={toggleTheme} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-90 transition-all">
                {theme === 'dark' ? <Icons.Sun size={16} className="text-amber-500" /> : <Icons.Moon size={16} className="text-blue-600" />}
              </button>
              <button onClick={() => syncAllGroupsMemberCount(token)} disabled={isScanning} className="p-2 bg-blue-600 text-white rounded-xl shadow-lg active:scale-90 transition-all">
                <Icons.Refresh size={16} className={isScanning ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </header>

        <div 
          className="relative min-h-[70vh]"
        >
          {activeTab === 'dashboard' && (
            <div className={`space-y-6 ${animationClass}`}>
               <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.02, translateY: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-[2rem] border-b-4 border-indigo-800 shadow-[0_15px_30px_rgba(79,70,229,0.4)] transition-all relative overflow-hidden"
                  >
                    <BubbleBackground />
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm relative z-10"><Icons.Home size={20} className="text-white" strokeWidth={3} /></div>
                    <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1 relative z-10">Batches</p>
                    <p className="text-3xl font-black text-white relative z-10">{groups.length}</p>
                 </motion.div>

                 <motion.div 
                    whileHover={{ scale: 1.02, translateY: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-br from-emerald-400 to-teal-600 p-5 rounded-[2rem] border-b-4 border-teal-800 shadow-[0_15px_30px_rgba(13,148,136,0.4)] transition-all relative overflow-hidden"
                  >
                    <BubbleBackground />
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm relative z-10"><Icons.Users size={20} className="text-white" strokeWidth={3} /></div>
                    <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-1 relative z-10">Total Verified</p>
                    <p className="text-3xl font-black text-white relative z-10">{totalMembers.toLocaleString()}</p>
                 </motion.div>

                 <motion.div 
                    whileHover={{ scale: 1.02, translateY: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-br from-amber-400 to-orange-500 p-5 rounded-[2rem] border-b-4 border-orange-700 shadow-[0_15px_30px_rgba(249,115,22,0.4)] transition-all relative overflow-hidden"
                  >
                    <BubbleBackground />
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm relative z-10"><Icons.Activity size={20} className="text-white" strokeWidth={3} /></div>
                    <p className="text-[10px] font-black text-amber-50 uppercase tracking-widest mb-1 relative z-10">Joins Today</p>
                    <p className="text-3xl font-black text-white relative z-10">{joinsTodayCount}</p>
                  </motion.div>

                 <motion.div 
                    whileHover={{ scale: 1.02, translateY: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-br from-fuchsia-500 to-purple-600 p-5 rounded-[2rem] border-b-4 border-purple-800 shadow-[0_15px_30px_rgba(192,38,211,0.4)] transition-all relative overflow-hidden"
                  >
                    <BubbleBackground />
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm relative z-10"><Icons.Zap size={20} className="text-white" strokeWidth={3} /></div>
                    <div className="flex flex-col gap-3 relative z-10">
                       <div>
                         <p className="text-[10px] font-black text-purple-100 uppercase tracking-widest mb-1">Bot Status</p>
                         <p className="text-xl font-black text-white uppercase">{botInfo ? 'ACTIVE' : 'OFFLINE'}</p>
                       </div>
                    </div>
                 </motion.div>

                 <motion.div 
                    whileHover={{ scale: 1.02, translateY: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-br from-rose-500 to-orange-600 p-5 rounded-[2rem] border-b-4 border-rose-800 shadow-[0_15px_30px_rgba(244,63,94,0.4)] transition-all relative overflow-hidden"
                  >
                    <BubbleBackground />
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"><Icons.TrendingUp size={20} className="text-white" strokeWidth={3} /></div>
                      <button 
                        onClick={() => setHideRevenue(!hideRevenue)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        title={hideRevenue ? "Show Revenue" : "Hide Revenue"}
                      >
                        {hideRevenue ? <Icons.EyeOff size={16} className="text-white/70" /> : <Icons.Eye size={16} className="text-white/70" />}
                      </button>
                    </div>
                    <p className="text-[10px] font-black text-rose-100 uppercase tracking-widest mb-1 relative z-10">Today's Revenue</p>
                    {hideRevenue ? (
                      <p className="text-3xl font-black text-white relative z-10 text-shadow-sm blur-md select-none">₹8,888,888</p>
                    ) : (
                      <p className="text-3xl font-black text-white relative z-10 text-shadow-sm">₹{(joinsTodayCount * joinRate).toLocaleString()}</p>
                    )}
                    <p className="text-[8px] font-bold text-rose-100/60 uppercase mt-1 relative z-10">Rate: ₹{joinRate}/join</p>
                 </motion.div>

                 <motion.button 
                    whileHover={{ scale: 1.02, translateY: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab('settings')}
                    className="bg-gradient-to-br from-cyan-500 to-blue-600 p-5 rounded-[2rem] border-b-4 border-blue-800 shadow-[0_15px_30px_rgba(6,182,212,0.4)] transition-all relative overflow-hidden text-left group"
                  >
                    <BubbleBackground />
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm relative z-10"><Icons.BarChart3 size={20} className="text-white" strokeWidth={3} /></div>
                    <p className="text-[10px] font-black text-cyan-50 uppercase tracking-widest mb-1 relative z-10">Analytics</p>
                    <p className="text-xl font-black text-white relative z-10 flex items-center gap-2">
                      VIEW GROWTH <Icons.ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </p>
                 </motion.button>
              </div>
              <div className="relative rounded-[2.5rem] border border-white/10 p-8 shadow-2xl overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 text-white transform transition-all duration-300 hover:scale-[1.01] hover:shadow-fuchsia-500/20">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-16 -mt-16 mix-blend-overlay pointer-events-none"></div>
                 <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-300/20 rounded-full blur-3xl -ml-16 -mb-16 mix-blend-overlay pointer-events-none"></div>
                 <h2 className="text-xl font-black uppercase tracking-tight mb-4 flex items-center gap-3 relative z-10">
                   <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-inner border border-white/20 text-yellow-300">
                     <Icons.Zap size={24} />
                   </div>
                   <span className="bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent drop-shadow-sm">Fast Batch Injection</span>
                 </h2>
                 <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                   <input type="text" placeholder="Enter Telegram Chat ID (-100...)" className="flex-1 bg-black/20 border border-white/20 px-6 py-4 rounded-2xl text-xs font-mono outline-none focus:ring-4 focus:ring-white/30 shadow-inner placeholder:text-white/50 text-white backdrop-blur-sm" value={newChatId} onChange={e => setNewChatId(e.target.value)} />
                   <button onClick={handleAddGroupManual} disabled={isAddingGroup || !newChatId} className="px-8 py-4 bg-white text-fuchsia-900 hover:bg-fuchsia-50 rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(0,0,0,0.3)] active:scale-95 disabled:opacity-50 transition-all border border-white">
                     {isAddingGroup ? 'Connecting...' : 'Inject Batch(es)'}
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
                  <button 
                    onClick={() => setShowFilterMenu(!showFilterMenu)} 
                    className={`flex items-center gap-2 p-3 ${filterOption !== 'recent' ? 'bg-blue-600 text-white border-blue-500' : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'} border rounded-2xl shadow-sm hover:brightness-110 transition-all`}
                  >
                    <Icons.Filter size={18} />
                    {filterOption !== 'recent' && (
                      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                        {filterOption.replace(/([A-Z])/g, ' $1')}
                      </span>
                    )}
                  </button>
                  {showFilterMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 py-2 overflow-hidden">
                      <p className="px-4 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 mb-1">Sort & Filter</p>
                      {[
                        { id: 'recent', label: 'Last Active', icon: <Icons.Zap size={12} /> },
                        { id: 'newAdded', label: 'Newly Added', icon: <Icons.PlusCircle size={12} /> },
                        { id: 'activeToday', label: 'Active Today', icon: <Icons.Activity size={12} /> },
                        { id: 'frequent', label: 'Most Frequent', icon: <Icons.BarChart size={12} /> },
                        { id: 'mostMembers', label: 'Biggest Community', icon: <Icons.Users size={12} /> },
                        { id: 'leastMembers', label: 'Smallest Community', icon: <Icons.User size={12} /> },
                      ].map(opt => (
                        <button 
                          key={opt.id} 
                          onClick={() => { setFilterOption(opt.id as any); setShowFilterMenu(false); }} 
                          className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-3 transition-colors ${filterOption === opt.id ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                        >
                          <span className={filterOption === opt.id ? 'text-blue-600' : 'text-slate-400'}>{opt.icon}</span>
                          {opt.label}
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
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 shadow-inner mb-6">
                <button 
                  onClick={() => setAuditSubTab('audit')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${auditSubTab === 'audit' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <Icons.Activity size={14} /> Audit Log
                </button>
                <button 
                  onClick={() => setAuditSubTab('blocked')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${auditSubTab === 'blocked' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <Icons.Ban size={14} /> Block List
                </button>
              </div>

              {auditSubTab === 'audit' ? (
                <>
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
                                  <div className="flex justify-end gap-1">
                                    <button onClick={() => handleRequestKick(e)} title="Kick Member" className="p-0.5 text-orange-500 hover:bg-orange-500 hover:text-white rounded-md transition-all">
                                      <Icons.Trash size={12}/>
                                    </button>
                                    <button onClick={() => handleRequestBan(e)} title="Permanent Ban" className="p-0.5 text-rose-600 hover:bg-rose-600 hover:text-white rounded-md transition-all">
                                      <Icons.Ban size={12}/>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                       </table>
                     </div>
                  </div>
                </>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl border-b-8 border-slate-200 dark:border-slate-800">
                    <div className="p-4 border-b border-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      <h2 className="text-lg font-black uppercase tracking-tight">Block List</h2>
                      <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-widest">Managing permanently banned members</p>
                    </div>
                    
                    <div className="p-0 overflow-x-auto max-h-[60vh]">
                      {bannedUsers.length === 0 ? (
                        <div className="p-12 text-center">
                          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
                             <Icons.CheckCircle className="text-slate-400" size={32} />
                          </div>
                          <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">No Banned Users</h3>
                          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Everything is clean!</p>
                        </div>
                      ) : (
                        <table className="w-full text-left">
                          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 backdrop-blur-md z-10">
                            <tr>
                              <th className="px-2 py-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">User ID</th>
                              <th className="px-2 py-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                              <th className="px-2 py-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">Chat</th>
                              <th className="px-2 py-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">Banned At</th>
                              <th className="px-2 py-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Delete</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {bannedUsers.map((user, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="px-2 py-1.5">
                                  <span className="text-[8px] font-mono font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{user.userId}</span>
                                </td>
                                <td className="px-2 py-1.5">
                                  <div className="text-[9px] font-black text-slate-900 dark:text-white truncate max-w-[70px]">{user.userName}</div>
                                </td>
                                <td className="px-2 py-1.5">
                                  <div className="text-[9px] font-bold text-blue-600 dark:text-blue-400 truncate max-w-[80px]">{user.chatTitle}</div>
                                  <div className="text-[8px] font-mono text-slate-400 tracking-tighter opacity-70">{user.chatId}</div>
                                </td>
                                <td className="px-2 py-1.5 text-[8px] font-bold text-slate-500 whitespace-nowrap">
                                  {new Date(user.timestamp).toLocaleString('en-CA', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '')}
                                </td>
                                <td className="px-2 py-1.5 text-right">
                                  <button 
                                    onClick={() => handleUnban(user)}
                                    className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[8px] font-black uppercase tracking-tight shadow shadow-rose-500/30 active:scale-95 transition-all inline-flex items-center gap-1"
                                    title="Unban User"
                                  >
                                    <Icons.X size={10} strokeWidth={3} />
                                    <span className="hidden sm:inline">Unban</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 shadow-inner">
                <button 
                  onClick={() => setSettingsSubTab('charts')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${settingsSubTab === 'charts' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <Icons.BarChart3 size={14} /> Analytics
                </button>
                <button 
                  onClick={() => setSettingsSubTab('config')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${settingsSubTab === 'config' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  <Icons.Settings size={14} /> Configuration
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

                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Today</p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-black">{comparisonStats.today}</p>
                          <span className={`text-[8px] font-bold ${comparisonStats.todayTrend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {comparisonStats.todayTrend >= 0 ? '+' : ''}{comparisonStats.todayTrend}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Yesterday</p>
                        <p className="text-lg font-black">{comparisonStats.yesterday}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Revenue Analysis</h3>
                          <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                            {analyticsRange === 'CUSTOM' ? 'Custom Period' : `Last ${revenueDays} Days`}
                          </p>
                        </div>
                        {analyticsRange !== 'CUSTOM' && (
                          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            {([7, 14, 30, 90] as const).map(days => (
                              <button
                                key={days}
                                onClick={() => setRevenueDays(days)}
                                className={`px-2.5 py-1 text-[8px] font-black uppercase rounded-lg transition-all ${revenueDays === days ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                              >
                                {days}D
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="h-[100px] w-full -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueAnalysis.data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" hide />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-slate-900 text-white p-2 rounded-lg text-[10px] font-black border border-white/10 shadow-2xl">
                                      <p className="opacity-60">{new Date(payload[0].payload.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                                      <p className="text-indigo-400 text-xs">₹{payload[0].value?.toLocaleString()}</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="revenue" 
                              stroke="#6366f1" 
                              strokeWidth={2.5}
                              fillOpacity={1} 
                              fill="url(#colorRevenue)" 
                              animationDuration={1500}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-[2rem] text-white shadow-lg">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">Highest Income</p>
                        <p className="text-xs font-black truncate">{revenueAnalysis.highest ? new Date(revenueAnalysis.highest.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A'}</p>
                        <p className="text-lg font-black mt-1">₹{revenueAnalysis.highest?.revenue.toLocaleString() || 0}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-lg">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Lowest Income</p>
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">{revenueAnalysis.lowest ? new Date(revenueAnalysis.lowest.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A'}</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white mt-1">₹{revenueAnalysis.lowest?.revenue.toLocaleString() || 0}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {settingsSubTab === 'config' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm">
                    <h3 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                      <Icons.Zap size={14} /> Bot Gateway
                    </h3>
                    
                    <div className="mb-8 p-6 bg-white dark:bg-black/20 rounded-[2rem] border border-slate-200 dark:border-white/5 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-between">
                            Group Cleanup
                          </h4>
                          <p className="text-[9px] text-slate-500 font-bold">Auto-delete Join/Leave messages</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-black ${autoCleanServiceMessages ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {autoCleanServiceMessages ? 'ACTIVE' : 'OFF'}
                          </span>
                          <button 
                            onClick={() => setAutoCleanServiceMessages(!autoCleanServiceMessages)}
                            className={`w-10 h-5 rounded-full transition-all relative ${autoCleanServiceMessages ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoCleanServiceMessages ? 'left-6' : 'left-1'}`} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                        <div>
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-between">
                            Group Welcome
                          </h4>
                          <p className="text-[9px] text-slate-500 font-bold">5s delay, Tag user & delete after 60s</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-black ${autoWelcome ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {autoWelcome ? 'ACTIVE' : 'OFF'}
                          </span>
                          <button 
                            onClick={() => setAutoWelcome(!autoWelcome)}
                            className={`w-10 h-5 rounded-full transition-all relative ${autoWelcome ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoWelcome ? 'left-6' : 'left-1'}`} />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 mt-6 !mt-6">
                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          <Icons.ShieldCheck size={14} className="inline mr-1 text-emerald-500" />
                          Requires bot to have <span className="text-emerald-500 underline">Delete Messages</span> permissions. If you change settings, please <b>Restart Background Worker</b> to apply them to 24/7 mode!
                        </p>
                        
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                           <div className="flex items-center justify-between">
                             <div>
                               <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Background Worker (24/7)</p>
                               <p className="text-[9px] text-slate-500">Enable this to run cleanup & welcome 24/7.</p>
                             </div>
                             {webhookActive ? (
                               <button 
                                 onClick={handleDeleteWebhook}
                                 disabled={isProcessingWebhook}
                                 className="px-3 py-1.5 bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase rounded-lg border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 whitespace-nowrap ml-2"
                               >
                                 {isProcessingWebhook ? 'Working...' : 'Stop Background'}
                               </button>
                             ) : (
                               <button 
                                 onClick={handleSetWebhook}
                                 disabled={isProcessingWebhook}
                                 className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase rounded-lg border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50 whitespace-nowrap ml-2"
                               >
                                 {isProcessingWebhook ? 'Working...' : 'Start Background'}
                               </button>
                             )}
                           </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-8 p-6 bg-white dark:bg-black/20 rounded-[2rem] border border-slate-200 dark:border-white/5">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Icons.Radio size={14} className="text-rose-500" /> Broadcast to All Hubs
                      </h4>
                      <textarea 
                        placeholder="Enter broadcast message..." 
                        className="w-full bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 px-6 py-4 rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-4 focus:ring-indigo-500/20 mb-4 transition-all"
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

                      {broadcasts.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Recent Broadcasts</h4>
                          <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                            {broadcasts.slice(0, 5).map(b => (
                              <div key={b._id} className="bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
                                <div className="flex-1 min-w-0 mr-4">
                                  <p className="text-[10px] text-slate-900 dark:text-white truncate font-bold">{b.message}</p>
                                  <p className="text-[8px] text-slate-500">{new Date(b.timestamp).toLocaleTimeString()}</p>
                                </div>
                                <button onClick={() => handleDeleteBroadcast(b._id)} className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all">
                                  <Icons.Trash size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input 
                          type="number" 
                          value={joinRate} 
                          onChange={e => setJoinRate(Number(e.target.value))} 
                          className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 pl-8 pr-6 py-4 rounded-2xl text-slate-900 dark:text-white font-mono text-xs outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all" 
                          placeholder="Join Rate"
                        />
                        <span className="absolute -top-2 left-4 bg-white dark:bg-slate-900 px-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Revenue Rate</span>
                      </div>
                      <input type="password" value={token} onChange={e => setToken(e.target.value)} disabled={isLocked} className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 px-6 py-4 rounded-2xl text-slate-900 dark:text-white font-mono text-xs outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all" placeholder="Bot Token" />
                    </div>
                    <div className="flex gap-2 mb-6">
                      <button onClick={() => handleVerify(token)} className="flex-1 py-4 bg-indigo-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl hover:bg-indigo-500 active:scale-95 transition-all">Sync Connection</button>
                      <button onClick={() => setIsLocked(!isLocked)} className="px-6 py-4 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">{isLocked ? 'Unlock' : 'Lock'}</button>
                    </div>

                    <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Pending Sync</p>
                          <p className="text-xs font-bold text-slate-500">{pendingGroups.length} Batches, {pendingJoins.length} Joins</p>
                        </div>
                        {isSyncingToDb ? <Icons.Refresh className="animate-spin text-blue-500" size={20} /> : <Icons.Database className="text-blue-500" size={20} />}
                      </div>
                      <button 
                        onClick={syncDataToDatabase}
                        disabled={isSyncingToDb || (pendingGroups.length === 0 && pendingJoins.length === 0)}
                        className="w-full py-3 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                      >
                        {isSyncingToDb ? 'Updating Database...' : 'Update To Database'}
                      </button>
                    </div>

                    <div className="mb-6 bg-emerald-500/5 dark:bg-emerald-500/10 p-6 rounded-[2rem] border border-emerald-500/20">
                      <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <Icons.Search size={14} /> Auto-Discovery Help
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                        Bot auto-detects existing groups if someone sends a message. 
                        To force discovery: 
                        <br/><span className="text-emerald-500">1. Go to Group</span>
                        <br/><span className="text-emerald-500">2. Type /start or any message</span>
                        <br/><span className="text-slate-500">3. App will auto-inject the batch!</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-slate-200 dark:border-slate-800 pt-6">
                      <button onClick={handleExport} className="flex flex-col items-center justify-center gap-2 p-5 bg-indigo-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all">
                        <Icons.DownloadCloud size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Export</span>
                      </button>
                      <button onClick={handleShareApp} className="flex flex-col items-center justify-center gap-2 p-5 bg-purple-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all">
                        <Icons.Share2 size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Share</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <button onClick={() => importFileRef.current?.click()} className="flex flex-col items-center justify-center gap-2 p-5 bg-emerald-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all w-full col-span-1">
                        <Icons.UploadCloud size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Import</span>
                      </button>
                      <button onClick={() => window.open('/api/diagnostics', '_blank')} className="flex flex-col items-center justify-center gap-2 p-5 bg-amber-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all w-full col-span-1">
                        <Icons.Activity size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Log</span>
                      </button>
                      <input type="file" ref={importFileRef} onChange={handleImport} accept=".json" className="hidden" />
                    </div>
                  </div>
                </div>
              )}
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