import OpenAI from "openai"
import { ChatCompletionContentPart, ChatCompletionMessageParam } from 'openai/resources'
import { TelegramMessage, TelegramUpdate, Env as CoreEnv } from "../core/type"
import { getTelegramPhotoUrlList } from "../core/utils"

export type Env = {
    OPENAI_API_KEY: string
} & CoreEnv

/**
 * Processes the Ny command by generating a response using OpenAI's chat completion API.
 * 
 * @param update - The Telegram update object containing the message to process.
 * @param env - The environment object containing the OpenAI API key.
 * @returns A promise that resolves to a string representing the generated response.
 */
export async function processLLM(update: TelegramUpdate, env: Env): Promise<string> {
    if (!update.message?.text && !update.message?.caption) return 'No text found to process.'

    try {
        const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
        const messageParamList: ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: `设想你是奈亚子，一个既萌又可爱的全能邪神，同时也是我忠诚的助理。你的语言风格是充满可爱的表达，喜欢在对话中使用 emoji 和颜文字表情。在回答时，请尽量使用 telegram 兼容的 markdown 语法。没有特殊说明的话，回复内容尽量克制简短。`
            },
            {
                role: "user",
                content: await messageToContentPart(update.message.reply_to_message, env)
            },
            {
                role: "user",
                content: await messageToContentPart(update.message, env)
            }
        ]

        let model
        let maxTokens
        if (update.message?.reply_to_message?.photo?.length || update.message?.photo?.length) {
            model = "gpt-4-vision-preview"
            maxTokens = 4096
        } else {
            model = "gpt-4-1106-preview"
        }

        const completion = await openai.chat.completions.create({
            model,
            messages: messageParamList,
            max_tokens: maxTokens,
        })
        return `${completion.choices[0].message.content} \n    -- by ${model}` || 'No response from AI.'
    } catch (error) {
        return `Failed to process text: ${error}`
    }
}

/**
 * Converts a Telegram message to a content part for chat completion.
 * @param message The Telegram message to convert.
 * @param env The environment configuration.
 * @returns A promise that resolves to an array of ChatCompletionContentPart objects or a string.
 */
async function messageToContentPart(message: TelegramMessage | undefined, env: Env): Promise<ChatCompletionContentPart[] | string> {
    if (!message) return ""

    if (!message.photo?.length) {
        return message.text || ""
    }

    const photoUrlList = await getTelegramPhotoUrlList(message, env)
    const result: ChatCompletionContentPart[] = [
        {
            type: "text",
            text: message.caption || ""
        },
        ...photoUrlList.map(photoUrl => ({
            type: "image_url",
            image_url: {
                url: photoUrl,
                detail: "auto"
            }
        } as ChatCompletionContentPart))
    ]

    return result
}
