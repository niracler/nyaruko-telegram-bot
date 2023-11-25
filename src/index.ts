/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	TELEGRAM_BOT_SECRET: string

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
	// 添加更多的消息相关字段
}

interface TelegramUpdate {
	update_id: number      // Update ID from Telegram
	message?: TelegramMessage // Message object, optional
	// 添加更多的更新相关字段
}

async function handleTelegramUpdate(update: TelegramUpdate, env: Env) {
	// 确定update是否包含消息
	if (update.message && update.message.text) {
		// 构建回复的消息
		const chatId = update.message.chat.id
		const replyText = `Echo: ${update.message.text}`

		// 向Telegram发送回复
		const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_SECRET}/sendMessage`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				chat_id: chatId,
				text: replyText,
			}),
		})
		if (!response.ok) {
			throw new Error(`Telegram API responded with status ${response.status}`)
		}
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method === 'POST') {
			const update: TelegramUpdate = await request.json()
			await handleTelegramUpdate(update, env)
			return new Response('Update processed')
		}
		return new Response('Expecting POST request')
	},
}
