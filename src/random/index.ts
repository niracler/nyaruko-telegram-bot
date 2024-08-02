import { Env as CoreEnv } from "@/core/type"
import { getTelegramPhotoUrlList } from "@/core/utils"
import { Update, Message } from "grammy/types"

export type Env = {
    MY_BUCKET: R2Bucket
    GH_TOKEN: string
} & CoreEnv

export async function processRandom(update: Update, env: Env): Promise<string> {
    const allowedUserList = env.ALLOW_USER_IDS
    let fromUserId = update.message?.from?.id.toString() || ''
    let fromUsername = update.message?.from?.username || ''
    let formFirstName = update.message?.from?.first_name || ''
    let replyName = fromUsername ? `@${fromUsername}` : formFirstName

    if (replyName === "@GroupAnonymousBot") {
        const username = update.message?.sender_chat?.username || ''
        const title = update.message?.sender_chat?.title || ''
        fromUsername = update.message?.sender_chat?.username || ''
        fromUserId = update.message?.sender_chat?.id.toString() || ''
        replyName = username ? `@${username}` : title
    }

    if (!allowedUserList.includes(fromUsername) && !allowedUserList.includes(fromUserId)) {
        return ''
    }

    console.log("here?")

    let issue_url: string | undefined
    const entities = update.message?.reply_to_message?.entities
    if (entities) {
        for (const entity of entities) {
            if (entity.type === 'text_link') {
                issue_url = entity.url
                if (issue_url === "https://trello.com/c/5PubTeC9") {
                    issue_url = "https://github.com/niracler/random/issues/6"
                }
                break
            }
        }
    }

    if (!issue_url) {
        return ''
    }

    let content = update.message?.text || update.message?.caption || ''
    if (!update.message) return ''
    
    const photoUrlList = await getTelegramPhotoUrlList(update.message, env)

    if (photoUrlList.length !== 0) {
        const attachmentUrlList = await uploadPhotosToR2(photoUrlList, env)
        content += '\n\n'
        for (const attachmentUrl of attachmentUrlList) {
            content += `![image](${attachmentUrl})\n`
        }
    }

    console.log("here2")

    // comment this message to this issue throught github api
    const issue_id = issue_url.split('/').pop()
    const url = `https://api.github.com/repos/niracler/random/issues/${issue_id}/comments`
    const body = JSON.stringify({
        body: content
    })
    const headers = {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${env.GH_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${env.GH_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'niracler'
        },
        body: JSON.stringify({
            body: content
        })
    })

    console.log(`here3 ${url}`)
    console.log(`body: ${body}`)
    console.log(`headers: ${JSON.stringify(headers, null, 2)}`)

    const result = await response.text()
    console.log(JSON.stringify(result, null, 2))
    return ''
}

export async function uploadPhotosToR2(photoUrlList: string[], env: Env): Promise<string[]> {
    console.log("HHHHH1")
    const attachmentUrlList: string[] = []
    for (const photoUrl of photoUrlList) {
        const mediaData = await fetch(photoUrl).then(res => res.arrayBuffer())
        const r2path = `random/${Date.now()}.png`
        
        try {
            await env.MY_BUCKET.put(r2path, mediaData)
        } catch (e) {
            throw new Error(`Failed to upload media: ${e}`)
        }

        attachmentUrlList.push(`https://image.niracler.com/${r2path}`)
    }
    return attachmentUrlList
}

