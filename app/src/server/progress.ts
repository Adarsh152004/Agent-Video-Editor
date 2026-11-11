import { open } from 'node:fs/promises';
import type { JobSettings, PhaseId, PhaseState } from '../shared/types.js';

export const phaseOrder: PhaseId[] = ['intake', 'transcribe', 'brand-assets', 'repo-captures', 'directive', 'validate', 'graphics', 'composite', 'verify', 'deliver'];
const introWeights: Record<PhaseId, number> = { intake: 3, transcribe: 10, 'brand-assets': 5, 'repo-captures': 5, directive: 15, validate: 2, graphics: 35, composite: 15, verify: 8, deliver: 2 };

export function initialPhases(skill: JobSettings['skill']): PhaseState[] {
  return phaseOrder.map((id) => ({ id, state: skill === 'long-form' && id === 'repo-captures' ? 'skipped' : 'pending' }));
}

export function weightedPercent(skill: JobSettings['skill'], phases: PhaseState[]): number {
  const ids = phaseOrder.filter((id) => skill === 'intro' || id !== 'repo-captures');
  const total = ids.reduce((sum, id) => sum + introWeights[id], 0);
  const value = ids.reduce((sum, id) => {
    const phase = phases.find((item) => item.id === id);
    const fraction = phase?.state === 'done' || phase?.state === 'skipped' ? 1 : phase?.state === 'active' || phase?.state === 'waiting' ? Math.max(0, Math.min(100, phasePercent(phase))) / 100 : 0;
    return sum + introWeights[id] * fraction;
  }, 0);
  return Math.round(value / total * 1000) / 10;
}

const phaseFractions = new WeakMap<PhaseState, number>();
function phasePercent(phase: PhaseState): number { return phaseFractions.get(phase) ?? 0; }

export function applyProgressLine(phases: PhaseState[], line: string): boolean {
  let value: unknown;
  try { value = JSON.parse(line); } catch { return false; }
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (typeof record.phase !== 'string' || !phaseOrder.includes(record.phase as PhaseId)) return false;
  const id = record.phase as PhaseId;
  const index = phases.findIndex((phase) => phase.id === id);
  if (index < 0) return false;
  for (let i = 0; i < index; i++) if (phases[i].state !== 'skipped') phases[i] = { ...phases[i], state: 'done' };
  const current = phases[index];
  const state = record.skipped === true ? 'skipped' : 'active';
  const message = typeof record.message === 'string' ? record.message.slice(0, 300) : current.message;
  phases[index] = { ...current, state, ...(message ? { message } : {}) };
  phaseFractions.set(phases[index], typeof record.percent === 'number' ? Math.max(0, Math.min(100, record.percent)) : 0);
  return true;
}

export class IncrementalProgressReader {
  private offset = 0;
  private partial = '';
  async read(path: string, phases: PhaseState[]): Promise<number> {
    const handle = await open(path, 'r').catch(() => null);
    if (!handle) return 0;
    try {
      const info = await handle.stat();
      if (info.size < this.offset) { this.offset = 0; this.partial = ''; }
      const length = info.size - this.offset;
      if (!length) return 0;
      const buffer = Buffer.alloc(length);
      await handle.read(buffer, 0, length, this.offset);
      this.offset += length;
      const lines = (this.partial + buffer.toString('utf8')).split(/\r?\n/);
      this.partial = lines.pop() ?? '';
      let changed = 0;
      for (const line of lines) if (applyProgressLine(phases, line)) changed++;
      return changed;
    } finally { await handle.close(); }
  }
}
