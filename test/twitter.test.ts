import twitter, { Env } from "../src/twitter"

async function main() {
    const env = {
        TWITTER_API_KEY: "TWITTER_API_KEY",
        TWITTER_API_SECRET: "TWITTER_API_SECRET",
        TWITTER_ACCESS_TOKEN: "TWITTER_ACCESS_TOKEN",
        TWITTER_ACCESS_TOKEN_SECRET: "TWITTER_ACCESS_TOKEN_SECRET",
    } as Env
    const res = await twitter.uploadPhotosToTwitter([
        "https://img3.doubanio.com/view/subject/s/public/s27207923.jpg"
    ], env)
    console.log(res)

    return
}

main().catch(console.error).then(console.log)
