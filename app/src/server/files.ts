import { createWriteStream } from 'node:fs';
import { mkdir, readdir, stat, unlink } from 'node:fs/promises';
import type { IncomingMessage } from 'node:http';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { DirEntry, DirListing, MediaInfo, Settings } from '../shared/types.js';
import { HttpError } from './http.js';
import { probeMedia } from './media.js';
import { assertListablePath, assertWorkspacePath } from './paths.js';
import type { SettingsStore } from './settings.js';

const video = new Set(['.mp4', '.mov', '.m4v', '.mkv']);
const audio = new Set(['.m4a', '.wav', '.mp3', '.aac']);

function classify(path: string, directory: boolean): DirEntry['kind'] {
  if (directory) return 'dir';
  const extension = extname(path).toLowerCase();
  if (video.has(extension)) return 'video';
  if (audio.has(extension)) return 'audio';
  return 'other';
}

export async function listDirectory(requested: string | undefined, store: SettingsStore): Promise<DirListing> {
  const settings = store.get();
  const path = await assertListablePath(requested || settings.lastFolder || (await import('node:os')).homedir());
  const info = await stat(path).catch(() => null);
  if (!info?.isDirectory()) throw new HttpError(400, 'Not a folder.');
  const names = await readdir(path);
  const entries: DirEntry[] = [];
  for (const name of names) {
    if (name.startsWith('.')) continue;
    const entryPath = join(path, name);
    const entryInfo = await stat(entryPath).catch(() => null);
    if (!entryInfo) continue;
    entries.push({ name, path: entryPath, kind: classify(name, entryInfo.isDirectory()), ...(entryInfo.isFile() ? { sizeBytes: entryInfo.size } : {}) });
  }
  entries.sort((a, b) => a.kind === 'dir' && b.kind !== 'dir' ? -1 : a.kind !== 'dir' && b.kind === 'dir' ? 1 : a.name.localeCompare(b.name));
  const parentPath = resolve(path, '..');
  let parent: string | null = parentPath;
  try { parent = await assertListablePath(parentPath); } catch { parent = null; }
  if (parent === path) parent = null;
  await store.setLastFolder(path);
  return { path, parent, entries };
}

export function sanitiseUploadName(encodedName: string): string {
  let name: string;
  try { name = decodeURIComponent(encodedName); } catch { throw new HttpError(400, 'Invalid encoded file name.'); }
  if (!name || name.includes('/') || name.includes('\\') || name.includes('\0')) throw new HttpError(400, 'File names cannot contain path separators.');
  name = basename(name).replace(/[^A-Za-z0-9._() -]/g, '-').replace(/^\.+/, '').trim();
  if (!name || name === '.' || name === '..') throw new HttpError(400, 'Invalid file name.');
  return name;
}

export async function uniqueUploadPath(folder: string, name: string): Promise<string> {
  const extension = extname(name);
  const stem = name.slice(0, name.length - extension.length);
  for (let number = 1; number < 10000; number++) {
    const candidate = join(folder, number === 1 ? name : `${stem}-${number}${extension}`);
    try { await stat(candidate); } catch { return candidate; }
  }
  throw new HttpError(409, 'Could not allocate an upload name.');
}

export async function uploadFile(req: IncomingMessage, encodedName: string, store: SettingsStore): Promise<MediaInfo> {
  const settings: Settings = store.get();
  if (!settings.workspace) throw new HttpError(409, 'Configure the editor workspace first.');
  const name = sanitiseUploadName(encodedName);
  const day = new Date().toISOString().slice(0, 10);
  const folder = join(settings.workspace, 'sources', day);
  await mkdir(folder, { recursive: true });
  const destination = await uniqueUploadPath(folder, name);
  let complete = false;
  try {
    await pipeline(req, createWriteStream(destination, { flags: 'wx' }));
    complete = true;
  } catch (error) {
    await unlink(destination).catch(() => {});
    if ((error as NodeJS.ErrnoException).code === 'ENOSPC') throw new HttpError(507, 'The workspace disk is full. Free some space and try again.');
    if (req.aborted || req.destroyed) throw new HttpError(499, 'Upload cancelled.');
    throw error;
  }
  if (!complete || req.aborted) {
    await unlink(destination).catch(() => {});
    throw new HttpError(499, 'Upload cancelled.');
  }
  const canonical = await assertWorkspacePath(settings.workspace, destination);
  return probeMedia(canonical);
}

export async function revealCommand(path: string): Promise<{ command: string; args: string[] }> {
  if (process.platform === 'darwin') return { command: 'open', args: ['-R', path] };
  if (process.platform === 'win32') return { command: 'explorer', args: [`/select,${path}`] };
  return { command: 'xdg-open', args: [dirname(path)] };
}
