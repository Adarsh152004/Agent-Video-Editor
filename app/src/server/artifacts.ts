import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { Check } from '../shared/types.js';
import { HttpError } from './http.js';
import { assertWorkspacePath, resolveAgentPath } from './paths.js';

async function newestFile(folder: string, accept: (path: string) => boolean): Promise<string | null> {
  let newestPath: string | null = null;
  let newestTime = -1;
  async function visit(path: string): Promise<void> {
    const entries = await readdir(path, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) await visit(child);
      else if (entry.isFile() && accept(child)) {
        const info = await stat(child);
        if (info.mtimeMs > newestTime) { newestPath = child; newestTime = info.mtimeMs; }
      }
    }
  }
  await visit(folder);
  return newestPath;
}

interface ResultFile { status?: string; master?: string; checks?: string; kind?: string; phase?: string; summary?: string; details?: string[] }
export async function readResultFile(projectDir: string): Promise<ResultFile | null> {
  try {
    const parsed: unknown = JSON.parse(await readFile(join(projectDir, 'ui-result.json'), 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const value = parsed as Record<string, unknown>;
    return {
      ...(typeof value.status === 'string' ? { status: value.status } : {}),
      ...(typeof value.master === 'string' ? { master: value.master } : {}),
      ...(typeof value.checks === 'string' ? { checks: value.checks } : {}),
      ...(typeof value.kind === 'string' ? { kind: value.kind } : {}),
      ...(typeof value.phase === 'string' ? { phase: value.phase } : {}),
      ...(typeof value.summary === 'string' ? { summary: value.summary } : {}),
      ...(Array.isArray(value.details) ? { details: value.details.filter((line): line is string => typeof line === 'string') } : {}),
    };
  } catch { return null; }
}

export async function discoverMaster(projectDir: string, workspace: string, declared?: string): Promise<string | null> {
  if (declared) {
    const path = await assertWorkspacePath(workspace, resolveAgentPath(projectDir, workspace, declared));
    const info = await stat(path).catch(() => null);
    return info?.isFile() ? path : null;
  }
  return newestFile(join(projectDir, 'renders'), (path) => path.toLowerCase().endsWith('.mp4'));
}

export function parseChecks(value: unknown): Check[] {
  if (!value || typeof value !== 'object') return [];
  const results = (value as { results?: unknown }).results;
  if (!Array.isArray(results)) return [];
  return results.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const check = entry as Record<string, unknown>;
    return typeof check.check === 'string' && typeof check.pass === 'boolean' && typeof check.detail === 'string' ? [{ check: check.check, pass: check.pass, detail: check.detail }] : [];
  });
}

export async function discoverChecks(projectDir: string, workspace: string, declared?: string): Promise<Check[]> {
  let path: string | null = null;
  if (declared) {
    const candidate = await assertWorkspacePath(workspace, resolveAgentPath(projectDir, workspace, declared));
    if ((await stat(candidate).catch(() => null))?.isFile()) path = candidate;
  }
  path ??= await newestFile(join(projectDir, 'verify'), (candidate) => candidate.endsWith('checks.json'));
  if (!path) return [];
  try { return parseChecks(JSON.parse(await readFile(path, 'utf8'))); } catch { return []; }
}

export function requireResultPath(path: string | null): string {
  if (!path) throw new HttpError(502, 'The completed master was not found.');
  return path;
}
