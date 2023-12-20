import { Env, TelegramUpdate } from "../type"

export async function sync2database(update: TelegramUpdate, env: Env) {

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
