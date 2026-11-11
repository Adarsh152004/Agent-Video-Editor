import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sanitiseUploadName, uniqueUploadPath } from '../src/server/files';

 describe('upload names', () => {
  it('decodes and sanitises names and refuses path separators', () => {
    expect(sanitiseUploadName('My%20intro%20%26%20talk.mp4')).toBe('My intro - talk.mp4');
    expect(() => sanitiseUploadName('..%2Fsecret.mp4')).toThrow();
    expect(() => sanitiseUploadName('folder%5Csecret.mp4')).toThrow();
  });
  it('allocates numbered names without overwriting', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'editor-upload-'));
    const first = await uniqueUploadPath(folder, 'intro.mp4');
    await writeFile(first, 'one');
    const second = await uniqueUploadPath(folder, 'intro.mp4');
    expect(basename(second)).toBe('intro-2.mp4');
    await writeFile(second, 'two');
    expect(basename(await uniqueUploadPath(folder, 'intro.mp4'))).toBe('intro-3.mp4');
  });
 });
