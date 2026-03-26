import type { FastifyInstance } from 'fastify';
import type { ToolCatalog } from '../services/tool-catalog.js';

export async function toolsRoutes(
  app: FastifyInstance,
  opts: { catalog: ToolCatalog },
): Promise<void> {
  const { catalog } = opts;

  // Search/list all tools
  app.get<{ Querystring: { search?: string; serverId?: string; limit?: string; offset?: string } }>(
    '/api/v1/mcp/tools',
    async (request) => {
      const limit = Math.min(parseInt(request.query.limit ?? '50', 10), 100);
      const offset = parseInt(request.query.offset ?? '0', 10);
      const all = catalog.listTools({
        search: request.query.search,
        serverId: request.query.serverId,
      });
      return all.slice(offset, offset + limit);
    },
  );

  // Get tool by ID
  app.get<{ Params: { toolId: string } }>(
    '/api/v1/mcp/tools/:toolId',
    async (request, reply) => {
      const tool = catalog.getTool(request.params.toolId);
      if (!tool) {
        reply.status(404).send({ error: { code: 'TOOL_NOT_FOUND', message: `Tool ${request.params.toolId} not found` } });
        return;
      }
      return tool;
    },
  );
}
