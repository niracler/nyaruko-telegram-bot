import OpenAI from "openai";
import { ChatCompletionContentPart, ChatCompletionMessageParam } from 'openai/resources';
import { getTelegramPhotoUrlList, getUserInfo } from "@/core/utils";
import { Update, Message } from "grammy/types";
import { Env } from "./type";

export async function processLLM(update: Update, env: Env): Promise<string> {
    if (!update.message) return '';
    
    const content = update.message.text || update.message.caption || '';
    const replyName = update.message.reply_to_message?.from?.username || '';
    
    if (!content.includes(`@${env.TELEGRAM_BOT_USERNAME}`) && replyName !== env.TELEGRAM_BOT_USERNAME) {
        return '';
    }

    try {
        if (content.startsWith(`@${env.TELEGRAM_BOT_USERNAME} 提问: `)) {
            return await processTextQuestion(content.split(`@${env.TELEGRAM_BOT_USERNAME} 提问: `)[1], env);
        }

        const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
        const messageParamList = await buildMessageParamList(update.message, env);
        const model = determineModel(update.message, env.ALLOW_USER_IDS);
        
        if (model === "restricted") {
            return "抱歉，不是所有人都能使用图片哦~";
        }

        const completion = await openai.chat.completions.create({
            model,
            messages: messageParamList,
        });
        
        return `${completion.choices[0].message.content} \n    -- by ${model}`;
    } catch (error) {
        return `处理文本失败: ${error}`;
    }
}

async function processTextQuestion(question: string, env: Env): Promise<string> {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const { data } = await openai.embeddings.create({
        input: [question],
        model: 'text-embedding-ada-002',
    });

    const vectors = data[0].embedding;

    const SIMILARITY_CUTOFF = 0.78;
    const vectorQuery = await env.VECTORIZE_INDEX.query(vectors, { topK: 5 });
    const vecIds = vectorQuery.matches
        .filter(vec => vec.score > SIMILARITY_CUTOFF)
        .map(vec => Math.floor(Number(vec.id) / 100));

    if (!vecIds.length) {
        return "没有找到相关文章";
    }

    const query = `SELECT * FROM articles WHERE id IN (${vecIds.join(", ")})`;
    let { results } = await env.DB.prepare(query).bind().all();
    if (results) results = results.map(vec => {
        return {
            id: vec.id,
            filepath: vec.file_path,
            content: vec.content,
            score: vectorQuery.matches.find(match => Math.floor(Number(match.id) / 100) === vec.id)?.score
        };
    });

    const contextMessage = `
        设想你是奈亚子，一个既萌又可爱的全能邪神，同时也是我的知识库助理。
        1. 你的语言风格是充满可爱的表达，喜欢在对话中使用 emoji 和颜文字表情。
        2. 在回答时，请尽量使用 telegram 兼容的 markdown 语法。
        3. 回复的时候请表明你是根据那几篇文章回答的哦~

        以下是我为你找到的相关文章：
        \n${JSON.stringify(results, null, 2)}\n

        生成规则：请基于上面的片段，回答 ${question}
    `;

    const completion = await openai.chat.completions.create({
        messages: [
            { role: 'user', content: contextMessage }
        ],
        model: "gpt-4o-mini"
    });

    return completion.choices[0].message.content || "没有回应";
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
    ];
}

function determineModel(message: Message, allowedUserList: string[]): string {
    const { id, replyName } = getUserInfo(message);

    if (allowedUserList.includes(id.toString()) || allowedUserList.includes(replyName)) {
        return "gpt-4o";
    }

    if (message.reply_to_message?.photo?.length || message.photo?.length) {
        return "restricted";
    }

    return "gpt-3.5-turbo";
}

async function messageToContentPart(message: Message | undefined, env: Env): Promise<ChatCompletionContentPart[] | string> {
    if (!message) return "";

    if (!message.photo?.length) {
        return message.text || "";
    }

    const photoUrlList = await getTelegramPhotoUrlList(message, env);
    return [
        { type: "text", text: message.caption || "" },
        ...photoUrlList.map(photoUrl => ({
            type: "image_url",
            image_url: { url: photoUrl, detail: "auto" }
        } as ChatCompletionContentPart))
    ];
}
