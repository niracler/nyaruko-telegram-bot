import { Env, TelegramMessage } from "../type"

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
