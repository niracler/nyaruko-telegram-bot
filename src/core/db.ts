import { Env } from "./type";
import { Message } from 'grammy/types';
import { drizzle } from 'drizzle-orm/d1';
import { telegramMessages } from './schema';

export async function syncToDatabase(updateId: number, message: Message, env: Env) {
    // TODO: use sentry to log errors
    console.log('syncToDatabase', JSON.stringify(message, null, 2));

    const db = drizzle(env.DB);
    await db.insert(telegramMessages).values({
        updateId,
        messageId: message.message_id,
        userId: message.from?.id,
        firstName: message.from?.first_name,
        username: message.from?.username,
        senderChatId: message.sender_chat?.id.toString(),
        senderChatTitle: message.sender_chat?.title,
        senderChatUsername: message.sender_chat?.username,
        senderChatType: message.sender_chat?.type,
        chatId: message.chat?.id.toString(),
        chatTitle: message.chat?.title,
        chatUsername: message.chat?.username,
        chatType: message.chat?.type,
        date: message.date,
        messageThreadId: message.message_thread_id,
        replyToMessageId: message.reply_to_message?.message_id,
        replyFromId: message.reply_to_message?.from?.id,
        replyFromFirstName: message.reply_to_message?.from?.first_name,
        replySenderChatId: message.reply_to_message?.sender_chat?.id,
        replySenderChatTitle: message.reply_to_message?.sender_chat?.title,
        replySenderChatType: message.reply_to_message?.sender_chat?.type,
        replyDate: message.reply_to_message?.date ? message.reply_to_message.date : null,
        forwardFromChatId: null,
        forwardFromChatTitle: null,
        forwardFromChatType: null,
        forwardFromMessageId: null,
        mediaGroupId: Number(message.media_group_id),
        photoFileId: message.photo?.length ? message.photo[message.photo.length - 1].file_id.toString() : null,
        caption: message.caption,
        text: message.text
    });
}
