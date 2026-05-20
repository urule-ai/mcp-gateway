import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ToolCatalog } from '../services/tool-catalog.js';

const listToolsQuerySchema = z.object({
  search: z.string().optional(),
  serverId: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

const toolParamsSchema = z.object({ toolId: z.string() });

export async function toolsRoutes(
  app: FastifyInstance,
  opts: { catalog: ToolCatalog },
): Promise<void> {
  const { catalog } = opts;

  // Search/list all tools
  app.get<{ Querystring: z.infer<typeof listToolsQuerySchema> }>(
    '/api/v1/mcp/tools',
    {
      schema: {
        tags: ['tools'],
        summary: 'Search / list the tool catalog',
        description:
          'Returns tools across every registered MCP server. `?search=` matches name + description (case-insensitive substring), `?serverId=` filters to a single server. `?limit` capped at 100, default 50; `?offset` defaults to 0.',
        querystring: listToolsQuerySchema,
      },
    },
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
  app.get<{ Params: z.infer<typeof toolParamsSchema> }>(
    '/api/v1/mcp/tools/:toolId',
    {
      schema: {
        tags: ['tools'],
        summary: 'Get tool by ID',
        description: 'Returns a single catalog entry. 404 TOOL_NOT_FOUND when the id is unknown.',
        params: toolParamsSchema,
      },
    },
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
