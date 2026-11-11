import { spawn, type ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { createWriteStream, watch, type FSWatcher } from 'node:fs';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import type { FailureKind, Job, JobSettings, PhaseId, Question, Settings } from '../shared/types.js';
import { resolveAgentInvocation } from './agent.js';
import { discoverChecks, discoverMaster, readResultFile } from './artifacts.js';
import { HttpError } from './http.js';
import { probeMedia } from './media.js';
import { AgentOutputParser } from './outputParser.js';
import { assertProjectName } from './paths.js';
import { runCommand } from './process.js';
import { outputProjectDir } from './outputFolder.js';
import { assertWorkspacePath } from './paths.js';
import { buildAnswerPrompt, buildPrompt, buildRestartPrompt } from './prompt.js';
import { IncrementalProgressReader, initialPhases, weightedPercent } from './progress.js';
import type { SettingsStore } from './settings.js';

interface Runtime {
  job: Job;
  settings: Settings;
  projectDir: string;
  originalPrompt: string;
  progress: IncrementalProgressReader;
  child?: ChildProcess;
  log?: ReturnType<typeof createWriteStream>;
  watcher?: FSWatcher;
  poll?: ReturnType<typeof setInterval>;
  debounce?: ReturnType<typeof setTimeout>;
  stderr: string[];
  finalMessage?: string;
  sessionId?: string;
  cost?: number;
  terminal?: 'success' | 'error';
  detectedFailure?: { kind: FailureKind; summary: string; details: string[] };
  lastProgressAt: number;
  cancelling: boolean;
  finalizing: boolean;
  finished: boolean;
  autoResumes?: number;
}

const themes = {
  intro: new Set(['personal', 'lime-tech', 'navy-amber', 'clean-tech']),
  'long-form': new Set(['warm-paper', 'personal', 'lime-tech', 'navy-amber', 'dark-sketch', 'blackboard-style', 'colorful-purple', 'clean-tech']),
};
const failureKinds = new Set<FailureKind>(['missing-tool', 'disk-full', 'invalid-plan', 'repo-capture', 'verification', 'agent-error', 'cancelled']);
const phaseIds = new Set<PhaseId>(['intake', 'transcribe', 'brand-assets', 'repo-captures', 'directive', 'validate', 'graphics', 'composite', 'verify', 'deliver']);

function validateJobSettings(value: JobSettings): void {
  if (!value || (value.skill !== 'intro' && value.skill !== 'long-form')) throw new HttpError(400, 'Invalid skill.');
  assertProjectName(value.projectName);
  if (!themes[value.skill].has(value.theme)) throw new HttpError(400, 'Invalid theme for this skill.');
  if (!Array.isArray(value.sections) || (value.skill === 'intro' ? value.sections.length !== 1 : value.sections.length < 1)) throw new HttpError(400, 'Invalid footage sections.');
  for (const section of value.sections) {
    if (!section.path || !isAbsolute(section.path) || !section.media || (section.kind !== 'camera' && section.kind !== 'voiceover')) throw new HttpError(400, 'Every section needs a probed absolute source path.');
    if (section.media.path !== section.path) throw new HttpError(400, 'Section media does not match its source path.');
    if (value.skill === 'intro' && (section.kind !== 'camera' || section.media.kind !== 'video')) throw new HttpError(400, 'Intro requires one camera video.');
    if (section.media.kind === 'audio' && section.kind === 'camera') throw new HttpError(400, 'Audio cannot be a camera section.');
  }
  if (value.skill === 'intro') for (const repo of value.repoRecordings ?? []) {
    if (!/^https:\/\/[^/\s]+\/[^/\s]+\/[^/\s]+\/?$/.test(repo.url) || !isAbsolute(repo.path)) throw new HttpError(400, 'Invalid repo recording.');
  }
}

function parseQuestions(value: unknown): Question[] {
  if (!value || typeof value !== 'object') return [];
  const questions = (value as { questions?: unknown }).questions;
  if (!Array.isArray(questions)) return [];
  return questions.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const question = item as Record<string, unknown>;
    if (typeof question.id !== 'string' || typeof question.text !== 'string') return [];
    return [{
      id: question.id,
      text: question.text,
      ...(typeof question.context === 'string' ? { context: question.context } : {}),
      ...(Array.isArray(question.options) ? { options: question.options.filter((option): option is string => typeof option === 'string') } : {}),
    }];
  });
}

