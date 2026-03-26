import type { FastifyInstance } from 'fastify';
import type { ServerRegistry, RegisterServerRequest } from '../services/server-registry.js';
import type { ToolCatalog } from '../services/tool-catalog.js';
import { z } from 'zod';
import { AuditLogger } from '@urule/events';

const audit = new AuditLogger('mcp-gateway', (topic, data) => {
  console.log(JSON.stringify({ audit: true, topic, ...data as Record<string, unknown> }));
});

// -- Zod Schemas ------------------------------------------------------

const registerServerSchema = z.object({
  name: z.string().min(1),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  transportType: z.string().optional(),
  env: z.object({}).passthrough().optional(),
});

const registerToolSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  inputSchema: z.object({}).passthrough().optional(),
});

const registerToolsSchema = z.array(registerToolSchema);

// -- Routes -----------------------------------------------------------

export async function serversRoutes(
  app: FastifyInstance,
  opts: { registry: ServerRegistry; catalog: ToolCatalog },
): Promise<void> {
  const { registry, catalog } = opts;

  // List all MCP servers
  app.get<{ Querystring: { limit?: string; offset?: string } }>('/api/v1/mcp/servers', async (request) => {
    const limit = Math.min(parseInt(request.query.limit ?? '50', 10), 100);
    const offset = parseInt(request.query.offset ?? '0', 10);
    const all = registry.list();
    return all.slice(offset, offset + limit);
  });

  // Register a new MCP server
  app.post<{ Body: RegisterServerRequest }>('/api/v1/mcp/servers', async (request, reply) => {
    const parsed = registerServerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.issues });
    }
    const server = registry.register(parsed.data as RegisterServerRequest);

    const user = (request as any).uruleUser;
    audit.entityCreated(
      { id: user?.id ?? 'anonymous', username: user?.username ?? 'anonymous' },
      'mcp-server', server.id, `MCP server "${parsed.data.name}" registered`,
    ).catch(() => {});

    reply.status(201).send(server);
  });

  // Get MCP server by ID
  app.get<{ Params: { serverId: string } }>('/api/v1/mcp/servers/:serverId', async (request, reply) => {
    const server = registry.get(request.params.serverId);
    if (!server) {
      reply.status(404).send({ error: { code: 'SERVER_NOT_FOUND', message: `MCP server ${request.params.serverId} not found` } });
      return;
    }
    return server;
  });

  // Remove MCP server
  app.delete<{ Params: { serverId: string } }>('/api/v1/mcp/servers/:serverId', async (request, reply) => {
    const removed = registry.remove(request.params.serverId);
    if (!removed) {
      reply.status(404).send({ error: { code: 'SERVER_NOT_FOUND', message: `MCP server ${request.params.serverId} not found` } });
      return;
    }
    catalog.removeServerTools(request.params.serverId);

    const user = (request as any).uruleUser;
    audit.entityDeleted(
      { id: user?.id ?? 'anonymous', username: user?.username ?? 'anonymous' },
      'mcp-server', request.params.serverId, `MCP server "${request.params.serverId}" removed`,
    ).catch(() => {});

    reply.status(204).send();
  });

  // Register tools for a server
  app.post<{
    Params: { serverId: string };
    Body: Array<{ name: string; description: string; inputSchema?: Record<string, unknown> }>;
  }>('/api/v1/mcp/servers/:serverId/tools', async (request, reply) => {
    const server = registry.get(request.params.serverId);
    if (!server) {
      reply.status(404).send({ error: { code: 'SERVER_NOT_FOUND', message: `MCP server ${request.params.serverId} not found` } });
      return;
    }

    const parsed = registerToolsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.issues });
    }

    const registered = parsed.data.map((tool) =>
      catalog.registerTool(request.params.serverId, server.name, tool),
    );

    reply.status(201).send(registered);
  });

  // List tools for a server
  app.get<{ Params: { serverId: string } }>('/api/v1/mcp/servers/:serverId/tools', async (request, reply) => {
    const server = registry.get(request.params.serverId);
    if (!server) {
      reply.status(404).send({ error: { code: 'SERVER_NOT_FOUND', message: `MCP server ${request.params.serverId} not found` } });
      return;
    }
    return catalog.listByServer(request.params.serverId);
  });
}
