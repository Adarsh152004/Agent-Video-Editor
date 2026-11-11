import type { IncomingMessage, ServerResponse } from 'node:http';
import { isAbsolute } from 'node:path';
import type { DirListing, JobSettings, Settings } from '../shared/types.js';
import { outputProjectDir } from './outputFolder.js';
import { uploadFile, listDirectory, revealCommand } from './files.js';
import { HttpError, readJson } from './http.js';
import type { JobManager } from './jobs.js';
import { probeMedia, serveMedia } from './media.js';
import { assertProjectName, assertWorkspacePath, canonical } from './paths.js';
import { runCommand } from './process.js';
import { Router, sendJson } from './router.js';
import type { SettingsStore } from './settings.js';
import type { SseHub } from './sse.js';

function url(req: IncomingMessage): URL { return new URL(req.url ?? '/', 'http://localhost'); }
function queryPath(req: IncomingMessage): string {
  const path = url(req).searchParams.get('path');
  if (!path) throw new HttpError(400, 'A path is required.');
  return path;
}

async function allowedWorkspaceOrSource(path: string, store: SettingsStore, jobs: JobManager): Promise<string> {
  const workspace = store.get().workspace;
  if (workspace) {
    try { return await assertWorkspacePath(workspace, path); } catch { /* A known source may live outside the workspace. */ }
  }
  const output = await jobs.knownOutputPath(path);
  if (output) return output;
  const resolved = await canonical(path);
  if (!jobs.isKnownSource(path) && !jobs.isKnownSource(resolved)) throw new HttpError(403, 'Path is outside the workspace and is not a known source.');
  return resolved;
}

export function createApiRouter(store: SettingsStore, jobs: JobManager, events: SseHub): Router {
  const router = new Router();
  router.get('/api/health', (_req, res) => sendJson(res, 200, { ok: true }));
  router.get('/api/workspace', async (_req, res) => sendJson(res, 200, await store.workspaceInfo()));
  router.get('/api/settings', (_req, res) => sendJson(res, 200, store.get()));
  router.put('/api/settings', async (req, res) => sendJson(res, 200, await store.save(await readJson<Settings>(req))));
  router.get('/api/fs/list', async (req, res) => sendJson<DirListing>(res, 200, await listDirectory(url(req).searchParams.get('path') ?? undefined, store)));
  router.post('/api/probe', async (req, res) => {
    const body = await readJson<{ path?: string }>(req);
    const targetPath = body.path?.trim().replace(/^["']|["']$/g, '').trim();
    if (!targetPath || !isAbsolute(targetPath)) throw new HttpError(400, 'An absolute path is required.');
    sendJson(res, 200, await probeMedia(targetPath));
  });
  router.post('/api/upload', async (req, res) => {
    const name = req.headers['x-file-name'];
    if (typeof name !== 'string') throw new HttpError(400, 'X-File-Name is required.');
    sendJson(res, 201, await uploadFile(req, name, store));
  });
  router.get('/api/projects/:name/exists', async (req, res, params) => {
    assertProjectName(params.name);
    const workspace = store.get().workspace;
    if (!workspace) return sendJson(res, 200, { exists: false });
    const { stat } = await import('node:fs/promises');
    const projectDir = await outputProjectDir(workspace, params.name, url(req).searchParams.get('outputFolder') || undefined);
    const info = await stat(projectDir).catch(() => null);
    sendJson(res, 200, { exists: Boolean(info) });
  });
  router.get('/api/jobs', (_req, res) => sendJson(res, 200, jobs.list()));
  router.post('/api/jobs', async (req, res) => sendJson(res, 201, await jobs.start(await readJson<JobSettings>(req))));
  router.post('/api/jobs/:id/answers', async (req, res, params) => {
    const body = await readJson<{ answers?: Record<string, string> }>(req);
    if (!body.answers) throw new HttpError(400, 'Answers are required.');
    await jobs.answer(params.id, body.answers);
    sendJson(res, 200, { ok: true });
  });
  router.post('/api/jobs/:id/cancel', async (_req, res, params) => { await jobs.cancel(params.id); sendJson(res, 200, { ok: true }); });
  router.post('/api/reveal', async (req, res) => {
    const body = await readJson<{ path?: string }>(req);
    if (!body.path) throw new HttpError(400, 'A path is required.');
    const path = await allowedWorkspaceOrSource(body.path, store, jobs);
    const invocation = await revealCommand(path);
    const result = await runCommand(invocation.command, invocation.args);
    if (result.code !== 0) throw new HttpError(500, `Could not reveal the file: ${result.stderr}`);
    sendJson(res, 200, { ok: true });
  });
  router.get('/api/media', async (req, res) => {
    const path = await allowedWorkspaceOrSource(queryPath(req), store, jobs);
    await serveMedia(req, res, path);
  });
  router.get('/api/events', (req, res) => events.connect(req, res, jobs.list()));
  jobs.on('change', (job) => events.publish(job));
  return router;
}
