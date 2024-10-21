import { Hono } from "hono";
import { Env } from "./type";
import OpenAI from "openai";
import { drizzle } from "drizzle-orm/d1";
import { articles } from "./schema";
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const llmApp = new Hono<{ Bindings: Env }>();

llmApp.get('/', (c) => c.text('Expecting POST request from telegram'));

llmApp.post('/article', async (c) => {
    const { content, filepath } = await c.req.json();
    if (!content || !filepath) {
        return c.text("Missing content or filepath", 400);
    }

    const db = drizzle(c.env.DB);
    const result = await db.insert(articles).values({ filepath, content })
        .onConflictDoUpdate({
            target: articles.filepath,
            set: { content }
        }).returning({ insertedId: articles.id });

    const openai = new OpenAI({ apiKey: c.env.OPENAI_API_KEY });

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 4096,
        chunkOverlap: 200,
        separators: ['\n\n', '\n', ' '],
    });

    const chunks = await textSplitter.splitText(content);

    const vecList: VectorizeVector[] = [];
    const promises = chunks.map(async (chunk, index) => {
        const { data } = await openai.embeddings.create({
            input: [chunk],
            model: 'text-embedding-ada-002',
        });

        const values = data[0].embedding;
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
    return c.json({ filepath, inserted });
});

llmApp.get('/vec', async (c) => {
    const question = c.req.query('text') || "What is the square root of 9?";

    const openai = new OpenAI({ apiKey: c.env.OPENAI_API_KEY });
    const { data } = await openai.embeddings.create({
        input: [question],
        model: 'text-embedding-ada-002',
    });

    const vectors = data[0].embedding;

    const SIMILARITY_CUTOFF = 0.75;
    const vectorQuery = await c.env.VECTORIZE_INDEX.query(vectors, { topK: 10 });
    const vecIds = vectorQuery.matches
        .filter(vec => vec.score > SIMILARITY_CUTOFF)
        .map(vec => Math.floor(Number(vec.id) / 100));
    console.log(vecIds);

    if (vecIds.length) {
        const query = `SELECT * FROM articles WHERE id IN (${vecIds.join(", ")})`;
        const { results } = await c.env.DB.prepare(query).bind().all();
        if (results) results.map(vec => {
            return {
                id: vec.id,
                filepath: vec.filepath,
                score: vectorQuery.matches.find(match => match.id === vec.id)?.score
            };
        });
        return c.json(results);
    }

    return c.json([]);
});

async function getAnswerFromQuestion(question: string, env: Env) {
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
        return "No relevant articles found";
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

    console.log(contextMessage);

    const completion = await openai.chat.completions.create({
        messages: [
            { role: 'user', content: contextMessage }
        ],
        model: "gpt-4o-mini"
    });

    return completion.choices[0].message.content || "No response";
};

llmApp.get("/search", async (c) => {
    const question = c.req.query('text') || "What is the square root of 9?";
    const answer = await getAnswerFromQuestion(question, c.env);
    return c.text(answer);
});

export default llmApp;
