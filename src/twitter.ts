import OAuth from 'oauth-1.0a'
import { HmacSHA1, enc } from 'crypto-js'
import { Buffer } from 'node:buffer'
import { Env } from "./type"

/**
 * Uploads media to Twitter.
 * @param mediaData The media data to be uploaded.
 * @param env The environment variables.
 * @returns The response from the Twitter API.
 */
export async function uploadMediaToTwitter(mediaData: ArrayBuffer, env: Env): Promise<any> {
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
        url: 'https://upload.twitter.com/1.1/media/upload.json?media_category=tweet_image',
        method: 'POST',
        data: {
            media_data: Buffer.from(mediaData).toString('base64'),
        },
    }

    const response = await fetch(requestData.url, {
        method: 'POST',
        headers: {
            ...oauth.toHeader(oauth.authorize(requestData, oauthToken)),
            'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ media_data: Buffer.from(mediaData).toString('base64') }),
    })

    return await response.json()
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
export async function postTweet(text: string, mediaList: string[], replyId: string | undefined, env: Env): Promise<any> {
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
        url: "https://api.twitter.com/2/tweets",
        method: 'POST',
    }

    const msg = {
        text,
        reply: replyId ? { in_reply_to_tweet_id: replyId } : undefined,
        media: mediaList.length > 0 ? { media_ids: mediaList } : undefined,
    }

    const response = await fetch(requestData.url, {
        method: 'POST',
        headers: {
            ...oauth.toHeader(oauth.authorize(requestData, oauthToken)),
            'content-type': "application/json",
        },
        body: JSON.stringify(msg),
    })

    return await response.json()
}
