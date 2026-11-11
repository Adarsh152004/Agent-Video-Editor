import type { IncomingMessage, ServerResponse } from 'node:http';
import { errorMessage } from './http.js';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';
type Handler = (req: IncomingMessage, res: ServerResponse, params: Record<string, string>) => void | Promise<void>;

interface Route {
  method: Method;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

/** Minimal router: exact paths plus `:param` segments. */
export class Router {
  private routes: Route[] = [];

  add(method: Method, path: string, handler: Handler): this {
    const keys: string[] = [];
    const source = path.replace(/:(\w+)/g, (_, key: string) => {
      keys.push(key);
      return '([^/]+)';
    });
    this.routes.push({ method, pattern: new RegExp(`^${source}$`), keys, handler });
    return this;
  }

  get(path: string, handler: Handler): this { return this.add('GET', path, handler); }
  post(path: string, handler: Handler): this { return this.add('POST', path, handler); }
  put(path: string, handler: Handler): this { return this.add('PUT', path, handler); }
  delete(path: string, handler: Handler): this { return this.add('DELETE', path, handler); }

  /** Returns false when no route matches, so the caller can fall through. */
  handle(req: IncomingMessage, res: ServerResponse): boolean {
    const pathname = new URL(req.url ?? '/', 'http://x').pathname;
    for (const route of this.routes) {
      const match = route.method === req.method && route.pattern.exec(pathname);
      if (!match) continue;
      Promise.resolve()
        .then(() => {
          const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
          return route.handler(req, res, params);
        })
        .catch((err: unknown) => {
          const failure = errorMessage(err);
          if (!res.headersSent) sendJson(res, failure.status, { error: failure.error });
          else res.destroy();
        });
      return true;
    }
    return false;
  }
}

export function sendJson<T>(res: ServerResponse, status: number, body: T): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}
