import { pgTable, varchar, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { mcpServers } from './mcp-servers.js';

export const tools = pgTable('tools', {
  id: varchar('id', { length: 26 }).primaryKey(),
  serverId: varchar('server_id', { length: 26 }).notNull().references(() => mcpServers.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull().default(''),
  inputSchema: jsonb('input_schema').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  serverIdIdx: index('tools_server_id_idx').on(table.serverId),
}));
