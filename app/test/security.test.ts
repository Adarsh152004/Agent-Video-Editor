import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { hostAllowed, originAllowed, secureRequest, tokenMatches } from '../src/server/security';

const token = 'test-token';
function request(headers: Record<string, string> = {}, url = '/api/health'): IncomingMessage {
  return { method: 'GET', url, headers: { host: '127.0.0.1:4317', ...headers } } as IncomingMessage;
}
function response(): ServerResponse {
  return { writeHead: vi.fn(), end: vi.fn(), headersSent: false } as unknown as ServerResponse;
}

describe('request security', () => {
  it('rejects a missing or wrong token with 401', () => {
    for (const req of [request(), request({ authorization: 'Bearer wrong' })]) {
      const res = response();
      expect(secureRequest(req, res, token, 4317)).toBe(false);
      expect(res.writeHead).toHaveBeenCalledWith(401, expect.anything());
    }
  });
  it('rejects an unexpected Host with 421', () => {
    const res = response();
    expect(secureRequest(request({ host: 'attacker.example' }), res, token, 4317)).toBe(false);
    expect(res.writeHead).toHaveBeenCalledWith(421, expect.anything());
    expect(hostAllowed('localhost:4317', 4317)).toBe(true);
  });
  it('rejects an unexpected Origin with 403', () => {
    const res = response();
    expect(secureRequest(request({ origin: 'https://attacker.example' }), res, token, 4317)).toBe(false);
    expect(res.writeHead).toHaveBeenCalledWith(403, expect.anything());
    expect(originAllowed('http://localhost:4317', 4317)).toBe(true);
  });
  it('accepts bearer authentication and query authentication only for events or media', () => {
    expect(secureRequest(request({ authorization: `Bearer ${token}`, origin: 'http://127.0.0.1:4317' }), response(), token, 4317)).toBe(true);
    expect(secureRequest(request({}, `/api/events?t=${token}`), response(), token, 4317)).toBe(true);
    expect(secureRequest(request({}, `/api/health?t=${token}`), response(), token, 4317)).toBe(false);
    expect(tokenMatches(token, token)).toBe(true);
    expect(secureRequest(request({}, '/api/index.ts'), response(), token, 4317, true)).toBe(true);
    expect(secureRequest(request({}, '/api/index.ts'), response(), token, 4317, false)).toBe(false);
  });
});
