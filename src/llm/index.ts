import OpenAI from "openai"
import { ChatCompletionContentPart, ChatCompletionMessageParam } from 'openai/resources'
import { getTelegramPhotoUrlList, getUserInfo } from "@/core/utils"
import { Update, Message } from "grammy/types"
import { Env } from "./type"

/**
 * 使用OpenAI的聊天完成API处理Ny命令并生成响应。
 * 
 * @param update - 包含要处理的消息的Telegram更新对象。
 * @param env - 包含OpenAI API密钥的环境对象。
 * @returns 解析为表示生成的响应的字符串的Promise。
 */
export async function processLLM(update: Update, env: Env): Promise<string> {
    if (!update.message) return ''
    
    const content = update.message.text || update.message.caption || ''
    const replyName = update.message.reply_to_message?.from?.username || ''
    
    if (!content.includes(`@${env.TELEGRAM_BOT_USERNAME}`) && replyName !== env.TELEGRAM_BOT_USERNAME) {
        return ''
    }

    try {
        const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
        const messageParamList = await buildMessageParamList(update.message, env)
        const model = determineModel(update.message, env.ALLOW_USER_IDS)
        
        if (model === "restricted") {
            return "抱歉，不是所有人都能使用图片哦~"
        }

        const completion = await openai.chat.completions.create({
            model,
            messages: messageParamList,
        })
        
        return `${completion.choices[0].message.content} \n    -- by ${model}`
    } catch (error) {
        return `处理文本失败: ${error}`
    }
}

/**
 * 构建消息参数列表。
 */
async function buildMessageParamList(message: Message, env: Env): Promise<ChatCompletionMessageParam[]> {
    return [
        {
            role: "system",
            content: `设想你是奈亚子，一个既萌又可爱的全能邪神，同时也是我忠诚的助理。你的语言风格是充满可爱的表达，喜欢在对话中使用 emoji 和颜文字表情。在回答时，请尽量使用 telegram 兼容的 markdown 语法。没有特殊说明的话，回复内容尽量克制简短。`
        },
        {
            role: "user",
            content: await messageToContentPart(message.reply_to_message, env)
        },
        {
            role: "user",
            content: await messageToContentPart(message, env)
        }
    ]
}

/**
 * 确定要使用的模型。
 */
function determineModel(message: Message, allowedUserList: string[]): string {
    const { id, replyName } = getUserInfo(message)

    if (allowedUserList.includes(id.toString()) || allowedUserList.includes(replyName)) {
        return "gpt-4o"
    }

    if (message.reply_to_message?.photo?.length || message.photo?.length) {
        return "restricted"
    }

    return "gpt-3.5-turbo"
}

/**
 * 将Telegram消息转换为聊天完成的内容部分。
 * @param message 要转换的Telegram消息。
 * @param env 环境配置。
 * @returns 解析为ChatCompletionContentPart对象数组或字符串的Promise。
 */
async function messageToContentPart(message: Message | undefined, env: Env): Promise<ChatCompletionContentPart[] | string> {
    if (!message) return ""

    if (!message.photo?.length) {
        return message.text || ""
    }

    const photoUrlList = await getTelegramPhotoUrlList(message, env)
    return [
        { type: "text", text: message.caption || "" },
        ...photoUrlList.map(photoUrl => ({
            type: "image_url",
            image_url: { url: photoUrl, detail: "auto" }
        } as ChatCompletionContentPart))
    ]
}
