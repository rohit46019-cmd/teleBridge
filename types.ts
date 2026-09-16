
export interface TelegramGroup {
  id: string;
  name: string;
  memberCount: number;
  description: string;
  category: string;
  image: string;
  lastInteraction?: number; // Timestamp of last usage
  interactionCount?: number;
  pinned?: boolean;
  createdAt?: number;
}

export interface JoinEvent {
  userId: number;
  userName: string;
  chatId: number;
  chatTitle: string;
  timestamp: number;
  is_bot?: boolean;
}

export interface BannedUser {
  userId: number;
  userName: string;
  chatId: number;
  chatTitle: string;
  timestamp: number;
}

export interface InviteLink {
  id: string;
  link: string;
  groupId: string;
  createdAt: string;
  isUsed: boolean;
  memberLimit: number;
  expiresIn?: number; // Minutes
}

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  createdAt: number;
  expiresAt?: number;
  lastUsed?: number;
  status: 'active' | 'revoked' | 'expired';
  permissions: ('read' | 'invite' | 'admin')[];
  environment: 'production' | 'staging' | 'development';
  webhookUrl?: string;
  usageCount24h: number;
}

export interface BotState {
  isConnected: boolean;
  botName: string;
  botToken: string;
  apiId: string;
  apiHash: string;
}

export interface AdminPermissions {
  canDeleteMessages: boolean;
  canRestrictMembers: boolean;
  canInviteUsers: boolean;
  canPinMessages: boolean;
  canChangeInfo: boolean;
  canManageVideoChats: boolean;
  canManageTopics: boolean;
  canPromoteMembers: boolean;
}

export interface AdminUser {
  _id?: string;
  userId: number;
  username?: string;
  name?: string;
  customTitle?: string;
  isMasterAdmin?: boolean;
  groups?: string[]; // group IDs or ['all']
  permissions: AdminPermissions;
  createdAt: number;
}

export interface GeminiInsight {
  title: string;
  summary: string;
  suggestion: string;
}

export interface BatchFolder {
  id: string;
  name: string;
  color: string;
  batchIds: string[];
  createdAt: number;
}
