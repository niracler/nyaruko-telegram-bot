import { Env } from "./type"
import { Message } from 'grammy/types'

/**
 * Inserts the Telegram update data into the database.
 * 
 * @param update - The Telegram update object.
 * @param env - The environment object.
 * @returns A promise that resolves when the data is successfully inserted into the database.
 */
export async function syncToDatabase(updateId: number, message: Message, env: Env) {
    console.log('syncToDatabase', JSON.stringify(message, null, 2))

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
        updateId,
        message.message_id,
        message.from?.id || null,
        message.from?.first_name || null,
        message.from?.username || null,
        message.sender_chat?.id || null,
        message.sender_chat?.title || null,
        message.sender_chat?.username || null,
        message.sender_chat?.type || null,
        message.chat?.id || null,
        message.chat?.title || null,
        message.chat?.username || null,
        message.chat?.type || null,
        message.date,
        message.message_id,
        message.reply_to_message?.message_id || null,
        message.reply_to_message?.from?.id || null,
        message.reply_to_message?.from?.first_name || null,
        message.reply_to_message?.sender_chat?.id || null,
        message.reply_to_message?.sender_chat?.title || null,
        message.reply_to_message?.sender_chat?.type || null,
        message.reply_to_message?.date || null,
        null, null, null, null,
        message.media_group_id || null,
        message.photo?.length ? message.photo[message.photo.length - 1].file_id : null,
        message.caption || null,
        message.text || null
    ).run()
}
