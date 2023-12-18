// telegram.js
import * as twitter from './twitter'
import { Env, TelegramUpdate } from './type'
import telegramifyMarkdown from "telegramify-markdown";
import OpenAI from "openai";

// Process the Telegram update received
export async function handleTelegramUpdate(update: TelegramUpdate, env: Env) {
    const allowedUserIds = env.ALLOW_USER_IDS
    const fromUserId = update.message?.from?.id.toString() || ''
    const fromUsername = update.message?.from?.username || ''

    // insert message to database
    if (!update.message) {
        console.log('No message found in the update')
        return
    }

    try {
        await sync2database(update, env)
    } catch (error) {
        // Send a reply message to Telegram
        await sendReplyToTelegram(
            update.message?.chat.id,
            `Failed to insert message to database: ${error}`,
            update.message?.message_id, env
        )
        return
    }

    let replyText = ''
    // Check if the user is allowed to interact with the bot

    if (update.message.text?.startsWith('/getchatid')) {
        replyText = await processGetGroupIdCommand(update, env)
    } else if (update.message.text?.startsWith('/getuserid')) {
        replyText = await processGetUserIdCommand(update, env)
    } else if (update.message.text?.startsWith('/ping')) {
        replyText = await processPingCommand(update, env)
    } else if (update.message.text?.startsWith('/sync_twitter')) {
        // Need to check both user ID and username because some users don't have a username
        if (!allowedUserIds.includes(fromUsername) && !allowedUserIds.includes(fromUserId)) {
            replyText = 'You are not allowed to sync with Twitter. Please contact @niracler to get access.'
        } else {
            replyText = await processSyncTwitterCommand(update, env)
        }
    } else if (update.message.text?.includes(`@${env.TELEGRAM_BOT_USERNAME}`)) {
        replyText = await processNyCommand(update, env)
    } else {
        // replyText = await processDebugCommand(update, env)
        return
    }

    // Send a reply message to Telegram
    await sendReplyToTelegram(update.message.chat.id, replyText, update.message.message_id, env)
}

// Process the '/sync_twitter' command
async function processSyncTwitterCommand(update: TelegramUpdate, env: Env): Promise<string> {
    if (!update.message?.reply_to_message) {
        return 'No message found to sync with Twitter.'
    }

    try {
        // select same media group id from database
        let photoIdList = []
        if (!update.message.reply_to_message.media_group_id) {
            if (update.message.reply_to_message.photo?.length) {
                photoIdList = [update.message.reply_to_message.photo[update.message.reply_to_message.photo.length - 1].file_id]
            }
        } else {
            const mediaGroup = await env.DB.prepare(`
                SELECT * FROM telegram_messages WHERE media_group_id = ?
            `).bind(update.message.reply_to_message.media_group_id).all()
            photoIdList = mediaGroup.results.map((message: any) => message.photo_file_id)
        }

        const tweetMediaIds = []
        for (const photoId of photoIdList) {
            const photoUrl = await getTelegramFileUrl(photoId, env.TELEGRAM_BOT_SECRET)
            const mediaData = await fetch(photoUrl).then(res => res.arrayBuffer())
            const media = await twitter.uploadMediaToTwitter(mediaData, env)
            tweetMediaIds.push(media.media_id_string)
        }

        let tweetContent = `${update.message.reply_to_message.caption || update.message.reply_to_message.text} #sync_from_telegram`
        let lastTweetId: string | undefined = undefined
        let mediaIdIndex = 0

        // twitter 超过 140 字符需要分开发, 发的时候需要引用上一条推文，图片也是以 4 张为一组发，最后一组可以不满 4 张
        let replyText = ''
        while (tweetContent.length > 0 || mediaIdIndex < tweetMediaIds.length) {
            let tweetContentTemp = ''
            for (const line of tweetContent.split('\n')) {
                if (tweetContentTemp.length + line.length > 140) {
                    break
                }
                if (line === '---') {
                    tweetContentTemp += '   '
                    break
                }
                tweetContentTemp += line + '\n'
            }

            let tweetMediaIdsTemp = []
            for (let i = 0; i < 4; i++) {
                if (mediaIdIndex >= tweetMediaIds.length) {
                    break
                }
                tweetMediaIdsTemp.push(tweetMediaIds[mediaIdIndex])
                mediaIdIndex += 1
            }

            const tweet = await twitter.postTweet(tweetContentTemp, tweetMediaIdsTemp, lastTweetId, env)

            if (!tweet.data?.id) {
                replyText += `Failed to post tweet: ${JSON.stringify(tweet)}` + '\n'
            } else {
                replyText = `Your message has been posted to Twitter. Id: ${tweet.data.id}` + '\n' + replyText
                lastTweetId = tweet.data.id
            }

            tweetContent = tweetContent.slice(tweetContentTemp.length)
        }

        return replyText
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
                    content: `设想你是奈亚子，一个既萌又可爱的全能邪神，同时也是我忠诚的助理。你的语言风格是充满可爱的表达，喜欢在对话中使用 emoji 和颜文字表情。在回答时，请尽量使用 telegram 兼容的 markdown 语法。没有特殊说明的话，回复内容尽量克制简短。`
                },
                {
                    role: "user",
                    content: update.message?.reply_to_message?.text || update.message?.reply_to_message?.caption || ''
                },
                {
                    role: "user",
                    content: update.message?.text || ''
                }
            ],
            model: "gpt-4-1106-preview",
        })
        return `${completion.choices[0].message.content} \n -- by gpt-4-1106-preview` || 'No response from AI.'
    } catch (error) {
        return `Failed to process text: ${error}`
    }
}

