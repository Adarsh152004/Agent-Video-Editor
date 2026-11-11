import { realpath } from 'node:fs/promises';
import { homedir } from 'node:os';
import { isAbsolute, resolve, sep } from 'node:path';
import { HttpError } from './http.js';

export function inside(base: string, target: string): boolean {
  const root = resolve(base);
  const path = resolve(target);
  return path === root || path.startsWith(root + sep);
}

export async function canonical(path: string): Promise<string> {
  try { return await realpath(path); } catch { return resolve(path); }
}

export async function assertWorkspacePath(workspace: string, path: string): Promise<string> {
  if (!isAbsolute(path)) throw new HttpError(400, 'An absolute path is required.');
  const canonicalWorkspace = await canonical(workspace);
  const resolved = await canonical(path);
  if (!inside(canonicalWorkspace, resolved)) throw new HttpError(403, 'Path is outside the editor workspace.');
  return resolved;
}

export async function assertListablePath(path: string): Promise<string> {
  if (!isAbsolute(path)) throw new HttpError(400, 'An absolute path is required.');
  const home = await canonical(homedir());
  const resolved = await canonical(path);
  if (!inside(home, resolved) && !inside('/Volumes', resolved)) throw new HttpError(403, 'Only the home folder and external drives can be browsed.');
  return resolved;
}

export function resolveAgentPath(projectDir: string, workspace: string, value: string): string {
  const candidate = isAbsolute(value) ? resolve(value) : resolve(projectDir, value);
  if (!inside(workspace, candidate)) throw new HttpError(403, 'Agent output path escapes the workspace.');
  return candidate;
}

export function assertProjectName(name: string): void {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(name)) throw new HttpError(400, 'Invalid project name.');
}
