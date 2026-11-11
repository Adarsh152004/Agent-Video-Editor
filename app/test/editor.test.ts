import { describe, expect, it } from 'vitest';
import type { Section } from '../src/shared/types';
import { changeSkill, createDraft, reorderSections, validateProjectName, visibleState } from '../src/client/lib/editor';
import { createMockJob } from '../src/client/api/mockApi';

 describe('project name validation', () => {
  it('accepts portable project names', () => {
    expect(validateProjectName('intro-final_02')).toBeUndefined();
  });
  it('rejects empty, long and unsafe names', () => {
    expect(validateProjectName('')).toBeTruthy();
    expect(validateProjectName('has spaces')).toBeTruthy();
    expect(validateProjectName('../escape')).toBeTruthy();
    expect(validateProjectName('a'.repeat(65))).toBeTruthy();
  });
  it('rejects an existing output folder', () => {
    expect(validateProjectName('existing', true)).toMatch('already exists');
  });
 });

describe('skill and theme reset', () => {
  it('resets to the destination default and clears only skill-specific fields', () => {
    const intro = { ...createDraft('intro'), theme: 'navy-amber', projectName: 'keep-me', repoRecordings: [{ url: 'https://github.com/a/b', path: '/repo.mp4' }] };
    const long = changeSkill(intro, 'long-form');
    expect(long.theme).toBe('warm-paper');
    expect(long.projectName).toBe('keep-me');
    expect(long.repoRecordings).toBeUndefined();
    expect(long.presenterFraming).toBe('full-frame');
    expect(long.delivery).toBe('source');
    const back = changeSkill({ ...long, theme: 'dark-sketch' }, 'intro');
    expect(back.theme).toBe('personal');
    expect(back.presenterFraming).toBeUndefined();
    expect(back.delivery).toBeUndefined();
    expect(back.repoRecordings).toEqual([]);
  });
});

describe('section reordering', () => {
  const sections: Section[] = ['a', 'b', 'c'].map((id) => ({ id, path: `/${id}.mp4`, kind: 'camera' }));
  it('moves sections into program order without mutating the input', () => {
    expect(reorderSections(sections, 2, 0).map((s) => s.id)).toEqual(['c', 'a', 'b']);
    expect(sections.map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });
  it('supports adjacent keyboard-style moves and ignores invalid moves', () => {
    expect(reorderSections(sections, 1, 2).map((s) => s.id)).toEqual(['a', 'c', 'b']);
    expect(reorderSections(sections, 0, -1)).toBe(sections);
  });
});

describe('status to visible state', () => {
  it('shows empty without a selected job', () => {
    expect(visibleState(null)).toBe('empty');
  });
  it.each(['preparing', 'processing', 'needs-decision', 'complete', 'failed', 'cancelled'] as const)('maps %s directly to its view', (status) => {
    expect(visibleState(createMockJob(status))).toBe(status);
  });
});
