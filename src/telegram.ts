// telegram.js
import * as twitter from './twitter'
import { Env, TelegramUpdate } from './type'

// Process the Telegram update received
export async function handleTelegramUpdate(update: TelegramUpdate, env: Env) {
    const allowedUserIds = env.ALLOW_USER_IDS
    const fromUserId = update.message?.from?.id.toString() || ''
    const fromUsername = update.message?.from?.username || ''

    // Exit if there is no message text
    if (!update.message?.text) return
    let replyText = ''

    // Check if the user is allowed to interact with the bot
    if (!allowedUserIds.includes(fromUsername) && !allowedUserIds.includes(fromUserId)) {
        return
    } else if (update.message.text.startsWith('/sync_twitter')) {
        replyText = await processSyncTwitterCommand(update, env)
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
