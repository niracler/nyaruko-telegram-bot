/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { handleTelegramUpdate } from './telegram'
import { Env, TelegramUpdate } from './type'

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method === 'POST') {
			try {
				const update = await request.json() as TelegramUpdate
				await handleTelegramUpdate(update, env)
			} catch (e) {
				console.log(e)
			}
			return new Response('Update processed')
		}
		return new Response('Expecting POST request')
	},
}
