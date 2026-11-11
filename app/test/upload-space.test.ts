import { mkdtemp, readFile, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import type { IncomingMessage } from 'node:http';
import { expect, it, vi } from 'vitest';
import { uploadFile } from '../src/server/files';
import type { SettingsStore } from '../src/server/settings';

vi.mock('../src/server/media', () => ({ probeMedia: vi.fn(async (path: string) => ({ path, kind: 'video' })) }));

it('uploads even when legacy settings specify an impossible minimum free-space reserve', async () => {
  const workspace = await realpath(await mkdtemp(join(tmpdir(), 'upload-space-')));
  try {
    const store = { get: () => ({ workspace, minFreeGb: Number.MAX_SAFE_INTEGER }) } as unknown as SettingsStore;
    const request = Readable.from(['sample footage']) as unknown as IncomingMessage;
    const result = await uploadFile(request, 'sample.mp4', store);
    expect(await readFile(result.path, 'utf8')).toBe('sample footage');
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
