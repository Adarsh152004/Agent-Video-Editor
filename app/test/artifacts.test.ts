import { mkdir, mkdtemp, readFile, realpath, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { discoverChecks, discoverMaster, readResultFile } from '../src/server/artifacts';

async function project(): Promise<{ workspace: string; projectDir: string }> {
  const workspace = await realpath(await mkdtemp(join(tmpdir(), 'editor-artifacts-')));
  const projectDir = join(workspace, 'edit', 'project');
  await mkdir(join(projectDir, 'renders'), { recursive: true });
  return { workspace, projectDir };
}

describe('result artifact discovery', () => {
  it('uses a declared master and checks file', async () => {
    const { workspace, projectDir } = await project();
    await mkdir(join(projectDir, 'verify'), { recursive: true });
    const master = join(projectDir, 'renders', 'master.mp4');
    await writeFile(master, 'video');
    await writeFile(join(projectDir, 'ui-result.json'), await readFile(join(process.cwd(), 'test/fixtures/ui-result.json')));
    await writeFile(join(projectDir, 'verify', 'checks.json'), await readFile(join(process.cwd(), 'test/fixtures/checks.json')));
    const result = await readResultFile(projectDir);
    expect(await discoverMaster(projectDir, workspace, result?.master)).toBe(master);
    expect(await discoverChecks(projectDir, workspace, result?.checks)).toHaveLength(2);
  });
  it('finds the newest MP4 fallback and newest nested checks', async () => {
    const { workspace, projectDir } = await project();
    const oldMaster = join(projectDir, 'renders', 'old.mp4');
    const newMaster = join(projectDir, 'renders', 'new.mp4');
    await writeFile(oldMaster, 'old');
    await writeFile(newMaster, 'new');
    await utimes(oldMaster, new Date(1000), new Date(1000));
    await utimes(newMaster, new Date(2000), new Date(2000));
    await mkdir(join(projectDir, 'verify', 'run-1'), { recursive: true });
    await writeFile(join(projectDir, 'verify', 'run-1', 'checks.json'), await readFile(join(process.cwd(), 'test/fixtures/checks.json')));
    expect(await discoverMaster(projectDir, workspace)).toBe(newMaster);
    expect(await discoverChecks(projectDir, workspace)).toHaveLength(2);
  });
  it('returns no checks when the report is missing and rejects escapes', async () => {
    const { workspace, projectDir } = await project();
    const master = join(projectDir, 'renders', 'master.mp4');
    await writeFile(master, 'video');
    expect(await discoverChecks(projectDir, workspace)).toEqual([]);
    await expect(discoverMaster(projectDir, workspace, '../../../outside.mp4')).rejects.toMatchObject({ status: 403 });
  });
});
