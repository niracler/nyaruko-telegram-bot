import { ipfsUploadFile } from "crossbell/ipfs"
import { Env as CoreEnv } from "@/core/type"
import { getTelegramPhotoUrlList, getUserInfo } from "@/core/utils"
import { Update, Message } from "grammy/types"

export type Env = CoreEnv & {
    XLOG_TOKEN: string
    XLOG_CHARACTER_ID: string
}

interface XLogResponse {
    data?: {
        noteId: string
    }
    errors?: unknown
}

/**
 * 处理同步XLog命令，将消息同步到XLog。
 */
export async function processSyncXLogCommand(update: Update, env: Env): Promise<string> {
    if (!update.message) return ''
    const { id: fromUserId, replyName } = getUserInfo(update.message)

    if (!isUserAuthorized(fromUserId, replyName, env)) {
        return generateUnauthorizedMessage(replyName)
    }

    if (!update.message.reply_to_message) {
        return generateNoReplyMessage(replyName)
    }

    try {
        const { title, content } = extractTitleAndContent(update.message)
        const photoUrlList = await getTelegramPhotoUrlList(update.message.reply_to_message, env)
        const attachmentUrlList = await uploadPhotosToXLog(photoUrlList)
        const response = await createShort(title, content, attachmentUrlList, env)

        return response.data 
            ? generateSuccessMessage(env.XLOG_CHARACTER_ID, response.data.noteId)
            : `发布到 XLog 失败：${JSON.stringify(response)}`
    } catch (error) {
        return `发布到 XLog 失败：${error}`
    }
}

/**
 * 在XLOG系统中创建短笔记。
 */
async function createShort(title: string, content: string, attachmentUrlList: string[], env: Env): Promise<XLogResponse> {
    const url = `https://indexer.crossbell.io/v1/siwe/contract/characters/${env.XLOG_CHARACTER_ID}/notes`
    const body = createRequestBody(title, content, attachmentUrlList)

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${env.XLOG_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    })

    return response.json() as Promise<XLogResponse>
}

/**
 * 上传照片到XLog。
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
 */
function extractTitleAndContent(message: Message): { title: string, content: string } {
    const content = message.reply_to_message?.text || message.reply_to_message?.caption || ''
    
    if (message.quote?.is_manual) {
        return { title: message.quote.text, content }
    }

    const lines = content.split('\n')
    return { 
        title: lines[0] || 'Untitled', 
        content: lines.slice(1).join('\n') 
    }
}

function isUserAuthorized(userId: number, username: string, env: Env): boolean {
    return env.ALLOW_USER_IDS.includes(userId.toString()) || env.ALLOW_USER_IDS.includes(username)
}

function generateUnauthorizedMessage(replyName: string): string {
    return `${replyName} 噢呀～看来您还没有变身的魔法呢～ (＞ｍ＜) 为了同步XLog，您需要管理员大人的特别许可哦！快快联系管理员大大，拿到闪闪发光的权限吧～ヾ(｡>﹏<｡)ﾉﾞ✧*。`
}

function generateNoReplyMessage(replyName: string): string {
    return `${replyName} 哎呀，看起来有点技术问题哦 (｡•́︿•̀｡)～"没有找到与XLog同步的消息呢。" \n\n快快联系管理员大大帮忙弄清楚是怎么回事呀？ヾ(｡･ω･｡)`
}

function generateSuccessMessage(characterId: string, noteId: string): string {
    return `消息已经成功送到 XLog 了呢~ 🎈 快去看看吧：\n\nhttps://xlog.app/api/redirection?characterId=${characterId}&noteId=${noteId} ฅ^•ﻌ•^ฅ`
}

function createRequestBody(title: string, content: string, attachmentUrlList: string[]) {
    return {
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
    }
}
