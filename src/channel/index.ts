import { Env as CoreEnv } from "@/core/type";
import { Update } from "grammy/types";

export type Env = {} & CoreEnv;

export async function processSearchCommand(update: Update, env: Env): Promise<string> {

    const message = update.message?.text || update.message?.caption || '';
    const command = message.split(' ')[0];
    const content = message.slice(command.length + 1);

    const res = await env.DB.prepare('SELECT * FROM telegram_messages WHERE text LIKE ?').bind(`%${content}%`).all();
    // console.log('channel', command, content);

    // const aa = "niracler_channel";

    // const res = await env.DB.prepare('SELECT * FROM telegram_messages WHERE sender_chat_username LIKE ?').bind(`%${aa}%`).all();

    return `channel ${command} ${content} ${JSON.stringify(res)}`;
}
