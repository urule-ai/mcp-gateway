import { describe, it, expect, beforeEach } from 'vitest';
import { ServerRegistry } from '../src/services/server-registry.js';

describe('ServerRegistry', () => {
  let registry: ServerRegistry;

  beforeEach(() => {
    registry = new ServerRegistry();
  });

  it('registers a server and returns it', () => {
    const server = registry.register({
      name: 'filesystem',
      description: 'File system access',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem'],
    });

    expect(server.id).toBeTruthy();
    expect(server.name).toBe('filesystem');
    expect(server.status).toBe('registered');
    expect(server.transportType).toBe('stdio');
  });

  it('lists all servers', () => {
    registry.register({ name: 'srv-a', command: 'cmd-a' });
    registry.register({ name: 'srv-b', command: 'cmd-b' });

    const servers = registry.list();
    expect(servers).toHaveLength(2);
  });

  it('gets server by ID', () => {
    const created = registry.register({ name: 'test', command: 'test-cmd' });
    const found = registry.get(created.id);
    expect(found).toBeTruthy();
    expect(found!.name).toBe('test');

    expect(registry.get('nonexistent')).toBeUndefined();
  });

  it('removes a server', () => {
    const created = registry.register({ name: 'test', command: 'test-cmd' });
    expect(registry.remove(created.id)).toBe(true);
    expect(registry.get(created.id)).toBeUndefined();
    expect(registry.remove('nonexistent')).toBe(false);
  });

  it('updates server status', () => {
    const created = registry.register({ name: 'test', command: 'test-cmd' });
    const updated = registry.updateStatus(created.id, 'connected');
    expect(updated).toBeTruthy();
    expect(updated!.status).toBe('connected');

    expect(registry.updateStatus('nonexistent', 'error')).toBeUndefined();
  });

  it('binds server to workspace', () => {
    const server = registry.register({ name: 'test', command: 'test-cmd' });
    const binding = registry.bindToWorkspace(server.id, 'ws-1', { key: 'value' });

    expect(binding.id).toBeTruthy();
    expect(binding.workspaceId).toBe('ws-1');
    expect(binding.serverId).toBe(server.id);
    expect(binding.config).toEqual({ key: 'value' });
    expect(binding.status).toBe('active');
  });

  it('throws when binding nonexistent server', () => {
    expect(() => registry.bindToWorkspace('nonexistent', 'ws-1')).toThrow('Server not found');
  });

  it('lists workspace bindings', () => {
    const s1 = registry.register({ name: 'srv-1', command: 'cmd-1' });
    const s2 = registry.register({ name: 'srv-2', command: 'cmd-2' });

    registry.bindToWorkspace(s1.id, 'ws-1');
    registry.bindToWorkspace(s2.id, 'ws-1');
    registry.bindToWorkspace(s1.id, 'ws-2');

    expect(registry.getWorkspaceBindings('ws-1')).toHaveLength(2);
    expect(registry.getWorkspaceBindings('ws-2')).toHaveLength(1);
    expect(registry.getWorkspaceBindings('ws-3')).toHaveLength(0);
  });

  it('gets workspace servers', () => {
    const s1 = registry.register({ name: 'srv-1', command: 'cmd-1' });
    registry.bindToWorkspace(s1.id, 'ws-1');

    const servers = registry.getWorkspaceServers('ws-1');
    expect(servers).toHaveLength(1);
    expect(servers[0].name).toBe('srv-1');
  });

  it('unbinds from workspace', () => {
    const server = registry.register({ name: 'test', command: 'cmd' });
    const binding = registry.bindToWorkspace(server.id, 'ws-1');

    expect(registry.unbindFromWorkspace(binding.id)).toBe(true);
    expect(registry.getWorkspaceBindings('ws-1')).toHaveLength(0);
    expect(registry.unbindFromWorkspace('nonexistent')).toBe(false);
  });
});
