import { ipfsUploadFile } from "crossbell/ipfs"
import { Env as CoreEnv } from "@/core/type"
import { getTelegramPhotoUrlList, getUserInfo } from "@/core/utils"
import { Update } from "grammy/types"

export type Env = {
    XLOG_TOKEN: string
    XLOG_CHARACTER_ID: string
} & CoreEnv

/**
 * 处理同步XLog命令，将消息同步到XLog。
 * 
 * @param update - Telegram更新对象
 * @param env - 环境对象
 * @returns 同步操作结果的字符串Promise
 */
export async function processSyncXLogCommand(update: Update, env: Env): Promise<string> {
    if (!update.message) return ''
    const { id: fromUserId, replyName } = getUserInfo(update.message)

    if (!env.ALLOW_USER_IDS.includes(fromUserId.toString()) && !env.ALLOW_USER_IDS.includes(replyName)) {
        return `${replyName} 噢呀～看来您还没有变身的魔法呢～ (＞ｍ＜) 为了同步XLog，您需要管理员大人的特别许可哦！快快联系管理员大大，拿到闪闪发光的权限吧～ヾ(｡>﹏<｡)ﾉﾞ✧*。`
    }

    if (!update.message?.reply_to_message) {
        return `${replyName} 哎呀，看起来有点技术问题哦 (｡•́︿•̀｡)～"没有找到与XLog同步的消息呢。" \n\n快快联系管理员大大帮忙弄清楚是怎么回事呀？ヾ(｡･ω･｡)`
    }

    try {
        const { title, content } = extractTitleAndContent(update.message)
        const photoUrlList = await getTelegramPhotoUrlList(update.message.reply_to_message, env)
        const attachmentUrlList = await uploadPhotosToXLog(photoUrlList)
        const response = await createShort(title, content, attachmentUrlList, env)

        if (!response.data) {
            return `Failed to post to XLog: ${JSON.stringify(response)}`
        }

        return `消息已经成功送到 XLog 了呢~ 🎈 快去看看吧：\n\nhttps://xlog.app/api/redirection?characterId=${env.XLOG_CHARACTER_ID}&noteId=${response.data.noteId} ฅ^•ﻌ•^ฅ`
    } catch (error) {
        return `Failed to post to XLog: ${error}`
    }
}

/**
 * 在XLOG系统中创建短笔记。
 * @param title - 笔记标题
 * @param content - 笔记内容
 * @param attachmentUrlList - 笔记附件URL列表
 * @param env - 环境变量
 * @returns XLOG系统响应的Promise
 */
export async function createShort(title: string, content: string, attachmentUrlList: string[], env: Env): Promise<any> {
    const url = `https://indexer.crossbell.io/v1/siwe/contract/characters/${env.XLOG_CHARACTER_ID}/notes`

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

    return response.json()
}

/**
 * 上传照片到XLog。
 * 
 * @param photoUrlList - 要上传的照片URL列表
 * @returns 附件URL数组的Promise
 */
async function uploadPhotosToXLog(photoUrlList: string[]): Promise<string[]> {
    return Promise.all(photoUrlList.map(async (photoUrl) => {
        const mediaData = await fetch(photoUrl).then(res => res.arrayBuffer())
        const file = new File([mediaData], "mediaData")
        return (await ipfsUploadFile(file)).url
    }))
}

/**
 * 从消息中提取标题和内容。
 * @param message - Telegram消息对象
 * @returns 包含标题和内容的对象
 */
function extractTitleAndContent(message: any): { title: string, content: string } {
    let content = message.reply_to_message.text || message.reply_to_message.caption || ''
    let title

    if (message.quote && message.quote.is_manual) {
        title = message.quote.text
    } else {
        const lines = content.split('\n')
        title = lines[0] || 'Untitled'
        content = lines.slice(1).join('\n')
    }

    return { title, content }
}
