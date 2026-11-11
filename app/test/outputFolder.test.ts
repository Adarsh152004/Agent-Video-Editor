import { mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { outputProjectDir } from '../src/server/outputFolder';
import { probeMedia } from '../src/server/media';
import { buildPrompt } from '../src/server/prompt';
import { createDraft } from '../src/client/lib/editor';

let workspace: string;
beforeEach(async () => { workspace = await realpath(await mkdtemp(join(tmpdir(), 'output-picker-'))); });
afterEach(async () => { await rm(workspace, { recursive: true, force: true }); });

it('accepts an existing folder and a not-yet-created destination without probing them', async () => {
  expect(await outputProjectDir(workspace, 'test-1', workspace)).toBe(join(workspace, 'test-1'));
  expect(await outputProjectDir(workspace, 'test-1', join(workspace, 'new', 'output'))).toBe(join(workspace, 'new', 'output', 'test-1'));
  expect(await outputProjectDir(workspace, 'test-1')).toBe(join(workspace, 'edit', 'test-1'));
});
it('rejects files, relative paths, invalid project names and symlink escapes', async () => {
  const file = join(workspace, 'video.mp4');
  await writeFile(file, 'source');
  await expect(outputProjectDir(workspace, 'test-1', file)).rejects.toMatchObject({ status: 400 });
  await expect(outputProjectDir(workspace, 'test-1', 'relative')).rejects.toMatchObject({ status: 400 });
  await expect(outputProjectDir(workspace, '../escape')).rejects.toMatchObject({ status: 400 });
  await symlink(process.platform === 'win32' ? process.env.WINDIR ?? 'C:\\Windows' : '/etc', join(workspace, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
  await expect(outputProjectDir(workspace, 'test-1', join(workspace, 'escape', 'new'))).rejects.toMatchObject({ status: 403 });
});
it('explains mistaken source folder and missing source paths before invoking ffprobe', async () => {
  await expect(probeMedia(workspace)).rejects.toThrow('This is a folder.');
  await expect(probeMedia(join(workspace, 'not-created'))).rejects.toThrow('Set the destination separately under Output folder.');
});
it('directs the editor and all progress protocols to the selected project folder', () => {
  const draft = { ...createDraft('long-form'), projectName: 'test-1', sections: [] };
  const destination = join(workspace, 'chosen', 'test-1');
  const prompt = buildPrompt(draft, '/skills', '/python', destination);
  for (const file of ['ui-progress.jsonl', 'ui-question.json', 'ui-result.json']) expect(prompt).toContain(`${destination}/${file}`);
  expect(prompt).toContain(`Write everything under ${destination}/`);
});
