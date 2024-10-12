import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const articles = sqliteTable('articles', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    filepath: text('file_path').unique(),
    content: text('content'),
}) 
