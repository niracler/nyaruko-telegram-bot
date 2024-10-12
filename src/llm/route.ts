import { Hono } from "hono";
import { Env } from "./type";
import OpenAI from "openai";
import { drizzle } from "drizzle-orm/d1";
import { articles } from "./schema";
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const llmApp = new Hono<{ Bindings: Env }>()

llmApp.post('/', async (c) => {
    const { text } = await c.req.json()
    return c.text(text)
})

llmApp.get('/', (c) => c.text('Expecting POST request from telegram'))

llmApp.post('/article', async (c) => {
    // TODO: use zod to validate the request body
    const { content, filepath } = await c.req.json()
    if (!content || !filepath) {
        return c.text("Missing content or filepath", 400);
    }

    const db = drizzle(c.env.DB);
    const result = await db.insert(articles).values({
        filepath,
        content
    }).onConflictDoUpdate({
        target: articles.filepath,
        set: { content }
    }).returning({ insertedId: articles.id });

    // TODO: split the content if it is too long
    const openai = new OpenAI({ apiKey: c.env.OPENAI_API_KEY })

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 4096, // Maximum characters per chunk
        chunkOverlap: 200, // Overlap between chunks
        separators: ['\n\n', '\n', ' '], // Separators for splitting
    });

    const chunks = await textSplitter.splitText(content);

    // use promise.all to parallelize the requests
    const vecList: VectorizeVector[] = [];

    const promises = chunks.map(async (chunk, index) => {
        const { data } = await openai.embeddings.create({
            input: [chunk],
            model: 'text-embedding-ada-002',
        });

        const values = data[0].embedding
        const id = result[0].insertedId * 100 + index;
        vecList.push({
            id: id.toString(),
            values,
            metadata: { filepath }
        });
        console.log(`Inserted vector ${id} for ${filepath}`);
    });

    await Promise.all(promises);

    const inserted = await c.env.VECTORIZE_INDEX.upsert(vecList);
    return c.json({ filepath, inserted })
})

export default llmApp
