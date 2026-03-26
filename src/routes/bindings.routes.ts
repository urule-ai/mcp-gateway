import type { FastifyInstance } from 'fastify';
import type { ServerRegistry } from '../services/server-registry.js';
import type { ToolCatalog } from '../services/tool-catalog.js';

export async function bindingsRoutes(
  app: FastifyInstance,
  opts: { registry: ServerRegistry; catalog: ToolCatalog },
): Promise<void> {
  const { registry, catalog } = opts;

  // Bind MCP server to workspace
  app.post<{
    Body: { workspaceId: string; serverId: string; config?: Record<string, unknown> };
  }>('/api/v1/mcp/bindings', async (request, reply) => {
    try {
      const binding = registry.bindToWorkspace(
        request.body.serverId,
        request.body.workspaceId,
        request.body.config,
      );
      reply.status(201).send(binding);
    } catch (err) {
      reply.status(404).send({ error: { code: 'SERVER_NOT_FOUND', message: (err as Error).message } });
    }
  });

  // List bindings for a workspace
  app.get<{ Params: { wsId: string } }>(
    '/api/v1/workspaces/:wsId/mcp/bindings',
    async (request) => {
      return registry.getWorkspaceBindings(request.params.wsId);
    },
  );

  // List MCP servers available in a workspace
  app.get<{ Params: { wsId: string } }>(
    '/api/v1/workspaces/:wsId/mcp/servers',
    async (request) => {
      return registry.getWorkspaceServers(request.params.wsId);
    },
  );

  // List all tools available in a workspace
  app.get<{ Params: { wsId: string } }>(
    '/api/v1/workspaces/:wsId/mcp/tools',
    async (request) => {
      const servers = registry.getWorkspaceServers(request.params.wsId);
      const allTools = servers.flatMap((s) => catalog.listByServer(s.id));
      return allTools;
    },
  );

  // Remove binding
  app.delete<{ Params: { bindingId: string } }>(
    '/api/v1/mcp/bindings/:bindingId',
    async (request, reply) => {
      const removed = registry.unbindFromWorkspace(request.params.bindingId);
      if (!removed) {
        reply.status(404).send({ error: { code: 'BINDING_NOT_FOUND', message: `Binding ${request.params.bindingId} not found` } });
        return;
      }
      reply.status(204).send();
    },
  );
}
