import { Env as CoreEnv } from "@/core/type"
import { Update } from "grammy/types"

export type Env = {} & CoreEnv

/**
 * Processes the syncXLog command by syncing a message with XLog.
 * 
 * @param update - The Telegram update object.
 * @param env - The environment object.
 * @returns A promise that resolves to a string indicating the result of the sync operation.
 */
export async function processChannel(update: Update, env: Env): Promise<string> {

    const message = update.message?.text || update.message?.caption || ''
    const command = message.split(' ')[0]
    const content = message.slice(command.length + 1)

    const res = await env.DB.prepare('SELECT * FROM telegram_messages WHERE text LIKE ?').bind(`%${content}%`).all()
    // console.log('channel', command, content)

    // const aa = "niracler_channel"

    // const res = await env.DB.prepare('SELECT * FROM telegram_messages WHERE sender_chat_username LIKE ?').bind(`%${aa}%`).all()

    return `channel ${command} ${content} ${JSON.stringify(res)}`
}
