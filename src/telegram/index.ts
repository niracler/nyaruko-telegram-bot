import { Env, TelegramUpdate } from '../type'
import telegramifyMarkdown from "telegramify-markdown"
import { processSyncTwitterCommand } from './sync'
import { processNyCommand } from './ai'
import { syncToDatabase } from './db'

// Process the Telegram update received
export async function handleTelegramUpdate(update: TelegramUpdate, env: Env) {
    const allowedUserIds = env.ALLOW_USER_IDS
    const fromUserId = update.message?.from?.id.toString() || ''
    const fromUsername = update.message?.from?.username || ''

    try {
        await syncToDatabase(update, env)
    } catch (error) {
        await sendReplyToTelegram(
            update.message.chat.id,
            `Failed to insert message to database: ${error}`,
            update.message.message_id,
            env
        )
        return
    }

    let replyText = ''

    if (update.message.text?.startsWith('/getchatid')) {
        replyText = await processGetGroupIdCommand(update, env)
    } else if (update.message.text?.startsWith('/getuserid')) {
        replyText = await processGetUserIdCommand(update, env)
    } else if (update.message.text?.startsWith('/ping')) {
        replyText = await processPingCommand(update, env)
    } else if (update.message.text?.startsWith('/sync_twitter')) {
        if (!allowedUserIds.includes(fromUsername) && !allowedUserIds.includes(fromUserId)) {
            replyText = 'You are not allowed to sync with Twitter. Please contact @niracler to get access.'
        } else {
            replyText = await processSyncTwitterCommand(update, env)
        }
    } else if (update.message.text?.includes(`@${env.TELEGRAM_BOT_USERNAME}`)) {
        replyText = await processNyCommand(update, env)
    } else {
        return
    }

    await sendReplyToTelegram(update.message.chat.id, replyText, update.message.message_id, env)
}

// Process the '/getgroupid' command
async function processGetGroupIdCommand(update: TelegramUpdate, env: Env): Promise<string> {
    return `Your chat ID is ${update.message?.chat.id}`
}

// Process the '/getuserid' command
async function processGetUserIdCommand(update: TelegramUpdate, env: Env): Promise<string> {
    return `Your user ID is ${update.message?.from?.id}`
}

// Process the '/ping' command
async function processPingCommand(update: TelegramUpdate, env: Env): Promise<string> {
    // Show more information about this chat
    return JSON.stringify(update.message?.chat, null, 2)
}

// Process the '/debug' command
async function processDebugCommand(update: TelegramUpdate, env: Env): Promise<string> {
    // Show more information about this update
    return JSON.stringify(update, null, 2)
}

// Send a message back to Telegram chat
async function sendReplyToTelegram(chatId: number, text: string, messageId: number, env: Env) {
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
