export type Env = {
	TELEGRAM_BOT_USERNAME: string
	TELEGRAM_BOT_SECRET: string
	ALLOW_USER_IDS: string[]
	DB: D1Database
}

export interface TelegramUpdate {
	update_id: number      // Update ID from Telegram
	message: TelegramMessage // Message object, optional
	// 添加更多的更新相关字段| Add more update related fields
}

interface TelegramChat {
	id: number      // Chat ID
	title?: string  // Chat title, optional
	username?: string // Username, optional
	type: string // Type of chat, one of "private", "group", "supergroup" or "channel"
	// 添加更多的聊天相关字段 | Add more chat related fields
}

interface TelegramPhoto {
	file_id: string // 可用于获取文件内容 | Can be used to get file content
	file_unique_id: string // 文件的唯一标识符 | Unique identifier for this file
	width: number // 图片宽度 | Image width
	height: number // 图片高度 | Image height
	file_size?: number // 文件大小（可选） | File size (optional)
}

export interface TelegramMessage {
	message_id: number // Message ID
	chat: TelegramChat // Chat object
	text?: string      // Received message text, optional
	reply_to_message?: TelegramMessage  // 添加这个字段来获取回复的消息 | Add this field to get the replied message
	from: {
		username: string // 发送者的用户名 | Sender's username
		id: string // 发送者的ID | Sender's ID
		first_name: string // 发送者的名字 | Sender's first name
	},
	sender_chat?: TelegramChat // Sender's chat object, optional
	caption?: string
	photo?: TelegramPhoto[] // TelegramPhoto需要根据API定义 | TelegramPhoto needs to be defined according to the API
	forward_from_chat?: TelegramChat // Forwarded from chat object, optional
	forward_from_message_id?: number // Forwarded from message ID, optional
	media_group_id?: string // Media group ID
	quote?: {
		text: string
		is_manual?: boolean
	}
	date: number // Unix timestamp
	// 添加更多的消息相关字段 | Add more message related fields
}
