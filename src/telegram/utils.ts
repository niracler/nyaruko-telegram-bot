import { Env, TelegramMessage } from "../type"

/**
 * Retrieves the URL list of Telegram photos from a given message.
 * If the message belongs to a media group, it retrieves the photos from all messages in the group.
 * 
 * @param message - The Telegram message object.
 * @param env - The environment object containing necessary configurations.
 * @returns A promise that resolves to an array of photo URLs.
 */
export async function getTelegramPhotoUrlList(message: TelegramMessage, env: Env): Promise<string[]> {
    let photoIdList = []
    if (!message.media_group_id) {
        if (message.photo?.length) {
            photoIdList = [message.photo[message.photo.length - 1].file_id]
        }
    } else {
        const mediaGroup = await env.DB.prepare(`
                SELECT * FROM telegram_messages WHERE media_group_id = ?
            `).bind(message.media_group_id).all()
        photoIdList = mediaGroup.results.map((message: any) => message.photo_file_id)
    }

    const photoUrlList = []
    for (const photoId of photoIdList) {
        const photoUrl = await getTelegramFileUrl(photoId, env.TELEGRAM_BOT_SECRET)
        photoUrlList.push(photoUrl)
    }

    return photoUrlList
}

/**
 * Retrieves the URL of a file from the Telegram API based on the file ID.
 * @param fileId The ID of the file.
 * @param botSecret The secret token of the Telegram bot.
 * @returns The URL of the file.
 * @throws An error if the Telegram API getFile request fails.
 */
async function getTelegramFileUrl(fileId: string, botSecret: string): Promise<string> {
    const fileResponse = await fetch(`https://api.telegram.org/bot${botSecret}/getFile?file_id=${fileId}`)
    if (!fileResponse.ok) {
        throw new Error(`Telegram API getFile responded with status ${fileResponse.status}`)
    }
    const fileData = await fileResponse.json() as { ok: boolean, result: { file_path: string } }
    const filePath = fileData.result.file_path
    return `https://api.telegram.org/file/bot${botSecret}/${filePath}`
}