// Process the '/debug' command
async function processDebugCommand(update: TelegramUpdate, env: Env): Promise<string> {
    // Show more information about this update
    return JSON.stringify(update, null, 2)
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
            text: telegramifyMarkdown(text),
            reply_to_message_id: messageId,
            parse_mode: 'MarkdownV2',
        }),
    })

    if (!response.ok) {
        throw new Error(`Telegram API sendMessage responded with status ${response.status}`)
    }
}

async function sync2database(update: TelegramUpdate, env: Env) {
    if (!update.message) {
        throw new Error('No message found in the update')
    }

    await env.DB.prepare(`
    INSERT INTO telegram_messages (
        update_id,
        message_id,
        user_id,
        first_name,
        username,
        sender_chat_id,
        sender_chat_title,
        sender_chat_username,
        sender_chat_type,
        chat_id,
        chat_title,
        chat_username,
        chat_type,
        date,
        message_thread_id,
        reply_to_message_id,
        reply_from_id,
        reply_from_first_name,
        reply_sender_chat_id,
        reply_sender_chat_title,
        reply_sender_chat_type,
        reply_date,
        forward_from_chat_id,
        forward_from_chat_title,
        forward_from_chat_type,
        forward_from_message_id,
        media_group_id,
        photo_file_id,
        caption,
        text
    ) VALUES (
        ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
    )
`).bind(
        update.update_id,
        update.message.message_id,
        update.message.from?.id || null,
        update.message.from?.first_name || null,
        update.message.from?.username || null,
        update.message.sender_chat?.id || null,
        update.message.sender_chat?.title || null,
        update.message.sender_chat?.username || null,
        update.message.sender_chat?.type || null,
        update.message.chat?.id || null,
        update.message.chat?.title || null,
        update.message.chat?.username || null,
        update.message.chat?.type || null,
        update.message.date,
        update.message.message_id,
        update.message.reply_to_message?.message_id || null,
        update.message.reply_to_message?.from?.id || null,
        update.message.reply_to_message?.from?.first_name || null,
        update.message.reply_to_message?.sender_chat?.id || null,
        update.message.reply_to_message?.sender_chat?.title || null,
        update.message.reply_to_message?.sender_chat?.type || null,
        update.message.reply_to_message?.date || null,
        update.message.forward_from_chat?.id || null,
        update.message.forward_from_chat?.title || null,
        update.message.forward_from_chat?.type || null,
        update.message.forward_from_message_id || null,
        update.message.media_group_id || null,
        update.message.photo?.length ? update.message.photo[update.message.photo.length - 1].file_id : null,
        update.message.caption || null,
        update.message.text || null
    ).run()
}
