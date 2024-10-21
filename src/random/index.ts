import { Env as CoreEnv } from "@/core/type"
import { getTelegramPhotoUrlList, getUserInfo } from "@/core/utils"
import { Update, Message } from "grammy/types"

export type Env = {
    MY_BUCKET: R2Bucket
    GH_TOKEN: string
} & CoreEnv

export async function processRandom(update: Update, env: Env): Promise<string> {
    if (!update.message) return ''

    const { id, replyName } = getUserInfo(update.message)
    const allowedUserList = env.ALLOW_USER_IDS

    if (!allowedUserList.includes(replyName) && !allowedUserList.includes(id.toString())) {
        return ''
    }

    const issue_url = getIssueUrl(update.message.reply_to_message?.entities)
    if (!issue_url) return ''

    const content = await buildContent(update.message, env)
    await postCommentToGithub(issue_url, content, env.GH_TOKEN)

    return ''
}

function getIssueUrl(entities?: Array<{ url?: string, type: string }>): string | undefined {
    if (!entities) return undefined

    for (const entity of entities) {
        if (entity.type === 'text_link') {
            let url = entity.url
            if (url === "https://trello.com/c/5PubTeC9") {
                url = "https://github.com/niracler/random/issues/6"
            }
            return url
        }
    }
    return undefined
}

async function buildContent(message: Message, env: Env): Promise<string> {
    let content = message.text || message.caption || ''
    const photoUrlList = await getTelegramPhotoUrlList(message, env)

    if (photoUrlList.length !== 0) {
        const attachmentUrlList = await uploadPhotosToR2(photoUrlList, env)
        content += '\n\n' + attachmentUrlList.map(url => `![image](${url})`).join('\n')
    }

    return content
}

async function postCommentToGithub(issue_url: string, content: string, token: string): Promise<void> {
    const issue_id = issue_url.split('/').pop()
    const url = `https://api.github.com/repos/niracler/random/issues/${issue_id}/comments`

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'niracler'
        },
        body: JSON.stringify({ body: content })
    })

    if (!response.ok) {
        console.error(`Failed to post comment: ${await response.text()}`)
    }
}

async function uploadPhotosToR2(photoUrlList: string[], env: Env): Promise<string[]> {
    const attachmentUrlList: string[] = []
    for (const photoUrl of photoUrlList) {
        const mediaData = await fetch(photoUrl).then(res => res.arrayBuffer())
        const r2path = `random/${Date.now()}.png`

        try {
            await env.MY_BUCKET.put(r2path, mediaData)
            attachmentUrlList.push(`https://image.niracler.com/${r2path}`)
        } catch (e) {
            console.error(`Failed to upload media: ${e}`)
        }
    }
    return attachmentUrlList
}
