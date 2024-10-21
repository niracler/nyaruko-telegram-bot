import OAuth from 'oauth-1.0a'
import { HmacSHA1, enc } from 'crypto-js'
import { Buffer } from 'node:buffer'
import { Env as CoreEnv } from "@/core/type"
import { getTelegramPhotoUrlList, getUserInfo } from '@/core/utils'
import { Update } from 'grammy/types'

export type Env = {
    TWITTER_API_KEY: string
    TWITTER_API_SECRET: string
    TWITTER_ACCESS_TOKEN: string
    TWITTER_ACCESS_TOKEN_SECRET: string
    TWITTER_USER_ID: string
    ALLOW_USER_IDS: string[]
} & CoreEnv

interface TwitterResponse {
    data?: {
        id: string
        text: string
    }
    errors?: unknown
}

async function processSyncTwitterCommand(update: Update, env: Env): Promise<string> {
    if (!update.message?.reply_to_message) {
        return '没有找到要同步到 Twitter 的消息。'
    }

    const { id, replyName } = getUserInfo(update.message)
    if (!env.ALLOW_USER_IDS.includes(id.toString()) && !env.ALLOW_USER_IDS.includes(replyName)) {
        return '您没有权限同步到 Twitter。请联系管理员获取访问权限。'
    }

    try {
        const photoUrlList = await getTelegramPhotoUrlList(update.message.reply_to_message, env)
        const tweetMediaIds = await uploadPhotosToTwitter(photoUrlList, env)
        const tweetContent = `${update.message.reply_to_message.caption || update.message.reply_to_message.text || ''} #from_telegram`
        const tweets = await postTweets(tweetContent, tweetMediaIds, env)

        return formatTweetResponse(tweets, env.TWITTER_USER_ID)
    } catch (error) {
        return `发推失败：${error}`
    }
}

function formatTweetResponse(tweets: TwitterResponse[], userId: string): string {
    let replyText = ''
    let urlList = ''
    
    for (const tweet of tweets) {
        if (!tweet.data?.id) {
            replyText += `发推失败：${JSON.stringify(tweet)}\n`
        } else {
            urlList = `\nhttps://fxtwitter.com/${userId}/status/${tweet.data.id}${urlList}`
        }
    }

    return urlList ? `您的消息已发布到 Twitter：\n${urlList}` : replyText
}

async function postTweets(tweetContent: string, tweetMediaIds: string[], env: Env): Promise<TwitterResponse[]> {
    const tweets = []
    let lastTweetId: string | undefined
    let mediaIdIndex = 0

    while (tweetContent.length > 0 || mediaIdIndex < tweetMediaIds.length) {
        const { content, remainingContent } = splitTweetContent(tweetContent)
        const mediaIds = tweetMediaIds.slice(mediaIdIndex, mediaIdIndex + 4)
        
        const tweet = await postTweet(content, mediaIds, lastTweetId, env)
        tweets.push(tweet)
        
        lastTweetId = tweet.data?.id
        tweetContent = remainingContent
        mediaIdIndex += 4
    }

    return tweets
}

function splitTweetContent(content: string): { content: string, remainingContent: string } {
    let tweetContent = ''
    const lines = content.split('\n')
    
    for (const line of lines) {
        if (tweetContent.length + line.length > 140) break
        if (line === '---') {
            tweetContent += '   '
            break
        }
        tweetContent += line + '\n'
    }

    return {
        content: tweetContent,
        remainingContent: content.slice(tweetContent.length)
    }
}

async function uploadPhotosToTwitter(photoUrlList: string[], env: Env): Promise<string[]> {
    const uploadPromises = photoUrlList.map(async (photoUrl) => {
        const mediaData = await fetch(photoUrl).then(res => res.arrayBuffer())
        const media = await uploadMediaToTwitter(mediaData, env)
        if (media.errors) {
            console.log("上传媒体失败：", JSON.stringify(media.errors))
            throw new Error(`上传媒体失败：${JSON.stringify(media.errors)}`)
        }
        console.log(JSON.stringify(media, null, 2))
        return media
    })

    const result = await Promise.all(uploadPromises)

    return result.map(media => media.data?.id).filter((id): id is string => id !== undefined)
}

async function uploadMediaToTwitter(mediaData: ArrayBuffer, env: Env): Promise<TwitterResponse> {
    return makeTwitterRequest(
        'https://upload.X.com/1.1/media/upload.json?media_category=tweet_image',
        'POST',
        new URLSearchParams({ media_data: Buffer.from(mediaData).toString('base64') }),
        'application/x-www-form-urlencoded',
        env
    )
}

async function postTweet(text: string, mediaList: string[], replyId: string | undefined, env: Env): Promise<TwitterResponse> {
    const msg = {
        text,
        reply: replyId ? { in_reply_to_tweet_id: replyId } : undefined,
        media: mediaList.length > 0 ? { media_ids: mediaList } : undefined,
    }

    return makeTwitterRequest('https://api.twitter.com/2/tweets', 'POST', JSON.stringify(msg), 'application/json', env)
}

async function makeTwitterRequest(url: string, method: string, data: string | URLSearchParams, contentType: string, env: Env): Promise<TwitterResponse> {
    const oauth = new OAuth({
        consumer: { key: env.TWITTER_API_KEY, secret: env.TWITTER_API_SECRET },
        signature_method: 'HMAC-SHA1',
        hash_function(baseString, key) {
            return HmacSHA1(baseString, key).toString(enc.Base64)
        },
    })

    const oauthToken = {
        key: env.TWITTER_ACCESS_TOKEN,
        secret: env.TWITTER_ACCESS_TOKEN_SECRET,
    }

    const requestData = { url, method }
    const headers = {
        ...oauth.toHeader(oauth.authorize(requestData, oauthToken)),
        'Content-Type': contentType,
    }

    const response = await fetch(url, { method, headers, body: data })
    console.log(contentType)
    console.log(JSON.stringify(headers))

    return response.json() as Promise<TwitterResponse>
}

export default {
    processSyncTwitterCommand,
    uploadPhotosToTwitter
}
