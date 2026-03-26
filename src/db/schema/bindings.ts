import { pgTable, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { mcpServers } from './mcp-servers.js';

export const workspaceBindings = pgTable('workspace_bindings', {
  id: varchar('id', { length: 26 }).primaryKey(),
  workspaceId: varchar('workspace_id', { length: 26 }).notNull(),
  serverId: varchar('server_id', { length: 26 }).notNull().references(() => mcpServers.id),
  config: jsonb('config').notNull().default({}),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
