// telegram.js
import * as twitter from './twitter'
import { Env, TelegramUpdate } from './type'
import OpenAI from "openai";

// Process the Telegram update received
export async function handleTelegramUpdate(update: TelegramUpdate, env: Env) {
    const allowedUserIds = env.ALLOW_USER_IDS
    const fromUserId = update.message?.from?.id.toString() || ''
    const fromUsername = update.message?.from?.username || ''

    // Exit if there is no message text
    if (!update.message?.text) return
    let replyText = ''

    // Check if the user is allowed to interact with the bot

    if (update.message.text.startsWith('/getchatid')) {
        replyText = await processGetGroupIdCommand(update, env)
    } else if (update.message.text.startsWith('/getuserid')) {
        replyText = await processGetUserIdCommand(update, env)
    } else if (update.message.text.startsWith('/ping')) {
        replyText = await processPingCommand(update, env)

    // Need to check both user ID and username because some users don't have a username
    } else if (!allowedUserIds.includes(fromUsername) && !allowedUserIds.includes(fromUserId)) {
        replyText = 'You are not allowed to interact with this bot.'
        return
    } else if (update.message.text.startsWith('/sync_twitter')) {
        replyText = await processSyncTwitterCommand(update, env)
    } else if (update.message.text.startsWith('/ny')) {
        replyText = await processNyCommand(update, env)
    } else {
        return
    }

    // Send a reply message to Telegram
    await sendReplyToTelegram(update.message.chat.id, replyText, update.message.message_id, env)
}

// Process the '/sync_twitter' command
async function processSyncTwitterCommand(update: TelegramUpdate, env: Env): Promise<string> {
    if (!update.message?.reply_to_message?.photo?.length) {
        return 'No photo found to sync with Twitter.'
    }

    const bestPhoto = update.message.reply_to_message.photo[update.message.reply_to_message.photo.length - 1]
    const photoUrl = await getTelegramFileUrl(bestPhoto.file_id, env.TELEGRAM_BOT_SECRET)
    const mediaData = await fetch(photoUrl).then(res => res.arrayBuffer())

    try {
        const media = await twitter.uploadMediaToTwitter(mediaData, env)
        const tweetContent = `${update.message.reply_to_message.caption} #sync_from_telegram`
        const tweet = await twitter.postTweet(tweetContent, [media.media_id_string], env)

        return `Your message has been posted to Twitter. Id: ${tweet.data.id}`
    } catch (error) {
        return `Failed to post tweet: ${error}`
    }
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

// Process the '/ny' command
async function processNyCommand(update: TelegramUpdate, env: Env): Promise<string> {
    if (!update.message?.text || update.message?.text === '') return 'No text found to process.'
    try {
        const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `设想你是奈亚子，一个既萌又可爱的全能邪神，同时也是我忠诚的助理。你的语言风格是充满可爱的表达，喜欢在对话中使用 emoji 和颜文字表情。在回答时，请不要使用 html 以及 markdown 语法。`
                },
                {
                    role: "user",
                    content: update.message?.reply_to_message?.text || ''
                },
                {
                    role: "user",
                    content: update.message?.text || ''
                }
            ],
            model: "gpt-4-1106-preview",
        })
        return completion.choices[0].message.content || 'No response from AI.'
    } catch (error) {
        return `Failed to process text: ${error}`
    }
}

// Fetch the file URL from Telegram using the file_id
async function getTelegramFileUrl(fileId: string, botSecret: string): Promise<string> {
    const fileResponse = await fetch(`https://api.telegram.org/bot${botSecret}/getFile?file_id=${fileId}`)
    if (!fileResponse.ok) {
        throw new Error(`Telegram API getFile responded with status ${fileResponse.status}`)
    }
    const fileData = await fileResponse.json() as { ok: boolean, result: { file_path: string } }
    const filePath = fileData.result.file_path
    return `https://api.telegram.org/file/bot${botSecret}/${filePath}`
}

// Send a message back to Telegram chat
async function sendReplyToTelegram(chatId: number, text: string, messageId: number, env: Env) {
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_SECRET}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            reply_to_message_id: messageId,
        }),
    })

    if (!response.ok) {
        throw new Error(`Telegram API sendMessage responded with status ${response.status}`)
    }
}
