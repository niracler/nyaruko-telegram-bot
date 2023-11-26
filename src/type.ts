export interface Env {
	TELEGRAM_BOT_SECRET: string
	TWITTER_API_KEY: string
	TWITTER_API_SECRET: string
	TWITTER_ACCESS_TOKEN: string
	TWITTER_ACCESS_TOKEN_SECRET: string
    ALLOW_USER_IDS: string[]

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

interface TelegramPhoto {
	file_id: string // 可用于获取文件内容
	file_unique_id: string // 文件的唯一标识符
	width: number // 图片宽度
	height: number // 图片高度
	file_size?: number // 文件大小（可选）
}

interface TelegramMessage {
	message_id: number // Message ID
	chat: TelegramChat // Chat object
	text?: string      // Received message text, optional
	reply_to_message?: TelegramMessage  // 添加这个字段来获取回复的消息
	from: {
		username: string // 发送者的用户名
		id: string // 发送者的ID
	},
	caption?: string
	photo?: TelegramPhoto[] // TelegramPhoto需要根据API定义
	// 添加更多的消息相关字段
}

export interface TelegramUpdate {
	update_id: number      // Update ID from Telegram
	message?: TelegramMessage // Message object, optional
	// 添加更多的更新相关字段
}
