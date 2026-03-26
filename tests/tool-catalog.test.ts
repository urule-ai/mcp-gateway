import { describe, it, expect, beforeEach } from 'vitest';
import { ToolCatalog } from '../src/services/tool-catalog.js';

describe('ToolCatalog', () => {
  let catalog: ToolCatalog;

  beforeEach(() => {
    catalog = new ToolCatalog();
  });

  it('registers a tool and returns it', () => {
    const tool = catalog.registerTool('srv-1', 'test-server', {
      name: 'read_file',
      description: 'Read a file from disk',
      inputSchema: { type: 'object', properties: { path: { type: 'string' } } },
    });

    expect(tool.id).toBeTruthy();
    expect(tool.serverId).toBe('srv-1');
    expect(tool.serverName).toBe('test-server');
    expect(tool.name).toBe('read_file');
  });

  it('lists tools by server', () => {
    catalog.registerTool('srv-1', 'server-a', { name: 'tool_a', description: 'Tool A' });
    catalog.registerTool('srv-1', 'server-a', { name: 'tool_b', description: 'Tool B' });
    catalog.registerTool('srv-2', 'server-b', { name: 'tool_c', description: 'Tool C' });

    const srv1Tools = catalog.listByServer('srv-1');
    expect(srv1Tools).toHaveLength(2);
    expect(srv1Tools.map((t) => t.name)).toContain('tool_a');
    expect(srv1Tools.map((t) => t.name)).toContain('tool_b');

    const srv2Tools = catalog.listByServer('srv-2');
    expect(srv2Tools).toHaveLength(1);
  });

  it('searches tools by name', () => {
    catalog.registerTool('srv-1', 'server-a', { name: 'read_file', description: 'Read file' });
    catalog.registerTool('srv-1', 'server-a', { name: 'write_file', description: 'Write file' });
    catalog.registerTool('srv-1', 'server-a', { name: 'list_dir', description: 'List directory' });

    const results = catalog.listTools({ search: 'file' });
    expect(results).toHaveLength(2);
  });

  it('searches tools by description', () => {
    catalog.registerTool('srv-1', 'server-a', { name: 'cmd', description: 'Execute shell command' });
    catalog.registerTool('srv-1', 'server-a', { name: 'browse', description: 'Browse web page' });

    const results = catalog.listTools({ search: 'shell' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('cmd');
  });

  it('finds tool by name within a server', () => {
    catalog.registerTool('srv-1', 'server-a', { name: 'read_file', description: 'Read' });
    catalog.registerTool('srv-2', 'server-b', { name: 'read_file', description: 'Read' });

    const found = catalog.findToolByName('srv-1', 'read_file');
    expect(found).toBeTruthy();
    expect(found!.serverId).toBe('srv-1');

    const notFound = catalog.findToolByName('srv-1', 'nonexistent');
    expect(notFound).toBeUndefined();
  });

  it('removes all tools for a server', () => {
    catalog.registerTool('srv-1', 'server-a', { name: 'tool_a', description: 'A' });
    catalog.registerTool('srv-1', 'server-a', { name: 'tool_b', description: 'B' });
    catalog.registerTool('srv-2', 'server-b', { name: 'tool_c', description: 'C' });

    const removed = catalog.removeServerTools('srv-1');
    expect(removed).toBe(2);
    expect(catalog.listByServer('srv-1')).toHaveLength(0);
    expect(catalog.listByServer('srv-2')).toHaveLength(1);
  });

  it('removes a single tool', () => {
    const tool = catalog.registerTool('srv-1', 'server-a', { name: 'tool_a', description: 'A' });
    expect(catalog.removeTool(tool.id)).toBe(true);
    expect(catalog.getTool(tool.id)).toBeUndefined();
    expect(catalog.removeTool('nonexistent')).toBe(false);
  });
});
