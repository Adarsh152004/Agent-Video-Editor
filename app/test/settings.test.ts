import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { SettingsStore } from '../src/server/settings';

let temporaryDirectory: string | undefined;
afterEach(async () => {
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
  temporaryDirectory = undefined;
});

it('defaults to the workspace virtual environment using the platform executable path', async () => {
  temporaryDirectory = await mkdtemp(join(tmpdir(), 'settings-'));
  const workspace = join(temporaryDirectory, 'workspace');
  const pythonPath = join(workspace, '.venv', process.platform === 'win32' ? 'Scripts' : 'bin', process.platform === 'win32' ? 'python.exe' : 'python');
  await mkdir(join(workspace, 'skills', 'presenter-intro-editor'), { recursive: true });
  await mkdir(dirname(pythonPath), { recursive: true });
  await writeFile(join(workspace, 'skills', 'presenter-intro-editor', 'SKILL.md'), 'skill');
  await writeFile(pythonPath, '');

  const store = new SettingsStore(workspace, join(temporaryDirectory, 'settings.json'));
  await expect(store.load()).resolves.toMatchObject({ python: pythonPath });
});
