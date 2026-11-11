import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseRange } from '../src/server/media';
import { assertListablePath, assertWorkspacePath } from '../src/server/paths';

 describe('media byte ranges', () => {
  it('parses open, bounded and suffix ranges', () => {
    expect(parseRange('bytes=10-19', 100)).toEqual({ start: 10, end: 19 });
    expect(parseRange('bytes=10-', 100)).toEqual({ start: 10, end: 99 });
    expect(parseRange('bytes=90-200', 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange('bytes=-10', 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange(undefined, 100)).toBeUndefined();
  });
  it('rejects malformed and unsatisfiable ranges', () => {
    expect(parseRange('bytes=100-101', 100)).toBeNull();
    expect(parseRange('bytes=20-10', 100)).toBeNull();
    expect(parseRange('items=1-2', 100)).toBeNull();
  });
 });

describe('path boundaries', () => {
  it('rejects workspace escapes for media and reveal paths', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'editor-workspace-'));
    const outside = join(tmpdir(), 'outside.mp4');
    await writeFile(outside, 'video');
    await expect(assertWorkspacePath(workspace, outside)).rejects.toMatchObject({ status: 403 });
    await expect(assertWorkspacePath(workspace, join(workspace, '..', 'escape.mp4'))).rejects.toMatchObject({ status: 403 });
  });
  it('rejects fs/list paths outside home and external volumes', async () => {
    await expect(assertListablePath('/etc')).rejects.toMatchObject({ status: 403 });
    await expect(assertListablePath('relative/path')).rejects.toMatchObject({ status: 400 });
  });
});
