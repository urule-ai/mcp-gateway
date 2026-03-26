import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { mcpServers } from './schema/mcp-servers.js';
import { workspaceBindings } from './schema/bindings.js';
import { tools } from './schema/tools.js';

export const schema = { mcpServers, workspaceBindings, tools };

export function createDb(connectionString: string) {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;
