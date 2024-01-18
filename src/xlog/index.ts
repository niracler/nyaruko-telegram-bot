import { ipfsUploadFile } from "crossbell/ipfs"
import { Env as CoreEnv, TelegramUpdate } from "../core/type"
import { getTelegramPhotoUrlList } from "../core/utils"

export type Env = {
    XLOG_TOKEN: string
    XLOG_CHARACTER_ID: string
    ALLOW_USER_IDS: string[]
} & CoreEnv

/**
 * Processes the syncXLog command by syncing a message with XLog.
 * 
 * @param update - The Telegram update object.
 * @param env - The environment object.
 * @returns A promise that resolves to a string indicating the result of the sync operation.
 */
export async function processSyncXLogCommand(update: TelegramUpdate, env: Env): Promise<string> {

    const fromUserId = update.message?.from?.id.toString() || ''
    const fromUsername = update.message?.from?.username || ''
    const allowedUserList = env.ALLOW_USER_IDS

    if (!allowedUserList.includes(fromUsername) && !allowedUserList.includes(fromUserId)) {
        return 'You are not allowed to sync with XLog. Please contact manager to get access.'
    }

    if (!update.message?.reply_to_message) {
        return 'No message found to sync with XLog.'
    }

    let content = update.message.reply_to_message.text || update.message.reply_to_message.caption || ''
    content = `${content}\n#from_telegram`

    try {
        const photoUrlList = await getTelegramPhotoUrlList(update.message.reply_to_message, env)
        const attachmentUrlList = await uploadPhotosToXLog(photoUrlList, env)
        // first line is title, rest is content
        const title = content.split('\n')[0] || 'Untitled'
        content = content.slice(title.length + 1)

        const response = await createShort(title, content, attachmentUrlList, env)

        if (!response.data ) {
            return `Failed to post to XLog: ${JSON.stringify(response)}`
        } else {
            // TODO: debug mode
            return `Your message has been posted to XLog. data: ${JSON.stringify(response.data)}` //, metadata: ${JSON.stringify(attachmentUrlList)}, response: ${JSON.stringify(photoUrlList)}`
        }
    } catch (error) {
        return `Failed to post to XLog: ${error}`
    }
}

/**
 * Creates a short note in the XLOG system.
 * @param title - The title of the note.
 * @param content - The content of the note.
 * @param attachmentUrlList - The list of attachment URLs for the note.
 * @param env - The environment variables.
 * @returns A Promise that resolves to the response from the XLOG system.
 */
export async function createShort(title: string, content: string, attachmentUrlList: string[], env: Env): Promise<any> {
    const characterId = env.XLOG_CHARACTER_ID
    const url = `https://indexer.crossbell.io/v1/siwe/contract/characters/${characterId}/notes`

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${env.XLOG_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            metadata: {
                tags: ["short"],
                type: "note",
                title,
                content,
                summary: "",
                sources: ["xlog"],
                date_published: new Date().toISOString(),
                attributes: [
                    {
                        // random with timestamp
                        value: `${Date.now()}`,
                        trait_type: "xlog_slug",
                    },
                ],
                attachments: attachmentUrlList.map(url => ({
                    name: "image",
                    address: url,
                    mime_type: "image/png",
                })),
            }
        }),
    })

    return await response.json()
}

/**
 * Uploads photos to XLog.
 * 
 * @param photoUrlList - The list of photo URLs to upload.
 * @param env - The environment settings.
 * @returns A promise that resolves to an array of attachment URLs.
 */
export async function uploadPhotosToXLog(photoUrlList: string[], env: Env): Promise<string[]> {
    const attachmentUrlList = []
    for (const photoUrl of photoUrlList) {
        const mediaData = await fetch(photoUrl).then(res => res.arrayBuffer())
        const file = new File([mediaData], "mediaData")
        const url = (await ipfsUploadFile(file)).url
        attachmentUrlList.push(url)
    }
    return attachmentUrlList
}
