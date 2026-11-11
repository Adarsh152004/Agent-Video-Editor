import { realpath, stat } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { assertListablePath, assertProjectName, canonical, inside } from './paths.js';
import { HttpError } from './http.js';

// Resolve existing ancestors too, so a new path cannot hide a symlink escape.
async function resolveFolder(path: string): Promise<string> {
  try {
    const resolved = await realpath(path);
    if (!(await stat(resolved)).isDirectory()) throw new HttpError(400, 'Choose a folder for output, not a file.');
    return resolved;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    const parent = dirname(path);
    if (parent === path) throw error;
    return join(await resolveFolder(parent), basename(path));
  }
}

export async function outputProjectDir(workspace: string, name: string, folder?: string): Promise<string> {
  assertProjectName(name);
  if (folder !== undefined && (typeof folder !== 'string' || !isAbsolute(folder))) throw new HttpError(400, 'Choose an output folder or enter its absolute path.');
  const root = await resolveFolder(folder || join(workspace, 'edit'));
  if (!inside(await canonical(workspace), root)) await assertListablePath(root);
  const project = join(root, name);
  // Existing project symlinks must not redirect writes outside the chosen folder.
  if (!inside(root, await canonical(project))) throw new HttpError(403, 'The project folder points outside the selected output folder.');
  return project;
}
