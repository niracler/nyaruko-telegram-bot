import OAuth from 'oauth-1.0a'
import { HmacSHA1, enc } from 'crypto-js'
import { Buffer } from 'node:buffer'
import { Env as CoreEnv, TelegramUpdate } from "@/core/type"
import { getTelegramPhotoUrlList } from '@/core/utils'

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
    errors?: any
}

/**
 * Processes the sync /sync_twitter command.
 * 
 * @param update - The Telegram update.
 * @param env - The environment variables.
 * @returns A promise that resolves to a string indicating the result of the sync operation.
 */
async function processSyncTwitterCommand(update: TelegramUpdate, env: Env): Promise<string> {
    const allowedUserList = env.ALLOW_USER_IDS
    const fromUserId = update.message?.from?.id.toString() || ''
    const fromUsername = update.message?.from?.username || ''
    if (!allowedUserList.includes(fromUsername) && !allowedUserList.includes(fromUserId)) {
        return 'You are not allowed to sync with Twitter. Please contact manager to get access.'
    }

    if (!update.message?.reply_to_message) {
        return 'No message found to sync with Twitter.'
    }

    try {
        const photoUrlList = await getTelegramPhotoUrlList(update.message.reply_to_message, env)
        const tweetMediaIds = await uploadPhotosToTwitter(photoUrlList, env)

        let tweetContent = update.message.reply_to_message.caption || update.message.reply_to_message.text || ''

        tweetContent = `${tweetContent} #from_telegram`
        const tweets = await postTweets(tweetContent, tweetMediaIds, env)

        let replyText = ''
        let urlList = ''
        for (const tweet of tweets) {
            if (!tweet.data?.id) {
                replyText += `Failed to post tweet: ${JSON.stringify(tweet)}` + '\n'
            } else {
                urlList = `\nhttps://fxtwitter.com/${env.TWITTER_USER_ID}/status/${tweet.data.id}` + urlList
            }
        }

        if (urlList) {
            replyText += `Your message has been posted to Twitter:\n ${urlList}`
        }

        return replyText
    } catch (error) {
        return `Failed to post tweet: ${error}`
    }
}


/**
 * Posts tweets with content and media to Twitter.
 * 
 * @param tweetContent - The content of the tweet.
 * @param tweetMediaIds - An array of media IDs to be attached to the tweet.
 * @param env - The environment configuration.
 * @returns A promise that resolves to an array of TwitterResponse objects.
 */
async function postTweets(tweetContent: string, tweetMediaIds: string[], env: Env): Promise<TwitterResponse[]> {
    const tweets = []
    let lastTweetId: string | undefined = undefined
    let mediaIdIndex = 0

    while (tweetContent.length > 0 || mediaIdIndex < tweetMediaIds.length) {
        let tweetContentTemp = ''
        for (const line of tweetContent.split('\n')) {
            if (tweetContentTemp.length + line.length > 140) {
                break
            }
            if (line === '---') {
                tweetContentTemp += '   '
                break
            }
            tweetContentTemp += line + '\n'
        }

        const tweetMediaIdsTemp = tweetMediaIds.slice(mediaIdIndex, mediaIdIndex + 4)
        mediaIdIndex += 4

        const tweet = await postTweet(tweetContentTemp, tweetMediaIdsTemp, lastTweetId, env)

        tweets.push(tweet)
        lastTweetId = tweet.data?.id

        tweetContent = tweetContent.slice(tweetContentTemp.length)
    }

    return tweets
}

/**
 * Uploads photos to Twitter and returns an array of media IDs.
 * @param photoUrlList - The list of photo URLs to upload.
 * @param env - The environment configuration.
 * @returns A promise that resolves to an array of media IDs.
 */
async function uploadPhotosToTwitter(photoUrlList: string[], env: Env): Promise<string[]> {
    const tweetMediaIds = []
    for (const photoUrl of photoUrlList) {
        const mediaData = await fetch(photoUrl).then(res => res.arrayBuffer())
        const media = await uploadMediaToTwitter(mediaData, env)
        if (media.errors) {
            console.log("Failed to upload media: ", JSON.stringify(media.errors))
            throw new Error(`Failed to upload media: ${JSON.stringify(media.errors)}`)
        }

        console.log(JSON.stringify(media, null, 2))
        tweetMediaIds.push(media)
    }
    return tweetMediaIds
}

/**
 * Uploads media to Twitter.
 * @param mediaData The media data to be uploaded.
 * @param env The environment variables.
 * @returns The response from the Twitter API.
 */
async function uploadMediaToTwitter(mediaData: ArrayBuffer, env: Env): Promise<any> {
    return await makeTwitterRequest(
        'https://upload.X.com/1.1/media/upload.json?media_category=tweet_image',
        'POST',
        new URLSearchParams({ media_data: Buffer.from(mediaData).toString('base64') }),
        'application/x-www-form-urlencoded',
        env
    )
}

/**
 * Posts a tweet on Twitter.
 * 
 * @param text - The text content of the tweet.
 * @param mediaList - An array of media IDs to be attached to the tweet.
 * @param replyId - The ID of the tweet to reply to, if any.
 * @param env - The environment variables containing the Twitter API credentials.
 * @returns A Promise that resolves to the response from the Twitter API.
 */
async function postTweet(text: string, mediaList: string[], replyId: string | undefined, env: Env): Promise<any> {
    const msg = {
        text,
        reply: replyId ? { in_reply_to_tweet_id: replyId } : undefined,
        media: mediaList.length > 0 ? { media_ids: mediaList } : undefined,
    }

    return await makeTwitterRequest('https://api.twitter.com/2/tweets', 'POST', JSON.stringify(msg), 'application/json', env)
}

/**
 * Makes a request to the Twitter API.
 * 
 * @param url - The URL of the API endpoint.
 * @param method - The HTTP method of the request.
 * @param data - The data to be sent in the request body.
 * @param env - The environment variables containing the Twitter API credentials.
 * @returns A Promise that resolves to the response from the Twitter API.
 */
async function makeTwitterRequest(url: string, method: string, data: any, contentType: string, env: Env): Promise<any> {
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

    const requestData = {
        url,
        method,
    }

    const response = await fetch(requestData.url, {
        method,
        headers: {
            ...oauth.toHeader(oauth.authorize(requestData, oauthToken)),
            'Content-Type': contentType,
        },
        body: data,
    })
    console.log(contentType)
    console.log(JSON.stringify(oauth.toHeader(oauth.authorize(requestData, oauthToken))))

    return await response.json()
}

export default {
    processSyncTwitterCommand,
    uploadPhotosToTwitter
}
