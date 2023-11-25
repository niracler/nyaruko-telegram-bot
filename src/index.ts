/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import OAuth from 'oauth-1.0a'
import { HmacSHA1, enc } from 'crypto-js'

export interface Env {
	TELEGRAM_BOT_SECRET: string
	TWITTER_BEARER_TOKEN: string
	TWITTER_API_KEY: string
	TWITTER_API_SECRET: string
	TWITTER_ACCESS_TOKEN: string
	TWITTER_ACCESS_TOKEN_SECRET: string

	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue
}

interface TelegramChat {
	id: number      // Chat ID
	// 添加更多的聊天相关字段
}

interface TelegramMessage {
	message_id: number // Message ID
	chat: TelegramChat // Chat object
	text?: string      // Received message text, optional
	reply_to_message?: TelegramMessage  // 添加这个字段来获取回复的消息
	from?: {
		username?: string // 发送者的用户名
	}
	// 添加更多的消息相关字段
}

interface TelegramUpdate {
	update_id: number      // Update ID from Telegram
	message?: TelegramMessage // Message object, optional
	// 添加更多的更新相关字段
}

async function handleTelegramUpdate(update: TelegramUpdate, env: Env) {
	// 确定update是否包含消息
	if (!update.message || !update.message.text) {
		return
	}

	let replyText = ''

	// 检查消息是否是同步到Twitter的命令
	if (update.message.text.startsWith('/sync_twitter') && update.message.reply_to_message) {
		try {
			// 移除命令部分，将剩下的文本同步到Twitter
			// 获取原始消息的内容
			const tweetContent = `${update.message.reply_to_message.text} #sync_from_telegram`
			const senderUsername = update.message.from?.username // 获取消息发送者的用户名
			if (!tweetContent) {
				throw new Error('No text in replied message')
			}

			const tweet = await postTweet(tweetContent, env)
			// 构建回复的消息
			replyText = `@${senderUsername} Your message has been posted to Twitter. Id: ${tweet.data.id}`
		} catch (error) {
			// 可以选择发送失败通知回Telegram
			replyText = `Failed to post tweet ${error}`
		}
	} else {
		// 不是同步到 Twitter 的命令，直接回复
		replyText = `Echo: ${update.message.text}`
	}

	// 构建回复的消息
	const chatId = update.message.chat.id

	// 向Telegram发送回复
	const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_SECRET}/sendMessage`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			chat_id: chatId,
			text: replyText,
			reply_to_message_id: update.message.message_id, // 指定要回复的消息ID
		}),
	})

	if (!response.ok) {
		throw new Error(`Telegram API responded with status ${response.status}`)
	}
}

async function postTweet(text: string, env: Env): Promise<any> {
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
		body: JSON.stringify({ text }),
	})

	return await response.json()
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method === 'POST') {
			const update = await request.json() as TelegramUpdate
			await handleTelegramUpdate(update, env)
			return new Response('Update processed')
		}
		return new Response('Expecting POST request')
	},
}
