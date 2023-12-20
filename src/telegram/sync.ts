import * as twitter from '../twitter'
import { Env, TelegramUpdate, TwitterResponse } from "../type"
import { getTelegramPhotoUrlList } from "./utils"

// Process the '/sync_twitter' command
export async function processSyncTwitterCommand(update: TelegramUpdate, env: Env): Promise<string> {
    if (!update.message?.reply_to_message) {
        return 'No message found to sync with Twitter.'
    }

    try {
        const photoUrlList = await getTelegramPhotoUrlList(update.message.reply_to_message, env)
        const tweetMediaIds = await uploadPhotosToTwitter(photoUrlList, env)

        const tweetContent = `${update.message.reply_to_message.caption || update.message.reply_to_message.text} #from_telegram`
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

async function uploadPhotosToTwitter(photoUrlList: string[], env: Env): Promise<string[]> {
    const tweetMediaIds = []
    for (const photoUrl of photoUrlList) {
        const mediaData = await fetch(photoUrl).then(res => res.arrayBuffer())
        const media = await twitter.uploadMediaToTwitter(mediaData, env)
        tweetMediaIds.push(media.media_id_string)
    }
    return tweetMediaIds
}
