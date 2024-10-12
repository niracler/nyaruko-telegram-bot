import { Env as CoreEnv } from "@/core/type"

// npx wrangler vectorize create article-index --dimensions 1536 --metric cosine
export type Env = CoreEnv & {
    OPENAI_API_KEY: string
    VECTORIZE_INDEX: VectorizeIndex
}
