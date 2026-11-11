import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson } from './router.js';

export function tokenMatches(actual: string | null | undefined, expected: string): boolean {
  if (!actual) return false;
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function hostAllowed(host: string | undefined, port: number): boolean {
  return host === `127.0.0.1:${port}` || host === `localhost:${port}`;
}

export function originAllowed(origin: string | undefined, port: number): boolean {
  return origin === undefined || origin === `http://127.0.0.1:${port}` || origin === `http://localhost:${port}`;
}

export function requestToken(req: IncomingMessage): string | null {
  const authorization = req.headers.authorization;
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7);
  const url = new URL(req.url ?? '/', 'http://localhost');
  if ((url.pathname === '/api/events' || url.pathname === '/api/media') && req.method === 'GET') return url.searchParams.get('t');
  return null;
}

export function isDevClientModule(url: string | undefined, isDev: boolean): boolean {
  if (!isDev || !url) return false;
  return /^\/api\/[A-Za-z0-9_-]+\.tsx?$/.test(new URL(url, 'http://localhost').pathname);
}

export function secureRequest(req: IncomingMessage, res: ServerResponse, token: string, port: number, isDev = false): boolean {
  if (!hostAllowed(req.headers.host, port)) { sendJson(res, 421, { error: 'Misdirected request' }); return false; }
  if (!originAllowed(req.headers.origin, port)) { sendJson(res, 403, { error: 'Origin not allowed' }); return false; }
  if (req.url?.startsWith('/api/') && !isDevClientModule(req.url, isDev) && !tokenMatches(requestToken(req), token)) { sendJson(res, 401, { error: 'Use the authenticated link printed in the terminal.' }); return false; }
  return true;
}
