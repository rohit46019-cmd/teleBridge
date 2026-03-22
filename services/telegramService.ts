
const BASE_URL = 'https://api.telegram.org/bot';

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
  const response = await fetch(`${BASE_URL}${token}/getMe`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || 'Invalid Token');
  return data.result;
}

export async function getChatDetails(token: string, chatId: string | number): Promise<TelegramChat> {
  const response = await fetch(`${BASE_URL}${token}/getChat?chat_id=${chatId}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || 'Could not find chat. Make sure the bot is an admin in the group.');
  return data.result;
}

export async function getChatMemberCount(token: string, chatId: string | number): Promise<number> {
  const response = await fetch(`${BASE_URL}${token}/getChatMemberCount?chat_id=${chatId}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || 'Could not get member count.');
  return data.result;
}

export async function getRecentUpdates(token: string, offset: number = 0): Promise<any[]> {
  const response = await fetch(`${BASE_URL}${token}/getUpdates?offset=${offset}&allowed_updates=["chat_member", "message"]`);
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

  const response = await fetch(url);
  const data = await response.json();
  if (!data.ok) throw new Error(data.description || 'Failed to create invite link');
  return data.result.invite_link;
}

export async function kickChatMember(token: string, chatId: string | number, userId: number): Promise<boolean> {
  // First we ban (this kicks them)
  const banResponse = await fetch(`${BASE_URL}${token}/banChatMember?chat_id=${chatId}&user_id=${userId}`);
  const banData = await banResponse.json();
  if (!banData.ok) throw new Error(banData.description || 'Failed to kick member');
  
  // Then we unban so they aren't permanently blacklisted (standard "kick" behavior)
  await fetch(`${BASE_URL}${token}/unbanChatMember?chat_id=${chatId}&user_id=${userId}`);
  return true;
}
