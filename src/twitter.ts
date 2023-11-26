import OAuth from 'oauth-1.0a'
import { HmacSHA1, enc } from 'crypto-js'
import { Buffer } from 'node:buffer'
import { Env } from "./type"

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

    // 初始化媒体上传以获取media_id | Initialize media upload to get media_id
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

export async function postTweet(text: string, mediaList: string[], env: Env): Promise<any> {
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

    const response = await fetch(requestData.url, {
        method: 'POST',
        headers: {
            ...oauth.toHeader(oauth.authorize(requestData, oauthToken)),
            'content-type': "application/json",
        },
        body: JSON.stringify({ text, media: { media_ids: mediaList } }),
    })

    return await response.json()
}
