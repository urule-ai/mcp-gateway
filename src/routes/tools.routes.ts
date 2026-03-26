import type { FastifyInstance } from 'fastify';
import type { ToolCatalog } from '../services/tool-catalog.js';

export async function toolsRoutes(
  app: FastifyInstance,
  opts: { catalog: ToolCatalog },
): Promise<void> {
  const { catalog } = opts;

  // Search/list all tools
  app.get<{ Querystring: { search?: string; serverId?: string } }>(
    '/api/v1/mcp/tools',
    async (request) => {
      return catalog.listTools({
        search: request.query.search,
        serverId: request.query.serverId,
      });
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
