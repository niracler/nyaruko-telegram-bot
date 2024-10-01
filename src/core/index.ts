import telegramifyMarkdown from "telegramify-markdown"
import { Env } from "./type"
import { Update } from 'grammy/types'
import { syncToDatabase } from "./db"
import { Bot } from "grammy"
import { getUserInfo } from "./utils"

async function handleTelegramUpdate(update: Update, env: Env, handler: () => Promise<string>) {
    const message = update.message
    if (!message?.text) return
    const bot = new Bot(env.TELEGRAM_BOT_SECRET);

    try {
        await syncToDatabase(update.update_id, message, env)
    } catch (error) {
        await sendReplyToTelegram(message.chat.id, `同步数据库失败：${error}`, message.message_id, env)
    }

    try {
        await sendReplyToTelegram(message.chat.id, await handler(), message.message_id, env)
        if (message.text.startsWith('/')) {
            await bot.api.deleteMessage(message.chat.id, message.message_id)
        }
    } catch (error) {
        await sendReplyToTelegram(message.chat.id, `处理命令失败：${error}`, message.message_id, env)
    }
}

async function processGetGroupIdCommand(update: Update): Promise<string> {
    if (!update.message) return ""
    const { replyName } = getUserInfo(update.message)
    return `哟呼～记下来啦！${replyName} 的聊天 ID 是 \`${update.message?.chat.id}\` 呢~ (｡•̀ᴗ-)✧ `
}

async function processGetUserIdCommand(update: Update): Promise<string> {
    if (!update.message) return ""
    const { replyName, id } = getUserInfo(update.message)
    return `呀～ ${replyName} ，您的 ID 是 \`${id}\` 哦！ヽ(＾Д＾)ﾉ`
}

async function processPingCommand(update: Update): Promise<string> {
    return JSON.stringify(update.message?.chat, null, 2)
}

async function sendReplyToTelegram(chatId: number, text: string, messageId: number, env: Env) {
    if (!text) return
    const bot = new Bot(env.TELEGRAM_BOT_SECRET)
    try {
        await bot.api.sendMessage(chatId, telegramifyMarkdown(text), {
            reply_to_message_id: messageId,
            parse_mode: 'MarkdownV2',
        })
    } catch (error) {
        throw new Error(`发送消息失败：${error}`)
    }
}

export default {
    handleTelegramUpdate,
    processGetGroupIdCommand,
    processGetUserIdCommand,
    processPingCommand,
}
