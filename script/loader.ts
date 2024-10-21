import fs from 'fs'
import fetch from 'node-fetch'

const LIMIT = 1000

async function main() {
    const directory = "/Users/niracler/Library/Mobile Documents/iCloud~md~obsidian/Documents/Note/🌍 Areas";
    const filesOrigin = fs.readdirSync(directory, {
        recursive: true
    })

    const filepaths = filesOrigin.filter((file) => file.toString().endsWith('.md'))

    const ping = await fetch('https://nyaruko-telegram-bot.cloud-1e0.workers.dev/llm')
    console.log(await ping.text())

    let count = 0
    for (const filepath of filepaths) {
        const content = fs.readFileSync(`${directory}/${filepath}`, 'utf-8')

        console.log(filepath)
        const response = await fetch('https://nyaruko-telegram-bot.cloud-1e0.workers.dev/llm/article', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content,
                filepath
            })
        })
        const result = await response.json()
        console.log(result)

        count++
        if (count >= LIMIT) {
            break
        }
    }
}

main().then(() => {
    console.log("done")
})
