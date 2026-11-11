import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiRouter } from './api.js';
import { JobManager } from './jobs.js';
import { sendJson } from './router.js';
import { isDevClientModule, secureRequest } from './security.js';
import { SettingsStore } from './settings.js';
import { SseHub } from './sse.js';

const HOST = '127.0.0.1';
const FIRST_PORT = 4317;
const isDev = process.argv.includes('--dev');
const shouldOpen = !process.argv.includes('--no-open');
const token = randomBytes(32).toString('base64url');
const store = new SettingsStore(resolve(process.cwd(), '..'));
await store.load();
const jobs = new JobManager(store);
const events = new SseHub();
const router = createApiRouter(store, jobs, events);
let port = FIRST_PORT;

const server = createServer((req, res) => {
  if (!secureRequest(req, res, token, port, isDev)) return;
  if (router.handle(req, res)) return;
  if (req.url?.startsWith('/api/') && !isDevClientModule(req.url, isDev)) return sendJson(res, 404, { error: 'Not found' });
  clientHandler(req, res);
});

let clientHandler: (req: IncomingMessage, res: ServerResponse) => void;
if (isDev) {
  const { createServer: createVite } = await import('vite');
  const vite = await createVite({ configFile: fileURLToPath(new URL('../../vite.config.ts', import.meta.url)), server: { middlewareMode: true, hmr: { server } }, appType: 'spa' });
  clientHandler = (req, res) => vite.middlewares(req, res);
} else {
  clientHandler = serveStatic(fileURLToPath(new URL('../../client', import.meta.url)));
}

port = await listen(server, FIRST_PORT);
const url = `http://${HOST}:${port}/#/?t=${token}`;
console.log(`Agent Video Editor running at ${url}${isDev ? ' (dev)' : ''}`);
if (shouldOpen) openBrowser(url);

let shuttingDown = false;
async function shutdown(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  await jobs.shutdown();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 11000).unref();
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());

function listen(srv: Server, initialPort: number, attempts = 20): Promise<number> {
  return new Promise((done, fail) => {
    const onError = (err: NodeJS.ErrnoException) => {
      srv.off('listening', onListening);
      if (err.code === 'EADDRINUSE' && attempts > 1) done(listen(srv, initialPort + 1, attempts - 1));
      else fail(err);
    };
    const onListening = () => { srv.off('error', onError); done(initialPort); };
    srv.once('error', onError);
    srv.once('listening', onListening);
    srv.listen(initialPort, HOST);
  });
}

function openBrowser(target: string): void {
  const [cmd, args] = process.platform === 'darwin' ? ['open', [target]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', target]] : ['xdg-open', [target]];
  const child = spawn(cmd, args, { stdio: 'ignore', detached: true, shell: false });
  child.on('error', () => console.log('Open the authenticated URL printed above in your browser.'));
  child.unref();
}

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png',
};

function serveStatic(root: string) {
  const index = join(root, 'index.html');
  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: 'Method not allowed' });
    let pathname: string;
    try { pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname); } catch { return sendJson(res, 400, { error: 'Bad path' }); }
    const file = resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + sep)) return sendJson(res, 403, { error: 'Forbidden' });
    const info = await stat(file).catch(() => null);
    const target = info?.isFile() ? file : extname(pathname) ? null : index;
    if (!target) return sendJson(res, 404, { error: 'Not found' });
    res.writeHead(200, { 'Content-Type': TYPES[extname(target)] ?? 'application/octet-stream', 'Cache-Control': target.includes(`${sep}assets${sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache' });
    if (req.method === 'HEAD') return res.end();
    createReadStream(target).on('error', () => res.destroy()).pipe(res);
  };
}
