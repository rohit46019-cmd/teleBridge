
const BASE_URL = 'https://api.telegram.org/bot';

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Network timeout: Connection to Telegram is too slow.');
    }
    if (error.message === 'Failed to fetch') {
      throw new Error('Network error: Could not reach Telegram. Check your internet connection.');
    }
    throw error;
  }
}

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
}

export interface TelegramChat {
  id: number;
  title: string;
  type: string;
  description?: string;
}

export async function verifyBotToken(token: string): Promise<TelegramBotInfo> {
  const response = await fetchWithTimeout(`${BASE_URL}${token}/getMe`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || 'Invalid Token');
  return data.result;
}

export async function getChatDetails(token: string, chatId: string | number): Promise<TelegramChat> {
  const response = await fetchWithTimeout(`${BASE_URL}${token}/getChat?chat_id=${chatId}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || 'Could not find chat. Make sure the bot is an admin in the group.');
  return data.result;
}

export async function getChatMemberCount(token: string, chatId: string | number): Promise<number> {
  const response = await fetchWithTimeout(`${BASE_URL}${token}/getChatMemberCount?chat_id=${chatId}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || 'Could not get member count.');
  return data.result;
}

export async function getRecentUpdates(token: string, offset: number = 0): Promise<any[]> {
  const response = await fetchWithTimeout(`${BASE_URL}${token}/getUpdates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      offset: offset,
      allowed_updates: ["message", "chat_member", "my_chat_member", "chat_join_request", "channel_post"]
    })
  });
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || 'Failed to fetch updates');
  return data.result;
}

export async function createInviteLink(
  token: string, 
  chatId: string | number, 
  limit: number, 
  expireMinutes: number
): Promise<string> {
  let url = `${BASE_URL}${token}/createChatInviteLink?chat_id=${chatId}&member_limit=${limit}`;
  
  if (expireMinutes > 0) {
    const expireDate = Math.floor(Date.now() / 1000) + (expireMinutes * 60);
    url += `&expire_date=${expireDate}`;
  }

  const response = await fetchWithTimeout(url);
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || 'Failed to create invite link');
  return data.result.invite_link;
}

export async function revokeInviteLink(token: string, chatId: string | number, inviteLink: string): Promise<boolean> {
  const response = await fetchWithTimeout(`${BASE_URL}${token}/revokeChatInviteLink?chat_id=${chatId}&invite_link=${encodeURIComponent(inviteLink)}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || 'Failed to revoke invite link');
  return true;
}

export async function kickChatMember(token: string, chatId: string | number, userId: number): Promise<boolean> {
  // First we ban (this kicks them)
  const banResponse = await fetchWithTimeout(`${BASE_URL}${token}/banChatMember?chat_id=${chatId}&user_id=${userId}`);
  const banData = await banResponse.json();
  if (!banData.ok) throw new Error(banData.description || 'Failed to kick member');
  
  // Then we unban so they aren't permanently blacklisted (standard "kick" behavior)
  await fetchWithTimeout(`${BASE_URL}${token}/unbanChatMember?chat_id=${chatId}&user_id=${userId}`);
  return true;
}

export async function banMember(token: string, chatId: string | number, userId: number): Promise<boolean> {
  // Only ban, no unban. This prevents re-joining.
  const response = await fetchWithTimeout(`${BASE_URL}${token}/banChatMember?chat_id=${chatId}&user_id=${userId}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || 'Failed to ban member');
  return true;
}

export async function unbanMember(token: string, chatId: string | number, userId: number): Promise<boolean> {
  const response = await fetchWithTimeout(`${BASE_URL}${token}/unbanChatMember?chat_id=${chatId}&user_id=${userId}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || 'Failed to unban member');
  return true;
}

export async function sendMessage(token: string, chatId: string | number, text: string): Promise<boolean> {
  const response = await fetchWithTimeout(`${BASE_URL}${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || 'Failed to send message');
  return true;
}

export async function deleteMessage(token: string, chatId: string | number, messageId: number): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}${token}/deleteMessage?chat_id=${chatId}&message_id=${messageId}`);
    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.warn(`Failed to delete message ${messageId} in ${chatId}:`, error);
    return false;
  }
}

export async function setWebhook(token: string, url: string): Promise<boolean> {
  const response = await fetchWithTimeout(`${BASE_URL}${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: url,
      allowed_updates: ["message", "chat_member", "my_chat_member", "chat_join_request", "channel_post"]
    })
  });
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || 'Failed to set webhook');
  
  // Also register the commands list
  await fetchWithTimeout(`${BASE_URL}${token}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commands: [
        { command: 'approveall', description: 'Approve all pending join requests in this group' }
  ]
    })
  }).catch(err => console.warn("Failed to set commands:", err));

  return true;
}

export async function deleteWebhook(token: string): Promise<boolean> {
  const response = await fetchWithTimeout(`${BASE_URL}${token}/deleteWebhook`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || 'Failed to delete webhook');
  return true;
}
