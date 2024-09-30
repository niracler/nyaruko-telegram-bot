import { Hono } from 'hono'
import core from './core'
import twitter, { Env as TwitterEnv } from './twitter'
import { processLLM, Env as LLMEnv } from './llm'
import { processSyncXLogCommand, Env as XLogEnv } from './xlog'
import { processSearchCommand } from './channel'
import { processRandom, Env as RandomEnv } from './random'
import { Update } from 'grammy/types'

export type Env = LLMEnv & XLogEnv & TwitterEnv & RandomEnv

const commandHandlers: Record<string, (update: Update, env: Env) => Promise<string>> = {
    '/getchatid': core.processGetGroupIdCommand,
    '/getuserid': core.processGetUserIdCommand,
    '/ping': core.processPingCommand,
    '/sync_twitter': twitter.processSyncTwitterCommand,
    '/search': processSearchCommand,
    '/sync_xlog': processSyncXLogCommand
}

async function handleUpdate(update: Update, env: Env): Promise<string> {
    const content = update.message?.text || update.message?.caption || ''

    for (const [command, handler] of Object.entries(commandHandlers)) {
        if (content.startsWith(command)) {
            return handler(update, env)
        }
    }

    if (update.message?.reply_to_message?.text?.includes('#random_todolist')) {
        return processRandom(update, env)
    }

    return processLLM(update, env)
}

const app = new Hono<{ Bindings: Env }>()

app.post('/', async (c) => {
    try {
        const update = await c.req.json() as Update
        await core.handleTelegramUpdate(update, c.env, () => handleUpdate(update, c.env))
    } catch (e) {
        console.error('Error processing update:', e)
    }
    return c.text('Update processed')
})

app.get('/', (c) => c.text('Expecting POST request'))

export default app
