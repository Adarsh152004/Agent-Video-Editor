import { appendFile, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyProgressLine, IncrementalProgressReader, initialPhases, weightedPercent } from '../src/server/progress';

 describe('ui progress', () => {
  it('marks earlier phases done and calculates weighted percent', () => {
    const phases = initialPhases('intro');
    expect(applyProgressLine(phases, '{"phase":"intake","percent":50,"message":"Checking"}')).toBe(true);
    expect(weightedPercent('intro', phases)).toBe(1.5);
    applyProgressLine(phases, '{"phase":"transcribe","percent":50}');
    expect(phases[0].state).toBe('done');
    expect(weightedPercent('intro', phases)).toBe(8);
    applyProgressLine(phases, '{"phase":"brand-assets","skipped":true}');
    expect(weightedPercent('intro', phases)).toBe(18);
  });
  it('renormalises long-form weights without repo captures', () => {
    const phases = initialPhases('long-form');
    applyProgressLine(phases, '{"phase":"intake","percent":100}');
    expect(weightedPercent('long-form', phases)).toBeCloseTo(3.2, 1);
    expect(phases.find((phase) => phase.id === 'repo-captures')?.state).toBe('skipped');
  });
  it('reads only complete new lines from the last byte offset', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'editor-progress-'));
    const path = join(folder, 'ui-progress.jsonl');
    const reader = new IncrementalProgressReader();
    const phases = initialPhases('intro');
    await writeFile(path, '{"phase":"intake","percent":25}');
    expect(await reader.read(path, phases)).toBe(0);
    await appendFile(path, '\n{"phase":"intake","percent":75}\n');
    expect(await reader.read(path, phases)).toBe(2);
    expect(weightedPercent('intro', phases)).toBe(2.3);
    await appendFile(path, '{"phase":"transcribe","percent":10}\n');
    expect(await reader.read(path, phases)).toBe(1);
    expect(phases[0].state).toBe('done');
  });
 });
