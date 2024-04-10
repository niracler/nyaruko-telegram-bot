
import telegramifyMarkdown from "telegramify-markdown"
import { Env, TelegramUpdate } from "./type"
import { syncToDatabase } from "./db"

// Process the Telegram update received
export async function handleTelegramUpdate(update: TelegramUpdate, env: Env, handler: () => Promise<string | undefined>) {
    let replyText: string | undefined

    try {
        await syncToDatabase(update, env)
        replyText = await handler()
        if (!replyText) return // No reply text, do nothing
    } catch (error) {
        replyText = `Failed to insert message to database: ${error}`
    }

    await sendReplyToTelegram(update.message.chat.id, replyText, update.message.message_id, env)

    try {
        const content = update.message?.text || ''
        if (content.startsWith('/')) {
            await deleteCommand(update.message.chat.id, update.message.message_id, env)
        }
    } catch (error) {
        await sendReplyToTelegram(update.message.chat.id, `Failed to delete command: ${error}`, update.message.message_id, env)
    }
}

// Process the '/getgroupid' command
export async function processGetGroupIdCommand(update: TelegramUpdate, env: Env): Promise<string> {
    const fromUsername = update.message?.from?.username || ''
    const formFirstName = update.message?.from?.first_name || ''
    const replyName = fromUsername ? `@${fromUsername}` : formFirstName
    return `哟呼～记下来啦！${replyName} 的聊天 ID 是 \`${update.message?.chat.id}\` 呢~ (｡•̀ᴗ-)✧ `
}

// Process the '/getuserid' command
export async function processGetUserIdCommand(update: TelegramUpdate, env: Env): Promise<string> {
    const fromUsername = update.message?.from?.username || ''
    const formFirstName = update.message?.from?.first_name || ''
    const replyName = fromUsername ? `@${fromUsername}` : formFirstName
    return `呀～ ${replyName} ，您的用户 ID 是 \`${update.message?.from?.id}\` 哦！ヽ(＾Д＾)ﾉ`
}

// Process the '/ping' command
export async function processPingCommand(update: TelegramUpdate, env: Env): Promise<string> {
    // Show more information about this chat
    return JSON.stringify(update.message?.chat, null, 2)
}

// Process the '/debug' command
async function processDebugCommand(update: TelegramUpdate, env: Env): Promise<string> {
    // Show more information about this update
    return JSON.stringify(update, null, 2)
}

// Delete the message that triggered the command
async function deleteCommand(chatId: number, messageId: number, env: Env): Promise<void> {
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_SECRET}/deleteMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
        }),
    })

    if (!response.ok) {
        throw new Error(`Telegram API deleteMessage responded with status ${response.status} and body ${await response.text()}`)
    }
}

// Send a message back to Telegram chat
async function sendReplyToTelegram(chatId: number, text: string, messageId: number, env: Env) {
    if (!text) return
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_SECRET}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: telegramifyMarkdown(text),
            reply_to_message_id: messageId,
            parse_mode: 'MarkdownV2',
        }),
    })

    if (!response.ok) {
        throw new Error(`Telegram API sendMessage responded with status ${response.status}`)
    }
}
