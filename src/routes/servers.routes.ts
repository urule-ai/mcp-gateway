import type { FastifyInstance } from 'fastify';
import type { ServerRegistry, RegisterServerRequest } from '../services/server-registry.js';
import type { ToolCatalog } from '../services/tool-catalog.js';

export async function serversRoutes(
  app: FastifyInstance,
  opts: { registry: ServerRegistry; catalog: ToolCatalog },
): Promise<void> {
  const { registry, catalog } = opts;

  // List all MCP servers
  app.get('/api/v1/mcp/servers', async () => {
    return registry.list();
  });

  // Register a new MCP server
  app.post<{ Body: RegisterServerRequest }>('/api/v1/mcp/servers', async (request, reply) => {
    const server = registry.register(request.body);
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

    const registered = request.body.map((tool) =>
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
