// import OAuth from "oauth-1.0a"
import { TwitterApi } from 'twitter-api-v2'

// Tell typescript it's a readonly app

async function uploadMediaToTwitter(mediaData: ArrayBuffer, contentType: string): Promise<string> {
    const userClient = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY || "",
        appSecret: process.env.TWITTER_API_SECRET || "",
        accessToken: process.env.TWITTER_ACCESS_TOKEN || "",
        accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || "",
    })
    return await userClient.v1.uploadMedia(Buffer.from(mediaData), { mimeType: contentType })
}

async function main() {
    const response = await fetch("https://img3.doubanio.com/view/subject/s/public/s27207923.jpg")
    const mediaData = await response.arrayBuffer()
    const contentType = response.headers.get('Content-Type');
    console.log("hi")
    const media = await uploadMediaToTwitter(mediaData, contentType || "")
    console.log(media)

    return
}

main().catch(console.error).then(console.log)
