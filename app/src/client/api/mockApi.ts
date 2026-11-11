import type { DirEntry, DirListing, FailureKind, Job, JobSettings, JobStatus, MediaInfo, PhaseState, Settings, WorkspaceInfo } from '../../shared/types';
import { createDraft, failureSummaries, phaseLabels } from '../lib/editor';
import type { Api } from './Api';

const home = '/Users/you';
const videoExtensions = ['mp4', 'mov', 'm4v', 'mkv'];
const audioExtensions = ['m4a', 'wav', 'mp3', 'aac'];
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function mediaKind(path: string): MediaInfo['kind'] | null {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';
  if (videoExtensions.includes(extension)) return 'video';
  if (audioExtensions.includes(extension)) return 'audio';
  return null;
}

export function probeSummary(path: string): MediaInfo {
  const kind = mediaKind(path);
  if (!kind) throw new Error('Unsupported file. Choose a video or audio file.');
  if (path.includes('missing')) throw new Error('The server could not find this file.');
  return kind === 'video'
    ? { path, kind, durationS: 74.2, width: 3840, height: 2160, fps: '29.97', sampleRate: 48000, channels: 2 }
    : { path, kind, durationS: 132.8, sampleRate: 48000, channels: 2 };
}

export function makePhases(skill: JobSettings['skill'], status: JobStatus, failureKind?: FailureKind): PhaseState[] {
  const ids = Object.keys(phaseLabels) as PhaseState['id'][];
  let activeIndex = status === 'needs-decision' ? 4 : status === 'processing' ? 6 : -1;
  const failurePhase: Partial<Record<FailureKind, PhaseState['id']>> = {
    'missing-tool': 'intake', 'disk-full': 'composite', 'invalid-plan': 'validate', 'repo-capture': 'repo-captures', verification: 'verify', 'agent-error': 'graphics', cancelled: 'graphics',
  };
  if (status === 'failed' || status === 'cancelled') activeIndex = ids.indexOf(failurePhase[failureKind ?? 'agent-error'] ?? 'graphics');
  return ids.map((id, index) => {
    if (skill === 'long-form' && id === 'repo-captures') return { id, state: 'skipped' };
    if (status === 'complete') return { id, state: 'done' };
    if (status === 'preparing') return { id, state: 'pending' };
    if ((status === 'failed' || status === 'cancelled') && index === activeIndex) return { id, state: 'failed', message: failureSummaries[failureKind ?? 'agent-error'] };
    if (status === 'needs-decision' && id === 'directive') return { id, state: 'waiting', message: 'Waiting for your answer' };
    if (index < activeIndex) return { id, state: 'done' };
    if (index === activeIndex) return { id, state: 'active', message: id === 'graphics' ? 'Rendering graphics: frame 812 of 1856' : `${phaseLabels[id]}…` };
    return { id, state: 'pending' };
  });
}

