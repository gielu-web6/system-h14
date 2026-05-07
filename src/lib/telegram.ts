const TELEGRAM_API = 'https://api.telegram.org'

type AlertTarget = 'admin' | 'sales' | 'both'

interface TelegramMessage {
  message: string
  target: AlertTarget
  parseMode?: 'HTML' | 'Markdown'
}

export async function sendTelegramAlert({
  message,
  target,
  parseMode = 'HTML',
}: TelegramMessage): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const adminChatId = process.env.TELEGRAM_CHAT_ADMIN
  const salesChatId = process.env.TELEGRAM_CHAT_SALES

  if (!token) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN not set')
    return
  }

  const chatIds: string[] = []

  if (target === 'admin' && adminChatId) chatIds.push(adminChatId)
  if (target === 'sales' && salesChatId) chatIds.push(salesChatId)
  if (target === 'both') {
    if (adminChatId) chatIds.push(adminChatId)
    if (salesChatId && salesChatId !== adminChatId) chatIds.push(salesChatId)
  }

  for (const chatId of chatIds) {
    try {
      const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: parseMode,
        }),
      })
      if (!res.ok) {
        const err = await res.text()
        console.error(`[Telegram] Failed to send to chat ${chatId}:`, err)
      }
    } catch (e) {
      console.error('[Telegram] Network error:', e)
    }
  }
}
