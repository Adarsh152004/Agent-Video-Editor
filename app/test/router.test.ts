import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { Router } from '../src/server/router';

const req = (method: string, url: string) => ({ method, url }) as IncomingMessage;
const res = () => ({ headersSent: false, writeHead: vi.fn(), end: vi.fn(), destroy: vi.fn() }) as unknown as ServerResponse;

describe('Router', () => {
  it('matches method and path, and decodes params', async () => {
    const handler = vi.fn();
    const router = new Router().get('/api/jobs/:id', handler);
    expect(router.handle(req('GET', '/api/jobs/a%20b?x=1'), res())).toBe(true);
    await vi.waitFor(() => expect(handler.mock.calls[0][2]).toEqual({ id: 'a b' }));
    expect(router.handle(req('POST', '/api/jobs/1'), res())).toBe(false);
    expect(router.handle(req('GET', '/api/jobs/1/extra'), res())).toBe(false);
  });

  it('answers 500 when a handler throws or a param is malformed', async () => {
    const r = res();
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    new Router().get('/x/:id', () => {}).handle(req('GET', '/x/%E0'), r);
    await vi.waitFor(() => expect(r.writeHead).toHaveBeenCalledWith(500, expect.anything()));
    errors.mockRestore();
  });
});
