import { drizzle } from "drizzle-orm/d1";
import { Env } from "./type";
import { Message } from "grammy/types";
import { eq } from "drizzle-orm";
import { telegramMessages } from "./schema";

export async function getTelegramPhotoUrlList(message: Message, env: Env): Promise<string[]> {
    let photoIdList: string[] = [];
    if (!message.media_group_id) {
        if (message.photo?.length) {
            photoIdList = [message.photo[message.photo.length - 1].file_id];
        }
    } else {
        const db = drizzle(env.DB);
        const mediaGroup = await db.select().from(telegramMessages).where(eq(telegramMessages.mediaGroupId, Number(message.media_group_id)));
        photoIdList = mediaGroup.map((message) => message.photoFileId).filter((id): id is string => id !== null);
    }

    const photoUrlList = [];
    for (const photoId of photoIdList) {
        const photoUrl = await getTelegramFileUrl(photoId, env.TELEGRAM_BOT_SECRET);
        photoUrlList.push(photoUrl);
    }

    return photoUrlList;
}

async function getTelegramFileUrl(fileId: string, botSecret: string): Promise<string> {
    const fileResponse = await fetch(`https://api.telegram.org/bot${botSecret}/getFile?file_id=${fileId}`);
    if (!fileResponse.ok) {
        throw new Error(`Telegram API getFile responded with status ${fileResponse.status}`);
    }
    const fileData = await fileResponse.json() as { ok: boolean, result: { file_path: string } };
    const filePath = fileData.result.file_path;
    return `https://api.telegram.org/file/bot${botSecret}/${filePath}`;
}

export function getUserInfo(message: Message): { replyName: string, id: number } {
    const from = message?.from;
    const senderChat = message?.sender_chat;

    if (from?.username === "GroupAnonymousBot" && senderChat) {
        return {
            replyName: senderChat.username ? `@${senderChat.username}` : senderChat.title || '',
            id: senderChat.id || 0
        };
    }

    return {
        replyName: from?.username ? `@${from.username}` : from?.first_name || '',
        id: from?.id || 0
    };
}