export function createMockJob(status: JobStatus = 'processing', failureKind?: FailureKind): Job {
  const settings = createDraft('long-form');
  settings.projectName = 'local-ai-workflow';
  settings.sections = [
    { id: 'section-a', path: `${home}/Movies/presenter.mp4`, kind: 'camera', media: probeSummary(`${home}/Movies/presenter.mp4`) },
    { id: 'section-b', path: `${home}/Movies/explanation.m4a`, kind: 'voiceover', media: probeSummary(`${home}/Movies/explanation.m4a`) },
  ];
  const job: Job = {
    id: `mock-${status}-${failureKind ?? 'default'}`,
    settings,
    status,
    createdAt: new Date(Date.now() - 184000).toISOString(),
    phases: makePhases(settings.skill, status, failureKind),
    percent: status === 'complete' ? 100 : status === 'preparing' ? 42 : status === 'processing' || status === 'needs-decision' ? 64 : 71,
    activity: ['Workspace checked', 'Media streams verified', 'Transcript aligned', 'Edit plan validated', 'Rendering graphics: frame 812 of 1856'],
  };
  if (status === 'needs-decision') job.questions = [
    { id: 'repo', text: 'Which repository should this section show?', context: 'The transcript mentions “the SDK” at 04:18, but two repositories are named in your notes.', options: ['insforge/sdk', 'insforge/examples'] },
    { id: 'graphic', text: 'Should the architecture scene use one or two stages?', context: 'The narration describes a client and a server.', options: ['Two stages', 'One combined stage'] },
  ];
  if (status === 'complete' || (status === 'failed' && failureKind === 'verification')) job.result = {
    masterPath: `/workspace/edit/${settings.projectName}/master.mp4`,
    projectDir: `${settings.outputFolder || '/workspace/edit'}/${settings.projectName}`,
    durationS: 742,
    width: 3840,
    height: 2160,
    fps: '29.97',
    checks: [
      { check: 'Duration matches the timeline', pass: status === 'complete', detail: status === 'complete' ? '742.0 seconds, no missing frames' : 'Expected 742.0 seconds, found 739.8 seconds' },
      { check: 'Audio loudness', pass: true, detail: '-14.1 LUFS, true peak -1.1 dBTP' },
      { check: 'Graphics remain in the safe area', pass: true, detail: 'All 27 sampled frames passed' },
    ],
  };
  if (status === 'failed' || status === 'cancelled') {
    const kind = failureKind ?? (status === 'cancelled' ? 'cancelled' : 'agent-error');
    job.failure = { kind, summary: failureSummaries[kind], details: kind === 'disk-full' ? ['Error: ENOSPC: no space left on device', 'write /workspace/edit/local-ai-workflow/frames/0812.png'] : [`Editor phase: ${job.phases.find((phase) => phase.state === 'failed')?.id ?? 'graphics'}`, failureSummaries[kind], 'Source files were not modified.'], phase: job.phases.find((phase) => phase.state === 'failed')?.id };
  }
  return job;
}

export class MockApi implements Api {
  private jobs: Job[] = [];
  private listeners = new Set<(job: Job) => void>();
  private connectionListeners = new Set<(connected: boolean) => void>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private connected = true;
  private settings: Settings = { workspace: '/workspace', agent: 'kimi', agentPath: 'kimi', model: 'kimi-for-coding', python: '.venv/bin/python' };
  private directories = new Map<string, DirEntry[]>([
    [home, [
      { name: 'Movies', path: `${home}/Movies`, kind: 'dir' },
      { name: 'Recordings', path: `${home}/Recordings`, kind: 'dir' },
      { name: 'notes.txt', path: `${home}/notes.txt`, kind: 'other', sizeBytes: 1820 },
    ]],
    [`${home}/Movies`, [
      { name: 'presenter.mp4', path: `${home}/Movies/presenter.mp4`, kind: 'video', sizeBytes: 824000000 },
      { name: 'final-cut.mov', path: `${home}/Movies/final-cut.mov`, kind: 'video', sizeBytes: 1480000000 },
      { name: 'explanation.m4a', path: `${home}/Movies/explanation.m4a`, kind: 'audio', sizeBytes: 4200000 },
      { name: 'b-roll.wav', path: `${home}/Movies/b-roll.wav`, kind: 'audio', sizeBytes: 12600000 },
    ]],
    [`${home}/Recordings`, [
      { name: 'repo-demo.mp4', path: `${home}/Recordings/repo-demo.mp4`, kind: 'video', sizeBytes: 288000000 },
      { name: 'camera-2.mkv', path: `${home}/Recordings/camera-2.mkv`, kind: 'video', sizeBytes: 922000000 },
    ]],
  ]);

