import { ulid } from 'ulid';

export interface ToolDefinition {
  id: string;
  serverId: string;
  serverName: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolCallRequest {
  toolName: string;
  serverId: string;
  arguments: Record<string, unknown>;
}

export interface ToolCallResult {
  toolName: string;
  serverId: string;
  result: unknown;
  isError: boolean;
}

export class ToolCatalog {
  private tools = new Map<string, ToolDefinition>();
  private serverTools = new Map<string, Set<string>>();

  registerTool(serverId: string, serverName: string, tool: { name: string; description: string; inputSchema?: Record<string, unknown> }): ToolDefinition {
    const id = ulid();
    const def: ToolDefinition = {
      id,
      serverId,
      serverName,
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema ?? {},
    };
    this.tools.set(id, def);

    if (!this.serverTools.has(serverId)) {
      this.serverTools.set(serverId, new Set());
    }
    this.serverTools.get(serverId)!.add(id);

    return def;
  }

  removeTool(toolId: string): boolean {
    const tool = this.tools.get(toolId);
    if (!tool) return false;

    this.tools.delete(toolId);
    this.serverTools.get(tool.serverId)?.delete(toolId);
    return true;
  }

  removeServerTools(serverId: string): number {
    const toolIds = this.serverTools.get(serverId);
    if (!toolIds) return 0;

    let count = 0;
    for (const id of toolIds) {
      this.tools.delete(id);
      count++;
    }
    this.serverTools.delete(serverId);
    return count;
  }

  getTool(toolId: string): ToolDefinition | undefined {
    return this.tools.get(toolId);
  }

  findToolByName(serverId: string, toolName: string): ToolDefinition | undefined {
    const toolIds = this.serverTools.get(serverId);
    if (!toolIds) return undefined;

    for (const id of toolIds) {
      const tool = this.tools.get(id);
      if (tool && tool.name === toolName) return tool;
    }
    return undefined;
  }

  listTools(filters?: { serverId?: string; search?: string }): ToolDefinition[] {
    let results = Array.from(this.tools.values());

    if (filters?.serverId) {
      results = results.filter((t) => t.serverId === filters.serverId);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      );
    }

    return results;
  }

  listByServer(serverId: string): ToolDefinition[] {
    return this.listTools({ serverId });
  }
}
