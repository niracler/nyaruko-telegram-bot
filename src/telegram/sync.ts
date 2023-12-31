import * as twitter from '../twitter'
import { Env, TelegramUpdate, TwitterResponse } from "../type"
import { getTelegramPhotoUrlList } from "./utils"

/**
 * Processes the sync /sync_twitter command.
 * 
 * @param update - The Telegram update.
 * @param env - The environment variables.
 * @returns A promise that resolves to a string indicating the result of the sync operation.
 */
export async function processSyncTwitterCommand(update: TelegramUpdate, env: Env): Promise<string> {
    if (!update.message?.reply_to_message) {
        return 'No message found to sync with Twitter.'
    }

    try {
        const photoUrlList = await getTelegramPhotoUrlList(update.message.reply_to_message, env)
        const tweetMediaIds = await uploadPhotosToTwitter(photoUrlList, env)

        let tweetContent = update.message.reply_to_message.caption || update.message.reply_to_message.text
        if (!tweetContent) {
            return `No content found to sync with Twitter. ${JSON.stringify(update.message.reply_to_message)}}`
        }

        tweetContent = `${tweetContent} #from_telegram`
        const tweets = await postTweets(tweetContent, tweetMediaIds, env)

        let replyText = ''
        for (const tweet of tweets) {
            if (!tweet.data?.id) {
                replyText += `Failed to post tweet: ${JSON.stringify(tweet)}` + '\n'
            } else {
                replyText = `Your message has been posted to Twitter. Id: ${tweet.data.id}` + '\n' + replyText
            }
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

        const tweet = await twitter.postTweet(tweetContentTemp, tweetMediaIdsTemp, lastTweetId, env)

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
        const media = await twitter.uploadMediaToTwitter(mediaData, env)
        tweetMediaIds.push(media.media_id_string)
    }
    return tweetMediaIds
}