  async getWorkspace(): Promise<WorkspaceInfo> { await delay(80); return { workspace: this.settings.workspace, skillsDir: '/workspace/skills', skills: { intro: true, longForm: true }, companions: [] }; }
  async getSettings() { await delay(60); return { ...this.settings }; }
  async saveSettings(settings: Settings) { this.settings = { ...settings }; return this.getWorkspace(); }
  async listDir(path = home): Promise<DirListing> {
    await delay(120);
    const entries = this.directories.get(path);
    if (!entries) throw new Error('This folder is not available in the mock workspace.');
    return { path, parent: path === home ? null : home, entries };
  }
  async probe(path: string) { await delay(350); return probeSummary(path); }
  async uploadFile(file: File, onProgress: (fraction: number) => void, signal?: AbortSignal): Promise<MediaInfo> {
    if (!mediaKind(file.name)) throw new Error('Unsupported file. Choose a video or audio file.');
    let fraction = 0;
    await new Promise<void>((resolve, reject) => {
      const timer = setInterval(() => {
        fraction = Math.min(1, fraction + 0.07);
        onProgress(fraction);
        if (fraction === 1) { clearInterval(timer); resolve(); }
      }, 90);
      signal?.addEventListener('abort', () => { clearInterval(timer); reject(new DOMException('Cancelled', 'AbortError')); }, { once: true });
    });
    return probeSummary(`/workspace/uploads/${file.name}`);
  }
  async projectExists(name: string, outputFolder?: string) { await delay(100); return name === 'existing' || this.jobs.some((job) => job.settings.projectName === name && job.settings.outputFolder === outputFolder); }
  async startJob(settings: JobSettings) {
    const job = createMockJob('preparing');
    job.id = crypto.randomUUID();
    job.settings = structuredClone(settings);
    job.createdAt = new Date().toISOString();
    job.phases = makePhases(settings.skill, 'preparing');
    this.jobs = [job, ...this.jobs];
    this.emit(job);
    this.advance(job.id, 'processing', 900);
    return structuredClone(job);
  }
  async answerQuestions(jobId: string) {
    const job = this.requireJob(jobId);
    job.status = 'processing';
    job.questions = undefined;
    job.phases = makePhases(job.settings.skill, 'processing');
    this.emit(job);
    this.advance(jobId, 'complete', 2400);
  }
  async cancelJob(jobId: string) { this.setJobState(jobId, 'cancelled', 'cancelled'); }
  async listJobs() { await delay(60); return structuredClone(this.jobs); }
  async reveal() { await delay(50); }
  mediaUrl(path: string) { return `/api/media?path=${encodeURIComponent(path)}`; }
  onJobUpdate(cb: (job: Job) => void) { this.listeners.add(cb); return () => this.listeners.delete(cb); }
  onConnectionChange(cb: (connected: boolean) => void) { this.connectionListeners.add(cb); return () => this.connectionListeners.delete(cb); }

  setConnected(connected: boolean) {
    this.connected = connected;
    this.connectionListeners.forEach((cb) => cb(connected));
  }

  setJobState(jobId: string, status: JobStatus, failureKind?: FailureKind) {
    const current = this.requireJob(jobId);
    const scenario = createMockJob(status, failureKind);
    const next: Job = { ...scenario, id: current.id, settings: current.settings, createdAt: current.createdAt, phases: makePhases(current.settings.skill, status, failureKind) };
    const index = this.jobs.findIndex((job) => job.id === jobId);
    this.jobs[index] = next;
    const timer = this.timers.get(jobId);
    if (timer) clearTimeout(timer);
    this.timers.delete(jobId);
    this.emit(next);
    if (status === 'processing') this.advance(jobId, 'needs-decision', 2600);
    if (status === 'preparing') this.advance(jobId, 'processing', 1200);
  }

  private advance(jobId: string, status: JobStatus, after: number) {
    const timer = setTimeout(() => {
      if (!this.connected) { this.advance(jobId, status, after); return; }
      this.setJobState(jobId, status);
      if (status === 'processing') {
        const job = this.requireJob(jobId);
        job.activity = [...job.activity, 'Graphics rendering started'];
        this.emit(job);
      }
    }, after);
    this.timers.set(jobId, timer);
  }

  private requireJob(id: string) {
    const job = this.jobs.find((item) => item.id === id);
    if (!job) throw new Error('Job not found');
    return job;
  }

  private emit(job: Job) { this.listeners.forEach((cb) => cb(structuredClone(job))); }
}