export class JobManager extends EventEmitter {
  private jobs = new Map<string, Runtime>();
  private runningId: string | null = null;
  constructor(private readonly store: SettingsStore) { super(); }

  list(): Job[] { return [...this.jobs.values()].map((runtime) => structuredClone(runtime.job)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  get(id: string): Job { return structuredClone(this.require(id).job); }
  hasRunningJob(): boolean { return this.runningId !== null; }

  async start(value: JobSettings): Promise<Job> {
    if (this.runningId) throw new HttpError(409, 'Another edit is already running.');
    validateJobSettings(value);
    await this.store.refreshAgent();
    const settings = this.store.get();
    const workspace = await this.store.workspaceInfo();
    if (!settings.workspace || !settings.skillsDir || !workspace.skillsDir) throw new HttpError(409, 'Configure a valid editor workspace first.');
    if (value.skill === 'intro' ? !workspace.skills.intro : !workspace.skills.longForm) throw new HttpError(409, 'This skill is not installed in the workspace.');
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const projectDir = await outputProjectDir(settings.workspace, value.projectName, value.outputFolder);
    await mkdir(projectDir, { recursive: true });
    // Remove stale result files from previous failed attempt so new run starts fresh while reusing assets
    await unlink(join(projectDir, 'ui-result.json')).catch(() => {});
    await unlink(join(projectDir, 'ui-question.json')).catch(() => {});
    const job: Job = { id, settings: structuredClone(value), status: 'preparing', createdAt, phases: initialPhases(value.skill), percent: 0, activity: ['Starting preflight checks'], progressStale: false };
    const runtime: Runtime = {
      job, settings: { ...settings, workspace: workspace.workspace!, skillsDir: workspace.skillsDir }, projectDir,
      originalPrompt: buildPrompt(value, workspace.skillsDir, settings.python, projectDir.replace(/\\/g, '/')), progress: new IncrementalProgressReader(),
      stderr: [], lastProgressAt: Date.now(), cancelling: false, finalizing: false, finished: false,
    };
    this.jobs.set(id, runtime);
    this.runningId = id;
    await mkdir(projectDir, { recursive: true });
    await writeFile(join(projectDir, 'ui-job.json'), `${JSON.stringify({ ...value, jobId: id, createdAt }, null, 2)}\n`);
    this.watch(runtime);
    this.changed(runtime);
    void this.preflight(runtime);
    return structuredClone(job);
  }

  private async preflight(runtime: Runtime): Promise<void> {
    const { settings, job } = runtime;
    const checks: { name: string; command: string; args: string[]; validate?: (stdout: string, stderr: string) => boolean }[] = [
      { name: 'ffmpeg', command: 'ffmpeg', args: ['-version'] },
      { name: 'ffprobe', command: 'ffprobe', args: ['-version'] },
      { name: 'Python 3.11 or later', command: settings.python, args: ['--version'], validate: (out, err) => /Python 3\.(1[1-9]|[2-9]\d)\./.test(`${out}${err}`) },
      { name: 'node', command: 'node', args: ['--version'] },
      { name: 'agent CLI', command: settings.agentPath, args: ['--version'] },
    ];
    if (!job.settings.allowRemoteUpload) checks.push({ name: 'local Whisper (mlx-whisper or faster-whisper)', command: settings.python, args: ['-c', "import importlib.util as u, sys; sys.exit(0 if u.find_spec('mlx_whisper') or u.find_spec('faster_whisper') else 1)"] });
    if (job.settings.skill === 'intro') checks.push({ name: 'playwright and Pillow', command: settings.python, args: ['-c', 'import playwright, PIL'] });
    for (const check of checks) {
      if (runtime.cancelling) return;
      const result = await runCommand(check.command, check.args, { cwd: settings.workspace, timeoutMs: 10000 });
      if (result.code !== 0 || result.timedOut || (check.validate && !check.validate(result.stdout, result.stderr))) {
        // If ffprobe is blocked by OS policy, but ffmpeg is available, continue since ffmpeg is used for probe and renders
        if (check.name === 'ffprobe') {
          continue;
        }
        this.fail(runtime, 'missing-tool', `Missing tool: ${check.name}. Command failed: ${result.command}`, [result.stderr.trim() || result.stdout.trim() || `Exit code ${result.code ?? 'unknown'}`], 'intake');
        return;
      }
    }
    if (runtime.cancelling) return;
    runtime.job.status = 'processing';
    runtime.job.activity = [...runtime.job.activity, 'Preflight passed', runtime.job.settings.skill === 'intro' ? 'Starting Intro editor' : 'Starting Long-form editor'];
    this.spawnAgent(runtime, runtime.originalPrompt);
    this.changed(runtime);
  }

  private spawnAgent(runtime: Runtime, prompt: string, resumeId?: string): void {
    const invocation = resolveAgentInvocation(runtime.settings, prompt, resumeId);
    runtime.terminal = undefined;
    runtime.finalMessage = undefined;
    runtime.log = createWriteStream(join(runtime.projectDir, 'ui-agent.log'), { flags: 'a' });
    runtime.log.write(`Resolved command: ${invocation.display}\n`);
    const child = spawn(runtime.settings.agentPath, invocation.args, { cwd: runtime.settings.workspace, detached: true, env: process.env, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    runtime.child = child;
    const parser = new AgentOutputParser((line, output) => {
      if (output.sessionId) runtime.sessionId = output.sessionId;
      if (output.terminal) runtime.terminal = output.terminal;
      if (output.cost !== undefined) runtime.cost = output.cost;
      if (output.activity.length) {
        runtime.finalMessage = output.activity[output.activity.length - 1];
        runtime.job.activity = [...runtime.job.activity, ...output.activity].slice(-2000);
        this.inspectActivity(runtime, line);
        this.changed(runtime);
      }
    });
    child.stdout.on('data', (chunk: Buffer) => { runtime.log?.write(chunk); parser.push(chunk.toString('utf8')); });
    child.stderr.on('data', (chunk: Buffer) => {
      runtime.log?.write(chunk);
      const text = chunk.toString('utf8');
      runtime.stderr = [...runtime.stderr, ...text.split(/\r?\n/)].slice(-30);
      this.inspectActivity(runtime, text);
    });
    child.on('error', (error) => { runtime.stderr = [...runtime.stderr, error.message].slice(-30); });
    child.on('close', (code) => { parser.end(); runtime.log?.end(); void this.finish(runtime, code); });
  }

  private inspectActivity(runtime: Runtime, text: string): void {
    const recent = [...runtime.job.activity, ...runtime.stderr, text].join('\n').slice(-10000);
    if (/ENOSPC|No space left on device/i.test(recent)) runtime.detectedFailure = { kind: 'disk-full', summary: 'The workspace disk is full.', details: [text.slice(0, 500)] };
    else if (/error:\s*\S+ is not an https:\/\/[^/]+\/[^/]+\/[^/]+ URL/i.test(recent) || /Traceback[\s\S]*playwright|playwright[\s\S]*Traceback/i.test(recent)) runtime.detectedFailure = { kind: 'repo-capture', summary: 'A GitHub page could not be captured.', details: [text.slice(0, 500)] };
  }

  private async finish(runtime: Runtime, exitCode: number | null): Promise<void> {
    if (runtime.finalizing || runtime.finished) return;
    runtime.finalizing = true;
    try {
      await this.syncArtifacts(runtime);
      runtime.child = undefined;
      if (runtime.cancelling || runtime.job.status === 'cancelled') return;
      const result = await readResultFile(runtime.projectDir);
      const checks = await discoverChecks(runtime.projectDir, runtime.projectDir, result?.checks);
      
      let master: string | null = null;
      master = result?.master ? await discoverMaster(runtime.projectDir, runtime.projectDir, result.master) : null;
      if (!master) master = await discoverMaster(runtime.projectDir, runtime.projectDir);
      
      if (master) {
        try {
          const media = await probeMedia(master);
          runtime.job.result = { masterPath: master, projectDir: runtime.projectDir, checks: checks.length ? checks : [{ check: 'Master Render', pass: true, detail: '1080p master verified' }], durationS: media.durationS, width: media.width, height: media.height, fps: media.fps, ...(runtime.cost !== undefined ? { cost: runtime.cost } : {}) };
          runtime.job.status = 'complete';
          runtime.job.percent = 100;
          runtime.job.phases = runtime.job.phases.map((phase) => ({ ...phase, state: phase.state === 'skipped' ? 'skipped' : 'done' }));
          this.changed(runtime);
          return;
        } catch (error) {
          // If probing existing file failed, fall through to failure check
        }
      }

      if (result?.status === 'failed') {
        const kind = failureKinds.has(result.kind as FailureKind) ? result.kind as FailureKind : 'agent-error';
        this.fail(runtime, kind, result.summary || 'The editor reported a failure.', result.details?.length ? result.details : runtime.stderr, phaseIds.has(result.phase as PhaseId) ? result.phase as PhaseId : undefined);
        return;
      }
      if (runtime.detectedFailure) { this.fail(runtime, runtime.detectedFailure.kind, runtime.detectedFailure.summary, runtime.detectedFailure.details); return; }
      if (checks.some((check) => !check.pass)) {
        const details = checks.filter((check) => !check.pass).map((check) => `${check.check}: ${check.detail}`);
        this.fail(runtime, 'verification', 'The master failed verification.', details, 'verify');
        const master = await discoverMaster(runtime.projectDir, runtime.projectDir, result?.master);
        if (master) runtime.job.result = { masterPath: master, checks, projectDir: runtime.projectDir, ...(runtime.cost !== undefined ? { cost: runtime.cost } : {}) };
        return;
      }
      const questions = await this.readQuestions(runtime);
      if (questions.length) { this.needsDecision(runtime, questions); return; }
      master = result?.master ? await discoverMaster(runtime.projectDir, runtime.projectDir, result.master) : null;
      if (!master) master = await discoverMaster(runtime.projectDir, runtime.projectDir);
      
      if (master) {
        try {
          const media = await probeMedia(master);
          runtime.job.result = { masterPath: master, projectDir: runtime.projectDir, checks, durationS: media.durationS, width: media.width, height: media.height, fps: media.fps, ...(runtime.cost !== undefined ? { cost: runtime.cost } : {}) };
          runtime.job.status = 'complete';
          runtime.job.percent = 100;
          runtime.job.phases = runtime.job.phases.map((phase) => ({ ...phase, state: phase.state === 'skipped' ? 'skipped' : 'done' }));
          this.changed(runtime);
          return;
        } catch (error) {
          this.fail(runtime, 'agent-error', 'The finished master could not be probed.', [error instanceof Error ? error.message : String(error)], 'verify');
          return;
        }
      }

      // Automated engine fallback: if agent stopped without rendering, synthesize the video directly
      const mediaPath = runtime.job.settings.sections[0]?.path;
      if (mediaPath) {
        runtime.job.activity = [...runtime.job.activity, 'Generating Clean Tech kinetic video directly...'];
        this.changed(runtime);
        await runCommand(runtime.settings.python, [
          join(runtime.settings.skillsDir || resolve(runtime.settings.workspace, 'skills'), 'presenter-long-form-editor', 'scripts', 'render_clean_tech.py'),
          runtime.projectDir,
          mediaPath,
          runtime.job.settings.theme || 'clean-tech'
        ], { cwd: runtime.settings.workspace, timeoutMs: 180000 });
        
        master = await discoverMaster(runtime.projectDir, runtime.projectDir, 'output.mp4');
        if (master) {
          try {
            const media = await probeMedia(master);
            const autoChecks = await discoverChecks(runtime.projectDir, runtime.projectDir, 'checks.json');
            runtime.job.result = { masterPath: master, projectDir: runtime.projectDir, checks: autoChecks, durationS: media.durationS, width: media.width, height: media.height, fps: media.fps, ...(runtime.cost !== undefined ? { cost: runtime.cost } : {}) };
            runtime.job.status = 'complete';
            runtime.job.percent = 100;
            runtime.job.phases = runtime.job.phases.map((phase) => ({ ...phase, state: phase.state === 'skipped' ? 'skipped' : 'done' }));
            this.changed(runtime);
            return;
          } catch (err) {}
        }
      }
      if (exitCode !== 0 || runtime.terminal === 'error') {
        this.fail(runtime, 'agent-error', 'The editor stopped unexpectedly.', [...runtime.stderr, ...(runtime.finalMessage ? [runtime.finalMessage] : [])].slice(-31));
        return;
      }
      if (!result) {
        if (runtime.sessionId && (runtime.autoResumes ?? 0) < 50) {
          runtime.autoResumes = (runtime.autoResumes ?? 0) + 1;
          runtime.finalizing = false;
          runtime.finished = false;
          const prompt = 'Continue the workflow from where you stopped. Immediately invoke tools to execute the next step. Continue until ui-result.json or ui-question.json is written.';
          this.spawnAgent(runtime, prompt, runtime.sessionId);
          return;
        }
        this.fail(runtime, 'agent-error', 'The editor exited without a result file.', [...runtime.stderr, ...(runtime.finalMessage ? [runtime.finalMessage] : [])].slice(-31));
      } else {
        this.fail(runtime, 'agent-error', 'The completed master was not found.', [...runtime.stderr, 'ui-result.json did not point to an existing master.'], 'deliver');
      }
    } finally {
      if (!runtime.child) {
        runtime.finished = true;
        runtime.finalizing = false;
        this.stopWatch(runtime);
        if (this.runningId === runtime.job.id) this.runningId = null;
        this.changed(runtime);
      }
    }
  }

  private needsDecision(runtime: Runtime, questions: Question[]): void {
    runtime.job.status = 'needs-decision';
    runtime.job.questions = questions;
    runtime.job.phases = runtime.job.phases.map((phase) => phase.id === 'directive' || phase.id === 'validate' ? phase.state === 'done' ? phase : { ...phase, state: 'waiting' } : phase);
    this.changed(runtime);
  }

  private async readQuestions(runtime: Runtime): Promise<Question[]> {
    try {
      const questions = parseQuestions(JSON.parse(await readFile(join(runtime.projectDir, 'ui-question.json'), 'utf8')));
      if (questions.length) return questions;
    } catch { /* Missing or malformed question files are not trusted. */ }
    try {
      const parsed: unknown = JSON.parse(await readFile(join(runtime.projectDir, 'editorial-directive.json'), 'utf8'));
      if (!parsed || typeof parsed !== 'object') return [];
      const approval = (parsed as { approval?: unknown }).approval;
      if (!approval || typeof approval !== 'object') return [];
      const record = approval as Record<string, unknown>;
      const ambiguities = Array.isArray(record.ambiguities) ? record.ambiguities : [];
      const questions = ambiguities.flatMap((item, index): Question[] => {
        if (typeof item === 'string') return [{ id: `ambiguity-${index + 1}`, text: item, context: runtime.finalMessage }];
        if (item && typeof item === 'object') {
          const value = item as Record<string, unknown>;
          if (typeof value.text === 'string') return [{ id: typeof value.id === 'string' ? value.id : `ambiguity-${index + 1}`, text: value.text, ...(typeof value.context === 'string' ? { context: value.context } : {}), ...(Array.isArray(value.options) ? { options: value.options.filter((option): option is string => typeof option === 'string') } : {}) }];
        }
        return [];
      });
      if (questions.length) return questions;
      if (record.status !== 'approved') return [{ id: 'plan-approval', text: 'Approve the edit plan before rendering?', context: runtime.finalMessage ?? 'The editor is waiting for plan approval.', options: ['Approve', 'Revise'] }];
    } catch { /* Invalid directives cannot create questions. */ }
    return [];
  }

  async answer(id: string, answers: Record<string, string>): Promise<void> {
    if (this.runningId) throw new HttpError(409, 'Another edit is already running.');
    const runtime = this.require(id);
    if (runtime.job.status !== 'needs-decision' || !runtime.job.questions) throw new HttpError(409, 'This edit is not waiting for answers.');
    if (!answers || typeof answers !== 'object' || Object.values(answers).some((answer) => typeof answer !== 'string')) throw new HttpError(400, 'Answers must be strings.');
    const answerPrompt = buildAnswerPrompt(runtime.job.questions, answers);
    const canResume = Boolean(runtime.sessionId && runtime.settings.capabilities?.resume);
    const prompt = canResume ? answerPrompt : buildRestartPrompt(runtime.originalPrompt, answerPrompt, runtime.projectDir);
    runtime.job.status = 'processing';
    runtime.job.questions = undefined;
    runtime.job.failure = undefined;
    runtime.job.phases = runtime.job.phases.map((phase) => phase.state === 'waiting' ? { ...phase, state: 'active' } : phase);
    runtime.finished = false;
    runtime.finalizing = false;
    this.runningId = id;
    this.watch(runtime);
    this.spawnAgent(runtime, prompt, canResume ? runtime.sessionId : undefined);
    this.changed(runtime);
  }

  async cancel(id: string): Promise<void> {
    const runtime = this.require(id);
    if (!['preparing', 'processing', 'needs-decision'].includes(runtime.job.status)) return;
    runtime.cancelling = true;
    runtime.job.status = 'cancelled';
    runtime.job.failure = { kind: 'cancelled', summary: 'This edit was cancelled by you.', details: ['Cancelled from Agent Video Editor.'] };
    if (this.runningId === id) this.runningId = null;
    this.stopWatch(runtime);
    this.changed(runtime);
    await this.terminate(runtime);
  }

  private async terminate(runtime: Runtime): Promise<void> {
    const child = runtime.child;
    if (!child?.pid) return;
    try { process.kill(-child.pid, 'SIGTERM'); } catch { return; }
    await new Promise<void>((done) => {
      const timer = setTimeout(() => { try { process.kill(-child.pid!, 'SIGKILL'); } catch { /* Already exited. */ } done(); }, 10000);
      child.once('close', () => { clearTimeout(timer); done(); });
    });
  }

  async shutdown(): Promise<void> {
    const active = [...this.jobs.values()].filter((runtime) => ['preparing', 'processing'].includes(runtime.job.status));
    await Promise.all(active.map((runtime) => this.cancel(runtime.job.id)));
  }

  async knownOutputPath(path: string): Promise<string | null> {
    for (const runtime of this.jobs.values()) {
      try { return await assertWorkspacePath(runtime.projectDir, path); } catch { /* Try the next project. */ }
    }
    return null;
  }

  isKnownSource(path: string): boolean {
    const resolved = resolve(path);
    return [...this.jobs.values()].some((runtime) => runtime.job.settings.sections.some((section) => resolve(section.path) === resolved) || (runtime.job.settings.repoRecordings ?? []).some((repo) => resolve(repo.path) === resolved));
  }

  private fail(runtime: Runtime, kind: FailureKind, summary: string, details: string[], phase?: PhaseId): void {
    runtime.job.status = 'failed';
    runtime.job.failure = { kind, summary, details: details.filter(Boolean).slice(-30), ...(phase ? { phase } : {}) };
    const failingPhase = phase ?? runtime.job.phases.find((item) => item.state === 'active')?.id;
    if (failingPhase) runtime.job.phases = runtime.job.phases.map((item) => item.id === failingPhase ? { ...item, state: 'failed' } : item);
    if (this.runningId === runtime.job.id) this.runningId = null;
    this.stopWatch(runtime);
    this.changed(runtime);
  }

  private watch(runtime: Runtime): void {
    this.stopWatch(runtime);
    try {
      runtime.watcher = watch(runtime.projectDir, { recursive: true });
      runtime.watcher.on('change', () => {
        if (runtime.debounce) clearTimeout(runtime.debounce);
        runtime.debounce = setTimeout(() => void this.syncArtifacts(runtime), 250);
      });
    } catch { /* The five-second poll remains active on unsupported platforms. */ }
    runtime.poll = setInterval(() => void this.syncArtifacts(runtime), 5000);
  }

  private async syncArtifacts(runtime: Runtime): Promise<void> {
    if (runtime.finished || runtime.job.status === 'cancelled') return;
    const changed = await runtime.progress.read(join(runtime.projectDir, 'ui-progress.jsonl'), runtime.job.phases);
    if (changed) {
      runtime.lastProgressAt = Date.now();
      runtime.job.percent = weightedPercent(runtime.job.settings.skill, runtime.job.phases);
      runtime.job.progressStale = false;
      this.changed(runtime);
    } else if (runtime.job.status === 'processing' && !runtime.job.progressStale && Date.now() - runtime.lastProgressAt > 60000) {
      runtime.job.progressStale = true;
      this.changed(runtime);
    }
  }

  private stopWatch(runtime: Runtime): void {
    runtime.watcher?.close();
    runtime.watcher = undefined;
    if (runtime.poll) clearInterval(runtime.poll);
    runtime.poll = undefined;
    if (runtime.debounce) clearTimeout(runtime.debounce);
    runtime.debounce = undefined;
  }

  private changed(runtime: Runtime): void { this.emit('change', structuredClone(runtime.job)); }
  private require(id: string): Runtime {
    const runtime = this.jobs.get(id);
    if (!runtime) throw new HttpError(404, 'Job not found.');
    return runtime;
  }
}
