import type { FailureKind, Job, JobSettings, JobStatus, PhaseId, Section, SkillId } from '../../shared/types';
import { defaultTheme, themeById } from '../data/themes';

export const projectNamePattern = /^[A-Za-z0-9_-]{1,64}$/;
export const repoUrlPattern = /^https:\/\/[^/\s]+\/[^/\s]+\/[^/\s]+\/?$/;

export function validateProjectName(name: string, exists = false): string | undefined {
  if (!projectNamePattern.test(name)) return 'Use 1–64 letters, numbers, hyphens or underscores.';
  if (exists) return 'A project with this name already exists.';
  return undefined;
}

export function suggestProjectName(path: string): string {
  const name = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? '';
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '').slice(0, 64);
}

export function createDraft(skill: SkillId = 'intro'): JobSettings {
  return {
    skill,
    theme: defaultTheme(skill).id,
    projectName: '',
    approvalMode: 'finished',
    loudness: 'keep',
    captions: false,
    allowRemoteUpload: false,
    notes: '',
    sections: [],
    ...(skill === 'intro' ? { repoRecordings: [] } : { presenterFraming: 'full-frame', delivery: 'source' }),
  };
}

export function changeSkill(settings: JobSettings, skill: SkillId): JobSettings {
  if (settings.skill === skill) return settings;
  const next = { ...settings, skill, theme: defaultTheme(skill).id };
  if (skill === 'intro') {
    delete next.presenterFraming;
    delete next.delivery;
    next.repoRecordings = [];
  } else {
    delete next.repoRecordings;
    next.presenterFraming = 'full-frame';
    next.delivery = 'source';
  }
  return next;
}

export function reorderSections(sections: Section[], from: number, to: number): Section[] {
  if (from === to || from < 0 || to < 0 || from >= sections.length || to >= sections.length) return sections;
  const next = [...sections];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export type VisibleState = 'empty' | JobStatus;
export function visibleState(job?: Job | null): VisibleState {
  return job?.status ?? 'empty';
}

export const phaseLabels: Record<PhaseId, string> = {
  intake: 'Checking footage',
  transcribe: 'Transcribing words',
  'brand-assets': 'Fetching official logos',
  'repo-captures': 'Capturing GitHub pages',
  directive: 'Writing the edit plan',
  validate: 'Validating the plan',
  graphics: 'Rendering graphics',
  composite: 'Compositing the master',
  verify: 'Verifying frames and audio',
  deliver: 'Finishing',
};

export const failureSummaries: Record<FailureKind, string> = {
  'missing-tool': 'A required editing tool is missing. Install it and try again.',
  'disk-full': 'The workspace disk is full. Free some space and try again.',
  'invalid-plan': 'The editor produced an invalid plan and stopped before rendering.',
  'repo-capture': 'A GitHub page could not be captured. Check the repository URL.',
  verification: 'The master was rendered, but verification found a problem.',
  'agent-error': 'The editor stopped unexpectedly. Your source footage is unchanged.',
  cancelled: 'This edit was cancelled by you.',
};

export function themeName(job: Job): string {
  return themeById(job.settings.skill, job.settings.theme)?.name ?? job.settings.theme;
}

export function formatDuration(seconds = 0): string {
  const rounded = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : `${minutes}:${String(secs).padStart(2, '0')}`;
}
