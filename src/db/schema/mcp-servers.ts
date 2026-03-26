import { pgTable, varchar, text, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';

export const mcpServers = pgTable('mcp_servers', {
  id: varchar('id', { length: 26 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull().default(''),
  command: varchar('command', { length: 500 }).notNull(),
  args: jsonb('args').notNull().default([]),
  env: jsonb('env').notNull().default({}),
  transportType: varchar('transport_type', { length: 50 }).notNull().default('stdio'),
  url: varchar('url', { length: 500 }),
  verified: boolean('verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
